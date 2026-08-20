import { describe, expect, it } from "vitest";
import { computeUnknownReasonDistribution } from "../../lib/v2/reason-distribution";
import { parseUnknownReason, UNKNOWN_REASONS, type DomainScore, type RuleResultV2 } from "../../lib/v2/types";
import { SEO_CHECK_EVALUATORS } from "../../lib/v2/checks/seo";
import { GEO_FACT_CHECK_EVALUATORS } from "../../lib/v2/checks/geo-fact";

function rule(atomicResults: RuleResultV2["atomicResults"]): RuleResultV2 {
  return {
    ruleId: "SR-TEST", methodologyVersion: "test", scoreDomain: "SEO", category: "Test", engineType: "FACT",
    result: "UNKNOWN", awardedWeight: null, maxWeight: 1, atomicResults, factIds: [], evidenceIds: [], rationaleCode: "", recommendation: "",
  };
}

function domain(rules: RuleResultV2[]): DomainScore {
  return {
    domain: "SEO", score: null, state: "SCORED",
    coverage: { applicableWeight: 0, measuredWeight: 0, earnedWeight: 0, coverage: null, counts: { PASS: 0, WARN: 0, FAIL: 0, N_A: 0, UNKNOWN: 0, NOT_EVALUATED: 0 } },
    categories: [], rules,
  };
}

describe("parseUnknownReason", () => {
  it("인식되는 prefix를 뽑아낸다", () => {
    expect(parseUnknownReason("UNCALIBRATED:no-calibrated-length-profile")).toBe("UNCALIBRATED");
    expect(parseUnknownReason("CLASSIFICATION_UNCERTAIN:page-type-unknown")).toBe("CLASSIFICATION_UNCERTAIN");
  });

  it("인식되지 않는 prefix는 null이다", () => {
    expect(parseUnknownReason("no-calibrated-length-profile")).toBeNull();
    expect(parseUnknownReason("")).toBeNull();
  });
});

describe("computeUnknownReasonDistribution", () => {
  it("빈 입력은 전부 0이다", () => {
    const dist = computeUnknownReasonDistribution([]);
    expect(dist.total).toBe(0);
    expect(dist.unclassified).toBe(0);
    for (const reason of UNKNOWN_REASONS) expect(dist.byReason[reason]).toBe(0);
  });

  it("UNKNOWN이 아닌 상태는 세지 않는다", () => {
    const dist = computeUnknownReasonDistribution([
      domain([rule([{ atomicCheckId: "x", state: "PASS", rationaleCode: "ok", factIds: [], evidenceIds: [], engineType: "FACT", methodologyVersion: "t" }])]),
    ]);
    expect(dist.total).toBe(0);
  });

  it("taxonomy prefix별로 정확히 집계한다", () => {
    const dist = computeUnknownReasonDistribution([
      domain([
        rule([
          { atomicCheckId: "a", state: "UNKNOWN", rationaleCode: "UNCALIBRATED:no-profile", factIds: [], evidenceIds: [], engineType: "FACT", methodologyVersion: "t" },
          { atomicCheckId: "b", state: "UNKNOWN", rationaleCode: "CLASSIFICATION_UNCERTAIN:page-type-unknown", factIds: [], evidenceIds: [], engineType: "FACT", methodologyVersion: "t" },
        ]),
        rule([
          { atomicCheckId: "c", state: "UNKNOWN", rationaleCode: "CLASSIFICATION_UNCERTAIN:page-type-unknown", factIds: [], evidenceIds: [], engineType: "FACT", methodologyVersion: "t" },
        ]),
      ]),
    ]);
    expect(dist.total).toBe(3);
    expect(dist.byReason.UNCALIBRATED).toBe(1);
    expect(dist.byReason.CLASSIFICATION_UNCERTAIN).toBe(2);
    expect(dist.byReason.EXTRACTION_FAILURE).toBe(0);
    expect(dist.unclassified).toBe(0);
  });

  it("prefix 없는 rationaleCode는 unclassified로 잡힌다(회귀 감지용)", () => {
    const dist = computeUnknownReasonDistribution([
      domain([rule([{ atomicCheckId: "x", state: "UNKNOWN", rationaleCode: "legacy-no-prefix", factIds: [], evidenceIds: [], engineType: "FACT", methodologyVersion: "t" }])]),
    ]);
    expect(dist.unclassified).toBe(1);
    expect(dist.total).toBe(1);
  });
});

describe("실제 evaluator가 만드는 UNKNOWN은 전부 taxonomy prefix가 있다", () => {
  it("SEO evaluator", () => {
    const input = { index: { one: () => undefined, all: () => [] } as never, pageType: { type: "UNKNOWN", confidence: 0, assignment: "UNKNOWN", alternatives: [], evidenceIds: [] } as never };
    for (const [id, evaluator] of Object.entries(SEO_CHECK_EVALUATORS)) {
      const output = evaluator(input);
      if (output.state === "UNKNOWN") {
        expect(parseUnknownReason(output.rationaleCode), `${id}: ${output.rationaleCode}`).not.toBeNull();
      }
    }
  });

  it("GEO_FACT evaluator", () => {
    const input = { index: { one: () => undefined, all: () => [] } as never, pageType: { type: "UNKNOWN", confidence: 0, assignment: "UNKNOWN", alternatives: [], evidenceIds: [] } as never };
    for (const [id, evaluator] of Object.entries(GEO_FACT_CHECK_EVALUATORS)) {
      const output = evaluator(input);
      if (output.state === "UNKNOWN") {
        expect(parseUnknownReason(output.rationaleCode), `${id}: ${output.rationaleCode}`).not.toBeNull();
      }
    }
  });
});
