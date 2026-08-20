/**
 * Signal Family 도입으로 고친 두 가지 중복 계산 케이스를 검증한다.
 * 근거: 기획문서/score-reliability-improvement-plan-2026-08-20-v2-final.md §5 P1.
 *
 * 기존 fixture corpus(기획문서/fixtures/v2/html, 15개)는 evidence.test.ts가
 * 개수를 15로 고정해뒀기 때문에 여기에 새 파일을 추가하지 않는다. 대신
 * createSnapshot으로 이 테스트 안에서만 쓰는 최소 HTML을 직접 만든다.
 *
 * 본문은 항상 200자 이상을 채운다 — 그렇지 않으면 "short-main+few-links"
 * LANDING_PAGE 신호가 의도치 않게 같이 발생해서 share가 오염되고, 이 테스트가
 * 실제로 격리하려는 신호(schema/DOM/breadcrumb) 하나만의 효과를 볼 수 없다.
 */

import { describe, expect, it } from "vitest";
import { analyzeSnapshotV2 } from "../../lib/v2";
import { createSnapshot } from "../../lib/v2/snapshot";

const FETCHED_AT = "2026-08-18T00:00:00.000Z";
const FILLER = "<p>" + "본문을 200자 이상으로 채우기 위한 문장입니다. ".repeat(10) + "</p>";

async function classify(url: string, html: string) {
  const snapshot = await createSnapshot({
    requestUrl: url,
    rawHtml: html,
    headers: { "content-type": "text/html; charset=utf-8" },
    fetchedAt: FETCHED_AT,
  });
  return analyzeSnapshotV2(snapshot).pageType;
}

describe("스키마 배열 중복 계산 방지", () => {
  it("같은 JSON-LD 블록의 @type 배열 두 토큰이 같은 PageType에 매핑되면 한 번만 배점된다", async () => {
    // Article + NewsArticle → 둘 다 ARTICLE_BLOG. path/DOM 신호가 없어서
    // schema 신호 하나(5점)가 전부다. 예전처럼 5+5=10으로 더했다면
    // saturation=min(1,10/7)=1, confidence≈1(capped 0.95)로 AUTO_ASSIGNED가
    // 나왔을 것이다. 중복 제거 후에는 5점뿐이라 saturation=5/7≈0.714여야 한다.
    const html = `<!doctype html><html lang="en"><head>
      <title>Untitled</title>
      <script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": ["Article", "NewsArticle"],
        headline: "Test",
      })}</script>
    </head><body><div>${FILLER}</div></body></html>`;

    const result = await classify("https://fixtures.test/no-path-match-xyz", html);
    expect(result.type).toBe("ARTICLE_BLOG");
    expect(result.assignment).toBe("PROVISIONAL");
    expect(result.confidence).toBeLessThan(0.85);
    // 5/7 saturation × share 1.0 ≈ 0.7143
    expect(result.confidence).toBeCloseTo(5 / 7, 3);
  });
});

describe("DOM article 신호 tiered 처리(가산 아님)", () => {
  it("<article> 요소만 있으면 약한 신호(2점)만 잡힌다", async () => {
    const html = `<!doctype html><html lang="en"><head><title>T</title></head>
      <body><article>${FILLER}</article></body></html>`;
    const result = await classify("https://fixtures.test/no-path-match-abc", html);
    // 2점뿐이라 saturation=2/7≈0.2857, PROVISIONAL 문턱(0.6)에도 못 미쳐 UNKNOWN.
    expect(result.assignment).toBe("UNKNOWN");
    expect(result.alternatives[0]?.type).toBe("ARTICLE_BLOG");
    expect(result.alternatives[0]?.confidence).toBeCloseTo(2 / 7, 3);
  });

  it("<article> + H2 2개 이상 + 문단 구조가 갖춰지면 강한 신호(3점)로 대체되고 가산되지 않는다", async () => {
    const html = `<!doctype html><html lang="en"><head><title>T</title></head>
      <body><article>
        <h2>Section A</h2>${FILLER}
        <h2>Section B</h2>${FILLER}
      </article></body></html>`;
    const result = await classify("https://fixtures.test/no-path-match-def", html);
    // 3점만 있어야 한다(2+3=5가 아니라). 3/7≈0.4286 — 여전히 UNKNOWN 구간이지만
    // 후보는 ARTICLE_BLOG여야 한다.
    expect(result.assignment).toBe("UNKNOWN");
    expect(result.alternatives[0]?.type).toBe("ARTICLE_BLOG");
    expect(result.alternatives[0]?.confidence).toBeCloseTo(3 / 7, 3);
  });
});

