/**
 * Frozen Corpus 스냅샷 인터페이스 및 유틸리티.
 *
 * 근거:
 * - 기획문서/score-reliability-improvement-plan-2026-08-20-v2-final.md §3-1, §5 P5
 * - 기획문서/gemini-prompt-score-reliability-p4-p7.md P5
 *
 * 원칙:
 * 1. 공개(Public) 저장소의 저작권/ToS 보호를 위해 타 사이트 원본 HTML 전체를 저장하지 않는다.
 * 2. 정규화된 Fact/Evidence 레코드와 contentHash(SHA-256 12자리 hex)만 보존한다.
 * 3. 동일한 contentHash와 동일한 ruleset 환경에서 항상 동일한 평가 결과가 산출되는 결정론을 보장한다.
 */

import type { AnalysisV2 } from "./index";
import type { EvidenceRecord, FactRecord } from "./types";

export interface FrozenSnapshotRecord {
  readonly snapshotId: string;
  readonly contentHash: string;
  readonly finalUrl: string;
  readonly fetchedAt: string;
  readonly facts: readonly FactRecord[];
  readonly evidence: readonly EvidenceRecord[];
  readonly summary: {
    readonly factCount: number;
    readonly evidenceCount: number;
    readonly pageType: string;
    readonly seoScore: number | null;
    readonly geoFactScore: number | null;
    readonly seoCoverage: number | null;
    readonly geoFactCoverage: number | null;
  };
  readonly metadata: {
    readonly methodologyVersion: string;
    readonly registryVersion: string;
    readonly extractorVersion: string;
    readonly storageMode: "HASH_ONLY" | "FROZEN_RECORD";
  };
}

/**
 * v2 분석 결과로부터 원본 HTML을 배제한 Frozen Snapshot 레코드를 생성한다.
 */
export function createFrozenSnapshot(
  analysis: AnalysisV2,
  fetchedAt = new Date().toISOString(),
): FrozenSnapshotRecord {
  return {
    snapshotId: analysis.snapshotId,
    contentHash: analysis.contentHash,
    finalUrl: analysis.finalUrl,
    fetchedAt,
    facts: [...analysis.facts],
    evidence: [...analysis.evidence],
    summary: {
      factCount: analysis.facts.length,
      evidenceCount: analysis.evidence.length,
      pageType: analysis.pageType.type,
      seoScore: analysis.seo.score,
      geoFactScore: analysis.geoFact.score,
      seoCoverage: analysis.seo.coverage.coverage,
      geoFactCoverage: analysis.geoFact.coverage.coverage,
    },
    metadata: {
      methodologyVersion: analysis.methodologyVersion,
      registryVersion: analysis.registryVersion,
      extractorVersion: analysis.extractorVersion,
      storageMode: "FROZEN_RECORD",
    },
  };
}

/**
 * Frozen Snapshot 레코드의 무결성과 contentHash 일치 여부를 검증한다.
 */
export function verifyFrozenIntegrity(
  frozen: FrozenSnapshotRecord,
  recomputedContentHash: string,
): { valid: boolean; reason?: string } {
  if (frozen.contentHash !== recomputedContentHash) {
    return {
      valid: false,
      reason: `contentHash mismatch: stored=${frozen.contentHash}, recomputed=${recomputedContentHash}`,
    };
  }
  if (frozen.facts.length !== frozen.summary.factCount) {
    return {
      valid: false,
      reason: `factCount mismatch: record=${frozen.facts.length}, summary=${frozen.summary.factCount}`,
    };
  }
  if (frozen.evidence.length !== frozen.summary.evidenceCount) {
    return {
      valid: false,
      reason: `evidenceCount mismatch: record=${frozen.evidence.length}, summary=${frozen.summary.evidenceCount}`,
    };
  }
  return { valid: true };
}
