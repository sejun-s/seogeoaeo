import { expect, test } from "@playwright/test";

test("LOCAL_WORKSPACE 쿠키가 프로젝트 negative path를 404로 차단한다", async ({ browser, baseURL }) => {
  const first = await browser.newContext({ baseURL });
  const second = await browser.newContext({ baseURL });
  const firstRequest = first.request;
  const secondRequest = second.request;

  const created = await firstRequest.post("/api/projects", { data: { name: "First workspace", domain: "first.example" } });
  expect(created.status()).toBe(201);
  const project = (await created.json() as { item: { id: string } }).item;

  const cookies = await first.cookies();
  const workspaceCookie = cookies.find((cookie) => cookie.name === "citegraph_workspace");
  expect(workspaceCookie?.httpOnly).toBe(true);
  expect(workspaceCookie?.sameSite).toBe("Lax");

  const denied = await secondRequest.get(`/api/projects/${project.id}/scans`);
  expect(denied.status()).toBe(401);

  await secondRequest.get("/api/workspace");
  const hidden = await secondRequest.get(`/api/projects/${project.id}/scans`);
  expect(hidden.status()).toBe(404);

  await first.close();
  await second.close();
});
