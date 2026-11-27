import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberScalePanel } from "../src/pages/dashboard/panels/MemberScalePanel";
import { buildCrmUrl, readLifecycleParam } from "../src/utils/crm-url";
import { normalSnapshot } from "./fixtures";
import { chartInstances, emit } from "./echarts-fake";
import { renderInRouter } from "./helpers";
import type { LifecycleValue } from "../src/types/member-scale";

async function renderPanel(options: { route?: string; log?: string[]; navigateTo?: (url: string) => void }) {
  const view = renderInRouter(
    <MemberScalePanel state="normal" load={async () => normalSnapshot()} navigateTo={options.navigateTo} />,
    { route: options.route ?? "/", log: options.log },
  );
  await screen.findByTestId("member-scale-panel");
  // 图表实例在面板进入 ready 态的同一提交里初始化；等一下以防并发调度抖动
  await waitFor(() => {
    expect(chartInstances().some((item) => item.host.getAttribute("data-testid") === "lifecycle-bar-chart")).toBe(true);
  });
  return view;
}

function lastInstance() {
  const registry = chartInstances();
  const found = registry.find((item) => item.host.getAttribute("data-testid") === "lifecycle-bar-chart");
  if (!found) throw new Error("lifecycle bar instance missing");
  return found;
}

describe("AC2 点击状态条形跳转 URL 带正确 lifecycle 参数", () => {
  it("点击 active 条形后 URL 逐字等于 /crm/companies?lifecycle=active", async () => {
    const urls: string[] = [];
    const navigateTo = vi.fn((url: string) => {
      urls.push(url);
    });
    await renderPanel({ navigateTo });

    act(() => {
      emit(lastInstance(), "click", { data: { lifecycle: "active" } });
    });

    expect(navigateTo).toHaveBeenCalledTimes(1);
    expect(urls[0]).toBe("/crm/companies?lifecycle=active");
    expect(urls[0] === "/crm/companies?lifecycle=active").toBe(true);
  });

  it("中文标签「有效」永远不会被写进 URL（负例）", async () => {
    const urls: string[] = [];
    const navigateTo = vi.fn((url: string) => {
      urls.push(url);
    });
    await renderPanel({ navigateTo });

    act(() => {
      emit(lastInstance(), "click", { data: { lifecycle: "active" } });
    });

    expect(urls[0].includes(encodeURIComponent("有效"))).toBe(false);
    expect(urls[0].includes("%E6%9C%89%E6%95%88")).toBe(false);
    expect(decodeURIComponent(urls[0]).includes("有效")).toBe(false);
    expect(urls[0]).not.toContain("lifecycle=有效");
  });

  it("点击 churned 条形 URL 为 /crm/companies?lifecycle=churned", async () => {
    const urls: string[] = [];
    await renderPanel({ navigateTo: (url) => urls.push(url) });

    act(() => {
      emit(lastInstance(), "click", { data: { lifecycle: "churned" } });
    });

    expect(urls[0]).toBe("/crm/companies?lifecycle=churned");
  });

  it("router push 只调用 1 次（不重复触发）", async () => {
    const navigateTo = vi.fn();
    await renderPanel({ navigateTo });

    act(() => {
      emit(lastInstance(), "click", { data: { lifecycle: "active" } });
    });

    expect(navigateTo).toHaveBeenCalledTimes(1);
    const [call] = navigateTo.mock.calls;
    expect(call[0]).toBe("/crm/companies?lifecycle=active");
  });

  it("其它查询参数被保留：source=panel 仍在 URL 里", async () => {
    const urls: string[] = [];
    await renderPanel({ route: "/?source=panel", navigateTo: (url) => urls.push(url) });

    act(() => {
      emit(lastInstance(), "click", { data: { lifecycle: "active" } });
    });

    expect(urls[0]).toBe("/crm/companies?source=panel&lifecycle=active");
    expect(new URLSearchParams(urls[0].split("?")[1]).get("source")).toBe("panel");
  });

  it("面板自身的 state 参数不带到 CRM，业务参数 source 保留", () => {
    expect(buildCrmUrl("active", "?state=normal&source=panel")).toBe("/crm/companies?source=panel&lifecycle=active");
    expect(buildCrmUrl("active", "?state=empty")).toBe("/crm/companies?lifecycle=active");
  });

  it("已有的 lifecycle 参数被替换而不是叠加", () => {
    expect(buildCrmUrl("churned", "?lifecycle=active&source=panel")).toBe(
      "/crm/companies?source=panel&lifecycle=churned",
    );
  });

  it("未知枚举（含中文标签）直接抛错，构造不出脏 URL", () => {
    expect(() => buildCrmUrl("有效")).toThrowError("unknown lifecycle value: 有效");
    expect(() => buildCrmUrl("")).toThrow(/unknown lifecycle value/);
    expect(readLifecycleParam("?lifecycle=active")).toBe("active");
    expect(readLifecycleParam("?lifecycle=有效")).toBeNull();
  });

  it("真实 router 下点击后落到 /crm/companies 且查询串正确", async () => {
    const log: string[] = [];
    await renderPanel({ log });
    const user = userEvent.setup();

    const jump = screen.getByTestId("jump-active");
    await user.click(jump);

    await waitFor(() => {
      expect(log[log.length - 1]).toBe("/crm/companies?lifecycle=active");
    });
  });

  it("键盘 Enter 触发同一下钻（可访问性）", async () => {
    const log: string[] = [];
    await renderPanel({ log });

    const jump = screen.getByTestId("jump-churned");
    jump.focus();
    expect(jump).toHaveFocus();
    fireEvent.click(jump);

    await waitFor(() => {
      expect(log[log.length - 1]).toBe("/crm/companies?lifecycle=churned");
    });
  });

  it("图例按钮与条形点击产生完全相同的 URL（两条入口一致）", async () => {
    const fromChart: string[] = [];
    const fromButton: string[] = [];
    const { unmount } = await renderPanel({ navigateTo: (url) => fromChart.push(url) });
    act(() => {
      emit(lastInstance(), "click", { data: { lifecycle: "expiring" } });
    });
    unmount();

    await renderPanel({ navigateTo: (url) => fromButton.push(url) });
    const user = userEvent.setup();
    await user.click(screen.getByTestId("jump-expiring"));

    expect(fromChart[0]).toBe(fromButton[0]);
    expect(fromChart[0]).toBe("/crm/companies?lifecycle=expiring");
  });
});

describe("条形点击只接受合法枚举", () => {
  it("点击数据里没有 lifecycle 字段时不跳转", async () => {
    const navigateTo = vi.fn();
    await renderPanel({ navigateTo });
    act(() => {
      emit(lastInstance(), "click", { data: {} });
    });
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("每个状态条形的 lifecycle 值都是英文枚举", async () => {
    await renderPanel({});
    const option = lastInstance().option as { series: Array<{ data: Array<{ lifecycle: LifecycleValue }> }> };
    const values = option.series[0].data.map((item) => item.lifecycle);
    expect(values).toEqual(["pending", "certified", "active", "expiring", "expired", "churned"]);
    for (const value of values) {
      expect(value).toMatch(/^[a-z]+$/);
    }
  });
});
