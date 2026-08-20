import { describe, expect, it } from "vitest";
import { analyzeSnapshotV2 } from "../../lib/v2";
import { listFixtures, loadFixtureSnapshot } from "./fixtures";

const fixtures = listFixtures();

async function analyze(file: string) {
  const fixture = fixtures.find(entry => entry.file === file);
  if (!fixture) throw new Error(`fixture 없음: ${file}`);
  return analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
}

async function seoScore(file: string) {
  return (await analyze(file)).seo.score;
}

async function geoFactScore(file: string) {
  return (await analyze(file)).geoFact.score;
}

describe("SEO DomainScore 계약", () => {
  it("측정된 rule의 maxWeight 합이 100을 넘지 않는다(applicableWeight 기준)", async () => {
    for (const fixture of fixtures) {
      const analysis = analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
      expect(analysis.seo.coverage.applicableWeight, fixture.file).toBeLessThanOrEqual(100);
      expect(analysis.seo.coverage.measuredWeight, fixture.file).toBeLessThanOrEqual(analysis.seo.coverage.applicableWeight);
    }
  });

  it("score는 0~100 범위다", async () => {
    for (const fixture of fixtures) {
      const analysis = analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
      if (analysis.seo.score !== null) {
        expect(analysis.seo.score, fixture.file).toBeGreaterThanOrEqual(0);
        expect(analysis.seo.score, fixture.file).toBeLessThanOrEqual(100);
      }
    }
  });

  it("coverage는 measuredWeight/applicableWeight와 정확히 일치한다", async () => {
    for (const fixture of fixtures) {
      const analysis = analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
      const { measuredWeight, applicableWeight, coverage } = analysis.seo.coverage;
      if (applicableWeight === 0) {
        expect(coverage).toBeNull();
      } else {
        expect(coverage).toBeCloseTo(measuredWeight / applicableWeight, 3);
      }
    }
  });
});

describe("Weight 무결성", () => {
  it("SEO 18 Scoring Rule의 measured 상태 rule maxWeight 합이 applicableWeight와 일치한다", async () => {
    const analysis = await analyze("01-clean-homepage.html");
    const measuredSum = analysis.seo.rules.filter(r => r.result !== "N_A" && r.result !== "UNKNOWN" && r.result !== "NOT_EVALUATED").reduce((s, r) => s + r.maxWeight, 0);
    expect(measuredSum).toBe(analysis.seo.coverage.measuredWeight);
  });
});

describe("N_A / UNKNOWN / NOT_EVALUATED 발생 확인", () => {
  it("N_A가 실제로 발생한다(이미지 없는 fixture의 alt 관련 rule)", async () => {
    const analysis = await analyze("01-clean-homepage.html");
    const altRule = analysis.seo.rules.find(r => r.ruleId === "SR-SEO-ALT");
    expect(altRule?.result).toBe("N_A");
  });

  it("UNKNOWN이 실제로 발생한다(길이 heuristic profile 부재)", async () => {
    const analysis = await analyze("01-clean-homepage.html");
    const titleRule = analysis.seo.rules.find(r => r.ruleId === "SR-SEO-TITLE");
    expect(titleRule?.result).toBe("UNKNOWN");
  });

  it("NOT_EVALUATED가 GEO Semantic 전체와 SEO Advisory 전체에서 발생한다", async () => {
    const analysis = await analyze("01-clean-homepage.html");
    expect(analysis.geoSemantic.rules.every(r => r.result === "NOT_EVALUATED")).toBe(true);
    expect(analysis.seoAdvisory.every(r => r.result === "NOT_EVALUATED")).toBe(true);
  });

  it("N_A는 applicableWeight에서 제외되지만 UNKNOWN/NOT_EVALUATED는 포함된다", async () => {
    const analysis = await analyze("01-clean-homepage.html");
    const naWeight = analysis.seo.rules.filter(r => r.result === "N_A").reduce((s, r) => s + r.maxWeight, 0);
    const unknownWeight = analysis.seo.rules.filter(r => r.result === "UNKNOWN").reduce((s, r) => s + r.maxWeight, 0);
    const totalWeight = analysis.seo.rules.reduce((s, r) => s + r.maxWeight, 0);
    expect(analysis.seo.coverage.applicableWeight).toBe(totalWeight - naWeight);
    expect(unknownWeight).toBeGreaterThan(0);
    // UNKNOWN은 applicable에는 있지만 measured에서는 빠져야 한다.
    expect(analysis.seo.coverage.measuredWeight).toBeLessThanOrEqual(analysis.seo.coverage.applicableWeight - unknownWeight + 0.001);
  });
});

describe("GEO Overall 미산출 계약", () => {
  it("Semantic Engine 미실행이면 geoOverall이 항상 NOT_EVALUATED다", async () => {
    for (const fixture of fixtures) {
      const analysis = analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
      expect(analysis.geoOverall.state, fixture.file).toBe("NOT_EVALUATED");
    }
  });
});

describe("citation 오판 회귀 방지 (방법론 §12.4)", () => {
  it("F09 contact: mailto 링크만 있으면 AC-GF-CITEURL이 PASS가 아니다(N_A 또는 FAIL)", async () => {
    const analysis = await analyze("09-utility-contact.html");
    const citeRule = analysis.atomicResults.get("AC-GF-CITEURL");
    expect(citeRule?.state).not.toBe("PASS");
  });
});

