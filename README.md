# 会员规模与状态分布面板（Member Scale & Lifecycle Panel）

管理驾驶舱里的一个面板：4 张会员规模指标卡（带环比箭头）、按生命周期顺序排列并带条尾数值的横向条形图、近 12 个月有效会员企业折线图；点击任一条形（或图下方的键盘下钻按钮）跳转到 CRM 企业列表并带上 `lifecycle` 筛选。

- 技术栈：React 18 + TypeScript 5.9 + **TDesign React** + **ECharts 5**（按需引入 bar/line/grid/tooltip/graphic + SVG 渲染器）
- 构建 / 测试：Vite 7 + Vitest 3 + @testing-library/react（jsdom）
- 接口：**全部 mock**，本单没有后端。数据在 `src/services/mock/member-scale.json`，取数函数在 `src/services/member-scale-api.ts`
- 产品演示里出现过、但**本仓库不含**的内容：CRM 列表后端、会员统计数据仓库、指标口径定义

> 本仓库所有企业名称（星澜科技 / 云栖生物 / 恒泰智造 / 青禾新材 / 衡远物流 / 沐川数据 / 锦禾能源 / 越洋跨境 / 澄明环保 / 博雅教育）与数字均为虚构测试数据，不含任何真实个人信息或企业信息，也不出现客户名称。

## 一、依赖与运行环境（依赖什么 / 不需要什么 / 怎么跑）

**需要**：Node.js ≥ 20（实测 v26.13.1）、pnpm 11（实测 11.28.5；用 npm 也可，命令把 `pnpm` 换成 `npm run` 即可）、一个能跑 Chromium 的桌面环境（只有重现截图时才需要）。

**不需要**：后端服务、数据库、Redis、任何 API Key 或环境变量、任何向境外发送数据的 SDK。面板启动后读的是仓库内的 JSON。

```bash
# 1) 装依赖（实测 Packages: +199，约 30 秒）
pnpm install
# 预期输出末尾：Done in ...s using pnpm v11.x；并打印 dependencies / devDependencies 清单

# 2) 起开发服务器
pnpm dev
# 预期输出：VITE v7.3.x  ready in ... ms
#           ➜  Local:   http://localhost:5186/     （端口在 vite.config.ts 里固定为 5186 + strictPort）

# 3) 跑单元测试（50 个用例，6 个测试文件）
pnpm test -- --run
# 预期输出：Test Files  6 passed (6)
#           Tests  50 passed (50)
#           Exit code 0

# 4) 类型检查
pnpm typecheck
# 预期输出：无任何行（tsc --noEmit 静默即成功），Exit code 0

# 5) 生产构建
pnpm build
# 预期输出：✓ built in ~47s，产物落 dist/（index.html + 4 个 JS chunk + 2 个 CSS，合计 1323926 字节）
```

一条命令跑完全部四项：`pnpm verify`（= `tsc --noEmit && vitest run && vite build`）。

## 二、面板三种状态与路由

| 路由 | 作用 |
| --- | --- |
| `/` 或 `/?state=normal` | 正常数据 |
| `/?state=empty` | 空数据（指标卡 0、条形长度 0、折线贴 0 线、图内「暂无会员企业数据」） |
| `/?state=error` | 接口报错（mock 抛 503，显示错误文案 + 「重新加载」按钮） |
| `/?state=loading` | 加载中（骨架屏） |
| `/crm/companies?lifecycle=active` | 下钻目标页（mock 的 CRM 列表，按 lifecycle 过滤） |

页面顶部有「面板状态」切换条，点一下就改查询串，无需重启服务。

## 三、如何重现 AC1 的两张截图（真正的 Playwright 截图，非示意图）

脚本 `scripts/screenshot.mjs` 用 Playwright 的 Chromium（headless），以 1280×1000 视口、deviceScaleFactor=2 截 **fullPage** PNG，同时把图里每个 `<text>` 节点的内容抓出来写进 `shots/chart-text.json`，供 `scripts/verify-shots.mjs` 复核「条尾确实有数值」。

