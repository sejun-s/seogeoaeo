import { defineConfig } from "vitest/config";

// 앱의 vite.config.ts(Cloudflare/vinext 플러그인)를 불러오지 않는다.
// scoring 엔진은 순수 TypeScript 모듈이므로 node 환경에서만 실행한다.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: false,
  },
});
