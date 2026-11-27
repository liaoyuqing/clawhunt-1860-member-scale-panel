import mockSnapshot from "./mock/member-scale.json";
import type {
  CrmCompanyRow,
  LifecycleRow,
  LifecycleValue,
  MemberScaleSnapshot,
} from "../types/member-scale";

export type PanelState = "normal" | "empty" | "error" | "loading";

export const PANEL_STATES: readonly PanelState[] = ["normal", "empty", "error", "loading"];

/** ?state= 只接受四个固定值，其它一律按 normal 处理 */
export function parsePanelState(search: string): PanelState {
  const raw = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("state");
  if (raw && (PANEL_STATES as readonly string[]).includes(raw)) {
    return raw as PanelState;
  }
  return "normal";
}

const rawSnapshot = mockSnapshot as unknown as MemberScaleSnapshot & { companies: CrmCompanyRow[] };

export const MOCK_LATENCY_MS = 60;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function emptySnapshot(): MemberScaleSnapshot {
  return {
    asOf: rawSnapshot.asOf,
    scope: rawSnapshot.scope,
    kpis: rawSnapshot.kpis.map((item) => ({ ...item, value: 0, deltaPct: 0 })),
    lifecycle: rawSnapshot.lifecycle.map((row) => ({ ...row, count: 0 })),
    trend: rawSnapshot.trend.map((point) => ({ month: point.month, active: 0 })),
  };
}

/**
 * 本单没有后端：数据全部来自 src/services/mock/member-scale.json。
 * 对接点：把这三个函数换成工作台前端的真实请求（GET /api/v1/dashboard/member-scale
 * 与 GET /api/v1/crm/companies），返回结构保持 MemberScaleSnapshot / CrmCompanyRow 即可。
 */
export async function fetchMemberScale(state: PanelState = "normal"): Promise<MemberScaleSnapshot> {
  await delay(MOCK_LATENCY_MS);
  if (state === "error") {
    throw new Error("会员数据服务返回 503（mock）：请稍后重试");
  }
  if (state === "empty") {
    return emptySnapshot();
  }
  return {
    asOf: rawSnapshot.asOf,
    scope: rawSnapshot.scope,
    kpis: rawSnapshot.kpis,
    lifecycle: rawSnapshot.lifecycle,
    trend: rawSnapshot.trend,
  };
}

export async function fetchCrmCompanies(lifecycle: LifecycleValue | null): Promise<CrmCompanyRow[]> {
  await delay(MOCK_LATENCY_MS);
  const rows = rawSnapshot.companies;
  if (!lifecycle) return rows;
  return rows.filter((row) => row.lifecycle === lifecycle);
}

export function lifecycleCount(rows: readonly LifecycleRow[], value: LifecycleValue): number {
  const found = rows.find((row) => row.value === value);
  return found ? found.count : 0;
}
