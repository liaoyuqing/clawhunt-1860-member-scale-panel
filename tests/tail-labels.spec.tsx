import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { MemberScalePanel } from "../src/pages/dashboard/panels/MemberScalePanel";
import { buildLifecycleOption, formatTailLabel } from "../src/charts/lifecycle-option";
import { LIFECYCLE_ORDER } from "../src/utils/lifecycle-order";
import { normalSnapshot } from "./fixtures";
import { renderInRouter } from "./helpers";
import { barSeries, readOption, tailLabels } from "./option-reader";
import { waitForChart } from "./chart-wait";

describe("AC1 条形均标有数值（正常态）", () => {
  it("条尾 label 数量等于状态数（6 条条形 6 个标签）", async () => {
    renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");

    const labels = tailLabels(await waitForChart("lifecycle-bar-chart"));
    expect(labels).toHaveLength(6);
    expect(labels).toHaveLength(LIFECYCLE_ORDER.length);
    expect(labels.filter((item) => item.text.length > 0)).toHaveLength(6);
  });

  it("每条标签的文本就是该条的数据值，逐条核对", async () => {
    renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");

    const labels = tailLabels(await waitForChart("lifecycle-bar-chart"));
    const counts = normalSnapshot().lifecycle.map((row) => row.count);
    expect(labels.map((item) => item.value)).toEqual(counts);
    for (const label of labels) {
      expect(label.text).toBe(label.value + " 家");
    }
    expect(labels.map((item) => item.text)).toEqual(["8 家", "10 家", "64 家", "6 家", "7 家", "5 家"]);
  });

  it("label 的 show=true 且 position=right，系列级与数据级两处都开启", async () => {
    const option = buildLifecycleOption({ rows: normalSnapshot().lifecycle });
    const series = option.series[0] as unknown as {
      label: { show: boolean; position: string };
      data: Array<{ label: { show: boolean; position: string } }>;
    };
    expect(series.label.show).toBe(true);
    expect(series.label.position).toBe("right");
    expect(series.data).toHaveLength(6);
    expect(series.data.every((datum) => datum.label.show && datum.label.position === "right")).toBe(true);
  });

  it("y 轴条目与条形的顺序严格等于生命周期常量", async () => {
    renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");

    const option = readOption(await waitForChart("lifecycle-bar-chart"));
    expect(option.yAxis.data).toEqual(["待认证", "已认证", "有效", "临期", "已过期", "已流失"]);
    expect(option.yAxis.inverse).toBe(true);
    const series = barSeries(await waitForChart("lifecycle-bar-chart"));
    expect(series.data.map((item) => item.lifecycle)).toEqual([...LIFECYCLE_ORDER]);
    expect(series.data.map((item) => item.name)).toEqual(option.yAxis.data);
  });

  it("状态数值为 0 时仍保留条形与 0 的尾部标签", () => {
    const rows = [
      { value: "pending" as const, label: "待认证", count: 0 },
      { value: "active" as const, label: "有效", count: 64 },
    ];
    const option = buildLifecycleOption({ rows });
    const series = option.series[0] as unknown as {
      data: Array<{ value: number; lifecycle: string; label: { formatter: (p: { value: number }) => string } }>;
    };
    const zero = series.data.find((item) => item.lifecycle === "pending");
    expect(zero).toBeDefined();
    expect(zero?.value).toBe(0);
    expect(zero?.label.formatter({ value: 0 })).toBe("0 家");
    expect(series.data).toHaveLength(6);
  });

  it("formatTailLabel 对整数与 0 的输出稳定", () => {
    expect(formatTailLabel(0)).toBe("0 家");
    expect(formatTailLabel(64)).toBe("64 家");
  });

  it("图容器带有描述性 aria-label，条形图可被读屏识别", async () => {
    renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");
    const chart = screen.getByTestId("lifecycle-bar-chart");
    expect(chart).toHaveAttribute("role", "img");
    expect(chart.getAttribute("aria-label")).toContain("生命周期");
  });

  it("正常态不渲染空态提示", async () => {
    renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    await screen.findByTestId("member-scale-panel");
    expect(screen.queryByTestId("panel-empty-hint")).toBeNull();
    expect(screen.queryByTestId("panel-error")).toBeNull();
    expect(screen.queryByTestId("panel-loading")).toBeNull();
  });
});

describe("AC1 空数据态", () => {
  it("空数据态条形数为 0，且空态文案存在", async () => {
    renderInRouter(<MemberScalePanel state="empty" />);
    await screen.findByTestId("member-scale-panel");

    const instance = await waitForChart("lifecycle-bar-chart");
    const series = barSeries(instance);
    expect(series.data).toHaveLength(0);
    expect(tailLabels(instance)).toHaveLength(0);
    expect(screen.getByTestId("panel-empty-hint")).toBeInTheDocument();
    expect(screen.getByTestId("panel-empty-hint").textContent).toContain("没有在册会员企业");
  });

  it("空数据态图表内绘制「暂无会员企业数据」的提示文本", async () => {
    renderInRouter(<MemberScalePanel state="empty" />);
    await screen.findByTestId("member-scale-panel");
    const option = readOption(await waitForChart("lifecycle-bar-chart"));
    expect(option.graphic).toHaveLength(1);
    expect(option.graphic[0].style?.text).toBe("暂无会员企业数据");
  });

  it("空数据态指标卡显示 0 且环比为持平", async () => {
    renderInRouter(<MemberScalePanel state="empty" />);
    await screen.findByTestId("member-scale-panel");
    const values = screen.getAllByTestId("kpi-value").map((node) => node.textContent);
    expect(values).toEqual(["0", "0", "0", "0"]);
    const deltas = screen.getAllByTestId("kpi-delta");
    expect(deltas).toHaveLength(4);
    for (const delta of deltas) {
      expect(delta).toHaveAttribute("data-dir", "flat");
    }
  });

  it("空数据态折线仍是 12 个点，全部落在 0", async () => {
    renderInRouter(<MemberScalePanel state="empty" />);
    await screen.findByTestId("member-scale-panel");
    const instance = await waitForChart("trend-line-chart");
    const option = instance.option as unknown as { series: Array<{ data: number[] }> };
    expect(option.series[0].data).toHaveLength(12);
    expect(option.series[0].data.every((value) => value === 0)).toBe(true);
  });
});