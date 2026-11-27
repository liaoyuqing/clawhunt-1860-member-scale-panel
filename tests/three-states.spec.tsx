import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberScalePanel } from "../src/pages/dashboard/panels/MemberScalePanel";
import { DashboardPage } from "../src/pages/dashboard/DashboardPage";
import { parsePanelState } from "../src/services/member-scale-api";
import { normalSnapshot } from "./fixtures";
import { renderInRouter } from "./helpers";
import type { MemberScaleSnapshot } from "../src/types/member-scale";

const never: Promise<MemberScaleSnapshot> = new Promise(() => {
  /* 永远不 settle，用于停在加载态 */
});

describe("加载 / 空数据 / 报错三态", () => {
  it("加载态渲染骨架屏，不渲染图表与指标卡", async () => {
    renderInRouter(<MemberScalePanel state="loading" load={() => never} />);
    expect(screen.getByTestId("panel-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("lifecycle-bar-chart")).toBeNull();
    expect(screen.queryByTestId("kpi-grid")).toBeNull();
  });

  it("报错态显示错误信息与重试按钮", async () => {
    const failing = vi.fn(async () => {
      throw new Error("会员数据服务返回 503（mock）：请稍后重试");
    });
    renderInRouter(<MemberScalePanel state="error" load={failing} />);

    const alert = await screen.findByTestId("panel-error");
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toContain("会员数据加载失败");
    expect(alert.textContent).toContain("503");
    expect(screen.getByTestId("panel-retry")).toBeInTheDocument();
    expect(failing).toHaveBeenCalledTimes(1);
  });

  it("点击重试只触发一次重新取数，成功后渲染面板", async () => {
    let attempt = 0;
    const loader = vi.fn(async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("会员数据服务返回 503（mock）：请稍后重试");
      return normalSnapshot();
    });
    renderInRouter(<MemberScalePanel state="normal" load={loader} />);

    await screen.findByTestId("panel-error");
    expect(loader).toHaveBeenCalledTimes(1);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("panel-retry"));

    await screen.findByTestId("member-scale-panel");
    expect(loader).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("panel-error")).toBeNull();
  });

  it("三个状态互斥：报错态不出现条形图与空态提示", async () => {
    renderInRouter(<MemberScalePanel state="error" />);
    await screen.findByTestId("panel-error");
    expect(screen.queryByTestId("lifecycle-bar-chart")).toBeNull();
    expect(screen.queryByTestId("panel-empty-hint")).toBeNull();
  });

  it("?state= 解析：normal / empty / error / loading 四值，非法值回落 normal", () => {
    expect(parsePanelState("?state=normal")).toBe("normal");
    expect(parsePanelState("?state=empty")).toBe("empty");
    expect(parsePanelState("?state=error")).toBe("error");
    expect(parsePanelState("?state=loading")).toBe("loading");
    expect(parsePanelState("")).toBe("normal");
    expect(parsePanelState("?state=whatever")).toBe("normal");
  });

  it("演示页的 state 切换按钮能改写查询串", async () => {
    renderInRouter(<DashboardPage />, { route: "/?state=normal" });
    expect(await screen.findByTestId("member-scale-panel")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByTestId("state-tab-empty"));

    await waitFor(() => {
      expect(screen.getByTestId("panel-empty-hint")).toBeInTheDocument();
    });
    expect(screen.getByTestId("state-tab-empty").className).toContain("is-active");
  });

  it("空数据态与正常态的面板容器都渲染 data-panel-ready 标记", async () => {
    const normal = renderInRouter(<MemberScalePanel state="normal" load={async () => normalSnapshot()} />);
    const panel = await screen.findByTestId("member-scale-panel");
    expect(panel).toHaveAttribute("data-panel-ready", "true");
    normal.unmount();

    renderInRouter(<MemberScalePanel state="empty" />);
    expect(await screen.findByTestId("member-scale-panel")).toHaveAttribute("data-panel-ready", "true");
  });
});
