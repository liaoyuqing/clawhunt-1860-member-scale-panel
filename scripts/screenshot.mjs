/**
 * 用 Playwright 的 Chromium 对三种面板状态各截一张图，并把真实 DOM 里的
 * 条形标签文本抓出来落成 JSON（AC1 的「条形均标有数值」由此可复核）。
 *
 * 前置：先起静态服务（pnpm build && pnpm preview，端口 4186）。
 * 用法：pnpm shots  或  BASE_URL=http://127.0.0.1:4186 pnpm shots
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:4186";
const OUT_DIR = path.resolve("shots");
const TEXT_DUMP = path.resolve("shots", "chart-text.json");

const STATES = [
  { name: "normal", query: "?state=normal" },
  { name: "empty", query: "?state=empty" },
  { name: "error", query: "?state=error" },
];

async function readBarLabels(page) {
  return await page.$$eval('[data-testid="lifecycle-bar-chart"] svg text', (nodes) =>
    nodes.map((node) => (node.textContent ?? "").trim()).filter((text) => text.length > 0),
  );
}

async function waitForChart(page, expectBars) {
  await page.waitForSelector('[data-testid="lifecycle-bar-chart"] svg', { state: "attached", timeout: 20000 });
  if (!expectBars) {
    // 空数据态没有条形，只等 ECharts 把空态提示文本画出来
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('[data-testid="lifecycle-bar-chart"] svg text')).some((node) =>
          (node.textContent ?? "").includes("暂无会员企业数据"),
        ),
      undefined,
      { timeout: 20000 },
    );
    return;
  }
  await page.waitForFunction(
    (min) => {
      const paths = document.querySelectorAll('[data-testid="lifecycle-bar-chart"] svg path');
      return paths.length >= min;
    },
    6,
    { timeout: 20000 },
  );
}

const browser = await chromium.launch();
const evidence = { baseUrl: BASE_URL, viewport: { width: 1280, height: 1000 }, states: [] };

await mkdir(OUT_DIR, { recursive: true });

for (const state of STATES) {
  const page = await browser.newPage({ viewport: evidence.viewport, deviceScaleFactor: 2 });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  const url = BASE_URL + "/" + state.query;
  await page.goto(url, { waitUntil: "networkidle" });

  let labels = [];
  let kpiValues = [];
  if (state.name === "error") {
    await page.waitForSelector('[data-testid="panel-error"]', { timeout: 20000 });
  } else {
    await page.waitForSelector('[data-testid="member-scale-panel"]', { timeout: 20000 });
    await waitForChart(page, state.name === "normal");
    labels = await readBarLabels(page);
    kpiValues = await page.$$eval('[data-testid="kpi-value"]', (nodes) => nodes.map((node) => (node.textContent ?? "").trim()));
  }

  const file = path.join(OUT_DIR, state.name + ".png");
  await page.screenshot({ path: file, fullPage: true });
  const size = await page.evaluate(() => document.documentElement.scrollHeight);

  evidence.states.push({
    name: state.name,
    url,
    file: "shots/" + state.name + ".png",
    barLabels: labels,
    kpiValues,
    documentHeight: size,
    consoleErrors,
  });
  console.log(
    "SHOT " + state.name + " labels=" + labels.length + " kpi=" + kpiValues.length + " errors=" + consoleErrors.length,
  );
  await page.close();
}

await browser.close();
await writeFile(TEXT_DUMP, JSON.stringify(evidence, null, 2) + "\n", "utf8");
console.log("WROTE " + OUT_DIR);