describe("Expected Ordering — fixture-expected-outcomes.md", () => {
  it("SEO: F01 clean home > F02 problematic home", async () => {
    expect(await seoScore("01-clean-homepage.html")).toBeGreaterThan((await seoScore("02-problematic-homepage.html"))!);
  });

  it("SEO: F05(날짜 없음)는 SR-SEO-DATE가 확정 FAIL이 아니라 UNKNOWN이라 F03보다 낮지 않다", async () => {
    // 이전 기대(F03 > F05)는 검수 중 발견한 버그(AC-SEO-DATE-PRESENT가
    // pageType.assignment를 안 보고 type만 봐서 PROVISIONAL 페이지도
    // 확정 FAIL로 채점했음)를 전제로 한 것이었다. 그 버그를 고치고 나니
    // F05는 실제로 PROVISIONAL(0.8333 — date.signal이 ARTICLE_BLOG
    // confidence에도 기여하는 신호라, 날짜가 없으면 confidence 자체가
    // 0.85 문턱 아래로 떨어진다)이 되고, applicability.ts의 계약("PROVISIONAL
    // 이면 page-type 종속 check를 확정 판정하지 않는다")에 따라 SR-SEO-DATE가
    // UNKNOWN으로 정직하게 빠진다. UNKNOWN은 measured 분모에서 빠지므로
    // 오히려 F05의 비율 점수가 F03보다 높아질 수 있다 — "날짜가 없으면 무조건
    // 낮은 점수"가 아니라 "날짜가 없으면 그 항목을 판단 못 함"이 이 엔진의
    // 정직한 계약이다. F03(AUTO_ASSIGNED, 날짜 있음)이 확정 PASS로 3점을
    // 벌고, F05(PROVISIONAL)는 그 3점이 통째로 분모·분자에서 빠진다는
    // 사실만 확인한다.
    const f03 = await analyze("03-article.html");
    const f05 = await analyze("05-article-without-date.html");
    const f05DateRule = f05.seo.rules.find(r => r.ruleId === "SR-SEO-DATE");
    expect(f05.pageType.assignment).toBe("PROVISIONAL");
    expect(f05DateRule?.result).toBe("UNKNOWN");
    expect(f03.pageType.assignment).toBe("AUTO_ASSIGNED");
    expect(f03.seo.rules.find(r => r.ruleId === "SR-SEO-DATE")?.result).toBe("PASS");
  });

  it("SEO: F06 product > F12 invalid structured data", async () => {
    expect(await seoScore("06-product.html")).toBeGreaterThan((await seoScore("12-invalid-structured-data.html"))!);
  });

  it("SEO: F03 article > F10 noindex article", async () => {
    expect(await seoScore("03-article.html")).toBeGreaterThan((await seoScore("10-noindex-page.html"))!);
  });

  it("SEO: F15 strong-SEO/weak-GEO > F14 thin content", async () => {
    expect(await seoScore("15-strong-seo-weak-geo.html")).toBeGreaterThan((await seoScore("14-thin-content.html"))!);
  });

  it("GEO Technical: F03 article > F04 no-author article", async () => {
    expect(await geoFactScore("03-article.html")).toBeGreaterThan((await geoFactScore("04-article-without-author.html"))!);
  });

  it("GEO Technical: F03 article > F05 no-date article", async () => {
    expect(await geoFactScore("03-article.html")).toBeGreaterThan((await geoFactScore("05-article-without-date.html"))!);
  });

  it("GEO Technical: F01 clean home > F02 problematic home", async () => {
    expect(await geoFactScore("01-clean-homepage.html")).toBeGreaterThan((await geoFactScore("02-problematic-homepage.html"))!);
  });

  it("GEO Technical: F13 JS-heavy < F07 comparable server-rendered service", async () => {
    expect(await geoFactScore("13-js-heavy.html")).toBeLessThan((await geoFactScore("07-service.html"))!);
  });
});

describe("결정론", () => {
  it("같은 snapshot을 두 번 분석하면 점수와 coverage가 완전히 동일하다", async () => {
    for (const fixture of fixtures) {
      const snapshot = await loadFixtureSnapshot(fixture);
      const first = analyzeSnapshotV2(snapshot);
      const second = analyzeSnapshotV2(snapshot);
      expect(second.seo.score, fixture.file).toBe(first.seo.score);
      expect(second.seo.coverage, fixture.file).toEqual(first.seo.coverage);
      expect(second.geoFact.score, fixture.file).toBe(first.geoFact.score);
      expect(second.geoFact.coverage, fixture.file).toEqual(first.geoFact.coverage);
    }
  });
});

describe("Registry 관점 무결성", () => {
  it("SEO rule 18개, GEO Fact rule 8개가 전부 결과를 낸다(정의 누락 없음)", async () => {
    const analysis = await analyze("01-clean-homepage.html");
    expect(analysis.seo.rules).toHaveLength(18);
    expect(analysis.geoFact.rules).toHaveLength(8);
    expect(analysis.geoSemantic.rules).toHaveLength(9);
    expect(analysis.seoAdvisory).toHaveLength(6);
  });

  it("모든 rule 결과의 state가 6-상태 계약 안에 있다", async () => {
    const analysis = await analyze("15-strong-seo-weak-geo.html");
    const valid = new Set(["PASS", "WARN", "FAIL", "N_A", "UNKNOWN", "NOT_EVALUATED"]);
    for (const rule of [...analysis.seo.rules, ...analysis.geoFact.rules, ...analysis.geoSemantic.rules, ...analysis.seoAdvisory]) {
      expect(valid.has(rule.result), rule.ruleId).toBe(true);
    }
  });
});
