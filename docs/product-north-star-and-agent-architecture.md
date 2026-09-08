# Public-API Product North Star and Agent Architecture

## North Star

Public-API is not trying to become the largest public-API directory.

> Build the highest-quality browser-native public API workbench for humans, developers, and AI agents, where users can discover, understand, test, and use curated public APIs without API keys, backend infrastructure, or reading raw JSON.

Quality is more important than catalog size. A new API is valuable only when it adds a useful capability and remains reliable, understandable, browser-compatible, agent-usable, and maintainable.

## Product audiences

Public-API serves two primary groups:

1. **Humans / developers** — discover APIs, configure requests, understand semantic results, inspect raw JSON, and copy integration code.
2. **AI agents** — discover capabilities, select APIs, configure inputs, execute requests, and read results through structured tools or ordinary browser interaction.

The product must not require an AI agent to guess from screenshots, visual position, color, icons, or a full-page text highlight.

## One SSOT, three access surfaces

All important product surfaces should derive from the same API registry and semantic contracts:

```text
                     Public-API SSOT
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
      Human UI      Agent-readable Web   WebMCP
```

### Human UI

The catalog and Request Lab remain responsive, keyboard-friendly developer experiences. Charts, maps, galleries, tables, timelines, semantic cards, Raw JSON, and fetch code are optimized for human comprehension.

### Agent-readable Web UI

An AI agent without WebMCP must still be able to operate the site through the DOM and accessibility tree. The ordinary page is therefore a supported machine-operability surface, not only a visual rendering.

### WebMCP

When `document.modelContext` is available, WebMCP is the preferred structured agent interface. It must reuse the same SSOT, validation, request-building, execution, and navigation logic as the human UI rather than maintaining a parallel catalog.

WebMCP is important but optional. Public-API must remain agent-usable when WebMCP is unavailable.

WebMCP registration is also a lifecycle contract. Framework re-renders or ordinary UI selection changes must not tear down and re-register imperative tools while an invocation is active. Registration dependencies should stay stable across routine state changes, and browser E2E for structured tools should exercise the browser's native `document.modelContext` surface when available rather than relying only on a mocked registration object.

Request execution is likewise one shared lifecycle contract across Human UI and WebMCP. Validation, request construction, timeout, cancellation, stale-run protection, HTTP/error classification, and response parsing must flow through the same request-runtime primitive rather than being reimplemented inside page components or agent adapters. Page components own navigation, selection, parameter editing, and rendering; the shared request runtime owns transport state and must keep its execution callback stable enough for WebMCP registration not to churn during ordinary UI changes. Transport lifecycle regression tests should exercise that runtime boundary directly, while page-level tests retain user-visible Request Lab and WebMCP integration assertions rather than duplicating transport internals through the full application shell. Parameter validity is part of the same SSOT contract: numeric bounds, text-length bounds, and select option membership must be represented unambiguously in field metadata, reflected in native Human UI controls, exposed through WebMCP/machine discovery, and enforced before any provider request so structured agents cannot bypass constraints that the visual form naturally prevents. Provider request definitions must also use documented provider parameters rather than tolerated or silently ignored query keys. When a provider echoes recognized search/filter parameters in its response metadata, browser E2E should verify that acknowledgement so a visually successful but semantically unfiltered request cannot be mistaken for a working search.

### Provider execution policy

Agent usability does not override provider terms. Provider restrictions that materially affect structured or automated execution belong in the API SSOT, not only in prose notes. WebMCP discovery must expose that policy plus bounded provider usage constraints, and execution tools must fail closed when an endpoint is manual-only. Automated health verification is a distinct surface: when an official provider policy requires a minimum refresh cadence or immediate stop after non-200 responses, encode that constraint as `automatedVerification` in the same API SSOT and exclude the endpoint from generic recurring sweeps. The ordinary DOM and machine catalog should expose the same policy metadata so browser agents can abstain or schedule responsibly. Generic integration code must not be generated for a manual-only public endpoint. `manual-only` is reserved for explicit automation/platform restrictions; ordinary rate limits, attribution, caching, identification, or backoff requirements remain usage constraints unless the provider actually forbids the structured execution mode. A provider contract that the browser architecture cannot satisfy at all (such as a mandatory application-identifying header the browser does not allow application code to control) fails the browser-readiness gate and should be replaced or removed rather than misrepresented as supported.

## Agent-Readable DOM Contract

Agent-readable DOM semantics are a core product requirement.

### Controls

Every important control needs a deterministic accessible identity:

