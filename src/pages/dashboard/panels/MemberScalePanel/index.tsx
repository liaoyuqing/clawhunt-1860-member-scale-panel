import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "tdesign-react";
import { KpiCards } from "./KpiCards";
import { LifecycleBar } from "./LifecycleBar";
import { TrendLine } from "./TrendLine";
import { PanelError, PanelLoading, PanelEmptyHint } from "./PanelStates";
import { buildCrmUrl } from "../../../../utils/crm-url";
import { fetchMemberScale, type PanelState } from "../../../../services/member-scale-api";
import type { LifecycleValue, MemberScaleSnapshot } from "../../../../types/member-scale";

export interface MemberScalePanelProps {
  /** 来自 ?state=normal|empty|error|loading，默认 normal */
  state?: PanelState;
  /** 测试与嵌入场景可以替换取数函数 */
  load?: (state: PanelState) => Promise<MemberScaleSnapshot>;
  /** 测试可注入的导航函数；默认用 react-router 的 navigate */
  navigateTo?: (url: string) => void;
}

type LoadStatus = "loading" | "ready" | "failed";

export function MemberScalePanel({
  state = "normal",
  load = fetchMemberScale,
  navigateTo,
}: MemberScalePanelProps) {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [snapshot, setSnapshot] = useState<MemberScaleSnapshot | null>(null);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const routerNavigate = useNavigate();
  const location = useLocation();
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    load(state)
      .then((data) => {
        if (cancelled || !aliveRef.current) return;
        setSnapshot(data);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled || !aliveRef.current) return;
        setMessage(error instanceof Error ? error.message : "会员数据加载失败");
        setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [load, state, attempt]);

  const goCrm = useCallback(
    (lifecycle: LifecycleValue) => {
      const search = location.search || window.location.search;
      const url = buildCrmUrl(lifecycle, search);
      if (navigateTo) {
        navigateTo(url);
        return;
      }
      routerNavigate(url);
    },
    [navigateTo, routerNavigate, location.search],
  );

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  if (status === "loading") {
    return <PanelLoading />;
  }

  if (status === "failed" || !snapshot) {
    return <PanelError message={message} onRetry={retry} retryCount={attempt} />;
  }

  const isEmpty = snapshot.lifecycle.every((row) => row.count === 0);

  return (
    <section className="member-scale" data-testid="member-scale-panel" data-panel-ready="true">
      <header className="member-scale__head">
        <div>
          <h2 className="member-scale__title">会员规模与状态分布</h2>
          <p className="member-scale__sub">
            统计截至 {snapshot.asOf} · 口径：{snapshot.scope}
          </p>
        </div>
      </header>

      <KpiCards items={snapshot.kpis} />

      <div className="member-scale__grid">
        <Card title="生命周期状态分布" bordered className="member-scale__card">
          <LifecycleBar rows={snapshot.lifecycle} empty={isEmpty} onSelect={goCrm} />
        </Card>
        <Card title="近 12 个月有效会员企业数" bordered className="member-scale__card">
          <TrendLine points={snapshot.trend} />
        </Card>
      </div>

      {isEmpty ? <PanelEmptyHint /> : null}
    </section>
  );
}

export default MemberScalePanel;
