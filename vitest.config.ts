import { defineConfig } from "vitest/config";

// 단위 테스트 전용 설정. 앱 빌드(vite.config.ts)와 분리해 plugins/manualChunks 등
// 런타임 빌드 파이프라인에 영향을 주지 않는다. `npm run validate` 와도 독립.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "supabase/functions/**/*.test.ts"],
  },
});
