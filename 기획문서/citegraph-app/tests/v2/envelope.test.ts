import { describe, expect, it } from "vitest";
import { calculateConfidence, type ResultEnvelope } from "../../lib/v2/envelope";

describe("Result Envelope & Confidence Specification (Master Plan v1.0 §4, §5)", () => {
  it("결정론적 고품질 표본에 대해 High Confidence를 정확히 산출한다", () => {
    const conf = calculateConfidence({
      methodReliability: 1.0,
      inputCoverage: 1.0,
      evidenceAgreement: 1.0,
      sampleAdequacy: 1.0,
      freshness: 1.0,
    });

    expect(conf.value).toBe(1.0);
    expect(conf.band).toBe("high");
    expect(conf.reasons).toEqual([]);
  });

  it("표본 수가 부족(n < 5)하거나 커버리지가 낮으면 insufficient 또는 low band로 강등되고 이유가 첨부된다", () => {
    const conf = calculateConfidence({
      methodReliability: 0.9,
      inputCoverage: 0.3,
      evidenceAgreement: 1.0,
      sampleAdequacy: 0.2, // n < 5
      freshness: 1.0,
    });

    expect(conf.value).toBeLessThan(0.6);
    expect(conf.band).toBe("insufficient");
    expect(conf.reasons).toContain("입력 데이터 커버리지 부족");
    expect(conf.reasons).toContain("관측 표본 크기 부족 (n < 20)");
  });

  it("ResultEnvelope 객체는 필수 메타데이터(provenance, lifecycle, confidence, version)를 충족한다", () => {
    const envelope: ResultEnvelope<number> = {
      id: "env_001",
      metricKey: "geo.observed_recommendation_probability",
      lifecycle: "performance",
      measurementType: "external_observation",
      value: 0.12,
      unit: "probability",
      coverage: 0.95,
      confidence: calculateConfidence({
        methodReliability: 0.9,
        inputCoverage: 0.95,
        evidenceAgreement: 0.9,
        sampleAdequacy: 1.0,
        freshness: 1.0,
      }),
      sampleSize: 40,
      observedFrom: "2026-07-21T00:00:00Z",
      observedTo: "2026-08-20T00:00:00Z",
      scoreVersion: null,
      provenance: {
        inputHash: "hash_abcdef123456",
        methodKey: "PROMPT_OBSERVATION_RUNNER",
        methodVersion: "prompt-observation-v1.2",
        executedAt: new Date().toISOString(),
        evidenceRefs: ["OBS_RUN_101", "OBS_RUN_102"],
      },
      limitations: ["일부 해외 IP 환경에서는 결과가 상이할 수 있음"],
    };

    expect(envelope.lifecycle).toBe("performance");
    expect(envelope.measurementType).toBe("external_observation");
    expect(envelope.confidence.value).toBe(0.77);
    expect(envelope.confidence.band).toBe("medium");
    expect(envelope.sampleSize).toBe(40);
  });
});