- Prefer semantic/native elements such as `button`, `input`, `select`, `form`, headings, lists, tables, and links.
- Icon-only actions need visible text or a clear accessible name such as `aria-label`.
- Custom selectors must expose equivalent roles, labels, state, keyboard behavior, and focus semantics rather than opaque clickable `div` elements.
- Form fields need associated labels and understandable help/error text.
- Use stable action names such as `Search APIs`, `Open ... in Request Lab`, `Run API`, `Copy JSON`, and `Copy fetch code`.
- Repeated actions in collections must include the target identity in their accessible name. A catalog with many visible `Documentation` links should expose names such as `Open Country Explorer documentation`, not hundreds of indistinguishable links.
- Important controls must be keyboard-focusable and cannot require pointer-only interaction.
- Large catalog collections should use bounded semantic pagination rather than rendering every item into the DOM at once. Search and category filtering still operate over the complete SSOT, pagination uses native Previous/Next controls with current-page semantics, and every catalog item must remain reachable with exact no-duplicate/no-omission coverage. Search/filter changes reset to the first matching page so off-page state cannot hide a match. WebMCP and `api-catalog.json` remain full-catalog discovery surfaces.
- Single-page navigation must preserve the user's point of regard: when an action replaces the current workspace, focus moves to the new page heading. Any compact overlay that blocks the underlying workspace—including mobile navigation and the selected-API detail drawer—must use modal dialog semantics, move focus inside, keep background content inert, contain Tab/Shift+Tab, support Escape, and restore the invoking control when dismissed without navigating. Desktop persistent panels must not expose close controls that do nothing.
- Modal keyboard/focus behavior is one reusable product contract, not per-component glue. Blocking overlays should share the same focus-trap/restore primitive so Escape, Tab containment, body scroll lock, and invoker restoration cannot silently drift between mobile navigation and compact detail surfaces.

The accessibility tree should make this path obvious:

```text
Discover -> Search -> Select -> Open -> Configure -> Run -> Read result
```

### Stable machine metadata

Where useful, interactive surfaces should expose bounded data attributes derived from the SSOT, for example:

```html
<article
  data-api-id="nominatim-search"
  data-category="geo"
  data-browser-ready="true"
  data-key-required="false"
>
```

Request Lab surfaces may similarly expose API ID, SSOT card, adapter, layout, health/error state, and other values that exist in the product model.

These attributes supplement semantic HTML; they do not replace it.

## Accessibility is AI usability infrastructure

Accessibility is not treated only as compliance. Strong semantics improve:

- screen readers and keyboard users;
- Playwright/browser E2E automation;
- ChatGPT-style browser agents;
- computer-use agents;
- future autonomous agents.

Engineering principle:

> Accessible semantics are also machine-operability semantics.

A visually polished component that is opaque to the accessibility tree is incomplete.

## Semantic response architecture

Important information must never exist only as a chart, SVG path, color, icon, image, or map pin.

```text
Raw provider response
        |
        v
API-specific semantic adapter
        |
        v
Stable semantic ViewModel
       / \
      v   v
Visual UI  Agent-readable text/DOM
```

A chart may visualize a time series while the same ViewModel exposes latest value, min/max, trend, units, and dates as text. A map should expose names and coordinates in semantic DOM as well as pins.

## SSOT Card contract

The Request Lab contract remains:

```text
1 API
= 1 request definition
+ 1 semantic response adapter
+ 1 intentional card composition
+ 1 browser E2E contract
```

Shared primitives are encouraged; generic meaning is not. APIs may reuse `MetricGrid`, `DataTable`, `Map`, `Gallery`, or chart primitives, but each provider response must be adapted into domain meaning.

The shared result-card shell is a UX contract, not a substitute for API-specific design. Every successful SSOT card should use a consistent user-facing hierarchy: live-response state, API identity, domain/profile label, provider/category context, bounded runtime facts, then the API-owned semantic composition. Internal implementation terms such as adapter names stay machine-readable through stable metadata instead of competing with the user result. Visual individuality should come from domain meaning and response structure, not arbitrary per-API radius, pattern, or decoration. Values that matter to a person must remain readable on mobile rather than being irreversibly truncated for visual neatness.

The incremental domain-card redesign and its verification ledger are tracked in [SSOT Card UX Phase 2](ssot-card-ux-phase-2.md).

As dedicated semantic adapters accumulate, `responsePreview.tsx` should remain a bounded registry/composition layer rather than a second monolith. API-owned adapters belong under `src/previews/`, and shared response-data or semantic-card primitives should be extracted once they are reused across domains. Modularization must preserve the same SSOT registry identities, semantic DOM, and browser behavior rather than introducing a parallel rendering contract.

