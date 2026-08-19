import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface NormalizedUrlResult {
  fetchUrl: string;
  normalizedUrl: string;
  displayUrl: string;
}

export interface FetchedDocument {
  fetchUrl: string;
  finalUrl: string;
  normalizedUrl: string;
  httpStatus: number;
  html: string;
  xRobotsTag: string;
  contentType: string;
}

const SENSITIVE_QUERY_PARAMS = new Set([
  "token",
  "access_token",
  "key",
  "api_key",
  "secret",
  "auth",
  "session",
  "code",
  "signature",
]);

function isBlockedIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const parts = ip.split(".").map(Number);
    return (
      parts[0] === 0 ||
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] >= 224
    );
  }
  const lower = ip.toLowerCase();
  return (
    lower === "::" ||
    lower === "::1" ||
    /^(fc|fd|fe80|ff)/.test(lower) ||
    lower.startsWith("::ffff:127.") ||
    lower.startsWith("::ffff:10.") ||
    lower.startsWith("::ffff:192.168.")
  );
}

export async function guardUrl(value: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("INVALID_URL: 올바른 URL 형식이 아닙니다.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("INVALID_URL: http 및 https 공개 URL만 허용됩니다.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("INVALID_URL: URL 사용자 인증 정보(userinfo)는 허용되지 않습니다.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || isIP(hostname) && isBlockedIp(hostname)) {
    throw new Error("SSRF_BLOCKED: 허용되지 않는 로컬/사설 네트워크 주소입니다.");
  }

  try {
    const ips = await lookup(hostname, { all: true });
    if (!ips.length || ips.some((x) => isBlockedIp(x.address))) {
      throw new Error("SSRF_BLOCKED: 사설 IP 주소로 확인된 호스트입니다.");
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("SSRF_BLOCKED")) {
      throw err;
    }
    throw new Error(`UPSTREAM_FETCH_FAILED: 호스트 DNS 조회에 실패했습니다. (${hostname})`);
  }

  return parsed;
}

export async function validateAndNormalizeUrl(input: string): Promise<NormalizedUrlResult> {
  const url = await guardUrl(input);

  // Redact sensitive query parameters
  const normalizedParams = new URLSearchParams();
  const sortedKeys = Array.from(url.searchParams.keys()).sort();
  
  for (const key of sortedKeys) {
    const values = url.searchParams.getAll(key);
    for (const val of values) {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
        normalizedParams.append(key, "<redacted>");
      } else {
        normalizedParams.append(key, val);
      }
    }
  }

  const normalizedHost = url.hostname.toLowerCase();
  const portPart =
    (url.protocol === "http:" && url.port === "80") ||
    (url.protocol === "https:" && url.port === "443") ||
    !url.port
      ? ""
      : `:${url.port}`;

  const queryPart = normalizedParams.toString() ? `?${normalizedParams.toString()}` : "";
  const normalizedUrl = `${url.protocol}//${normalizedHost}${portPart}${url.pathname}${queryPart}`;

  return {
    fetchUrl: url.toString(),
    normalizedUrl,
    displayUrl: normalizedUrl,
  };
}

export async function fetchAuditDocument(inputUrl: string): Promise<FetchedDocument> {
  let currentUrl = inputUrl;
  const visited = new Set<string>();

  for (let i = 0; i < 5; i++) {
    const guarded = await guardUrl(currentUrl);
    const guardedStr = guarded.toString();

    if (visited.has(guardedStr)) {
      throw new Error("UPSTREAM_FETCH_FAILED: 리디렉션 루프가 감지되었습니다.");
    }
    visited.add(guardedStr);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(guardedStr, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "CiteGraphBot/0.1 (+https://citegraph.org)",
          accept: "text/html,application/xhtml+xml",
        },
      });
    } catch (cause) {
      clearTimeout(timeoutId);
      if (cause instanceof Error && cause.name === "AbortError") {
        throw new Error("UPSTREAM_TIMEOUT: 페이지 요청 시간이 초과되었습니다 (15초).");
      }
      throw new Error(`UPSTREAM_FETCH_FAILED: 원본 페이지를 가져오지 못했습니다. (${cause instanceof Error ? cause.message : ""})`);
    } finally {
      clearTimeout(timeoutId);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("UPSTREAM_FETCH_FAILED: 리디렉션 응답에 Location 헤더가 없습니다.");
      }
      currentUrl = new URL(location, guarded).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`UPSTREAM_FETCH_FAILED: 페이지 요청 실패 (HTTP ${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error(`UNSUPPORTED_CONTENT_TYPE: HTML 페이지만 분석할 수 있습니다. (${contentType})`);
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 2 * 1024 * 1024) {
      throw new Error("HTML_TOO_LARGE: 페이지 크기가 2MB 제한을 초과합니다.");
    }

    // Read body stream with byte capping
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > 2 * 1024 * 1024) {
            throw new Error("HTML_TOO_LARGE: 페이지 크기가 2MB 제한을 초과합니다.");
          }
          chunks.push(value);
        }
      }
    }

    const decoder = new TextDecoder("utf-8");
    const html = chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join("") + decoder.decode();

    const normalizedResult = await validateAndNormalizeUrl(guardedStr);

    return {
      fetchUrl: guardedStr,
      finalUrl: guardedStr,
      normalizedUrl: normalizedResult.normalizedUrl,
      httpStatus: response.status,
      html,
      xRobotsTag: response.headers.get("x-robots-tag") || "",
      contentType,
    };
  }

  throw new Error("UPSTREAM_FETCH_FAILED: 리디렉션 횟수가 최대 제한(5회)을 초과했습니다.");
}
