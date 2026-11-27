import type { TrendPoint } from "../types/member-scale";

export interface TrendOption {
  animation: boolean;
  grid: Record<string, unknown>;
  tooltip: {
    trigger: "axis";
    formatter: (params: Array<{ axisValue: string; data: number }>) => string;
  };
  xAxis: {
    type: "category";
    boundaryGap: boolean;
    data: string[];
    axisLabel: Record<string, unknown>;
    axisTick: Record<string, unknown>;
    axisLine: Record<string, unknown>;
  };
  yAxis: {
    type: "value";
    min: number;
    minInterval: number;
    splitLine: Record<string, unknown>;
    axisLabel: Record<string, unknown>;
  };
  series: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export function buildTrendOption(trend: readonly TrendPoint[]): TrendOption {
  const months = trend.map((point) => point.month);
  const values = trend.map((point) => point.active);
  return {
    animation: false,
    grid: { left: 8, right: 24, top: 24, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      formatter: (params: Array<{ axisValue: string; data: number }>) => {
        const first = params[0];
        if (!first) return "";
        return `${first.axisValue}<br/>有效会员企业 ${first.data} 家`;
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: months,
      axisLabel: { color: "#6b7785", fontSize: 11 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#dfe5ec" } },
    },
    yAxis: {
      type: "value",
      min: 0,
      minInterval: 1,
      splitLine: { lineStyle: { color: "#eef2f6" } },
      axisLabel: { color: "#6b7785" },
    },
    series: [
      {
        name: "有效会员企业",
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 5,
        data: values,
        lineStyle: { color: "#0052d9", width: 2 },
        itemStyle: { color: "#0052d9" },
        areaStyle: { color: "rgba(0, 82, 217, 0.08)" },
      },
    ],
  };
}
