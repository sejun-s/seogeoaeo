/**
 * Evidence Layer 저장소.
 *
 * Rule은 DOM을 직접 읽지 않는다. 관측은 여기서 한 번만 일어나고,
 * SEO check와 GEO check는 같은 Fact ID를 참조한다(Registry §5).
 *
 * ID는 snapshot contentHash와 관측 순서에서만 만들어진다. 시각이나 난수가
 * 들어가지 않으므로 같은 snapshot은 항상 같은 ID를 얻는다.
 */

import type {
  EvidenceRecord,
  FactRecord,
  FactStatus,
  FactType,
  Provenance,
  SourceType,
  TextSpan,
} from "../types";
import { EXTRACTOR_VERSION } from "../types";
import { normalizedTextHash, normalizeText } from "../hash";
import type { PageSnapshot } from "../snapshot";

/** factType → evidence/fact ID에 쓰는 짧은 코드. */
const FACT_CODE: Readonly<Record<FactType, string>> = {
  "url.final": "URLF",
  "redirect.chain": "RDIR",
  "http.status": "STAT",
  "http.header": "HDR",
  "document.title": "TTL",
  "document.meta_description": "META",
  "document.canonical": "CANON",
  "document.robots_directive": "ROBOT",
  "document.language": "LANG",
  "heading.node": "HNODE",
  "heading.outline": "HOUT",
  "landmark.node": "LMARK",
  "content.main_text": "MAIN",
  "content.paragraph": "PARA",
  "content.question_section": "QSEC",
  "link.node": "LINK",
  "link.internal": "LINT",
  "link.external_citation": "LEXT",
  "image.node": "IMG",
  "date.signal": "DATE",
  "author.signal": "AUTH",
  "publisher.signal": "PUB",
  "schema.block": "SBLK",
  "schema.node": "SNODE",
  "schema.validation": "SVAL",
  "access.barrier": "BARR",
  "render.diff": "RDIFF",
  "entity.signal": "ENT",
  "claim.candidate": "CLAIM",
  "citation.relation": "CITE",
  "page.type": "PTYPE",
};

export interface AddEvidenceInput {
  factType: FactType;
  sourceType: SourceType;
  rawValue: unknown;
  normalizedValue: unknown;
  selector?: string;
  quote?: string;
  quoteStart?: number;
  confidence?: number;
  derivation?: string;
  parentEvidenceIds?: string[];
}

export interface AddFactInput {
  factType: FactType;
  /** 같은 factType 안에서 fact를 구분하는 키. 단일 fact면 "main". */
  key: string;
  value: unknown;
  status: FactStatus;
  evidenceIds: string[];
  confidence?: number;
}

export class EvidenceLayer {
  private readonly evidence: EvidenceRecord[] = [];
  private readonly facts: FactRecord[] = [];
  private readonly ordinals = new Map<FactType, number>();
  private readonly hashPrefix: string;

  constructor(private readonly snapshot: PageSnapshot) {
    this.hashPrefix = snapshot.contentHash.slice(0, 12);
  }

  private nextOrdinal(factType: FactType): number {
    const next = (this.ordinals.get(factType) ?? 0) + 1;
    this.ordinals.set(factType, next);
    return next;
  }

  private provenance(input: AddEvidenceInput): Provenance {
    const provenance: Provenance = {
      fetchId: this.snapshot.fetchId,
      snapshotId: this.snapshot.snapshotId,
    };
    if (input.parentEvidenceIds?.length) provenance.parentEvidenceIds = input.parentEvidenceIds;
    if (input.derivation) provenance.derivation = input.derivation;
    return provenance;
  }

  addEvidence(input: AddEvidenceInput): EvidenceRecord {
    const code = FACT_CODE[input.factType];
    const ordinal = this.nextOrdinal(input.factType);
    let textSpan: TextSpan | undefined;
    if (typeof input.quote === "string" && input.quote.length > 0) {
      const quote = input.quote.slice(0, 400);
      const start = input.quoteStart ?? -1;
      textSpan = {
        start,
        end: start >= 0 ? start + quote.length : -1,
        quote,
        normalizedTextHash: normalizedTextHash(quote),
      };
    }
    const record: EvidenceRecord = {
      evidenceId: `EV2_${this.hashPrefix}_${code}_${String(ordinal).padStart(3, "0")}`,
      factType: input.factType,
      sourceUrl: this.snapshot.finalUrl,
      sourceType: input.sourceType,
      rawValue: input.rawValue,
      normalizedValue: input.normalizedValue,
      selector: input.selector,
      textSpan,
      observedAt: this.snapshot.fetchedAt,
      extractorVersion: EXTRACTOR_VERSION,
      contentHash: this.snapshot.contentHash,
      confidence: input.confidence ?? 1,
      provenance: this.provenance(input),
    };
    this.evidence.push(record);
    return record;
  }

  /**
   * 부재 Evidence(evidence schema §7).
   * "찾아봤고 없었다"를 명시적으로 기록한다. 이 기록이 없으면 UNKNOWN과 ABSENT를
   * 구분할 수 없고, 없는 것이 조용히 PASS가 되는 v1의 결함이 재발한다.
   */
  addAbsence(factType: FactType, selector: string, sourceType: SourceType = "STATIC_DOM"): EvidenceRecord {
    return this.addEvidence({
      factType,
      sourceType,
      rawValue: null,
      normalizedValue: null,
      selector,
      derivation: "absence-probe",
    });
  }

  addFact(input: AddFactInput): FactRecord {
    const code = FACT_CODE[input.factType];
    const key = normalizeText(input.key).replace(/[^A-Za-z0-9_.:-]+/g, "_").slice(0, 48) || "main";
    const record: FactRecord = {
      factId: `FACT_${this.hashPrefix}_${code}_${key}`,
      factType: input.factType,
      value: input.value,
      status: input.status,
      evidenceIds: input.evidenceIds,
      confidence: input.confidence ?? 1,
      extractorVersion: EXTRACTOR_VERSION,
      contentHash: this.snapshot.contentHash,
    };
    this.facts.push(record);
    return record;
  }

  getEvidence(): readonly EvidenceRecord[] {
    return this.evidence;
  }

  getFacts(): readonly FactRecord[] {
    return this.facts;
  }
}

/** 추출이 끝난 뒤 Rule 실행기가 사용하는 조회 인터페이스. */
export class FactIndex {
  private readonly byType = new Map<FactType, FactRecord[]>();
  private readonly byId = new Map<string, FactRecord>();

  constructor(
    readonly facts: readonly FactRecord[],
    readonly evidence: readonly EvidenceRecord[],
    readonly snapshot: PageSnapshot,
  ) {
    for (const fact of facts) {
      const list = this.byType.get(fact.factType) ?? [];
      list.push(fact);
      this.byType.set(fact.factType, list);
      this.byId.set(fact.factId, fact);
    }
  }

  all(factType: FactType): readonly FactRecord[] {
    return this.byType.get(factType) ?? [];
  }

  /** 단일 fact 조회. 없으면 undefined. 호출자는 UNKNOWN과 ABSENT를 구분해야 한다. */
  one(factType: FactType): FactRecord | undefined {
    return this.byType.get(factType)?.[0];
  }

  byFactId(factId: string): FactRecord | undefined {
    return this.byId.get(factId);
  }
}
