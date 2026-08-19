export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys.map(
    (key) => JSON.stringify(key) + ":" + stableStringify((obj as Record<string, unknown>)[key]),
  );
  return "{" + entries.join(",") + "}";
}

export async function calculateInputHash(input: {
  normalizedUrl: string;
  finalUrl: string;
  httpStatus: number;
  htmlHash: string;
  headers: {
    contentType: string;
    xRobotsTag: string;
  };
}): Promise<string> {
  const payload = stableStringify({
    normalizedUrl: input.normalizedUrl,
    finalUrl: input.finalUrl,
    httpStatus: input.httpStatus,
    htmlHash: input.htmlHash,
    headers: {
      contentType: input.headers.contentType.toLowerCase().trim(),
      xRobotsTag: input.headers.xRobotsTag.toLowerCase().trim(),
    },
  });

  return sha256Hex(payload);
}
