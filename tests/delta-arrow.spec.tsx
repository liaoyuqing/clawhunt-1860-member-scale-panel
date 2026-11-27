import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCards } from "../src/pages/dashboard/panels/MemberScalePanel/KpiCards";
import { DELTA_TONE_CLASS, deltaTone, describeDelta, formatDelta } from "../src/utils/delta";
import { normalSnapshot } from "./fixtures";
import type { KpiItem } from "../src/types/member-scale";

function cardFor(key: string): HTMLElement {
  render(<KpiCards items={normalSnapshot().kpis} />);
  return screen.getByTestId("kpi-" + key);
}

describe("AC3 环比箭头方向与正负值一致", () => {
  it("+5 判为 up 且渲染上箭头", () => {
    const view = describeDelta(5, "positive");
    expect(view.dir).toBe("up");
    expect(view.arrow).toBe("▲");
    expect(view.tone).toBe("good");

    render(<KpiCards items={[kpi("new", 5)]} />);
    const delta = screen.getByTestId("kpi-delta");
    expect(delta).toHaveAttribute("data-dir", "up");
    expect(delta.querySelector(".delta__arrow")?.textContent).toBe("▲");
    expect(delta.className).toContain(DELTA_TONE_CLASS.good);
  });

  it("-5 判为 down 且渲染下箭头", () => {
    const view = describeDelta(-5, "positive");
    expect(view.dir).toBe("down");
    expect(view.arrow).toBe("▼");
    expect(view.tone).toBe("bad");

    render(<KpiCards items={[kpi("new", -5)]} />);
    const delta = screen.getByTestId("kpi-delta");
    expect(delta).toHaveAttribute("data-dir", "down");
    expect(delta.querySelector(".delta__arrow")?.textContent).toBe("▼");
    expect(delta.className).toContain(DELTA_TONE_CLASS.bad);
  });

  it("0 判为 flat 且不渲染箭头节点", () => {
    const view = describeDelta(0, "positive");
    expect(view.dir).toBe("flat");
    expect(view.arrow).toBe("");
    expect(view.tone).toBe("neutral");

    render(<KpiCards items={[kpi("new", 0)]} />);
    const delta = screen.getByTestId("kpi-delta");
    expect(delta).toHaveAttribute("data-dir", "flat");
    const arrows = delta.querySelectorAll(".delta__arrow");
    expect(arrows).toHaveLength(0);
    expect(delta.className).toContain(DELTA_TONE_CLASS.neutral);
  });

  it("负数只出现一个负号：文本是 -5.0% 而非 --5.0% 或 +-5.0%", () => {
    expect(formatDelta(-5)).toBe("-5.0%");
    expect(describeDelta(-5).text).toBe("-5.0%");
    expect(formatDelta(-5).includes("--")).toBe(false);
    expect(describeDelta(-12.5).text).toBe("-12.5%");

    render(<KpiCards items={[kpi("new", -5)]} />);
    const text = screen.getByTestId("kpi-delta").querySelector(".delta__text")?.textContent ?? "";
    expect(text).toBe("-5.0%");
    expect(text.match(/-/g) ?? []).toHaveLength(1);
  });

  it("本期流失是负向指标：数值上升判为 bad（红），下降判为 good（绿）", () => {
    expect(deltaTone(25, "negative")).toBe("bad");
    expect(deltaTone(-25, "negative")).toBe("good");
    expect(deltaTone(25, "positive")).toBe("good");
    expect(deltaTone(-25, "positive")).toBe("bad");

    const card = cardFor("churned");
    const delta = card.querySelector('[data-testid="kpi-delta"]') as HTMLElement;
    expect(delta).toHaveAttribute("data-dir", "up");
    expect(delta.className).toContain(DELTA_TONE_CLASS.bad);
    expect(delta.className).not.toContain(DELTA_TONE_CLASS.good);
    expect(delta.querySelector(".delta__arrow")?.textContent).toBe("▲");
  });

  it("负向指标与正向指标的同一数值呈现不同语义色", () => {
    render(<KpiCards items={normalSnapshot().kpis} />);
    const positiveDelta = screen.getByTestId("kpi-active").querySelector('[data-testid="kpi-delta"]') as HTMLElement;
    const negativeDelta = screen.getByTestId("kpi-churned").querySelector('[data-testid="kpi-delta"]') as HTMLElement;
    expect(positiveDelta).toHaveAttribute("data-dir", "up");
    expect(positiveDelta.className).toContain(DELTA_TONE_CLASS.good);
    expect(negativeDelta.className).toContain(DELTA_TONE_CLASS.bad);
  });

  it("4 张指标卡全部渲染变化值", () => {
    render(<KpiCards items={normalSnapshot().kpis} />);
    expect(screen.getAllByTestId("kpi-delta")).toHaveLength(4);
    expect(screen.getAllByTestId("kpi-value")).toHaveLength(4);
    expect(screen.getAllByTestId("kpi-delta").every((node) => (node.textContent ?? "").includes("%"))).toBe(true);
  });
});

function kpi(key: string, deltaPct: number): KpiItem {
  return {
    key,
    label: "本期新增",
    value: 9,
    unit: "家",
    deltaPct,
    polarity: "positive",
    hint: "测试用指标",
  };
}