describe("breadcrumb 교차 family 보강(신규 신호)", () => {
  it("path 신호 + BreadcrumbList schema가 함께 있으면 같은 type에 소폭 가산된다", async () => {
    const html = `<!doctype html><html lang="en"><head>
      <title>Doc</title>
      <script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Docs" }],
      })}</script>
    </head><body><div>${FILLER}</div></body></html>`;

    const withBreadcrumb = await classify("https://fixtures.test/docs/example", html);

    const htmlNoBreadcrumb = `<!doctype html><html lang="en"><head><title>Doc</title></head>
      <body><div>${FILLER}</div></body></html>`;
    const withoutBreadcrumb = await classify("https://fixtures.test/docs/example", htmlNoBreadcrumb);

    expect(withBreadcrumb.type).toBe("DOCUMENTATION");
    // path만 있을 때(3점)는 3/7≈0.4286으로 PROVISIONAL 문턱(0.6) 아래라 UNKNOWN이다 —
    // breadcrumb 보강(3+2=5점, 5/7≈0.714)이 있어야 PROVISIONAL로 넘어간다는 게 이 테스트의 요지다.
    expect(withoutBreadcrumb.assignment).toBe("UNKNOWN");
    expect(withoutBreadcrumb.alternatives[0]?.type).toBe("DOCUMENTATION");
    expect(withBreadcrumb.assignment).toBe("PROVISIONAL");
    // path만 있을 때(3점) 대비 breadcrumb 보강(3+2=5점)으로 confidence가 올라가야 한다.
    expect(withBreadcrumb.confidence).toBeGreaterThan(withoutBreadcrumb.confidence);
    expect(withoutBreadcrumb.confidence).toBeCloseTo(3 / 7, 3);
    expect(withBreadcrumb.confidence).toBeCloseTo(5 / 7, 3);
  });

  it("path 신호가 없으면(홈페이지) breadcrumb만으로 보강하지 않는다", async () => {
    const html = `<!doctype html><html lang="en"><head>
      <title>Home</title>
      <script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Home" }],
      })}</script>
    </head><body><div>${FILLER}</div></body></html>`;
    const result = await classify("https://fixtures.test/", html);
    // HOMEPAGE(path:root, 4점)만 있어야 한다 — breadcrumb 보강은 pathMatch가
    // 있을 때만 붙는데 루트 경로는 pathMatch(PATH_MAP 매칭)를 만들지 않는다.
    expect(result.confidence).toBeCloseTo(4 / 7, 3);
  });
});

describe("신호 A: 복수 article vs 단일 article 분기", () => {
  it("복수 <article> 요소(3개 이상)가 있으면 CATEGORY_LISTING 신호(3점)가 발생한다", async () => {
    const html = `<!doctype html><html lang="en"><head><title>Feed</title></head>
      <body>
        <main>
          <article><h2>Post 1</h2>${FILLER}</article>
          <article><h2>Post 2</h2>${FILLER}</article>
          <article><h2>Post 3</h2>${FILLER}</article>
        </main>
      </body></html>`;

    const result = await classify("https://fixtures.test/no-path-match-feed", html);
    // 3점만 있어야 한다(3/7≈0.4286). 1개일 때의 ARTICLE_BLOG 신호가 아닌 CATEGORY_LISTING이어야 한다.
    expect(result.assignment).toBe("UNKNOWN");
    expect(result.alternatives[0]?.type).toBe("CATEGORY_LISTING");
    expect(result.alternatives[0]?.confidence).toBeCloseTo(3 / 7, 3);
    // ARTICLE_BLOG 신호는 발생하지 않아야 한다
    expect(result.alternatives.some(a => a.type === "ARTICLE_BLOG")).toBe(false);
  });

  it("단일 <article> 요소(1개)일 때는 ARTICLE_BLOG 신호가 유지된다", async () => {
    const html = `<!doctype html><html lang="en"><head><title>Single Post</title></head>
      <body>
        <main>
          <article><h2>Section 1</h2>${FILLER}<h2>Section 2</h2>${FILLER}</article>
        </main>
      </body></html>`;

    const result = await classify("https://fixtures.test/no-path-match-single", html);
    expect(result.alternatives[0]?.type).toBe("ARTICLE_BLOG");
    expect(result.alternatives.some(a => a.type === "CATEGORY_LISTING")).toBe(false);
  });
});

describe("신호 B: bare listing path vs article slug path 분기", () => {
  it("/blog 또는 /news 처럼 추가 슬러그가 없는 bare path는 CATEGORY_LISTING(3점)으로 매핑된다", async () => {
    const html = `<!doctype html><html lang="en"><head><title>Blog List</title></head>
      <body><div>${FILLER}</div></body></html>`;

    const blogResult = await classify("https://fixtures.test/blog", html);
    expect(blogResult.alternatives[0]?.type).toBe("CATEGORY_LISTING");
    expect(blogResult.alternatives[0]?.confidence).toBeCloseTo(3 / 7, 3);

    const newsResult = await classify("https://fixtures.test/news/", html);
    expect(newsResult.alternatives[0]?.type).toBe("CATEGORY_LISTING");
    expect(newsResult.alternatives[0]?.confidence).toBeCloseTo(3 / 7, 3);
  });

  it("/blog/some-article-slug 처럼 추가 슬러그가 있는 경로는 ARTICLE_BLOG(3점)으로 매핑된다", async () => {
    const html = `<!doctype html><html lang="en"><head><title>Blog Post</title></head>
      <body><div>${FILLER}</div></body></html>`;

    const slugResult = await classify("https://fixtures.test/blog/how-to-optimize-seo", html);
    expect(slugResult.alternatives[0]?.type).toBe("ARTICLE_BLOG");
    expect(slugResult.alternatives[0]?.confidence).toBeCloseTo(3 / 7, 3);
  });

  it("bare path(/blog) + 복수 article(3개)이 결합되면 CATEGORY_LISTING PROVISIONAL로 판정된다", async () => {
    const html = `<!doctype html><html lang="en"><head><title>Tech Blog</title></head>
      <body>
        <main>
          <article><h2>Article 1</h2>${FILLER}</article>
          <article><h2>Article 2</h2>${FILLER}</article>
          <article><h2>Article 3</h2>${FILLER}</article>
        </main>
      </body></html>`;

    const result = await classify("https://fixtures.test/blog", html);
    // path(3점) + DOM repeated-article(3점) = 6점 (6/7 ≈ 0.8571 >= 0.85 -> AUTO_ASSIGNED)
    expect(result.type).toBe("CATEGORY_LISTING");
    expect(result.assignment).toBe("AUTO_ASSIGNED");
    expect(result.confidence).toBeCloseTo(6 / 7, 3);
  });
});

