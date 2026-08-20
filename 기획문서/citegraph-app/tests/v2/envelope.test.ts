import { describe, expect, it } from "vitest";
import { calculateConfidence, determineConfidenceBand, type ResultEnvelope } from "../../lib/v2/envelope";

describe("Result Envelope & Confidence Specification (Master Plan v1.1 §4, §5)", () => {
  it("v1.0의 곱셈 공식(calculateConfidence)은 제거됐고 호출하면 명시적으로 실패한다", () => {
    // 근거 없는 Method Reliability 상수(deterministic=1.0, llm=0.75 등)에 의존하던
    // v1.0 공식이 마스터 플랜 §8 No-Go("재현 불가능한 가중치")를 스스로 어겼기 때문에
    // 제거했다. 조용히 삭제하면 과거 코드가 잘못된 값을 계속 받을 수 있으므로 예외를
    // 던져 즉시 드러나게 한다.
    expect(() => calculateConfidence()).toThrow(/v1\.1에서 제거/);
  });

  it("deterministic + 충분한 coverage면 high band다", () => {
    const conf = determineConfidenceBand({
      measurementType: "deterministic",
      inputCoverage: 1.0,
    });

    expect(conf.band).toBe("high");
    expect(conf.reasons).toEqual([]);
  });

  it("coverage가 20% 미만이면 측정 방식과 무관하게 insufficient다", () => {
    const conf = determineConfidenceBand({
      measurementType: "deterministic",
      inputCoverage: 0.1,
    });

    expect(conf.band).toBe("insufficient");
    expect(conf.reasons.some((r) => r.includes("커버리지"))).toBe(true);
  });

  it("llm 측정은 조건이 완벽해도 high를 넘지 않는다(ceiling=medium)", () => {
    const conf = determineConfidenceBand({
      measurementType: "llm",
      inputCoverage: 1.0,
    });

    expect(conf.band).toBe("medium");
  });

  it("external_observation은 표본 크기로 시작 band가 정해진다", () => {
    const small = determineConfidenceBand({
      measurementType: "external_observation",
      inputCoverage: 1.0,
      sampleSize: 8,
    });
    const large = determineConfidenceBand({
      measurementType: "external_observation",
      inputCoverage: 1.0,
      sampleSize: 45,
    });

    expect(small.band).toBe("low");
    expect(large.band).toBe("high");
  });

  it("표본 5 미만인 external_observation은 무조건 insufficient다", () => {
    const conf = determineConfidenceBand({
      measurementType: "external_observation",
      inputCoverage: 1.0,
      sampleSize: 3,
    });

    expect(conf.band).toBe("insufficient");
  });

  it("결함마다 한 단계씩만 강등한다(곱하지 않는다) — coverage 부족 + 오래된 관측이 동시에 있어도 최대 2단계", () => {
    const conf = determineConfidenceBand({
      measurementType: "deterministic",
      inputCoverage: 0.4, // 50% 미만 → 1단계 강등
      staleDays: 120, // 90일 초과 → 1단계 강등
    });

    // high → medium(coverage) → low(stale). insufficient까지 떨어지지 않는다.
    expect(conf.band).toBe("low");
    expect(conf.reasons).toHaveLength(2);
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
      confidence: determineConfidenceBand({
        measurementType: "external_observation",
        inputCoverage: 0.95,
        sampleSize: 40,
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
    expect(envelope.confidence.band).toBe("high"); // n=40 >= 20
    expect(envelope.sampleSize).toBe(40);
  });
});