Generic output such as `Result 1`, arbitrary property dumps, or `Structured records unavailable` after a successful default request is a product defect.

The semantic layout identifier is part of the machine-readable SSOT contract too. When a generic composition is replaced with a dedicated domain adapter, `data-preview-layout` and the preview profile must move to a domain-meaningful layout identifier rather than continuing to report a stale generic `data-table` label. Visual semantics and machine metadata must describe the same result composition.

## Capability-oriented discovery

AI agents usually ask for tasks rather than internal IDs. The SSOT should progressively capture metadata such as:

- `capabilities`;
- `keywords`;
- `useCases`;
- `inputTypes`;
- `outputTypes`;
- browser readiness;
- API-key requirement;
- health state;
- rate-limit and attribution notes.

An agent asking for “an API that converts an address to coordinates” should be able to discover the geocoding capability without already knowing the provider name.

## Agent fallbacks without WebMCP

### Required baseline

The normal DOM/accessibility tree must remain sufficient to discover and operate every supported API.

### Machine-readable catalog

The build emits `/api-catalog.json` from the same `apiCatalog` registry used by the UI and WebMCP. It is never hand-maintained. The document head advertises it with an `application/json` alternate link, and Agent Tools exposes an ordinary accessible link so agents without WebMCP can discover it from the page. The development server serves the same generated representation.

The versioned artifact exposes bounded, stable facts that exist in the SSOT: ID, name, provider, category, description, documentation URL, HTTP method, key requirement, deterministic Request Lab URL, parameter schema/options, provider usage notes, and `agentExecution`. It deliberately omits executable request-builder functions and current-health claims. Until durable health telemetry exists, the artifact reports `health: "not-included"` rather than turning a build snapshot into fake live verification.

### Deterministic Request Lab deep links

Request Lab uses stable per-API routing in the form `#/request-lab?api=<api-id>`, generated from the same catalog ID contract. Direct navigation selects the requested API and default parameters, and WebMCP discovery exposes the same canonical URL. Invalid API IDs fail closed to a valid canonical selection instead of creating an ambiguous UI state.

### Optional discovery helper

A future `llms.txt` may advertise the machine catalog, Request Lab, WebMCP support, and usage instructions. It is optional discovery metadata, not the primary contract.

## Machine-readable health and errors

Error states should distinguish provider unavailable, 429/rate limit, browser CORS rejection, timeout, invalid response/parser drift, and validation failure. An HTTP-success status is not sufficient evidence of a valid API result: APIs whose contract is JSON must fail closed as `invalid-response` when the body cannot be parsed as JSON, while intentionally non-JSON APIs must opt into an explicit response parser. HTTP error classification happens before custom parsing so a provider 429/5xx response cannot be masked by parser behavior.

Future health metadata may expose `healthy`, `degraded`, and `down`, plus bounded facts such as last check and consecutive failures. A single transient error must not immediately redefine a provider as permanently broken. Until that evidence exists in the SSOT, the product must not synthesize per-API review timestamps or present static catalog metadata as current live verification.

## Quality objective

```text
Maximize:
  Reliability
  x Data usefulness
  x UX quality
  x Agent usability
  x Maintainability

Minimize:
  Broken APIs
  Generic rendering
  Duplicate capabilities
  Bundle/runtime cost
  Architecture complexity
  Manual maintenance
```

This objective is intentionally not `maximize API count`.

## Maturity roadmap

1. **Production integrity** — browser E2E health, no stale contracts, no generic fallback.
2. **Semantic API experience** — intentional SSOT cards and useful loading/empty/error states.
3. **Modular architecture** — reduce monolithic registry/preview cost while preserving contracts.
4. **Performance and quality** — code splitting, cancellation/timeouts, accessibility, mobile/responsive quality, visual regression.
5. **PWA and i18n** — installable app shell, theme, mobile-first behavior, internationalization.
6. **AI-agent native capability layer** — capability search, machine metadata, deep links, agent-readable results, richer WebMCP.
7. **Curated expansion** — add APIs only to fill meaningful capability gaps and pass admission rules.

## Build mode vs maintenance mode

The project does not recursively modify itself forever.

- **Build mode**: use while material maturity gaps remain; prioritize the largest gap to the North Star.
- **Maintenance mode**: once mature, focus on monitoring, drift detection, regression repair, and occasional high-value improvements.

The system must be allowed to decide that there is no worthwhile code change in a cycle.

> No meaningful improvement is better than optimization theatre.
