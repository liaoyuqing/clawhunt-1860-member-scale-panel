import type { LifecycleRow, LifecycleValue } from "../types/member-scale";

export interface LifecycleStage {
  value: LifecycleValue;
  label: string;
  description: string;
}

/**
 * 生命周期顺序是业务常量：待认证 → 已认证 → 有效 → 临期 → 已过期 → 已流失。
 * 图表只能按这个数组排序，任何按数值大小重排都会让「下钻」的语义失真。
 */
export const LIFECYCLE_STAGES: readonly LifecycleStage[] = [
  { value: "pending", label: "待认证", description: "已提交入驻资料，资质尚未审核通过" },
  { value: "certified", label: "已认证", description: "资质审核通过，尚未开通会员权益" },
  { value: "active", label: "有效", description: "会员权益生效中，可正常使用资源对接" },
  { value: "expiring", label: "临期", description: "权益剩余 30 天内到期，待续约" },
  { value: "expired", label: "已过期", description: "权益已到期，处于宽限期" },
  { value: "churned", label: "已流失", description: "确认终止合作，席位已释放" },
];

export const LIFECYCLE_ORDER: readonly LifecycleValue[] = LIFECYCLE_STAGES.map(
  (stage) => stage.value,
);

export function isLifecycleValue(value: string): value is LifecycleValue {
  return (LIFECYCLE_ORDER as readonly string[]).includes(value);
}

export function stageLabel(value: LifecycleValue): string {
  const found = LIFECYCLE_STAGES.find((stage) => stage.value === value);
  return found ? found.label : value;
}

export function stageDescription(value: LifecycleValue): string {
  const found = LIFECYCLE_STAGES.find((stage) => stage.value === value);
  return found ? found.description : "";
}

/**
 * 把接口返回的行按常量顺序重排；缺失的阶段补 0，保证「数值为 0 的状态
 * 仍然有一条长度为 0 的条形和 0 的尾部标签」。未知枚举排在最后，不吞掉。
 */
export function mergeWithStages(rows: readonly LifecycleRow[]): LifecycleRow[] {
  const byValue = new Map<string, LifecycleRow>();
  for (const row of rows) {
    byValue.set(row.value, row);
  }
  const ordered: LifecycleRow[] = LIFECYCLE_STAGES.map((stage) => {
    const found = byValue.get(stage.value);
    byValue.delete(stage.value);
    return {
      value: stage.value,
      label: stage.label,
      count: found ? found.count : 0,
    };
  });
  const leftovers = [...byValue.values()].sort((a, b) =>
    a.value < b.value ? -1 : a.value > b.value ? 1 : 0,
  );
  return [...ordered, ...leftovers];
}

/** 严格按常量顺序排序，不读取 count，专门给「不许按数值重排」的断言用 */
export function orderLifecycleRows(rows: readonly LifecycleRow[]): LifecycleRow[] {
  return mergeWithStages(rows);
}
