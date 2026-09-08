# Repository Guidelines

## Project Structure & Module Organization
本仓库是 `Vite + React + TypeScript` 的单页应用。核心路径按职责分层如下。
- `src/main.tsx`：应用启动与根组件挂载。
- `src/App.tsx`：页面/路由、API 选择、参数表单、Catalog 与 Request Lab UI orchestration；不要把 transport lifecycle 再塞回这个组件。
- `src/apiCatalog.ts`：API 元数据单一事实源；所有 API 的 `id`、字段、`buildUrl`、请求头、解析策略都在此定义。
- `src/previewProfiles.ts`：API 与默认预览布局映射（如 `calendar-timeline`、`data-table`、`media-gallery`）。
- `src/responsePreview.tsx`：SSOT preview registry 与高层 composition；保持为 orchestration surface，不要继续把新的大型 domain adapter 塞回单体文件。
- `src/previews/`：API-owned semantic adapters、shared semantic-card primitives 与 response-data helpers；domain adapter 优先放这里，再由 `responsePreview.tsx` 注册。
- `src/App.test.tsx` 与 `src/apiCatalog.test.ts`：页面集成、目录一致性、布局映射和 URL 组装回归。
- `src/useApiRequestRuntime.test.tsx`：独立验证 shared request runtime 的 success、invalid-response、HTTP classification、timeout、superseded-run cancellation 与 unmount cleanup；不要把 transport lifecycle 回归重新堆进 `App.test.tsx`。
- `src/webmcp.ts`、`vite.config.ts`：外部适配与构建配置。
- `src/useModalFocusTrap.ts`：共享 compact/modal overlay 的 focus containment、Escape close、scroll lock 与 invoker focus restore contract；不要在各组件重复实现一份。
- `src/useApiRequestRuntime.ts`：Human Request Lab 与 WebMCP 共用的 request lifecycle：validation、timeout、AbortController cancellation、stale-run protection、response parsing/error classification；UI 只负责选择/显示状态，不要复制 transport state machine。

## Build、Test 与 Development Commands
- `npm install`：安装依赖。
- `npm run dev -- --host 0.0.0.0 --port 4173`：启动开发服务器。
- `npm run build`：执行 `tsc -b` 并构建生产产物到 `dist/`。
- `npm run preview`：本地验证生产构建是否可运行。
- `npm test`：执行完整测试套件。
- `npm run test:watch`：本地监听测试。
- 常见提交流程：先跑 `npm test`，再跑 `npm run build` 复核类型与打包。

## Coding Style & Naming Conventions
- 全局采用 2 空格缩进，禁止制表符。
- `React` 组件使用 `PascalCase`，函数/变量使用 `camelCase`。
- `ApiDemo` 相关配置建议集中在 `apiCatalog.ts`，避免在其他文件拼接 URL。
- API ID 采用短横线小写（示例：`openverse-search`）。
- Provider 搜索/过滤参数必须来自当前官方文档/OpenAPI；不要依赖 provider 静默忽略的 query key。若 response 会 echo `search`/`filters`，browser E2E 应验证 provider 实际承认了该参数。
- 日期字段优先使用 native `date` control；Human/agent SSOT 使用 `YYYY-MM-DD`，若 provider 要求其他日期格式，只在 `buildUrl` 边界转换，并用 provider echo 的 Gregorian/reporting date 做 browser E2E，避免 HTTP 200 掩盖日期误解析。
- 示例新增 API：
  1. 先在 `apiCatalog.ts` 增加定义。
  2. 在 `previewProfiles.ts` 加一条布局入口。
  3. 在 `src/previews/` 实现 API-owned semantic adapter，并在 `responsePreview.tsx` 注册。

建议流程（3步）：
- 1) 新建/更新 API 条目与示例参数。
- 2) 在测试中加入 URL/参数断言。
- 3) 在本地执行 2 个命令确认：`npm test`，`npm run build`。

## Testing Guidelines
- 测试框架：`vitest` + `@testing-library/react`。
- 文件命名：`*.test.ts`、`*.test.tsx`。
- 新 API 需要同步更新两处测试：
  - `src/apiCatalog.test.ts`（长度、ID 唯一、`buildUrl` 结果断言）。
  - `src/App.test.tsx`（布局选择与组件注册覆盖）。
