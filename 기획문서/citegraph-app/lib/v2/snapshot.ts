/**
 * PageSnapshot: 분석 대상 1회 관측 결과.
 *
 * 수집(fetch)과 분석을 분리한다. fixture는 네트워크 없이 같은 타입을 만들 수 있고,
 * 같은 snapshot을 다시 분석하면 항상 같은 Fact가 나와야 한다.
 */

import { sha256Hex } from "./hash";

export interface RedirectHop {
  from: string;
  to: string;
  status: number;
}

export interface PageSnapshot {
  snapshotId: string;
  fetchId: string;
  requestUrl: string;
  finalUrl: string;
  status: number;
  /** 소문자 키로 정규화된 응답 헤더. */
  headers: Readonly<Record<string, string>>;
  redirectChain: readonly RedirectHop[];
  /** 렌더링하지 않은 raw HTML. v2는 static DOM만 관측한다. */
  rawHtml: string;
  contentHash: string;
  /** provenance 전용. 점수 계산과 Fact 동일성 판정에 쓰지 않는다. */
  fetchedAt: string;
  /** rendered DOM을 확보하지 못했음을 명시한다. render 의존 check는 UNKNOWN이 된다. */
  renderedHtml: string | null;
}

export interface SnapshotInput {
  requestUrl: string;
  finalUrl?: string;
  status?: number;
  headers?: Record<string, string>;
  redirectChain?: RedirectHop[];
  rawHtml: string;
  /** 생략하면 현재 시각. 테스트는 고정값을 넘겨 완전 결정론을 얻는다. */
  fetchedAt?: string;
  renderedHtml?: string | null;
}

function lowercaseHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(headers).sort()) {
    out[key.toLowerCase()] = headers[key];
  }
  return out;
}

export async function createSnapshot(input: SnapshotInput): Promise<PageSnapshot> {
  const contentHash = await sha256Hex(input.rawHtml);
  const finalUrl = input.finalUrl ?? input.requestUrl;
  return {
    snapshotId: `SNAP_${contentHash.slice(0, 12)}`,
    fetchId: `FETCH_${contentHash.slice(0, 12)}`,
    requestUrl: input.requestUrl,
    finalUrl,
    status: input.status ?? 200,
    headers: lowercaseHeaders(input.headers ?? {}),
    redirectChain: input.redirectChain ?? [],
    rawHtml: input.rawHtml,
    contentHash,
    fetchedAt: input.fetchedAt ?? new Date().toISOString(),
    renderedHtml: input.renderedHtml ?? null,
  };
}
