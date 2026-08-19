/**
 * Static DOM → Evidence/Fact 추출기.
 *
 * 여기서만 DOM을 읽는다. Atomic Check는 이 결과(FactIndex)만 본다.
 * 판정(PASS/FAIL)은 하지 않는다. 관측한 값과 PRESENT/ABSENT/INVALID/UNKNOWN만 남긴다.
 */

import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { normalizeText } from "../hash";
import type { PageSnapshot } from "../snapshot";
import { EvidenceLayer, FactIndex } from "./layer";

const BOILERPLATE = "script:not([type='application/ld+json']),style,noscript,template";
const BARRIER_PATTERNS =
  /(sign in|log ?in|create an account|subscribe to continue|members only|enable javascript|로그인|회원가입|구독하셔야|자바스크립트를 활성화)/i;
const QUESTION_PATTERN = /\?|^(what|why|how|when|where|which|who|무엇|왜|어떻게|언제|어디|누가)\b/i;
const CLAIM_PATTERN = /\d+(?:[.,]\d+)?\s*%|\d{2,}(?:[.,]\d+)?\s*(명|개|건|배|원|억|만|년|시간|분|초|배가|이상|미만)|\b\d{4}년\b/g;

function textOf($: cheerio.CheerioAPI, node: AnyNode): string {
  return normalizeText($(node).text());
}

/** BCP47 형태 검증. 실제 registry 조회는 하지 않으므로 형식만 본다. */
function isPlausibleLangTag(value: string): boolean {
  return /^[A-Za-z]{2,3}(-[A-Za-z]{4})?(-([A-Za-z]{2}|\d{3}))?(-[A-Za-z0-9]{5,8})*$/.test(value.trim());
}

export interface ExtractionResult {
  index: FactIndex;
  layer: EvidenceLayer;
}