```bash
# 终端 A：起生产预览（截图用的是构建产物，不是 dev server）
pnpm build
pnpm preview
# 预期输出：➜  Local:   http://localhost:4186/   （vite.config.ts 固定 4186 + strictPort）

# 终端 B：截图 + 自检
BASE_URL=http://localhost:4186 pnpm shots
# 预期输出：
#   SHOT normal labels=20 kpi=4 errors=0
#   SHOT empty  labels=7  kpi=4 errors=0
#   SHOT error  labels=0  kpi=0 errors=0
#   WROTE <repo>/shots

pnpm verify:shots
# 预期输出（逐行 OK，末行 PASS，退出码 0）：
#   OK   shots/normal.png 是 PNG，字节数 ~194747
#   OK   shots/empty.png  是 PNG，字节数 ~191906
#   OK   shots/error.png  是 PNG，字节数 64050
#   OK   正常态阶段轴 6 项且顺序正确：待认证 / 已认证 / 有效 / 临期 / 已过期 / 已流失
#   OK   正常态条尾标签全部形如「8 家」：8 家 / 10 家 / 64 家 / 6 家 / 7 家 / 5 家
#   ...
#   VERIFY_SHOTS=PASS
```

- `shots/normal.png`：正常态。6 条条形，条尾依次是 **8 家 / 10 家 / 64 家 / 6 家 / 7 家 / 5 家**，数字肉眼可读；4 张指标卡带 ▲ 箭头与 +x.x% 变化值，本期流失是负向指标，箭头朝上时是红色。
- `shots/empty.png`：空数据态。指标卡 0，条形长度 0 且没有任何条尾数值，图内居中显示「暂无会员企业数据」，下方空态说明文字存在。
- `shots/error.png`：报错态（AC 没要求，附带证据）。

脚本不会自己下载浏览器：Playwright 用本机已安装的 Chromium（`%USERPROFILE%\AppData\Local\ms-playwright`）。如果换了机器，先 `pnpm exec playwright install chromium`。

## 四、目录结构

```
src/
  App.tsx / main.tsx                     路由与入口（/ 与 /crm/companies）
  pages/dashboard/DashboardPage.tsx      驾驶舱页 + 状态切换条
  pages/dashboard/panels/MemberScalePanel/
    index.tsx                            面板容器：取数、三态、下钻回调
    KpiCards.tsx                         4 张指标卡（环比箭头 + 语义色）
    LifecycleBar.tsx                     横向条形图 + 键盘下钻按钮
    TrendLine.tsx                        12 个月折线
    PanelStates.tsx                      加载 / 报错 / 空态提示
  charts/lifecycle-option.ts             条形图 option（顺序、条尾 label、空态 graphic）
  charts/trend-option.ts                 折线 option（min:0、12 点）
  charts/echarts-runtime.ts              ECharts 按需注册 + 单点导出
  utils/delta.ts                         环比方向 / 文本 / 语义色（AC3 判定点）
  utils/lifecycle-order.ts               生命周期常量顺序 + 补 0 排序
  utils/crm-url.ts                       下钻 URL 构造（AC2 判定点）
  services/member-scale-api.ts           取数（mock，含对接点说明）
  services/mock/member-scale.json        虚构数据（100 家量级的 10 条抽样 + 分布汇总）
  types/member-scale.ts                  领域类型
tests/                                   6 个 spec + ECharts 内存替身 + fixtures
scripts/screenshot.mjs                   Playwright 截图 + 文本抓取
scripts/verify-shots.mjs                 截图与文本证据自检
shots/                                   normal.png / empty.png / error.png / chart-text.json
docs/checks/                             真实命令输出日志（见下）
```

## 五、关键设计说明（验收会看的地方）