- Request transport lifecycle 由 `src/useApiRequestRuntime.test.tsx` 直接覆盖；`App.test.tsx` 保留用户可见的 Request Lab / WebMCP integration contract，避免用整页 UI 测试重复 transport internals。
- 建议覆盖：成功返回、空结果、网络错误、超时、JSON 解析失败。

## Commit & Pull Request Guidelines
- 提交前缀常用：`feat`、`fix`、`refactor`、`test`、`chore`。
- PR 描述至少包含：变更概览、动机、影响范围、手工验证命令与结果。
- 涉及新 API 时，注明来源链接、限制条件、CORS 限制、以及字段缺失时的退化文案。

## Architecture Overview
`apiCatalog.ts`（元数据/请求定义）→ `useApiRequestRuntime.ts`（请求生命周期/解析/error semantics）→ `App.tsx`（页面与 UI orchestration）→ `previewProfiles.ts`（布局）→ `responsePreview.tsx`（渲染）。
建议优先通过 `usageNote` 标注速率、归属地或授权边界，避免在组件中写死业务规则。

## Security & Configuration Tips
- 禁止提交 API key、token、`.env` 与敏感凭据。
- 错误提示应统一处理 `CORS` 拒绝、429、超时和无效 JSON。
- 公开素材与引用数据需保留授权说明与展示边界。
- Provider automation/platform restrictions are executable policy, not only prose: encode explicit automation prohibitions in the catalog SSOT with an official policy link, fail closed for structured agent execution, and do not send autonomous live probes to manual-only public endpoints. Provider-specific automated-verification cadence/backoff also belongs in the SSOT when official policy requires it; generic health sweeps must exclude cadence-limited endpoints rather than repeatedly probing them. Rate limits, attribution, caching, or identification requirements alone do not automatically mean `manual-only`; keep those as bounded usage constraints unless the provider explicitly restricts automation/platform use. If a mandatory provider contract (for example an application-identifying `User-Agent`) cannot be satisfied by a normal browser, the endpoint is not browser-ready and should be replaced or removed rather than left behind a warning.

## Product North Star & Agent Compatibility
- 产品目标不是最大 API 目录，而是高质量、browser-native、同时服务 human/developer 与 AI agent 的 Public API workbench。
- 重大 UI/interaction 修改必须遵守 `docs/product-north-star-and-agent-architecture.md` 的 Agent-Readable DOM Contract：优先 semantic HTML/native controls；所有重要 action 有 clear accessible name；custom control 提供等价 ARIA/keyboard semantics；不要让 AI agent 依赖截图、颜色、icon 或全文 highlight 才能理解操作。
- Accessibility 同时视为 AI usability infrastructure；重要信息不能只存在于 chart/SVG/map/color，必须从同一个 semantic ViewModel 提供 agent-readable text/DOM。
- WebMCP 是可选的 structured agent surface，不得成为唯一 AI 入口；普通网页在无 WebMCP 环境仍须可通过 accessibility tree 完成 discover → search → select → configure → run → read result。
- WebMCP imperative tool registration 必须跨普通 React state/selection 变化保持稳定；不要让 callback identity churn 触发 teardown/re-register 并中断 in-flight tool invocation。浏览器 E2E 应在可用时验证原生 `document.modelContext`，mock 仅作为 unit-level 补充。
- Field validation 是 SSOT contract：number 使用 `min/max`，text 使用 `minLength/maxLength`，select 必须验证 value 属于 declared options；Human native controls、WebMCP discovery、`api-catalog.json` 与 shared request runtime 必须保持同义，并在 provider network 前 fail closed。
- `api-catalog.json` 是从 `apiCatalog.ts` build/dev-time 生成的 machine-readable fallback；禁止手工维护第二份 catalog。Catalog/policy schema 变更必须同步验证 JSON artifact、head discovery、Agent Tools link 与 WebMCP policy semantics 来自同一 SSOT；artifact 不得伪造 live health。
- 自主优化规则见 `docs/autonomous-optimization-loop.md`。Scheduled/local autonomous work 可以研究、修改、测试并更新 KB-MCP，但未收到用户明确 publication 指令前不得 commit、push、开 PR 或 merge。
