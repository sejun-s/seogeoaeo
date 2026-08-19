import * as cheerio from "cheerio";
import { fetchAuditDocument } from "./audit/guard";

export type Status = "PASS" | "WARN" | "FAIL";
export type ScoreType = "SEO" | "GEO";
export type Evidence = { id: string; field: string; excerpt: string };

export type Rule = {
  id: string;
  ruleId: string;
  scoreType: ScoreType;
  category: string;
  title: string;
  description: string;
  weight: number;
  result: Status;
  evidence: Evidence[];
  recommendation: string;
};

export type Score = {
  score: number;
  categories: { name: string; score: number; maxScore: number; rules: Rule[] }[];
};

export type AuditResult = {
  finalUrl: string;
  rulesetVersion: string;
  extracted: {
    title: string;
    metaDescription: string;
    h1: string[];
    canonical: string;
    robots: string;
    schemaTypes: string[];
    lang: string;
  };
  scores: { seo: Score; geoReadiness: Score };
  findings: Rule[];
};

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

export function evaluateAuditRules(fetched: {
  html: string;
  finalUrl: string;
  xRobots?: string;
}): AuditResult {
  const $ = cheerio.load(fetched.html);
  $("script:not([type='application/ld+json']),style,noscript,template").remove();

  const title = clean($("title").first().text());
  const meta = clean($("meta[name='description']").attr("content") || "");
  const h1 = $("h1").map((_, e) => clean($(e).text())).get().filter(Boolean);
  const canonical = $("link[rel='canonical']").attr("href") || "";
  const robots = clean([$("meta[name='robots']").attr("content") || "", fetched.xRobots || ""].filter(Boolean).join(", "));
  const lang = $("html").attr("lang") || "";

  const heads = $("h1,h2,h3,h4,h5,h6").map((_, e) => ({ n: +e.tagName.slice(1), t: clean($(e).text()) })).get().filter((x) => x.t);
  const body = clean($("main,article").first().text() || $("body").text());
  const paras = $("p").map((_, e) => clean($(e).text())).get().filter(Boolean);
  const links = $("a[href]").map((_, e) => ({ href: $(e).attr("href") || "", text: clean($(e).text()) })).get();
  const imgs = $("img").map((_, e) => $(e).attr("alt")).get();

  const json: Record<string, unknown>[] = [];
  let badJson = 0;
  $("script[type='application/ld+json']").each((_, e) => {
    try {
      const v = JSON.parse($(e).text());
      json.push(v);
    } catch {
      badJson++;
    }
  });

  const schemaTypes = [
    ...new Set(
      json.flatMap((v) => {
        const ns = Array.isArray(v["@graph"]) ? (v["@graph"] as Record<string, unknown>[]) : [v];
        return ns.flatMap((n) => (Array.isArray(n["@type"]) ? (n["@type"] as string[]) : n["@type"] ? [String(n["@type"])] : []));
      }),
    ),
  ];

  const u = new URL(fetched.finalUrl);
  const internal = links.filter((l) => {
    try {
      return new URL(l.href, u).hostname === u.hostname;
    } catch {
      return false;
    }
  });
  const external = links.filter((l) => {
    try {
      return new URL(l.href, u).hostname !== u.hostname;
    } catch {
      return false;
    }
  });

  const date = $("time,meta[property='article:published_time'],meta[property='article:modified_time']").length > 0 || /datePublished|dateModified/.test(fetched.html);
  const author = $("[rel='author'],[itemprop='author'],meta[name='author']").length > 0 || /["']author["']\s*:/.test(fetched.html);
  const publisher = schemaTypes.some((x) => ["Organization", "Person", "NewsMediaOrganization"].includes(x));
  const skip = heads.some((h, i) => i > 0 && h.n > heads[i - 1].n + 1);
  const question = heads.some((h) => /\?|^(what|why|how|무엇|왜|어떻게)/i.test(h.t));
  const list = $("ul li,ol li,table").length >= 2;
  const direct = paras.some((p) => p.length >= 40 && p.length <= 320);
  const claims = (body.match(/\d+(?:[.,]\d+)?%|\d+\s*(명|개|건|배|원|년)/g) || []).length;
  const alt = imgs.length ? imgs.filter(Boolean).length / imgs.length : 1;
  const blockedShell = body.length < 180 && /(sign in|log in|로그인|enable javascript)/i.test(body);

  let seq = 0;
  const make = (
    id: string,
    scoreType: ScoreType,
    category: string,
    title: string,
    description: string,
    weight: number,
    result: Status,
    excerpt: string,
    recommendation: string,
  ): Rule => ({
    id,
    ruleId: id,
    scoreType,
    category,
    title,
    description,
    weight,
    result,
    evidence: [
      {
        id: `EV-${String(++seq).padStart(3, "0")}`,
        field: title,
        excerpt: clean(excerpt || "해당 요소 없음").slice(0, 2000),
      },
    ],
    recommendation,
  });

  const st = (ok: boolean, warn = false): Status => (ok ? "PASS" : warn ? "WARN" : "FAIL");

  // 35 Canonical Rules (SEO 50pt scale, GEO Readiness 50pt scale -> Normalized to 100 max each)
  const defs: [string, ScoreType, string, string, string, number, Status, string, string][] = [
    ["SEO-TECH-001", "SEO", "Technical SEO", "HTTPS 사용", "최종 URL의 보안 연결", 5, st(u.protocol === "https:"), fetched.finalUrl, "HTTPS로 제공하세요."],
    ["SEO-TECH-002", "SEO", "Technical SEO", "Canonical 존재", "대표 URL 선언", 5, st(!!canonical), canonical, "canonical을 추가하세요."],
    ["SEO-TECH-003", "SEO", "Technical SEO", "Robots 지시 명확성", "충돌 없는 robots 지시", 5, st(!/(noindex.*index|index.*noindex)/i.test(robots), !robots), robots, "robots 지시를 명확히 하세요."],
    ["SEO-TECH-004", "SEO", "Technical SEO", "문서 언어 선언", "html lang 존재", 5, st(!!lang), lang, "html lang을 선언하세요."],
    ["SEO-ONPAGE-001", "SEO", "On-page", "Title 품질", "제목 존재와 길이", 8, st(title.length >= 20 && title.length <= 65, !!title), title, "20~65자 제목으로 다듬으세요."],
    ["SEO-ONPAGE-002", "SEO", "On-page", "Meta description 품질", "설명 존재와 길이", 6, st(meta.length >= 70 && meta.length <= 170, !!meta), meta, "70~170자 설명을 작성하세요."],
    ["SEO-ONPAGE-003", "SEO", "On-page", "단일 핵심 H1", "H1 개수", 6, st(h1.length === 1, h1.length > 0), h1.join(" | "), "H1 하나를 사용하세요."],
    ["SEO-ONPAGE-004", "SEO", "On-page", "Heading 계층", "제목 단계의 연속성", 5, st(heads.length > 1 && !skip, heads.length > 0), heads.map((x) => `H${x.n} ${x.t}`).join(" | "), "제목 단계를 순서대로 구성하세요."],
    ["SEO-INDEX-001", "SEO", "Indexability", "Noindex 차단 없음", "색인 차단 여부", 10, st(!robots.toLowerCase().includes("noindex")), robots, "불필요한 noindex를 제거하세요."],
    ["SEO-INDEX-002", "SEO", "Indexability", "Robots 차단 없음", "링크 추적 차단 여부", 5, st(!/none|nofollow/i.test(robots)), robots, "불필요한 none/nofollow를 제거하세요."],
    [
      "SEO-INDEX-003",
      "SEO",
      "Indexability",
      "Canonical 일관성",
      "대표 URL 호스트 일치",
      5,
      st(
        !!canonical &&
          (() => {
            try {
              return new URL(canonical, u).hostname === u.hostname;
            } catch {
              return false;
            }
          })(),
        !!canonical,
      ),
      canonical,
      "같은 사이트의 대표 URL을 선언하세요.",
    ],
    ["SEO-SCHEMA-001", "SEO", "Structured Data", "JSON-LD 문법", "구조화 데이터 파싱", 8, st(json.length > 0 && badJson === 0, badJson === 0), `${json.length}개 유효 / ${badJson}개 오류`, "유효한 JSON-LD를 추가하세요."],
    ["SEO-SCHEMA-002", "SEO", "Structured Data", "Schema 유형", "@type 존재", 7, st(schemaTypes.length > 0), schemaTypes.join(", "), "페이지 성격에 맞는 @type을 선언하세요."],
    ["SEO-CONTENT-001", "SEO", "Content Basics", "충분한 본문", "본문 텍스트 양", 8, st(body.length >= 600, body.length >= 250), `${body.length}자`, "고유 본문을 보강하세요."],
    ["SEO-CONTENT-002", "SEO", "Content Basics", "내부 링크", "관련 내부 링크", 4, st(internal.length >= 2, internal.length === 1), `${internal.length}개`, "관련 내부 링크를 추가하세요."],
    ["SEO-CONTENT-003", "SEO", "Content Basics", "이미지 대체 텍스트", "alt 제공 비율", 4, st(alt === 1, alt >= 0.7), `${Math.round(alt * 100)}%`, "이미지에 alt를 제공하세요."],
    ["SEO-CONTENT-004", "SEO", "Content Basics", "콘텐츠 갱신 신호", "날짜 정보", 4, st(date), date ? "날짜 신호 발견" : "없음", "작성·수정일을 표시하세요."],

    // GEO Readiness (Fact & Structural Readiness Rules)
    ["GEO-ANSWER-001", "GEO", "Answerability", "직접 답변 블록 신호", "간결한 독립 문단 구조", 8, st(direct), paras.find((p) => p.length >= 40 && p.length <= 320) || "해당 구조 없음", "질문 직후 2~3문장의 명확한 답변 블록을 배치하세요."],
    ["GEO-ANSWER-002", "GEO", "Answerability", "질문형 Heading", "질문 의도 제목", 6, st(question), heads.map((x) => x.t).join(" | "), "검색 질문을 반영한 제목을 추가하세요."],
    ["GEO-ANSWER-003", "GEO", "Answerability", "목록·표 구조", "단계와 비교의 구조화", 6, st(list), `${$("li").length}개 목록 / ${$("table").length}개 표`, "단계·비교를 목록이나 표로 정리하세요."],
    ["GEO-MACHINE-001", "GEO", "Machine Readability", "Heading 구조", "문서 구획", 6, st(heads.length > 1 && !skip, heads.length > 0), heads.map((x) => `H${x.n} ${x.t}`).join(" | "), "순차적인 heading을 사용하세요."],
    ["GEO-MACHINE-002", "GEO", "Machine Readability", "의미 구조", "main/article/section 사용", 6, st($("main,article,section").length > 0), `${$("main,article,section").length}개`, "의미 HTML 요소로 본문을 구분하세요."],
    ["GEO-MACHINE-003", "GEO", "Machine Readability", "메타데이터 명확성", "title과 description", 4, st(!!title && !!meta, !!title || !!meta), `${title} | ${meta}`, "title과 description에 주제를 명시하세요."],
    ["GEO-MACHINE-004", "GEO", "Machine Readability", "구조화 데이터", "유효 JSON-LD", 4, st(json.length > 0 && badJson === 0), schemaTypes.join(", "), "유효한 JSON-LD를 추가하세요."],
    ["GEO-TRUST-001", "GEO", "Evidence & Trust", "저자 정보", "책임 저자 신호", 5, st(author), author ? "발견" : "없음", "저자와 전문성을 표시하세요."],
    ["GEO-TRUST-002", "GEO", "Evidence & Trust", "작성·수정 날짜", "콘텐츠 시점", 5, st(date), date ? "발견" : "없음", "작성·수정일을 명시하세요."],
    ["GEO-TRUST-003", "GEO", "Evidence & Trust", "외부 근거 링크", "설명적인 원출처", 6, st(external.some((x) => x.text.length >= 4), external.length > 0), `${external.length}개`, "주장 가까이에 원출처를 연결하세요."],
    ["GEO-TRUST-004", "GEO", "Evidence & Trust", "발행 주체 식별", "조직 또는 개인 정보", 4, st(publisher), schemaTypes.join(", "), "Organization 또는 Person schema를 제공하세요."],
    ["GEO-CITE-001", "GEO", "Citation Readiness", "주장과 근거의 근접성", "수치 주장과 출처", 8, st(claims === 0 || external.length > 0, claims > 0), `${claims}개 주장 / ${external.length}개 외부 링크`, "수치 주장 옆에 원출처를 연결하세요."],
    ["GEO-CITE-002", "GEO", "Citation Readiness", "출처 링크 품질", "설명적인 링크 텍스트", 6, st(external.some((x) => x.text.length >= 4), external.length > 0), external.slice(0, 3).map((x) => x.text || x.href).join(" | "), "출처가 드러나는 링크 문구를 쓰세요."],
    [
      "GEO-CITE-003",
      "GEO",
      "Citation Readiness",
      "엔티티 명명 일관성",
      "Title과 H1 일치",
      6,
      st(!!h1[0] && title.toLowerCase().includes(h1[0].toLowerCase().slice(0, 20)), !!title && !!h1[0]),
      `${title} | ${h1[0] || ""}`,
      "핵심 이름을 일관되게 사용하세요.",
    ],
    ["GEO-ACCESS-001", "GEO", "Content Accessibility", "초기 HTML 본문 노출", "JS 없는 본문", 8, st(body.length >= 120), `${body.length}자`, "핵심 본문을 초기 HTML에 렌더링하세요."],
    ["GEO-ACCESS-002", "GEO", "Content Accessibility", "읽기 가능한 텍스트", "본문과 문단 구조", 5, st(body.length >= 600 && paras.length >= 3, body.length >= 250), `${body.length}자 / ${paras.length}문단`, "짧고 명확한 문단으로 구성하세요."],
    ["GEO-ACCESS-003", "GEO", "Content Accessibility", "접근 차단 요소 없음", "로그인 shell 여부", 3, st(!blockedShell), blockedShell ? "차단 문구 중심" : "본문 접근 가능", "로그인 없이 핵심 설명을 제공하세요."],
    ["GEO-ACCESS-004", "GEO", "Content Accessibility", "언어 식별 가능", "문서 언어", 4, st(!!lang), lang, "html lang을 선언하세요."],
  ];

  const rules = defs.map((x) => make(...x));
  const sum = (type: ScoreType): Score => {
    const rs = rules.filter((r) => r.scoreType === type);
    const factor = (r: Rule) => (r.result === "PASS" ? 1 : r.result === "WARN" ? 0.5 : 0);
    const names = [...new Set(rs.map((r) => r.category))];
    return {
      score: Math.round(rs.reduce((s, r) => s + r.weight * factor(r), 0)),
      categories: names.map((name) => {
        const cr = rs.filter((r) => r.category === name);
        return {
          name,
          score: Math.round(cr.reduce((s, r) => s + r.weight * factor(r), 0) * 10) / 10,
          maxScore: cr.reduce((s, r) => s + r.weight, 0),
          rules: cr,
        };
      }),
    };
  };

  return {
    finalUrl: fetched.finalUrl,
    rulesetVersion: "2026.08.1",
    extracted: {
      title,
      metaDescription: meta,
      h1,
      canonical,
      robots,
      schemaTypes,
      lang,
    },
    scores: { seo: sum("SEO"), geoReadiness: sum("GEO") },
    findings: rules.filter((r) => r.result !== "PASS").sort((a, b) => b.weight - a.weight),
  };
}

export async function auditPage(input: string): Promise<AuditResult> {
  const doc = await fetchAuditDocument(input);
  return evaluateAuditRules(doc);
}
