import { describe, expect, it } from "vitest";
import { analyzeSnapshotV2 } from "../../lib/v2";
import type { FactRecord, FactType } from "../../lib/v2/types";
import { listFixtures, loadFixtureSnapshot } from "./fixtures";

const fixtures = listFixtures();

function factOf(facts: readonly FactRecord[], factType: FactType, keySuffix?: string): FactRecord | undefined {
  return facts.find(fact => fact.factType === factType && (keySuffix ? fact.factId.endsWith(keySuffix) : true));
}

async function analyze(file: string) {
  const fixture = fixtures.find(entry => entry.file === file);
  if (!fixture) throw new Error(`fixture 없음: ${file}`);
  return analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
}

describe("Fixture corpus", () => {
  it("15개 fixture가 모두 로드되고 파싱된다", async () => {
    expect(fixtures).toHaveLength(15);
    for (const fixture of fixtures) {
      const analysis = analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
      expect(analysis.facts.length, fixture.file).toBeGreaterThan(10);
      expect(analysis.contentHash, fixture.file).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});

describe("Evidence Layer", () => {
  it("F01 clean homepage: 핵심 Fact가 PRESENT다", async () => {
    const { facts } = await analyze("01-clean-homepage.html");
    expect(factOf(facts, "document.title")?.status).toBe("PRESENT");
    expect(factOf(facts, "document.meta_description")?.status).toBe("PRESENT");
    expect(factOf(facts, "document.canonical")?.status).toBe("PRESENT");
    expect(factOf(facts, "document.language")?.status).toBe("PRESENT");
    expect(factOf(facts, "schema.block", "_summary")?.status).toBe("PRESENT");
    expect((factOf(facts, "schema.node", "_types")?.value as { types: string[] }).types).toContain("Organization");
  });

  it("F02 problematic homepage: 부재와 무효가 PASS로 흡수되지 않는다", async () => {
    const { facts } = await analyze("02-problematic-homepage.html");
    expect(factOf(facts, "document.language")?.status).toBe("ABSENT");
    expect(factOf(facts, "document.canonical")?.status).toBe("INVALID");
    expect(factOf(facts, "schema.block", "_summary")?.status).toBe("INVALID");
    const robots = factOf(facts, "document.robots_directive")?.value as { conflict: boolean; hasNoindex: boolean };
    expect(robots.conflict).toBe(true);
  });

  it("부재 Evidence가 실제로 기록된다", async () => {
    const { evidence, facts } = await analyze("02-problematic-homepage.html");
    const langFact = factOf(facts, "document.language");
    const absenceRecord = evidence.find(record => record.evidenceId === langFact?.evidenceIds[0]);
    expect(absenceRecord?.rawValue).toBeNull();
    expect(absenceRecord?.selector).toBe("html[lang]");
    expect(absenceRecord?.provenance.derivation).toBe("absence-probe");
  });

  it("F09 contact: mailto는 external citation 후보에서 제외된다", async () => {
    const { facts } = await analyze("09-utility-contact.html");
    const citation = factOf(facts, "link.external_citation")?.value as {
      httpCount: number;
      rejectedSchemes: string[];
    };
    // v1이 전화/메일 링크를 출처로 인정한 오판(방법론 §12.4)의 회귀 방지.
    expect(citation.httpCount).toBe(0);
    expect(citation.rejectedSchemes).toContain("mailto:");
  });

  it("F11: canonical 존재와 유효성이 분리 기록된다", async () => {
    const { facts } = await analyze("11-invalid-canonical.html");
    const canonical = factOf(facts, "document.canonical");
    expect(canonical?.status).toBe("INVALID");
    expect((canonical?.value as { count: number }).count).toBe(1);
    expect((canonical?.value as { valid: boolean }).valid).toBe(false);
  });

  it("F12: schema parse 실패가 INVALID로 남고 type이 조작되지 않는다", async () => {
    const { facts } = await analyze("12-invalid-structured-data.html");
    expect(factOf(facts, "schema.block", "_summary")?.status).toBe("INVALID");
    expect((factOf(facts, "schema.node", "_types")?.value as { types: string[] }).types).toEqual([]);
  });

  it("F13 JS-heavy: rendered snapshot이 없으면 render.diff는 UNKNOWN이다", async () => {
    const { facts } = await analyze("13-js-heavy.html");
    const render = factOf(facts, "render.diff");
    expect(render?.status).toBe("UNKNOWN");
    expect((render?.value as { hasRendered: boolean }).hasRendered).toBe(false);
  });

  it("F03 article: author/date/citation Fact가 모두 PRESENT다", async () => {
    const { facts } = await analyze("03-article.html");
    expect(factOf(facts, "author.signal")?.status).toBe("PRESENT");
    expect(factOf(facts, "date.signal")?.status).toBe("PRESENT");
    expect((factOf(facts, "link.external_citation")?.value as { httpCount: number }).httpCount).toBe(1);
  });

  it("F04: author 부재가 ABSENT로 기록된다", async () => {
    const { facts } = await analyze("04-article-without-author.html");
    expect(factOf(facts, "author.signal")?.status).toBe("ABSENT");
  });

  it("F05: date 부재가 ABSENT로 기록된다", async () => {
    const { facts } = await analyze("05-article-without-date.html");
    expect(factOf(facts, "date.signal")?.status).toBe("ABSENT");
  });

  it("claim candidate는 confidence 0.5로 남아 확정 주장으로 취급되지 않는다", async () => {
    const { facts } = await analyze("15-strong-seo-weak-geo.html");
    const claim = factOf(facts, "claim.candidate");
    expect(claim?.confidence).toBe(0.5);
  });
});

describe("결정론", () => {
  it("같은 snapshot을 두 번 분석하면 Fact/Evidence가 완전히 동일하다", async () => {
    for (const fixture of fixtures) {
      const snapshot = await loadFixtureSnapshot(fixture);
      const first = analyzeSnapshotV2(snapshot);
      const second = analyzeSnapshotV2(snapshot);
      expect(JSON.stringify(second.facts), fixture.file).toBe(JSON.stringify(first.facts));
      expect(JSON.stringify(second.evidence), fixture.file).toBe(JSON.stringify(first.evidence));
      expect(second.pageType, fixture.file).toEqual(first.pageType);
    }
  });

  it("같은 HTML로 새 snapshot을 만들어도 contentHash와 ID가 같다", async () => {
    const fixture = fixtures[0];
    const a = analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
    const b = analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
    expect(b.contentHash).toBe(a.contentHash);
    expect(b.facts.map(fact => fact.factId)).toEqual(a.facts.map(fact => fact.factId));
    expect(b.evidence.map(record => record.evidenceId)).toEqual(a.evidence.map(record => record.evidenceId));
  });

  it("observedAt이 달라도 Fact 결과는 바뀌지 않는다", async () => {
    const fixture = fixtures[0];
    const { createSnapshot } = await import("../../lib/v2/snapshot");
    const early = await createSnapshot({ requestUrl: fixture.url, rawHtml: fixture.html, fetchedAt: "2020-01-01T00:00:00.000Z" });
    const late = await createSnapshot({ requestUrl: fixture.url, rawHtml: fixture.html, fetchedAt: "2030-01-01T00:00:00.000Z" });
    expect(JSON.stringify(analyzeSnapshotV2(late).facts)).toBe(JSON.stringify(analyzeSnapshotV2(early).facts));
  });
});

describe("Semantic 미실행 계약", () => {
  it("모든 fixture에서 GEO Semantic과 GEO Overall이 NOT_EVALUATED다", async () => {
    for (const fixture of fixtures) {
      const analysis = analyzeSnapshotV2(await loadFixtureSnapshot(fixture));
      expect(analysis.geoSemantic.state, fixture.file).toBe("NOT_EVALUATED");
      expect(analysis.geoOverall.state).toBe("NOT_EVALUATED");
      expect(analysis.geoOverall.reason).toBe("semantic-engine-not-implemented");
      for (const rule of analysis.geoSemantic.rules) {
        expect(rule.result, `${fixture.file} ${rule.ruleId}`).toBe("NOT_EVALUATED");
      }
      for (const rule of analysis.seoAdvisory) {
        expect(rule.result, `${fixture.file} ${rule.ruleId}`).toBe("NOT_EVALUATED");
      }
    }
  });
});