export function extractEvidence(snapshot: PageSnapshot): ExtractionResult {
  const layer = new EvidenceLayer(snapshot);
  const $ = cheerio.load(snapshot.rawHtml);
  const finalUrl = new URL(snapshot.finalUrl);

  /* ---------------- transport ---------------- */

  {
    const ev = layer.addEvidence({
      factType: "url.final",
      sourceType: "HTTP_RESPONSE",
      rawValue: snapshot.finalUrl,
      normalizedValue: { href: finalUrl.href, protocol: finalUrl.protocol, hostname: finalUrl.hostname },
    });
    layer.addFact({
      factType: "url.final",
      key: "main",
      value: { href: finalUrl.href, protocol: finalUrl.protocol, hostname: finalUrl.hostname },
      status: "PRESENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  {
    const ev = layer.addEvidence({
      factType: "http.status",
      sourceType: "HTTP_RESPONSE",
      rawValue: snapshot.status,
      normalizedValue: snapshot.status,
    });
    layer.addFact({
      factType: "http.status",
      key: "main",
      value: snapshot.status,
      status: "PRESENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  {
    const hops = snapshot.redirectChain;
    const ev = hops.length
      ? layer.addEvidence({
          factType: "redirect.chain",
          sourceType: "HTTP_RESPONSE",
          rawValue: hops,
          normalizedValue: hops.map(hop => `${hop.status} ${hop.from} -> ${hop.to}`),
        })
      : layer.addAbsence("redirect.chain", "response.redirects", "HTTP_RESPONSE");
    layer.addFact({
      factType: "redirect.chain",
      key: "main",
      value: hops,
      status: hops.length ? "PRESENT" : "ABSENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  for (const header of ["x-robots-tag", "content-type"]) {
    const value = snapshot.headers[header];
    const ev = value
      ? layer.addEvidence({
          factType: "http.header",
          sourceType: "HTTP_RESPONSE",
          rawValue: value,
          normalizedValue: normalizeText(value).toLowerCase(),
          selector: `header:${header}`,
        })
      : layer.addAbsence("http.header", `header:${header}`, "HTTP_RESPONSE");
    layer.addFact({
      factType: "http.header",
      key: header,
      value: value ? normalizeText(value).toLowerCase() : null,
      status: value ? "PRESENT" : "ABSENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  /* ---------------- head metadata ---------------- */

  {
    const raw = $("title").first().text();
    const text = normalizeText(raw);
    const ev = $("title").length
      ? layer.addEvidence({
          factType: "document.title",
          sourceType: "STATIC_DOM",
          rawValue: raw,
          normalizedValue: { text, length: text.length },
          selector: "head > title",
          quote: text,
        })
      : layer.addAbsence("document.title", "head > title");
    layer.addFact({
      factType: "document.title",
      key: "main",
      value: { text, length: text.length },
      status: $("title").length === 0 ? "ABSENT" : text.length === 0 ? "INVALID" : "PRESENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  {
    const node = $("meta[name='description']").first();
    const raw = node.attr("content") ?? "";
    const text = normalizeText(raw);
    const ev = node.length
      ? layer.addEvidence({
          factType: "document.meta_description",
          sourceType: "STATIC_DOM",
          rawValue: raw,
          normalizedValue: { text, length: text.length },
          selector: "meta[name='description']",
          quote: text,
        })
      : layer.addAbsence("document.meta_description", "meta[name='description']");
    layer.addFact({
      factType: "document.meta_description",
      key: "main",
      value: { text, length: text.length },
      status: node.length === 0 ? "ABSENT" : text.length === 0 ? "INVALID" : "PRESENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  {
    const nodes = $("link[rel='canonical']");
    const raw = nodes.first().attr("href") ?? "";
    let resolved: string | null = null;
    let valid = false;
    if (raw) {
      try {
        const url = new URL(raw, finalUrl);
        valid = url.protocol === "http:" || url.protocol === "https:";
        resolved = url.href;
      } catch {
        valid = false;
      }
    }
    const ev = nodes.length
      ? layer.addEvidence({
          factType: "document.canonical",
          sourceType: "STATIC_DOM",
          rawValue: raw,
          normalizedValue: { raw, resolved, valid, count: nodes.length },
          selector: "link[rel='canonical']",
          quote: raw,
        })
      : layer.addAbsence("document.canonical", "link[rel='canonical']");
    layer.addFact({
      factType: "document.canonical",
      key: "main",
      value: { raw, resolved, valid, count: nodes.length, sameHost: resolved ? new URL(resolved).hostname === finalUrl.hostname : null },
      status: nodes.length === 0 ? "ABSENT" : valid ? "PRESENT" : "INVALID",
      evidenceIds: [ev.evidenceId],
    });
  }

  {
    const metaRobots = $("meta[name='robots']").first().attr("content") ?? "";
    const headerRobots = snapshot.headers["x-robots-tag"] ?? "";
    const sources: string[] = [];
    const evidenceIds: string[] = [];
    if (metaRobots) {
      sources.push("meta");
      evidenceIds.push(
        layer.addEvidence({
          factType: "document.robots_directive",
          sourceType: "STATIC_DOM",
          rawValue: metaRobots,
          normalizedValue: normalizeText(metaRobots).toLowerCase(),
          selector: "meta[name='robots']",
        }).evidenceId,
      );
    }
    if (headerRobots) {
      sources.push("header");
      evidenceIds.push(
        layer.addEvidence({
          factType: "document.robots_directive",
          sourceType: "HTTP_RESPONSE",
          rawValue: headerRobots,
          normalizedValue: normalizeText(headerRobots).toLowerCase(),
          selector: "header:x-robots-tag",
        }).evidenceId,
      );
    }
    if (!sources.length) {
      evidenceIds.push(layer.addAbsence("document.robots_directive", "meta[name='robots'], header:x-robots-tag").evidenceId);
    }
    const tokens = [metaRobots, headerRobots]
      .filter(Boolean)
      .flatMap(value => value.toLowerCase().split(","))
      .map(token => normalizeText(token))
      .filter(Boolean);
    const hasIndex = tokens.includes("index");
    const hasNoindex = tokens.includes("noindex");
    const hasFollow = tokens.includes("follow");
    const hasNofollow = tokens.includes("nofollow") || tokens.includes("none");
    layer.addFact({
      factType: "document.robots_directive",
      key: "effective",
      value: {
        tokens,
        sources,
        hasIndex,
        hasNoindex,
        hasFollow,
        hasNofollow,
        conflict: (hasIndex && hasNoindex) || (hasFollow && hasNofollow),
        declared: sources.length > 0,
      },
      status: sources.length ? "PRESENT" : "ABSENT",
      evidenceIds,
    });
  }

  {
    const raw = $("html").attr("lang");
    const value = raw === undefined ? "" : normalizeText(raw);
    const ev = raw === undefined
      ? layer.addAbsence("document.language", "html[lang]")
      : layer.addEvidence({
          factType: "document.language",
          sourceType: "STATIC_DOM",
          rawValue: raw,
          normalizedValue: { raw: value, valid: isPlausibleLangTag(value) },
          selector: "html[lang]",
        });
    layer.addFact({
      factType: "document.language",
      key: "main",
      value: { raw: value, valid: isPlausibleLangTag(value) },
      status: raw === undefined ? "ABSENT" : value === "" ? "INVALID" : isPlausibleLangTag(value) ? "PRESENT" : "INVALID",
      evidenceIds: [ev.evidenceId],
    });
  }

  /* ---------------- headings ---------------- */

  const headingNodes = $("h1,h2,h3,h4,h5,h6")
    .toArray()
    .map((element, order) => ({
      level: Number((element as { tagName: string }).tagName.slice(1)),
      text: textOf($, element),
      order,
    }))
    .filter(node => node.text.length > 0);

  headingNodes.forEach(node => {
    const ev = layer.addEvidence({
      factType: "heading.node",
      sourceType: "STATIC_DOM",
      rawValue: { level: node.level, text: node.text },
      normalizedValue: { level: node.level, text: node.text, order: node.order },
      selector: `h${node.level}:nth-of-type(${node.order + 1})`,
      quote: node.text,
    });
    layer.addFact({
      factType: "heading.node",
      key: `${node.order}-h${node.level}`,
      value: { level: node.level, text: node.text, order: node.order },
      status: "PRESENT",
      evidenceIds: [ev.evidenceId],
    });
  });
  if (headingNodes.length === 0) {
    const ev = layer.addAbsence("heading.node", "h1,h2,h3,h4,h5,h6");
    layer.addFact({ factType: "heading.node", key: "none", value: [], status: "ABSENT", evidenceIds: [ev.evidenceId] });
  }

  {
    const levels = headingNodes.map(node => node.level);
    const skips = levels.filter((level, i) => i > 0 && level > levels[i - 1] + 1).length;
    const firstLevel = levels[0] ?? null;
    const ev = layer.addEvidence({
      factType: "heading.outline",
      sourceType: "DERIVED",
      rawValue: levels,
      normalizedValue: { levels, skips, firstLevel, h1Count: levels.filter(l => l === 1).length },
      derivation: "heading-outline@1",
    });
    layer.addFact({
      factType: "heading.outline",
      key: "main",
      value: { levels, skips, firstLevel, h1Count: levels.filter(l => l === 1).length, headingCount: levels.length },
      status: levels.length ? "PRESENT" : "ABSENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  /* ---------------- landmarks & main content ---------------- */

  const $content = cheerio.load(snapshot.rawHtml);
  $content(BOILERPLATE).remove();
  const mainSelector = $content("main").length ? "main" : $content("article").length ? "article" : "body";
  const mainScope = $content(mainSelector).first();
  const mainText = normalizeText(mainScope.text());
  const bodyText = normalizeText($content("body").text());

  {
    const counts = {
      main: $("main").length,
      article: $("article").length,
      section: $("section").length,
      nav: $("nav").length,
      header: $("header").length,
      footer: $("footer").length,
      // Page Type 신호용. SEO/GEO 점수 판정에는 쓰지 않는다.
      form: $("form").length,
      address: $("address").length,
    };
    const ev = layer.addEvidence({
      factType: "landmark.node",
      sourceType: "STATIC_DOM",
      rawValue: counts,
      normalizedValue: { ...counts, mainTextRatio: bodyText.length ? mainText.length / bodyText.length : 0 },
      selector: "main,article,section,nav,header,footer,form,address",
    });
    layer.addFact({
      factType: "landmark.node",
      key: "main",
      value: { ...counts, resolvedFrom: mainSelector, mainTextRatio: bodyText.length ? mainText.length / bodyText.length : 0 },
      status: counts.main + counts.article + counts.section > 0 ? "PRESENT" : "ABSENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  {
    const ev = layer.addEvidence({
      factType: "content.main_text",
      sourceType: "STATIC_DOM",
      rawValue: mainText.slice(0, 2000),
      normalizedValue: { length: mainText.length, source: mainSelector },
      selector: mainSelector,
      quote: mainText.slice(0, 300),
    });
    layer.addFact({
      factType: "content.main_text",
      key: "main",
      value: { text: mainText, length: mainText.length, source: mainSelector, bodyLength: bodyText.length },
      status: mainText.length > 0 ? "PRESENT" : "ABSENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  const paragraphs = $content("p")
    .toArray()
    .map(element => normalizeText($content(element).text()))
    .filter(Boolean);
  paragraphs.forEach((text, i) => {
    const ev = layer.addEvidence({
      factType: "content.paragraph",
      sourceType: "STATIC_DOM",
      rawValue: text,
      normalizedValue: { length: text.length, order: i },
      selector: `p:nth-of-type(${i + 1})`,
      quote: text,
    });
    layer.addFact({
      factType: "content.paragraph",
      key: String(i),
      value: { text, length: text.length, order: i },
      status: "PRESENT",
      evidenceIds: [ev.evidenceId],
    });
  });

  {
    const questionHeadings = headingNodes.filter(node => QUESTION_PATTERN.test(node.text));
    const ev = questionHeadings.length
      ? layer.addEvidence({
          factType: "content.question_section",
          sourceType: "DERIVED",
          rawValue: questionHeadings.map(node => node.text),
          normalizedValue: { count: questionHeadings.length },
          derivation: "question-heading-pattern@1",
          quote: questionHeadings[0].text,
        })
      : layer.addAbsence("content.question_section", "heading[question-pattern]", "DERIVED");
    layer.addFact({
      factType: "content.question_section",
      key: "main",
      value: { headings: questionHeadings.map(node => node.text), count: questionHeadings.length },
      status: questionHeadings.length ? "PRESENT" : "ABSENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  {
    const listItems = $content("ul li,ol li").length;
    const tables = $content("table").length;
    const orderedLists = $content("ol").length;
    const ev = layer.addEvidence({
      factType: "entity.signal",
      sourceType: "DERIVED",
      rawValue: { listItems, tables, orderedLists },
      normalizedValue: { listItems, tables, orderedLists },
      derivation: "list-table-structure@1",
    });
    layer.addFact({
      factType: "entity.signal",
      key: "list_table_structure",
      value: { listItems, tables, orderedLists },
      status: listItems + tables > 0 ? "PRESENT" : "ABSENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  /* ---------------- links ---------------- */

  const linkNodes = $("a[href]")
    .toArray()
    .map((element, order) => {
      const href = $(element).attr("href") ?? "";
      const anchor = textOf($, element);
      let resolved: string | null = null;
      let scheme = "";
      try {
        const url = new URL(href, finalUrl);
        resolved = url.href;
        scheme = url.protocol;
      } catch {
        scheme = "";
      }
      const internal = resolved ? new URL(resolved).hostname === finalUrl.hostname : false;
      const inMain = $(element).parents("main,article").length > 0;
      return { href, anchor, resolved, scheme, internal, order, inMain };
    });

  linkNodes.forEach(link => {
    layer.addEvidence({
      factType: "link.node",
      sourceType: "STATIC_DOM",
      rawValue: { href: link.href, anchor: link.anchor },
      normalizedValue: { resolved: link.resolved, scheme: link.scheme, internal: link.internal, inMain: link.inMain },
      selector: `a[href]:nth-of-type(${link.order + 1})`,
      quote: link.anchor,
    });
  });

  {
    const internal = linkNodes.filter(link => link.internal && link.scheme.startsWith("http"));
    const ev = layer.addEvidence({
      factType: "link.internal",
      sourceType: "DERIVED",
      rawValue: internal.map(link => link.resolved),
      normalizedValue: { count: internal.length, crawlable: internal.filter(link => link.anchor.length > 0).length },
      derivation: "link-classification@1",
    });
    layer.addFact({
      factType: "link.internal",
      key: "main",
      value: {
        count: internal.length,
        crawlable: internal.filter(link => link.anchor.length > 0).length,
        samples: internal.slice(0, 5).map(link => ({ href: link.resolved, anchor: link.anchor })),
      },
      status: internal.length ? "PRESENT" : "ABSENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  {
    // tel:/mailto:/javascript: 는 citation 후보가 아니다. v1이 전화번호를 출처로
    // 인정한 오판(방법론 §12.4)을 여기서 차단한다.
    const external = linkNodes.filter(link => !link.internal);
    const httpExternal = external.filter(link => link.scheme === "http:" || link.scheme === "https:");
    const nonHttp = external.filter(link => link.scheme !== "http:" && link.scheme !== "https:");
    const ev = external.length
      ? layer.addEvidence({
          factType: "link.external_citation",
          sourceType: "DERIVED",
          rawValue: external.map(link => ({ href: link.href, anchor: link.anchor, scheme: link.scheme })),
          normalizedValue: { httpCount: httpExternal.length, nonHttpCount: nonHttp.length },
          derivation: "citation-candidate@1",
        })
      : layer.addAbsence("link.external_citation", "a[href][external]", "DERIVED");
    layer.addFact({
      factType: "link.external_citation",
      key: "main",
      value: {
        httpCount: httpExternal.length,
        nonHttpCount: nonHttp.length,
        rejectedSchemes: [...new Set(nonHttp.map(link => link.scheme))],
        inMainCount: httpExternal.filter(link => link.inMain).length,
        samples: httpExternal.slice(0, 5).map(link => ({ href: link.resolved, anchor: link.anchor, inMain: link.inMain })),
      },
      status: external.length ? "PRESENT" : "ABSENT",
      evidenceIds: [ev.evidenceId],
    });
  }

  /* ---------------- images ---------------- */

  {
    const images = $("img")
      .toArray()
      .map((element, order) => {
        const alt = $(element).attr("alt");
        const role = $(element).attr("role") ?? "";
        return {
          order,
          src: $(element).attr("src") ?? "",
          hasAltAttribute: alt !== undefined,
          altText: alt ?? "",
          decorative: role === "presentation" || role === "none" || alt === "",
        };
      });
    images.forEach(image => {
      layer.addEvidence({
        factType: "image.node",
        sourceType: "STATIC_DOM",
        rawValue: { src: image.src, alt: image.altText, hasAltAttribute: image.hasAltAttribute },
        normalizedValue: { decorative: image.decorative },
        selector: `img:nth-of-type(${image.order + 1})`,
      });
    });
    if (images.length === 0) layer.addAbsence("image.node", "img");
    const applicable = images.filter(image => !image.decorative);
    layer.addFact({
      factType: "image.node",
      key: "summary",
      value: {
        total: images.length,
        applicable: applicable.length,
        withAltAttribute: applicable.filter(image => image.hasAltAttribute).length,
        decorative: images.length - applicable.length,
      },
      status: images.length ? "PRESENT" : "ABSENT",
      evidenceIds: [],
    });
  }

  /* ---------------- structured data ---------------- */

  {
    const blocks = $("script[type='application/ld+json']").toArray();
    const parsed: Record<string, unknown>[] = [];
    let parseErrors = 0;
    const blockEvidenceIds: string[] = [];
    blocks.forEach((element, order) => {
      const raw = $(element).text();
      let ok = true;
      try {
        const value = JSON.parse(raw) as unknown;
        const nodes = Array.isArray(value) ? value : [value];
        for (const node of nodes) {
          const record = node as Record<string, unknown>;
          const graph = record["@graph"];
          if (Array.isArray(graph)) parsed.push(...(graph as Record<string, unknown>[]));
          else parsed.push(record);
        }
      } catch {
        ok = false;
        parseErrors += 1;
      }
      blockEvidenceIds.push(
        layer.addEvidence({
          factType: "schema.block",
          sourceType: "STRUCTURED_DATA",
          rawValue: raw.slice(0, 1000),
          normalizedValue: { parsed: ok },
          selector: `script[type='application/ld+json']:nth-of-type(${order + 1})`,
        }).evidenceId,
      );
    });
    if (blocks.length === 0) blockEvidenceIds.push(layer.addAbsence("schema.block", "script[type='application/ld+json']", "STRUCTURED_DATA").evidenceId);

    layer.addFact({
      factType: "schema.block",
      key: "summary",
      value: { blockCount: blocks.length, parseErrors, nodeCount: parsed.length },
      status: blocks.length === 0 ? "ABSENT" : parseErrors > 0 ? "INVALID" : "PRESENT",
      evidenceIds: blockEvidenceIds,
    });

    const types = [
      ...new Set(
        parsed.flatMap(node => {
          const type = node["@type"];
          if (Array.isArray(type)) return type.map(String);
          return type ? [String(type)] : [];
        }),
      ),
    ].sort();

    parsed.forEach((node, order) => {
      layer.addEvidence({
        factType: "schema.node",
        sourceType: "STRUCTURED_DATA",
        rawValue: node,
        normalizedValue: { type: node["@type"] ?? null, hasContext: "@context" in node },
        selector: `ld+json[${order}]`,
      });
    });
    layer.addFact({
      factType: "schema.node",
      key: "types",
      value: { types, nodeCount: parsed.length, withContext: parsed.filter(node => "@context" in node).length },
      status: parsed.length ? "PRESENT" : "ABSENT",
      evidenceIds: [],
    });

    // required property 검증은 최소 셋만 결정론적으로 확인한다. 미지원 type은
    // PASS/FAIL이 아니라 UNKNOWN으로 남겨야 하므로 supported 여부를 함께 남긴다.
    const REQUIRED: Record<string, string[]> = {
      Article: ["headline"],
      NewsArticle: ["headline"],
      BlogPosting: ["headline"],
      Product: ["name"],
      Organization: ["name"],
      Person: ["name"],
      FAQPage: ["mainEntity"],
    };
    const validations = parsed
      .map(node => {
        const type = Array.isArray(node["@type"]) ? String((node["@type"] as unknown[])[0]) : node["@type"] ? String(node["@type"]) : "";
        const required = REQUIRED[type];
        if (!required) return { type, supported: false, missing: [] as string[] };
        return { type, supported: true, missing: required.filter(property => !(property in node)) };
      })
      .filter(entry => entry.type);
    layer.addEvidence({
      factType: "schema.validation",
      sourceType: "DERIVED",
      rawValue: validations,
      normalizedValue: { supportedCount: validations.filter(entry => entry.supported).length },
      derivation: "required-property-check@1",
    });
    layer.addFact({
      factType: "schema.validation",
      key: "required",
      value: {
        validations,
        supportedCount: validations.filter(entry => entry.supported).length,
        missingCount: validations.reduce((total, entry) => total + entry.missing.length, 0),
      },
      status: validations.length ? "PRESENT" : "ABSENT",
      evidenceIds: [],
    });

    /* -------- author / date / publisher (schema + DOM) -------- */

    const schemaAuthor = parsed.some(node => "author" in node);
    const domAuthor = $("[rel='author'],[itemprop='author'],meta[name='author']").length > 0;
    const authorEv = schemaAuthor || domAuthor
      ? layer.addEvidence({
          factType: "author.signal",
          sourceType: schemaAuthor ? "STRUCTURED_DATA" : "STATIC_DOM",
          rawValue: { schemaAuthor, domAuthor },
          normalizedValue: { sources: [schemaAuthor ? "schema" : null, domAuthor ? "dom" : null].filter(Boolean) },
          selector: "[rel='author'],[itemprop='author'],meta[name='author'],ld+json.author",
        })
      : layer.addAbsence("author.signal", "[rel='author'],[itemprop='author'],meta[name='author'],ld+json.author");
    layer.addFact({
      factType: "author.signal",
      key: "main",
      value: { schemaAuthor, domAuthor, sources: [schemaAuthor ? "schema" : null, domAuthor ? "dom" : null].filter(Boolean) },
      status: schemaAuthor || domAuthor ? "PRESENT" : "ABSENT",
      evidenceIds: [authorEv.evidenceId],
    });

    const schemaPublished = parsed.find(node => "datePublished" in node)?.["datePublished"];
    const schemaModified = parsed.find(node => "dateModified" in node)?.["dateModified"];
    const timeAttr = $("time[datetime]").first().attr("datetime") ?? "";
    const metaPublished = $("meta[property='article:published_time']").attr("content") ?? "";
    const typedValues = [schemaPublished, schemaModified, timeAttr, metaPublished]
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    const parseableValues = typedValues.filter(value => !Number.isNaN(Date.parse(value)));
    const dateEv = typedValues.length
      ? layer.addEvidence({
          factType: "date.signal",
          sourceType: schemaPublished || schemaModified ? "STRUCTURED_DATA" : "STATIC_DOM",
          rawValue: { schemaPublished, schemaModified, timeAttr, metaPublished },
          normalizedValue: { typedCount: typedValues.length, parseableCount: parseableValues.length },
          selector: "time[datetime],meta[property='article:published_time'],ld+json.datePublished",
        })
      : layer.addAbsence("date.signal", "time[datetime],meta[property='article:published_time'],ld+json.datePublished");
    layer.addFact({
      factType: "date.signal",
      key: "main",
      value: {
        published: schemaPublished ?? metaPublished ?? null,
        modified: schemaModified ?? null,
        timeAttr: timeAttr || null,
        typedCount: typedValues.length,
        parseableCount: parseableValues.length,
      },
      status: typedValues.length === 0 ? "ABSENT" : parseableValues.length === typedValues.length ? "PRESENT" : "INVALID",
      evidenceIds: [dateEv.evidenceId],
    });

    const publisherTypes = types.filter(type => ["Organization", "NewsMediaOrganization", "Person", "Corporation"].includes(type));
    const schemaPublisher = parsed.some(node => "publisher" in node);
    const publisherEv = publisherTypes.length || schemaPublisher
      ? layer.addEvidence({
          factType: "publisher.signal",
          sourceType: "STRUCTURED_DATA",
          rawValue: { publisherTypes, schemaPublisher },
          normalizedValue: { count: publisherTypes.length + (schemaPublisher ? 1 : 0) },
          selector: "ld+json.publisher,ld+json[@type=Organization]",
        })
      : layer.addAbsence("publisher.signal", "ld+json.publisher,ld+json[@type=Organization]", "STRUCTURED_DATA");
    layer.addFact({
      factType: "publisher.signal",
      key: "main",
      value: { publisherTypes, schemaPublisher },
      status: publisherTypes.length || schemaPublisher ? "PRESENT" : "ABSENT",
      evidenceIds: [publisherEv.evidenceId],
    });

    /* -------- entity signals -------- */

    const titleText = normalizeText($("title").first().text());
    const h1Text = headingNodes.find(node => node.level === 1)?.text ?? "";
    const schemaName = parsed.map(node => node["name"] ?? node["headline"]).find(value => typeof value === "string") as string | undefined;
    const ogSiteName = $("meta[property='og:site_name']").attr("content") ?? "";
    const entitySources = [
      titleText ? "title" : null,
      h1Text ? "h1" : null,
      schemaName ? "schema" : null,
      ogSiteName ? "og:site_name" : null,
    ].filter(Boolean) as string[];
    const entityEv = entitySources.length
      ? layer.addEvidence({
          factType: "entity.signal",
          sourceType: "DERIVED",
          rawValue: { titleText, h1Text, schemaName: schemaName ?? "", ogSiteName },
          normalizedValue: { sourceCount: entitySources.length },
          derivation: "entity-signal-collection@1",
        })
      : layer.addAbsence("entity.signal", "title,h1,ld+json.name,og:site_name", "DERIVED");
    layer.addFact({
      factType: "entity.signal",
      key: "names",
      value: { titleText, h1Text, schemaName: schemaName ?? "", ogSiteName, sources: entitySources },
      status: entitySources.length ? "PRESENT" : "ABSENT",
      evidenceIds: [entityEv.evidenceId],
    });
  }

  /* ---------------- claims / citation relation ---------------- */

  {
    const candidates: Array<{ text: string; paragraph: number }> = [];
    paragraphs.forEach((text, order) => {
      const matches = text.match(CLAIM_PATTERN);
      if (matches) for (const match of matches) candidates.push({ text: match, paragraph: order });
    });
    const ev = candidates.length
      ? layer.addEvidence({
          factType: "claim.candidate",
          sourceType: "DERIVED",
          rawValue: candidates.slice(0, 20),
          normalizedValue: { count: candidates.length },
          derivation: "numeric-claim-candidate@1",
          confidence: 0.5,
          quote: candidates[0].text,
        })
      : layer.addAbsence("claim.candidate", "paragraph[numeric-pattern]", "DERIVED");
    layer.addFact({
      factType: "claim.candidate",
      key: "main",
      value: { candidates: candidates.slice(0, 20), count: candidates.length },
      // 정규식 후보는 확정된 주장이 아니다. confidence를 낮게 유지해 Rule이
      // 이것만으로 PASS/FAIL을 확정하지 못하게 한다.
      status: candidates.length ? "PRESENT" : "ABSENT",
      confidence: 0.5,
      evidenceIds: [ev.evidenceId],
    });

    const externalInMain = linkNodes.filter(
      link => !link.internal && (link.scheme === "http:" || link.scheme === "https:") && link.inMain,
    );
    const paragraphsWithClaim = new Set(candidates.map(candidate => candidate.paragraph));
    const paragraphsWithCitation = new Set(
      externalInMain
        .map(link => paragraphs.findIndex(text => text.includes(link.anchor) && link.anchor.length > 0))
        .filter(index => index >= 0),
    );
    const sameParagraph = [...paragraphsWithClaim].filter(index => paragraphsWithCitation.has(index)).length;
    const relEv = layer.addEvidence({
      factType: "citation.relation",
      sourceType: "DERIVED",
      rawValue: { claimParagraphs: [...paragraphsWithClaim], citationParagraphs: [...paragraphsWithCitation] },
      normalizedValue: { sameParagraph },
      derivation: "structural-proximity@1",
      confidence: 0.5,
    });
    layer.addFact({
      factType: "citation.relation",
      key: "proximity",
      value: {
        claimParagraphCount: paragraphsWithClaim.size,
        citationParagraphCount: paragraphsWithCitation.size,
        sameParagraph,
        proximity: paragraphsWithClaim.size === 0 ? "NO_CLAIM" : sameParagraph > 0 ? "SAME_PARAGRAPH" : externalInMain.length ? "SAME_DOCUMENT" : "NONE",
      },
      status: paragraphsWithClaim.size === 0 ? "ABSENT" : "PRESENT",
      confidence: 0.5,
      evidenceIds: [relEv.evidenceId],
    });
  }

  /* ---------------- access barrier / render dependency ---------------- */

  {
    const hit = BARRIER_PATTERNS.exec(bodyText);
    const ev = hit
      ? layer.addEvidence({
          factType: "access.barrier",
          sourceType: "STATIC_DOM",
          rawValue: hit[0],
          normalizedValue: { pattern: hit[0], mainTextLength: mainText.length },
          derivation: "barrier-pattern@1",
          confidence: 0.6,
          quote: hit[0],
        })
      : layer.addAbsence("access.barrier", "body[barrier-pattern]");
    layer.addFact({
      factType: "access.barrier",
      key: "main",
      value: { pattern: hit ? hit[0] : null, mainTextLength: mainText.length, bodyTextLength: bodyText.length },
      status: hit ? "PRESENT" : "ABSENT",
      confidence: 0.6,
      evidenceIds: [ev.evidenceId],
    });
  }

  {
    // rendered snapshot이 없으면 render 의존도는 알 수 없다. 이것을 PASS로
    // 만들지 않기 위해 UNKNOWN fact로 남긴다(방법론 §14.3).
    const hasRendered = snapshot.renderedHtml !== null;
    const ev = layer.addEvidence({
      factType: "render.diff",
      sourceType: "DERIVED",
      rawValue: { hasRendered },
      normalizedValue: { hasRendered, rawMainLength: mainText.length },
      derivation: "render-diff@1",
    });
    layer.addFact({
      factType: "render.diff",
      key: "main",
      value: { hasRendered, rawMainLength: mainText.length },
      status: hasRendered ? "PRESENT" : "UNKNOWN",
      evidenceIds: [ev.evidenceId],
    });
  }

  return { index: new FactIndex(layer.getFacts(), layer.getEvidence(), snapshot), layer };
}
