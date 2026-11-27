import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MemberScalePanel } from "./panels/MemberScalePanel";
import { parsePanelState } from "../../services/member-scale-api";

const STATE_TABS = [
  { value: "normal", label: "正常数据" },
  { value: "empty", label: "空数据" },
  { value: "error", label: "接口报错" },
  { value: "loading", label: "加载中" },
] as const;

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parsePanelState(params.toString()), [params]);

  return (
    <main className="page">
      <nav className="demo-toolbar" data-testid="state-switcher">
        <span className="demo-toolbar__label">面板状态</span>
        {STATE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={"demo-toolbar__tab" + (state === tab.value ? " is-active" : "")}
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              next.set("state", tab.value);
              setParams(next, { replace: true });
            }}
            data-testid={"state-tab-" + tab.value}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <MemberScalePanel key={state} state={state} />
    </main>
  );
}
