/**
 * 결정론적 해시 유틸.
 *
 * - contentHash: evidence schema §4가 요구하는 response body의 SHA-256.
 * - normalizedTextHash: text span 동일성 표시용 짧은 해시. 암호학적 용도가 아니다.
 *
 * Web Crypto만 사용하므로 Node 22와 Cloudflare Worker에서 같은 값을 만든다.
 */

const encoder = new TextEncoder();

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

/** FNV-1a 32bit. 같은 문자열이면 언제나 같은 8자리 hex를 돌려준다. */
export function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** 공백 정규화. Fact 값 비교와 텍스트 해시의 공통 전처리다. */
export function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function normalizedTextHash(input: string): string {
  return shortHash(normalizeText(input));
}
