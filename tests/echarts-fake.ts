import { vi } from "vitest";

export interface FakeChartInstance {
  host: HTMLElement;
  option: Record<string, unknown> | null;
  notMerge: boolean;
  disposed: boolean;
  handlers: Record<string, Array<(params: unknown) => void>>;
  initOptions: unknown;
  setOption: (option: Record<string, unknown>, opts?: { notMerge?: boolean }) => void;
  on: (event: string, handler: (params: unknown) => void) => void;
  off: (event: string, handler: (params: unknown) => void) => void;
  resize: () => void;
  dispose: () => void;
  getOption: () => Record<string, unknown> | null;
}

const instances: FakeChartInstance[] = [];
(globalThis as { __ECHARTS_INSTANCES__?: FakeChartInstance[] }).__ECHARTS_INSTANCES__ = instances;

export function chartInstances(): FakeChartInstance[] {
  return instances;
}

export function init(host: HTMLElement, _theme?: unknown, opts?: unknown): FakeChartInstance {
  const handlers: Record<string, Array<(params: unknown) => void>> = {};
  const instance: FakeChartInstance = {
    host,
    option: null,
    notMerge: false,
    disposed: false,
    handlers,
    initOptions: opts,
    setOption(option, setOpts) {
      instance.option = option;
      instance.notMerge = Boolean(setOpts && setOpts.notMerge);
    },
    on(event, handler) {
      handlers[event] = handlers[event] ?? [];
      handlers[event].push(handler);
    },
    off(event, handler) {
      handlers[event] = (handlers[event] ?? []).filter((item) => item !== handler);
    },
    resize: vi.fn(),
    dispose() {
      instance.disposed = true;
      const keys = Object.keys(handlers);
      for (const key of keys) {
        handlers[key] = [];
      }
    },
    getOption() {
      return instance.option;
    },
  };
  instances.push(instance);
  return instance;
}

export function emit(instance: FakeChartInstance, event: string, params: unknown): void {
  const list = instance.handlers[event] ?? [];
  for (const handler of list) {
    handler(params);
  }
}

export const use = vi.fn();
export const registerTheme = vi.fn();

/** 与 src/charts/echarts-runtime.ts 的导出形状一致 */
export const echarts = { init, use, registerTheme };
