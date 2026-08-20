import type { CiteGraphDb } from "./db";
import { workspaces } from "../db/schema";

export const WORKSPACE_COOKIE = "citegraph_workspace";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function readWorkspaceId(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const value = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${WORKSPACE_COOKIE}=`))?.slice(WORKSPACE_COOKIE.length + 1);
  return value && UUID_V4.test(value) ? value : null;
}

export function workspaceCookie(id: string) {
  return `${WORKSPACE_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
}

export async function ensureLocalWorkspace(db: CiteGraphDb, request: Request) {
  const existing = readWorkspaceId(request);
  const id = existing || crypto.randomUUID();
  await db.insert(workspaces).values({ id, kind: "LOCAL_WORKSPACE", createdAt: new Date() }).onConflictDoNothing();
  return { id, setCookie: existing ? null : workspaceCookie(id) };
}

export function normalizeDomainLabel(input: string) {
  const candidate = input.includes("://") ? input : `https://${input}`;
  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("INVALID_DOMAIN");
  return url.hostname.toLowerCase().replace(/\.$/, "");
}