1. **生命周期顺序是常量，不按数值排**：`LIFECYCLE_STAGES` 固定 待认证→已认证→有效→临期→已过期→已流失；`mergeWithStages` 只按常量重排，接口缺某状态时补 `count: 0`（条形长度 0，条尾仍写「0 家」）。测试里专门有一条反例断言：排序结果**不等于**按 count 降序的结果。
2. **条尾数值**：series 级与 data 级两处都开 `label.show`，`position: "right"`，formatter 输出 `${value} 家`。
3. **下钻 URL**：`buildCrmUrl(lifecycle, search)` 只接受英文枚举，传中文「有效」直接抛错（所以脏值进不了 URL）；已有业务参数（如 `source=panel`）按原顺序保留；同名 `lifecycle` 先删再写；面板自身的 `?state=` 是本地预览开关，下钻时丢弃。
4. **环比方向**：`describeDelta(value, polarity)` 返回 `{dir: "up"|"down"|"flat", text, tone, arrow}`。文本的符号由方向决定、绝对值单独取，所以 -5 只会渲染成 `-5.0%`；flat 时**不渲染箭头节点**（不是渲染一个空 span）。语义色与指标极性挂钩：正向指标涨=绿，负向指标（本期流失）涨=红。
5. **ECharts 实例管理**：每个图表组件的 effect 里 `echarts.init`，cleanup 里 `dispose()` 并解绑 resize；单测用内存替身断言卸载后无未 dispose 实例。
6. **接口对接点**：把 `src/services/member-scale-api.ts` 里三个函数换成真实请求即可（`GET /api/v1/dashboard/member-scale`、`GET /api/v1/crm/companies`），返回结构保持 `MemberScaleSnapshot` / `CrmCompanyRow`。本单按需求用 mock 先行。

## 六、测试覆盖（6 文件 50 用例）

| 文件 | 用例 | 覆盖 |
| --- | --- | --- |
| `tests/delta-arrow.spec.tsx` | 7 | AC3：+5/-5/0 的方向与箭头、单负号、负向指标红色、4 张卡都有变化值 |
| `tests/lifecycle-jump-url.spec.tsx` | 13 | AC2：点击 active 逐字等于 `/crm/companies?lifecycle=active`、中文标签负例、churned、push 只调 1 次、保留 source、路由器真实跳转、键盘、未知枚举抛错 |
| `tests/tail-labels.spec.tsx` | 12 | AC1：条尾标签数 === 状态数、逐条文本核对、0 值保留、空数据态条形 0 + 空态文案 |
| `tests/lifecycle-order.spec.tsx` | 4 | 常量顺序、乱序输入、缺失补 0、不按数值重排 |
| `tests/trend-and-dispose.spec.tsx` | 7 | 折线 12 点、月份连续、y 轴 min=0、tooltip、卸载 dispose、重挂载不复用旧实例 |
| `tests/three-states.spec.tsx` | 7 | 加载骨架、报错文案 + 重试只调 1 次、三态互斥、`?state=` 解析、状态切换条 |

## 七、验证日志

`docs/checks/` 下是真实命令输出（在干净副本里重跑得到）：

| 文件 | 命令 | 结果 |
| --- | --- | --- |
| `docs/checks/01-install.log` | `pnpm install` | exit 0 |
| `docs/checks/02-typecheck.log` | `pnpm exec tsc --noEmit` | exit 0（无输出） |
| `docs/checks/03-tests.log` | `pnpm exec vitest run` | exit 0，6 文件 50 用例全绿 |
| `docs/checks/04-build.log` | `pnpm exec vite build` | exit 0，产物见日志末行 |
| `docs/checks/05-shots.log` | `pnpm exec node scripts/screenshot.mjs` | exit 0，三张 PNG |
| `docs/checks/06-verify-shots.log` | `pnpm exec node scripts/verify-shots.mjs` | exit 0，VERIFY_SHOTS=PASS |
