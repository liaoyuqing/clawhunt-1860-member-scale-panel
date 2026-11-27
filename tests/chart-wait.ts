import { expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { chartInstances, type FakeChartInstance } from "./echarts-fake";

/**
 * 面板进入 ready 态后，图表子组件的 effect 才会 init / setOption。
 * 断言前统一等实例就位，避免因并发调度抖动产生的假失败。
 */
export async function waitForCharts(expected = 2): Promise<void> {
  await waitFor(() => {
    const live = chartInstances().filter((item) => !item.disposed);
    expect(live.length).toBeGreaterThanOrEqual(expected);
  });
}

export async function waitForChart(testId: string): Promise<FakeChartInstance> {
  await waitFor(() => {
    const found = chartInstances().find(
      (item) => item.host.getAttribute("data-testid") === testId && !item.disposed && item.option !== null,
    );
    expect(found).toBeTruthy();
  });
  const found = chartInstances().find(
    (item) => item.host.getAttribute("data-testid") === testId && !item.disposed && item.option !== null,
  );
  if (!found) throw new Error("chart instance missing: " + testId);
  return found;
}
