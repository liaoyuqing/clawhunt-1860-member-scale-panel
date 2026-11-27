import { isLifecycleValue } from "./lifecycle-order";
import type { LifecycleValue } from "../types/member-scale";

export const CRM_COMPANIES_PATH = "/crm/companies";

/**
 * 面板自身的展示态参数（?state=normal|empty|error|loading）只是本地预览开关，
 * 不属于业务筛选条件，下钻时一律丢弃，避免污染 CRM 的查询串。
 */
export const NON_BUSINESS_PARAMS: readonly string[] = ["state"];

function toSearchParams(search: string): URLSearchParams {
  if (!search) return new URLSearchParams();
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

/**
 * 构造 CRM 企业列表的下钻地址：
 * - lifecycle 只接受英文枚举，中文标签「有效」在这里直接抛错，进不了 URL；
 * - 已有业务查询参数（例如 source=panel）原样保留，顺序按原顺序；
 * - 旧的 lifecycle 参数先删再写，避免出现两个同名参数。
 */
export function buildCrmUrl(
  lifecycle: string,
  search = "",
  dropParams: readonly string[] = NON_BUSINESS_PARAMS,
): string {
  if (!isLifecycleValue(lifecycle)) {
    throw new Error(`unknown lifecycle value: ${lifecycle}`);
  }
  const params = toSearchParams(search);
  params.delete("lifecycle");
  for (const name of dropParams) {
    params.delete(name);
  }
  params.set("lifecycle", lifecycle);
  const query = params.toString();
  return query ? `${CRM_COMPANIES_PATH}?${query}` : CRM_COMPANIES_PATH;
}

export function readLifecycleParam(search: string): LifecycleValue | null {
  const value = toSearchParams(search).get("lifecycle");
  if (!value || !isLifecycleValue(value)) return null;
  return value;
}
