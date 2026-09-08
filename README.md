# Public API Admin Console

A reusable Vite + React + TypeScript admin console for demonstrating public APIs to developers and browser-based AI agents.

**Live demo:** [yapweijun1996.github.io/Public-API](https://yapweijun1996.github.io/Public-API/)

## What is included

- A curated catalog of 195 keyless public API demos
- Generated parameter forms with validation
- Preview-first Request Lab with one live-response SSOT card for every catalog API
- Raw JSON remains a secondary developer view; generated fetch code is available where provider policy permits reusable integration code
- Copyable JavaScript examples
- Responsive, keyboard-friendly UI
- Desktop catalog table with bounded 50-item semantic pagination and global SSOT search/filter, plus mobile API cards, navigation drawer, and selected-module drawer
- Five WebMCP tools registered through `document.modelContext`
- Build-generated `api-catalog.json` fallback for agents without WebMCP, advertised from the page and generated from the same API SSOT
- Typed catalog tests that validate every default endpoint
- Bounded live requests with a 20-second timeout and superseded-request cancellation

## Product North Star and AI-agent architecture

Public-API is a quality-first browser-native workbench for humans/developers and AI agents. The product treats accessibility semantics as AI usability infrastructure and targets one SSOT exposed through three complementary surfaces: Human UI, an agent-readable DOM/accessibility contract, and WebMCP when the environment supports it.

See:

- [`docs/product-north-star-and-agent-architecture.md`](docs/product-north-star-and-agent-architecture.md) — North Star, Agent-Readable DOM Contract, WebMCP/fallback strategy, semantic response architecture, capability discovery, and maturity roadmap.
- [`docs/autonomous-optimization-loop.md`](docs/autonomous-optimization-loop.md) — local-only autonomous research/optimization workflow, quality gates, KB-MCP learning policy, and publication boundary.

## Run locally

Use Node.js 20.19+, 22.12+, or 24+ (an active LTS release is recommended).

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Verify

```bash
npm test
npm run build
```

## Deploy

Pushes to `main` are tested, built, and deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`. The workflow sets Vite's repository base path automatically and publishes the `dist` artifact through GitHub's official Pages actions.

## Request Lab SSOT cards

Each catalog API is required to resolve through `apiSsotCardRegistry`. The registry joins its request definition, preview profile, and API-owned React component into one fail-closed response contract.

A successful Request Lab run shows the semantic SSOT card before the raw inspector. Shared primitives such as metric grids, semantic cards, maps, galleries, charts, and timelines are reusable, but the API adapter is responsible for translating the provider response into meaningful fields. Generic `Result 1` output is treated as a fallback defect for catalog APIs.

The current quality contract is:

1. Every catalog ID must have exactly one preview profile and one SSOT card component.
2. SSOT cards are generated only from the live API response and request metadata.
3. Single-result cards span the available response surface instead of leaving an unused second column.
4. Raw JSON and fetch code are diagnostic views, not the primary result experience.
5. API-specific regression tests should assert meaningful domain fields and reject generic fallback rendering.

## Add another public API

A catalog addition is not complete until its Request Lab SSOT card is defined. Add:

1. Catalog metadata in `src/apiCatalog.ts`, including provider, category, documentation, defaults, an HTTPS request builder, bounded `usageNote` constraints, `agentExecution` when official provider policy restricts automation/platform use, and `automatedVerification` when official policy imposes a stricter cadence/backoff contract on recurring health probes.
2. A response parser when the provider does not return ordinary JSON (for example newline-delimited version lists).
3. One intentional profile in `src/previewProfiles.ts` describing the semantic layout used by the response.
4. One API-owned card component/adapter under `src/previews/`, registered by `src/responsePreview.tsx`. Reuse visual primitives and shared response-data helpers, but map the provider response to domain fields rather than generic `Result 1` output.
5. Contract tests for the default request, policy semantics, and semantic card fields. Use real GitHub-Pages-origin browser E2E only where provider policy permits automated verification; for `manual-only` endpoints prove policy discovery, accessible DOM warnings, and zero-provider-request fail-closed behavior with deterministic fixtures.

`apiSsotCardRegistry` is fail-closed: every catalog ID must resolve to a profile and component. The admin table, detail panel, request form, generated code, validation, WebMCP discovery, and Request Lab SSOT surface are then derived from those registered contracts.

## Machine-readable catalog

`api-catalog.json` is generated during development/build from `src/apiCatalog.ts`; do not maintain a second catalog file by hand. A Pages build with base `/Public-API/` publishes it at `/Public-API/api-catalog.json`. It includes deterministic Request Lab paths, parameter metadata, provider usage constraints, `agentExecution`, and `automatedVerification` policy, but no executable `buildUrl` functions and no synthetic live-health status. `health: "not-included"` is intentional until health telemetry has a durable SSOT. The document head and Agent Tools page both advertise the artifact for ordinary browser agents.

## WebMCP

When `document.modelContext` is available, the app registers:

- `list_public_api_demos` — supports optional `query` / `category` discovery and returns total/matched counts, deterministic Request Lab URLs, parameter help, numeric bounds, and select options from the catalog SSOT.
- `filter_public_api_catalog`
- `navigate_api_console`
- `open_public_api_demo`
- `run_public_api_demo`

The API is currently experimental. The visual explorer remains fully usable when WebMCP is unavailable.

Agent actions reuse the same request definitions and validation logic as human interactions. They can filter the visible catalog, navigate the console, select a module, and execute permitted live requests while keeping the UI synchronized. Provider automation restrictions are part of the catalog SSOT: discovery returns `agentExecution` plus provider `usageNote` constraints when present, manual-only APIs are excluded from the run-tool enum, and `run_public_api_demo` independently fails closed if a blocked ID is submitted. Generic fetch-code generation is also withheld for manual-only endpoints. The human Request Lab remains available for provider-permitted interactive use and exposes the same policy in accessible DOM metadata.

Request Lab routes are deterministic per API: `#/request-lab?api=<api-id>`. Opening that URL directly selects the requested catalog entry and its default parameters; invalid IDs fail closed to a valid canonical selection. WebMCP discovery returns the same per-API Request Lab URL so structured agents and ordinary browser agents share one navigation contract.
