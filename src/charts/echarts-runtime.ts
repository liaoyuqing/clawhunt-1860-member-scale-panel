/**
 * ECharts 按需引入：只注册本面板真正用到的图表与组件，
 * 避免把整个 echarts 打进入口包（全量引入会让产物多出约 1 MB）。
 */
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { GraphicComponent, GridComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsType } from "echarts/core";

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, GraphicComponent, SVGRenderer]);

export { echarts };
export type { EChartsType };
