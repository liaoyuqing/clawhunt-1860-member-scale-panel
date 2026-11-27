import { useEffect, useRef } from "react";
import { echarts } from "../../../../charts/echarts-runtime";
import type { EChartsType } from "../../../../charts/echarts-runtime";
import { buildTrendOption } from "../../../../charts/trend-option";
import type { TrendPoint } from "../../../../types/member-scale";

export interface TrendLineProps {
  points: readonly TrendPoint[];
}

export function TrendLine({ points }: TrendLineProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const chart = echarts.init(host, undefined, { renderer: "svg" });
    chartRef.current = chart;
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
    chart.setOption(buildTrendOption(points), { notMerge: true });
  }, [points]);

  return (
    <div
      ref={hostRef}
      className="chart chart--line"
      data-testid="trend-line-chart"
      role="img"
      aria-label="近 12 个月有效会员企业数折线图，纵轴从 0 起"
    />
  );
}
