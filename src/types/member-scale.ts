export type LifecycleValue =
  | "pending"
  | "certified"
  | "active"
  | "expiring"
  | "expired"
  | "churned";

export type MetricPolarity = "positive" | "negative";

export interface KpiItem {
  key: string;
  label: string;
  value: number;
  unit: string;
  /** 环比变化百分比，正数为上升、负数为下降、0 为持平 */
  deltaPct: number;
  /** 指标极性：正向指标涨为好，负向指标（如流失）涨为坏 */
  polarity: MetricPolarity;
  /** 口径说明，仅用于前端提示 */
  hint: string;
}

export interface LifecycleRow {
  value: LifecycleValue;
  label: string;
  count: number;
}

export interface TrendPoint {
  /** YYYY-MM */
  month: string;
  active: number;
}

export interface MemberScaleSnapshot {
  asOf: string;
  /** 统计口径说明 */
  scope: string;
  kpis: KpiItem[];
  lifecycle: LifecycleRow[];
  trend: TrendPoint[];
}

export interface CrmCompanyRow {
  id: string;
  name: string;
  industry: string;
  seats: number;
  lifecycle: LifecycleValue;
  expireAt: string;
}
