import type { FakeChartInstance } from "./echarts-fake";

export interface BarDatum {
  value: number;
  lifecycle: string;
  name: string;
  label: { show: boolean; position: string; formatter: (params: { value: number }) => string };
}

export interface LifecycleSeries {
  type: string;
  data: BarDatum[];
  label: { show: boolean; position: string; formatter: (params: { value?: number }) => string };
}

export interface OptionShape {
  yAxis: { type: string; data: string[]; inverse: boolean };
  xAxis: { type: string; min?: number };
  graphic: Array<{ type: string; style?: { text?: string } }>;
  series: LifecycleSeries[];
  tooltip: { formatter: (params: unknown) => string };
}

export function readOption(instance: FakeChartInstance): OptionShape {
  if (!instance.option) throw new Error("chart option was never set");
  return instance.option as unknown as OptionShape;
}

export function barSeries(instance: FakeChartInstance): LifecycleSeries {
  const option = readOption(instance);
  const series = option.series[0];
  if (!series) throw new Error("no series in option");
  return series;
}

export function tailLabels(instance: FakeChartInstance): Array<{ value: number; lifecycle: string; text: string }> {
  const series = barSeries(instance);
  return series.data.map((datum) => ({
    value: datum.value,
    lifecycle: datum.lifecycle,
    text: datum.label.formatter({ value: datum.value }),
  }));
}

export function lineOption(instance: FakeChartInstance): {
  xAxis: { data: string[] };
  yAxis: { min?: number; type: string };
  series: Array<{ type: string; data: number[] }>;
  tooltip: { formatter: (params: Array<{ axisValue: string; data: number }>) => string };
} {
  if (!instance.option) throw new Error("chart option was never set");
  return instance.option as unknown as {
    xAxis: { data: string[] };
    yAxis: { min?: number; type: string };
    series: Array<{ type: string; data: number[] }>;
    tooltip: { formatter: (params: Array<{ axisValue: string; data: number }>) => string };
  };
}
