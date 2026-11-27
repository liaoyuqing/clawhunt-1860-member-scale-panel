import mockJson from "../src/services/mock/member-scale.json";
import type { CrmCompanyRow, MemberScaleSnapshot } from "../src/types/member-scale";

export interface MockFile extends MemberScaleSnapshot {
  companies: CrmCompanyRow[];
}

export const mockData = mockJson as unknown as MockFile;

export function normalSnapshot(): MemberScaleSnapshot {
  return {
    asOf: mockData.asOf,
    scope: mockData.scope,
    kpis: mockData.kpis,
    lifecycle: mockData.lifecycle,
    trend: mockData.trend,
  };
}

export function emptySnapshotFixture(): MemberScaleSnapshot {
  return {
    asOf: mockData.asOf,
    scope: mockData.scope,
    kpis: mockData.kpis.map((item) => ({ ...item, value: 0, deltaPct: 0 })),
    lifecycle: mockData.lifecycle.map((row) => ({ ...row, count: 0 })),
    trend: mockData.trend.map((point) => ({ month: point.month, active: 0 })),
  };
}

export const LIFECYCLE_STAGE_COUNT = 6;
export const BARS_IN_NORMAL_STATE = mockData.lifecycle.length;
export const TREND_POINTS = 12;
