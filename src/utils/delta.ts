import type { MetricPolarity } from "../types/member-scale";

export type DeltaDirection = "up" | "down" | "flat";
export type DeltaTone = "good" | "bad" | "neutral";

export const DELTA_ARROW: Record<DeltaDirection, string> = {
  up: "▲",
  down: "▼",
  flat: "",
};

export interface DeltaView {
  /** 箭头方向：正数 up、负数 down、0 flat */
  dir: DeltaDirection;
  /** 带符号的百分比文本，负号只出现一次 */
  text: string;
  /** 语义色：与指标极性挂钩 */
  tone: DeltaTone;
  /** 箭头字符，flat 时为空串（组件不渲染节点） */
  arrow: string;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** 消除 -0，避免出现「-0.0%」这种既不是正也不是负的文本 */
export function normalizeDelta(value: number): number {
  const rounded = roundTo(value, 4);
  return rounded === 0 ? 0 : rounded;
}

export function deltaDirection(value: number): DeltaDirection {
  const normalized = normalizeDelta(value);
  if (normalized > 0) return "up";
  if (normalized < 0) return "down";
  return "flat";
}

/**
 * 百分比文本。符号由方向决定，绝对值单独取，所以 -5 永远是「-5.0%」，
 * 不会因为模板里再拼一个减号而变成「--5.0%」。
 */
export function formatDelta(value: number, digits = 1): string {
  const normalized = normalizeDelta(roundTo(value, digits));
  const body = Math.abs(normalized).toFixed(digits);
  if (normalized > 0) return `+${body}%`;
  if (normalized < 0) return `-${body}%`;
  return `${body}%`;
}

/** 语义色只看「对本指标是好是坏」，不看正负本身 */
export function deltaTone(value: number, polarity: MetricPolarity): DeltaTone {
  const normalized = normalizeDelta(value);
  if (normalized === 0) return "neutral";
  const rising = normalized > 0;
  if (polarity === "positive") return rising ? "good" : "bad";
  return rising ? "bad" : "good";
}

export function describeDelta(
  value: number,
  polarity: MetricPolarity = "positive",
  digits = 1,
): DeltaView {
  const dir = deltaDirection(value);
  return {
    dir,
    text: formatDelta(value, digits),
    tone: deltaTone(value, polarity),
    arrow: DELTA_ARROW[dir],
  };
}

export const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  good: "delta--good",
  bad: "delta--bad",
  neutral: "delta--neutral",
};
