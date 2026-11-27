import { describe, expect, it } from "vitest";
import {
  LIFECYCLE_ORDER,
  LIFECYCLE_STAGES,
  mergeWithStages,
  stageLabel,
} from "../src/utils/lifecycle-order";
import { mockData, normalSnapshot } from "./fixtures";
import type { LifecycleRow } from "../src/types/member-scale";

const shuffled: LifecycleRow[] = [
  { value: "churned", label: "已流失", count: 5 },
  { value: "active", label: "有效", count: 64 },
  { value: "pending", label: "待认证", count: 8 },
  { value: "expired", label: "已过期", count: 7 },
  { value: "certified", label: "已认证", count: 10 },
  { value: "expiring", label: "临期", count: 6 },
];

describe("生命周期顺序常量与排序", () => {
  it("常量顺序固定为 待认证→已认证→有效→临期→已过期→已流失", () => {
    expect(LIFECYCLE_ORDER).toEqual(["pending", "certified", "active", "expiring", "expired", "churned"]);
    expect(LIFECYCLE_STAGES).toHaveLength(6);
    expect(LIFECYCLE_STAGES.map((stage) => stage.label)).toEqual(["待认证", "已认证", "有效", "临期", "已过期", "已流失"]);
  });

  it("乱序输入按常量顺序输出，且不按数值大小重排", () => {
    const ordered = mergeWithStages(shuffled);
    expect(ordered.map((row) => row.value)).toEqual([...LIFECYCLE_ORDER]);
    const byCount = [...shuffled].sort((a, b) => b.count - a.count).map((row) => row.value);
    expect(ordered.map((row) => row.value)).not.toEqual(byCount);
  });

  it("缺失状态补 0 且仍然保留条目，数值为 0 的状态不被丢弃", () => {
    const partial: LifecycleRow[] = [{ value: "active", label: "有效", count: 64 }];
    const merged = mergeWithStages(partial);
    expect(merged).toHaveLength(6);
    expect(merged.find((row) => row.value === "expiring")?.count).toBe(0);
    expect(merged.map((row) => row.value)).toEqual([...LIFECYCLE_ORDER]);
  });

  it("接口返回的行数与 mock 状态数一致，顺序与常量一致", () => {
    const snapshot = normalSnapshot();
    expect(snapshot.lifecycle).toHaveLength(mockData.lifecycle.length);
    expect(mockData.lifecycle.map((row) => row.value)).toEqual([...LIFECYCLE_ORDER]);
    expect(stageLabel("active")).toBe("有效");
    expect(stageLabel("churned")).toBe("已流失");
  });
});
