import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

/**
 * jsdom 里没有真实画布尺寸，单元测试统一用内存替身替换 ECharts 运行时：
 * 它记录 init / setOption / dispose 调用，既能断言条尾标签数量，
 * 也能断言组件卸载时 dispose 被调用（无实例泄漏）。
 */
vi.mock("../src/charts/echarts-runtime", async () => await import("./echarts-fake"));

afterEach(() => {
  const registry = (globalThis as { __ECHARTS_INSTANCES__?: unknown[] }).__ECHARTS_INSTANCES__;
  if (registry) registry.length = 0;
});
