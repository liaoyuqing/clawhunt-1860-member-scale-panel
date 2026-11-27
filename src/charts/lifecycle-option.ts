import { LIFECYCLE_STAGES, mergeWithStages } from "../utils/lifecycle-order";
import type { LifecycleRow } from "../types/member-scale";

export interface LifecycleOptionInput {
  rows: readonly LifecycleRow[];
  /** 空数据态：不给任何条形，但仍保留阶段轴与空态提示 */
  empty?: boolean;
}

export interface LifecycleBarDatum {
  value: number;
  lifecycle: string;
  name: string;
  label: { show: true; position: "right"; formatter: (params: { value: number }) => string };
}

export interface LifecycleOption {
  animation: boolean;
  grid: { left: number; right: number; top: number; bottom: number; containLabel: boolean };
  tooltip: Record<string, unknown>;
  xAxis: Record<string, unknown>;
  yAxis: Record<string, unknown>;
  graphic: Array<Record<string, unknown>>;
  series: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/** 尾部标签统一格式：数值 + 单位，空值显示 0 家 */
export function formatTailLabel(value: number): string {
  return `${value} 家`;
}

export function buildLifecycleOption(input: LifecycleOptionInput): LifecycleOption {
  const rows = input.empty ? [] : mergeWithStages(input.rows);
  const stages = LIFECYCLE_STAGES.map((stage) => stage.label);
  const data: LifecycleBarDatum[] = rows.map((row) => ({
    value: row.count,
    lifecycle: row.value,
    name: row.label,
    label: {
      show: true,
      position: "right",
      formatter: (params: { value: number }) => formatTailLabel(Number(params.value ?? 0)),
    },
  }));

  return {
    animation: false,
    grid: { left: 12, right: 64, top: 24, bottom: 12, containLabel: true },
    tooltip: {
      trigger: "item",
      formatter: (params: { data?: { lifecycle?: string; value?: number } }) => {
        const row = rows.find((item) => item.value === params.data?.lifecycle);
        const label = row ? row.label : "";
        const count = params.data?.value ?? 0;
        return `${label}<br/>在册企业 ${count} 家（点击下钻 CRM 列表）`;
      },
    },
    xAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "#e8ecf1" } },
      axisLabel: { color: "#6b7785" },
    },
    yAxis: {
      type: "category",
      data: stages,
      inverse: true,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#dfe5ec" } },
      axisLabel: { color: "#33475b", fontSize: 12 },
    },
    graphic: input.empty
      ? [
          {
            type: "text",
            left: "center",
            top: "middle",
            style: {
              text: "暂无会员企业数据",
              fill: "#8d99a6",
              fontSize: 13,
            },
          },
        ]
      : [],
    series: [
      {
        name: "在册企业",
        type: "bar",
        barMaxWidth: 22,
        data,
        itemStyle: { color: "#0052d9", borderRadius: [0, 4, 4, 0] },
        emphasis: { itemStyle: { color: "#266fe8" } },
        label: {
          show: true,
          position: "right",
          color: "#33475b",
          fontSize: 12,
          formatter: (params: { value?: number }) => formatTailLabel(Number(params.value ?? 0)),
        },
      },
    ],
  };
}
