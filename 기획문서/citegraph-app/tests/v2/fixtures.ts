/**
 * Fixture corpus 로더.
 *
 * corpus: 기획문서/fixtures/v2/html/*.html (15개)
 * 네트워크를 쓰지 않는다. 로컬 HTML로 PageSnapshot을 만든다.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSnapshot, type PageSnapshot } from "../../lib/v2/snapshot";

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURE_DIR = join(here, "..", "..", "..", "fixtures", "v2", "html");

/**
 * canonical이 유효한 http(s) URL이 아닌 fixture의 request URL.
 * fixture 설계 의도(README/expected outcomes)에 맞춘 경로이며 HTML을 수정하지 않는다.
 */
const URL_OVERRIDES: Readonly<Record<string, string>> = {
  "02-problematic-homepage.html": "https://fixtures.test/",
  "11-invalid-canonical.html": "https://fixtures.test/compare",
};

/** 결정론 확인을 위해 고정한다. observedAt이 결과를 흔들지 않아야 한다. */
export const FIXED_FETCHED_AT = "2026-08-18T00:00:00.000Z";

export interface FixtureCase {
  id: string;
  file: string;
  url: string;
  html: string;
}

function resolveUrl(file: string, html: string): string {
  const override = URL_OVERRIDES[file];
  if (override) return override;
  const match = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html);
  if (match) {
    try {
      const url = new URL(match[1]);
      if (url.protocol === "http:" || url.protocol === "https:") return url.href;
    } catch {
      /* fall through */
    }
  }
  return `https://fixtures.test/${file.replace(/\.html$/, "")}`;
}

export function listFixtures(): FixtureCase[] {
  return readdirSync(FIXTURE_DIR)
    .filter(file => file.endsWith(".html"))
    .sort()
    .map(file => {
      const html = readFileSync(join(FIXTURE_DIR, file), "utf8");
      return { id: `F${file.slice(0, 2)}`, file, url: resolveUrl(file, html), html };
    });
}

export async function loadFixtureSnapshot(fixture: FixtureCase): Promise<PageSnapshot> {
  return createSnapshot({
    requestUrl: fixture.url,
    rawHtml: fixture.html,
    headers: { "content-type": "text/html; charset=utf-8" },
    fetchedAt: FIXED_FETCHED_AT,
  });
}
