/**
 * 截图证据自检（不依赖浏览器）：
 * 1) 三张 PNG 都存在且字节数大于阈值（拒绝空白图）；
 * 2) PNG 头 8 字节是 89 50 4E 47；
 * 3) chart-text.json 里正常态 6 条标签、空数据态 0 条标签、条尾标签全部是「<数字> 家」；
 * 4) 三个状态都没有 console error。
 * 任一不过退出码 1。
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const MIN_BYTES = 20 * 1024;
const failures = [];

function fail(message) {
  failures.push(message);
  console.log("FAIL " + message);
}

function ok(message) {
  console.log("OK   " + message);
}

for (const name of ["normal", "empty", "error"]) {
  const file = path.join(ROOT, "shots", name + ".png");
  let buffer;
  try {
    buffer = await readFile(file);
  } catch {
    fail("截图缺失: shots/" + name + ".png");
    continue;
  }
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") fail("不是 PNG: shots/" + name + ".png (" + signature + ")");
  else ok("shots/" + name + ".png 是 PNG，字节数 " + buffer.length);
  if (buffer.length < MIN_BYTES) fail("截图过小可能是空白图: shots/" + name + ".png = " + buffer.length + " bytes");
}

const dump = JSON.parse(await readFile(path.join(ROOT, "shots", "chart-text.json"), "utf8"));
const byName = new Map(dump.states.map((state) => [state.name, state]));

const normal = byName.get("normal");
if (!normal) {
  fail("chart-text.json 缺少 normal 态");
} else {
  const labels = normal.barLabels.filter((text) => /^\d+ 家$/.test(text));
  const STAGES = ["待认证", "已认证", "有效", "临期", "已过期", "已流失"];
  const axisLabels = normal.barLabels.filter((text) => STAGES.includes(text));
  if (axisLabels.join(",") !== STAGES.join(",")) fail("正常态 y 轴阶段顺序应严格等于常量，实际 " + axisLabels.join(" / "));
  else ok("正常态阶段轴 6 项且顺序正确：" + axisLabels.join(" / "));
  if (labels.length !== 6) fail("正常态「数字 + 家」格式的标签数应为 6，实际 " + labels.length);
  else ok("正常态条尾标签全部形如「8 家」：" + labels.join(" / "));
  if (normal.kpiValues.length !== 4) fail("正常态指标卡数应为 4，实际 " + normal.kpiValues.length);
  else ok("正常态指标卡 4 张，值 " + normal.kpiValues.join(" / "));
  if (normal.consoleErrors.length > 0) fail("正常态有 console 错误: " + normal.consoleErrors.join(" | "));
  else ok("正常态无 console 错误");
}

const empty = byName.get("empty");
if (!empty) {
  fail("chart-text.json 缺少 empty 态");
} else {
  const emptyTailLabels = empty.barLabels.filter((text) => /^\d+ 家$/.test(text));
  if (emptyTailLabels.length !== 0) fail("空数据态不应有「数字 + 家」条尾标签，实际 " + emptyTailLabels.length);
  else ok("空数据态条尾标签数 0（无条形），仅剩阶段轴与空态提示");
  if (!empty.barLabels.includes("暂无会员企业数据")) fail("空数据态缺少「暂无会员企业数据」图内提示");
  else ok("空数据态图内提示「暂无会员企业数据」存在");
  if (empty.kpiValues.join(",") !== "0,0,0,0") fail("空数据态指标卡应全为 0，实际 " + empty.kpiValues.join(","));
  else ok("空数据态指标卡 0/0/0/0");
  if (empty.consoleErrors.length > 0) fail("空数据态有 console 错误: " + empty.consoleErrors.join(" | "));
  else ok("空数据态无 console 错误");
}

const errorState = byName.get("error");
if (!errorState) {
  fail("chart-text.json 缺少 error 态");
} else if (errorState.consoleErrors.length > 0) {
  fail("报错态有 console 错误: " + errorState.consoleErrors.join(" | "));
} else {
  ok("报错态无 console 错误");
}

if (failures.length > 0) {
  console.log("VERIFY_SHOTS=FAIL (" + failures.length + " 项)");
  process.exit(1);
}
console.log("VERIFY_SHOTS=PASS");
