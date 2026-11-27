import { useEffect, useRef } from "react";
import { echarts } from "../../../../charts/echarts-runtime";
import type { EChartsType } from "../../../../charts/echarts-runtime";
import { buildLifecycleOption } from "../../../../charts/lifecycle-option";
import { mergeWithStages } from "../../../../utils/lifecycle-order";
import type { LifecycleRow, LifecycleValue } from "../../../../types/member-scale";

export interface LifecycleBarProps {
  rows: readonly LifecycleRow[];
  empty?: boolean;
  onSelect: (value: LifecycleValue) => void;
}

interface BarClickParams {
  data?: { lifecycle?: string } | null;
  componentType?: string;
}

/**
 * 横向条形图：y 轴按生命周期常量顺序排列，条尾标数值；
 * 点击任一条形带着英文枚举下钻 CRM 企业列表。
 * 图下方另给一组键盘可达的状态按钮，保证只靠键盘也能完成同样的下钻。
 */
export function LifecycleBar({ rows, empty = false, onSelect }: LifecycleBarProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const chart = echarts.init(host, undefined, { renderer: "svg" });
    chartRef.current = chart;
    chart.on("click", (params: unknown) => {
      const event = params as BarClickParams;
      const value = event && event.data ? event.data.lifecycle : undefined;
      if (value) {
        selectRef.current(value as LifecycleValue);
      }
    });
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(buildLifecycleOption({ rows, empty }), { notMerge: true });
  }, [rows, empty]);

  const stages = mergeWithStages(rows);

  return (
    <div className="lifecycle-block">
      <div
        ref={hostRef}
        className="chart chart--bar"
        data-testid="lifecycle-bar-chart"
        role="img"
        aria-label="生命周期状态分布横向条形图，按生命周期顺序排列，条尾标注在册企业数，点击可下钻 CRM 企业列表"
      />
      <ul className="lifecycle-jumps" data-testid="lifecycle-jumps" aria-label="按状态下钻 CRM 企业列表">
        <li className="lifecycle-jumps__label" aria-hidden="true">
          键盘下钻：
        </li>
        {stages.map((stage) => (
          <li key={stage.value}>
            <button
              type="button"
              className="lifecycle-jumps__btn"
              data-testid={"jump-" + stage.value}
              data-lifecycle={stage.value}
              onClick={() => onSelect(stage.value)}
            >
              {stage.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
