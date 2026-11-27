import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { MemberScalePanel } from "../src/pages/dashboard/panels/MemberScalePanel";
import { buildTrendOption } from "../src/charts/trend-option";
import { chartInstances } from "./echarts-fake";
import { normalSnapshot } from "./fixtures";
import { renderInRouter } from "./helpers";
import { lineOption } from "./option-reader";
import { waitForChart, waitForCharts } from "./chart-wait";

describe("近 12 个月有效会员数折线", () => {
  it("折线点数 === 12", async () => {
    renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");
    const option = lineOption(await waitForChart("trend-line-chart"));
    expect(option.series[0].data).toHaveLength(12);
    expect(option.xAxis.data).toHaveLength(12);
  });

  it("横轴是 12 个连续月份，跨度 11 个月", () => {
    const option = buildTrendOption(normalSnapshot().trend);
    const months = option.xAxis.data;
    expect(months[0]).toBe("2025-11");
    expect(months[11]).toBe("2026-10");
    expect(new Set(months).size).toBe(12);
  });

  it("纵轴从 0 起，不允许截断误导增长幅度", async () => {
    renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");
    const option = lineOption(await waitForChart("trend-line-chart"));
    expect(option.yAxis.min).toBe(0);
    expect(option.yAxis.type).toBe("value");
  });

  it("tooltip 同时给出月份与数值", () => {
    const option = buildTrendOption(normalSnapshot().trend);
    const text = option.tooltip.formatter([{ axisValue: "2026-10", data: 64 }]);
    expect(text).toContain("2026-10");
    expect(text).toContain("64");
  });

  it("折线是 line 类型且关闭动画，截图不依赖时序", () => {
    const option = buildTrendOption(normalSnapshot().trend);
    expect(option.animation).toBe(false);
    expect((option.series as Array<{ type: string }>)[0].type).toBe("line");
  });
});

describe("ECharts 实例生命周期", () => {
  it("组件卸载时 dispose 被调用，两个图表实例都不残留", async () => {
    const view = renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");
    await waitForCharts(2);

    const before = chartInstances().filter((item) => !item.disposed);
    expect(before.some((item) => item.host.getAttribute("data-testid") === "lifecycle-bar-chart")).toBe(true);
    expect(before.some((item) => item.host.getAttribute("data-testid") === "trend-line-chart")).toBe(true);

    view.unmount();

    const leaked = chartInstances().filter((item) => !item.disposed);
    expect(leaked).toHaveLength(0);
    expect(chartInstances().length).toBeGreaterThanOrEqual(2);
  });

  it("重新挂载会新建实例，不复用已 dispose 的实例", async () => {
    const first = renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");
    await waitForCharts(2);
    const firstCount = chartInstances().length;
    first.unmount();
    expect(chartInstances().every((item) => item.disposed)).toBe(true);

    renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");
    await waitForCharts(2);
    expect(chartInstances().length).toBeGreaterThan(firstCount);
    const fresh = chartInstances().slice(firstCount);
    expect(fresh.every((item) => !item.disposed)).toBe(true);
  });
});
