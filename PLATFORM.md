# Reactory — Platform Description

> **Status of this document.** Every capability claim below was verified against source in the
> `reactory-*` repositories on 2026-07-27. Claims that could not be verified are marked
> **[unverified]**. Work-in-progress is marked **[WIP]**. Where existing marketing material
> overstates the codebase, the discrepancy is called out explicitly in
> [§11 Maturity ledger](#11-maturity-ledger). This is intended as the source of truth that
> marketing, README and pitch material derive from — not the other way round.

---

## 1. Executive summary

**Reactory is a full-stack application platform for building multi-tenant, enterprise-grade
business software — where the application itself is data, not code.**

A Reactory application is described by declarative artifacts held on the server: JSON Schema form
definitions, YAML workflows, YAML AI persona definitions, tenant configuration documents, and
fully-qualified component names. The server assembles these per tenant, per user and per role, and
the client renders whatever it is handed. Adding a screen, a business process, an integration or an
AI agent is a matter of adding a definition — not rebuilding and redeploying a frontend.

Around that core, Reactory ships the things every enterprise application needs and nobody wants to
build again: multi-tenancy, four-dimensional RBAC, nine authentication strategies including Azure AD
and Okta, a GraphQL API, a durable workflow engine with saga compensation, an integration layer
spanning REST/GraphQL/gRPC/five database engines/queues, OpenTelemetry instrumentation, and delivery
to web, desktop and (nascent) mobile from one definition set.

**Who it is for.** Small engineering teams who need to ship software with enterprise
characteristics — tenancy, audit, RBAC, SSO, observability, durable processes — without an
enterprise-sized team or an enterprise-sized licence bill.

**What makes it different.** Three things, in combination:

1. **Server-driven, schema-defined UI.** Routes, menus, themes, forms and plugins all arrive from a
   single `apiStatus` GraphQL query at boot. Change a user's role and their application changes.
2. **A single naming convention across every layer.** `nameSpace.Name@version` identifies forms,
   components, widgets, services, workflows, personas, plugins and AI tools alike. One resolution
   model, one extension model.
3. **Agency as a first-class layer, not a bolt-on.** AI personas are contributed by modules the same
   way services and forms are; every platform capability is automatically an AI tool *and* an MCP
   tool; and an agent conversation is a durable, resumable step inside a workflow.

**At a glance**

| | |
|---|---|
| **Runtime** | Node.js 20.19.4, TypeScript, Yarn 4 |
| **API** | Apollo Server 4 GraphQL at `/graph`; REST and gRPC secondary |
| **Data** | MongoDB (primary, Mongoose 7) · PostgreSQL (TypeORM) · MySQL · MSSQL · Databricks · Redis · MeiliSearch |
| **Web client** | React 17, MUI 6, Apollo Client 3, Webpack 5, PWA/Workbox |
| **Desktop** | Electron 33 — embeds MongoDB, the Express server and the web client in one installable app |
| **Mobile** | React Native 0.81 — **SDK layer only, ~15% complete [WIP]** |
| **Workflow** | Hardened fork of `workflow-es` v2.5.0 + a YAML flow compiler, 35 step types |
| **Agentic** | 10 AI providers registered / 5 with native adapters; MCP client *and* server; persona + macro + skill registries |
| **Modules on disk** | 14 (see [§5](#5-the-module-system)) |
| **Licence** | MIT on the platform repositories; a commercial module tier is declared — see [§10](#10-the-open-source-position) |

---

## 2. What the platform is made of

Reactory is a multi-repository workspace, described by `reactory.code-workspace` at the root.

| Repository | Role | Maturity |
|---|---|---|
| `reactory-core` | The shared type contract. ~26,700 lines of ambient TypeScript declarations under a single global `Reactory` namespace, plus a handful of enums. Every other repo compiles against it. | Stable |
| `reactory-express-server` | The platform. Express + Apollo, tenancy, auth, service registry, module loader, workflow engine, CDN, CLI. | Production |
| `reactory-pwa-client` | The web client. Form engine, component registry, plugin loader, theming. | Production, mid-migration |
| `reactory-electron` | Desktop packaging. Embeds MongoDB + server + client. | Coherent, complete-looking |
| `reactory-speech-service` | Referenced in the workspace file; **not present on disk**. | Absent |
| `reactory-native` | React Native client. | **Scaffolding [WIP]** |
| `reactory-workflow-es` | Durable workflow/saga engine — a hardened fork of `danielgerlag/workflow-es`. | Production, exceptionally well-governed |
| `reactory-data` | Runtime data root (`$REACTORY_DATA`): themes, fonts, i18n, email templates, YAML workflow catalog, YAML form overlays, AI personas, and the JIT plugin compilation workspace. | Live production data |
| `reactory-docs` | Documentation. | Accurate but behind the product |
| `reactor-system-navigator` | 3D WebGL system-landscape visualiser. Mock data only. | **Prototype** |

`reactory-core` deserves a note: it is almost entirely a type library (`src/types/index.d.ts` alone
is 14,051 lines) exported as a single ambient namespace. This is why a form definition written on
the server type-checks identically in the web client, the Electron shell and the native SDK. It is
the mechanism behind "shared types across platforms".

---

## 3. The core idea: applications as data

### 3.1 One naming convention

`nameSpace.Name@version` — the FQN — is the universal identity. It names forms
(`reactor.AgentGitCommitInputForm@1.0.0`), UI components (`core.ApplicationCard@1.0.0`), services
(`core.RedisService@1.0.0`), workflows (`core.CleanCacheWorkflow@1.0.0`), plugins, AI personas and
even roles.

*Evidence:* `reactory-core/src/types/index.d.ts:82` (`FQN = string`);
`reactory-pwa-client/src/api/ReactoryApi.tsx:1592` (`registerComponent`);
`reactory-express-server/src/application/decorators/service.ts`.

> **Caveat:** version pinning is parsed but not enforced on the client. `resolveFqn` logs
> `ignoring @version suffix … (version pinning not yet enforced)`. Treat the `@version` segment as
> documentation today, not as a resolution constraint. **[WIP]**

### 3.2 The server drives the client

At boot the web client issues one query — `apiStatus` — with composable scopes:

```
'application' | 'loggedIn' | 'theme' | 'server' | 'colorSchemes'
| 'routes' | 'menus' | 'messages' | 'navigationComponents' | 'plugins'
```

The response carries the router table (`{ path, public, roles, componentFqn, exact, redirect,
componentProps }`), the menu tree, the active MUI theme as a raw options blob, notification
messages, and the list of client plugins to inject. The client rebuilds its route table on `onLogin`,
`onLogout`, `onPluginLoaded` and `onApiStatusUpdate`.

*Evidence:* `reactory-pwa-client/src/api/graphql/graph/queries/ApiStatus/index.ts`;
`reactory-pwa-client/src/app/router/ReactoryRouter.tsx`; `reactory-pwa-client/src/App.tsx:357`.

The practical consequence: **role changes, menu changes, theme changes and new screens propagate
without a client deployment.** The web client's own README is blunt about the coupling — it "cannot
be used in isolation without the server". That is a deliberate architectural choice, and it is the
thing that makes everything else in this document possible.

### 3.3 Forms are the unit of interface

A form is a JSON Schema (`schema`) plus an rjsf-style `uiSchema`, plus Reactory extensions for
layout (`ui:field: GridLayout | TabbedLayout | AccordionLayout`, `ui:grid-layout`, `ui:form`), plus a
`graphql` block binding it to queries and mutations, plus optional `widgetMap`/`fieldMap` overrides,
exports, PDF reports and a workflow trigger.

```yaml
id: reactor.AgentGitCommitInputForm@1.0.0
uiFramework: material
schema:  { type: object, properties: { workdir: {...}, personaId: {...} } }
uiSchema:
  ui:form:  { showSubmit: true, componentType: div }
  ui:field: GridLayout
  ui:grid-layout:
    - workdir: { md: 12 }
      provider: { xl: 6, lg: 6, md: 6, sm: 12 }
  workdir: { ui:widget: TextWidget }
```

Crucially, **every form auto-registers as a component** under its own FQN unless it opts out. A form
can therefore be embedded inside another form, mounted as a route target, or rendered by an AI agent
into a chat panel — all through the same registry lookup.

*Evidence:* `reactory-data/forms/reactor.AgentGitCommitInputForm@1.0.0.yaml`;
`reactory-pwa-client/src/api/ReactoryApi.tsx:1257-1292`;
`reactory-core/src/types/forms/index.d.ts:1242` (`IReactoryForm`).

Forms are persisted two ways: as TypeScript in a module, and as **YAML overlays** in
`$REACTORY_DATA/forms/` that are deep-merged over the code definition. That is what allows a form to
be edited at runtime — by a person in the form editor, or by an agent — without touching a repo.

---

## 4. Multi-tenancy, identity and access

### 4.1 Tenancy

A tenant is a **`ReactoryClient`** (referred to in code as the *partner*). Every request resolves one,
and `context.partner` is threaded through every service, resolver and workflow step.

Resolution precedence (`src/express/middleware/ReactoryClient.ts`, ordinal `-70`): `x-client-key` /
`x-client-pwd` headers → query params → session → OAuth state. The client secret is validated with
PBKDF2; failure returns 401.

A tenant document carries: `key`, credentials, `siteUrl`, email transport, `applicationRoles`,
`menus`, `routes[]`, `auth_config[]` (which SSO providers this tenant enables), `themes`,
`settings[]`, `whitelist` (CORS), `plugins[]`, `featureFlags[]`. Tenant configs are authored as
TypeScript and/or YAML under `src/data/clientConfigs/<tenant>/` — with `${ENV_VAR:default}`
interpolation — and upserted into MongoDB at startup. Four tenants are configured in this workspace:
`reactory`, `zepz-quotes`, `reactor`, `booktutor`.

Isolation is **shared-schema with a tenant discriminator**, not database-per-tenant. Cache keys are
partner-scoped (`partner:<id>:context:<key>`). Database connections are resolved *from tenant
settings* (`context.partner.getSetting(connectionId)`), so a tenant can point at its own Postgres or
MSSQL instance. Query-level scoping is the responsibility of each service.

`context` provides `forPartner()`, `forUser()`, `runAs()` and `runAsSystem()` for controlled
cross-tenant and elevated execution.

### 4.2 Authentication

Nine strategies ship, and modules can contribute more (or replace a built-in by name):

`anon` · `local` · `jwt` · `google` · `facebook` · `github` · `linkedin` · `microsoft` (Azure AD,
OIDC) · `okta` (OIDC)

*Evidence:* `src/authentication/strategies/index.ts`; `src/authentication/configure.ts`.
Providers can be disabled per-deployment via `REACTORY_DISABLED_AUTH_PROVIDERS`; enabled per-tenant
via `auth_config`.

JWT bearer tokens with server-side session revocation checked against `core.SecurityService@1.0.0`
(Redis-backed, MongoDB fallback). Auth attempts emit telemetry and an internal `user.authenticated`
event.

> **Gap:** there is **no SAML support**. Enterprise SSO is OIDC-only. If SAML is a procurement
> requirement in your target market, this is a known build.

### 4.3 Authorisation

Reactory's RBAC is **four-dimensional**: a user holds *memberships*, each scoped to a
`clientId` (tenant) × `organizationId` × `businessUnitId`, each carrying a `roles[]` array.

```ts
memberships: [{ clientId, organizationId, businessUnitId, enabled,
                authProvider, providerId, roles: [String], ... }]
```

This means "Finance Approver at Acme, EMEA division, Payments unit" is expressible natively rather
than encoded into role-name strings.

Enforcement happens at four layers: `context.hasRole()/hasAnyRole()`; a `@roles([...])` method
decorator supporting templated role expressions; a GraphQL `@auth(roles:)` schema directive; and
component-level role filtering in the client registry (unauthorised components resolve to
`core.NotAllowed@1.0.0` rather than failing).

*Evidence:* `src/modules/reactory-core/models/User.ts`;
`src/authentication/decorators.ts`; `src/modules/reactory-core/graph/directives/AuthDirective.ts`;
`reactory-pwa-client/src/api/ReactoryApi.tsx` (`getComponents`).

---

## 5. The module system

**A module is the unit of capability.** It is a plain object implementing
`Reactory.Server.IReactoryModule`, and it can contribute across seventeen extension points in one
declaration:

```ts
{
  nameSpace, name, version, dependencies?, priority,
  graphDefinitions?,   // GraphQL SDL + resolvers + directives
  workflows?,          // code workflows
  workflowSteps?,      // new YAML step types
  forms?,              // form definitions
  pdfs?,               // PDF report components
  services?,           // FQN-registered services
  grpc?,               // proto files + service impls
  routes?,             // express Routers
  models?,             // mongoose / TypeORM models
  clientPlugins?,      // UMD bundles for the web client
  translations?,       // i18n
  passportProviders?,  // auth strategies
  cli?,                // CLI commands
  middleware?,         // express middleware with ordinals
  reactor?,            // AI providers, agents, macros, tools, skills, MCP
}
```

*Evidence:* `reactory-core/src/types/index.d.ts:11448`;
`reactory-express-server/src/modules/reactory-core/index.ts` (canonical example).

Modules are declared in `src/modules/available.json` and activated in `enabled-reactory.json`; a
`__index.ts` barrel is code-generated at startup. Each aggregation point iterates
`modules.enabled` — GraphQL types, resolvers, directives, middleware (ordinal-sorted), routes,
passport providers, CLI commands, workflow steps, gRPC services and services all compose this way.

### Modules present in this workspace (14)

| Module | Purpose |
|---|---|
| `reactory-core` | Users, orgs, business units, teams, files, forms, templates, email, SQL/search/cache services, the workflow engine, core schema and resolvers, CLI, migrations, feature flags |
| `reactory-reactor` | The agentic layer — providers, personas, macros/tools, skills, MCP client+server, agent workflow steps |
| `reactory-telemetry` | OpenTelemetry / Prometheus instrumentation and a telemetry query API |
| `reactory-queue` | Queue abstraction over BullMQ/Redis, AWS SQS, or in-memory |
| `reactory-communicator` | Multi-channel messaging orchestration — providers, templates, webhooks, health monitoring |
| `reactory-kb` | Knowledge base for humans *and* agents, with visibility control and full-text search |
| `reactory-kyc` | Identity verification and compliance workflows — **self-reported 61.8% complete [WIP]** |
| `reactory-google` | Google Workspace — Gmail, Calendar, Drive, Docs, Sheets, Contacts, Tasks, PubSub webhooks |
| `reactory-slack` | Slack messages, channels, threads, reactions |
| `reactory-azure` | Azure/Microsoft services and blob storage — **self-described "Example Only"** |
| `reactory-socialeyes` | Social listening across X, Reddit, Facebook, Instagram |
| `reactory-classroom` | LMS — courses, assignments, progress |
| `reactory-pdf-manager` | PDF generation, extraction and manipulation |
| `reactory-zepz-quotes` | **Customer-specific — not part of the standard distribution.** Wraps a third-party gRPC pricing API as Reactory services. Valuable internally as the reference pattern for packaging a vendor API as a module; excluded from public-facing material |

> **Accuracy note:** current marketing material claims "40+ modules". Fourteen exist on disk and in
> `available.json`. `AGENT.md` in the server repo also lists ~16 modules that are not present. Use
> **14** in any external material until the others land.

### Service registry

Services are declared either by a static `reactory` property or a `@service({...})` decorator, and
resolved through `context.getService<T>(fqn)`. Three lifecycles: `instance` (default), `request`
(cached on the request context), `singleton`. Dependencies are declared by FQN and injected by
setter convention — `dependencies: ['core.RedisService@1.0.0']` calls `setRedisService(instance)`.
Every resolved service is automatically decorated with a namespaced logger and a telemetry handle.

*Evidence:* `src/services/ServiceManager.ts`; `src/application/decorators/service.ts`;
`src/modules/reactory-core/services/RedisService.ts`.

Companion decorators: `@inject`, `@cached`, `@audit`, `@rateLimit`, `@traced`, `@counter`, `@gauge`,
`@histogram`, `@metric` — each with its own tests. This is the "cross-cutting concerns are already
solved" part of the value proposition, and it is real.

---

## 6. The workflow engine

Reactory's durable process layer is **`reactory-workflow-es` v2.5.0**, a hardened fork of
`danielgerlag/workflow-es` (upstream abandoned in 2019 at v2.3.5). It is the most rigorously
engineered component in the platform.

**Engine capabilities.** Workflows are defined as code or data, persisted, and **resumed across
process restarts**. Steps can sleep, wait for external events, branch, run in parallel, and
**compensate** (saga pattern). Error handling policies: Retry / Suspend / Terminate / Compensate.

**Pluggable providers.** Persistence: SQLite (embedded, for Electron), PostgreSQL, MongoDB, in-memory.
Queue and distributed lock: Redis (reliable queue + Redlock), Azure Service Bus, single-node.
OpenTelemetry is an *optional adapter* — the core has zero OTel dependency.

**Enterprise hardening.** The fork's `docs/upgrade-plan.md` tracks 18 hardening items, all marked
done and verified in CI: distributed lock and reliable queue, optimistic concurrency tokens, graceful
drain, bounded concurrency, dead-letter with max retries, at-rest encryption hook (`useDataCodec()`),
`host.health()`, structured logging with correlation IDs, provider index requirements, version
safety, and **`tenantId` scoping on `startWorkflow` and `publishEvent`**. 26 Jasmine scenario specs
cover saga compensation, two-host fanout, lock-release races, poll-worker leases, multi-tenancy and
persistence conformance, with provider suites running against ephemeral containers in CI.

The engine **fails loud at `start()`** if it detects single-node lock/queue providers paired with
durable persistence — it will not silently run an unsafe topology.

### YAML workflows

Above the engine sits **YamlFlow** (`src/modules/reactory-core/workflow/YamlFlow/`), which compiles
declarative YAML into engine classes:

```
condition   → .if(cond).do(then) [+ .if(!cond).do(else)]
for_each    → .foreach(items).do(body)
while       → .while(cond).do(body)
parallel    → .parallel().do(branch)...join()
saga        → .saga(body).compensateWithSequence(compensate)
wait_event  → .waitFor(eventName, eventKey, effectiveDate?)
```

**35 step types ship out of the box**, auto-registered from
`YamlFlow/steps/registry/YamlStepRegistry.ts`:

`Start · End · Log · Delay · Condition · ForEach · While · Parallel · Join · Task · Custom ·
SetVariable · Validation · DataTransformation · ApiCall · GraphQL · GraphQLQuery · GraphQLMutation ·
GRPC · Sql · MongoQuery · MongoWrite · MySql · PostgresSQL · MSSQL · Search · ServiceInvoke ·
InvokeWorkflow · CliCommand · FileOperation · Email · Telemetry · Todo · UserActivity · UserLookup`

Plus module-contributed steps — `reactory-reactor` adds `agent_conversation`.

**Modules can extend the workflow vocabulary**, which is the key extensibility property: a new
integration becomes a new step type available to every workflow author.

### Authoring and operations

Workflows live in `$REACTORY_DATA/workflows/catalog/<namespace>/<Name>/<version>/`, each with a
definition YAML and a **separate `.design.yaml` holding visual designer state** — canvas zoom/pan,
node positions, named input/output ports, and typed port-to-port connections. A graphical workflow
designer persists to disk alongside the definition. Twelve runtime management components are
compiled into the web client (`WorkflowManager`, `WorkflowLaunch`, `WorkflowInstanceInspector`,
`WorkflowYamlView`, `WorkflowSchedule`, `WorkflowErrors`, …).

Scheduling is cron-based (`node-cron` + `cron-parser`) with hot-reload via filesystem watch and a
distributed scheduler lock. `reactory-examples/` in the catalog is effectively a live feature
matrix — 24 runnable sample workflows.

---

## 7. The agentic layer

Reactory treats agency as an extension surface with the same shape as every other one. Five layers,
each declarative:

**1 — Providers.** A single 1,801-line registry (`ai/providers/providers.yaml`) declares ten
vendors: OpenAI, Anthropic, Google, AWS Bedrock, Azure OpenAI, xAI, Cohere, DeepSeek, GitHub Copilot,
and **Ollama for fully local inference**. Per-model metadata includes context length, rate limits,
per-token cost, streaming support, media types, and capability-negotiation blocks for sampling and
extended thinking. Users override or extend via `~/.reactor/providers.yaml`.
*Five have native SDK adapters* (OpenAI, Anthropic, Google, Bedrock, Ollama); the remainder route
through the OpenAI-compatible path **[unverified]**.

**2 — Personas.** An agent is a YAML file: model, provider, a Markdown system prompt, feature flags,
named canned prompts, role capabilities, and — critically — `tools.includes[]`, a named subset of
the platform's tool registry that this persona is permitted to use. **Any module can ship personas**
(`reactory-slack` ships `slackbot`, `reactory-zepz-quotes` ships `pricingpete` and `platformpaul`),
and users can author their own in `~/.reactor/ai/persona/`. Roughly a dozen ship today: `cmd`,
`gitguardian`, `qualityquinn`, `ceoclive`, `formidable`, `support`, `workflowwill`, `reactor`,
`booktutor`, and others.

**3 — Tools ("macros").** A macro is a function plus an OpenAI function-calling JSON schema plus a
role list. The registry spans filesystem, shell, HTTP, GraphQL, five database engines, workflow
control, code review, browser automation via Playwright, application/tenant administration, project
management, and inter-agent messaging. Access is role-gated *and* persona-gated.

The same registry serves three consumers simultaneously: LLM function-calling, an `@macro(arg)` text
DSL, and — **automatically** — the MCP `tools/list` response served to external clients. Adding a
capability to Reactory makes it available to Reactory's own agents *and* to Claude Desktop, Cursor,
or any other MCP client, in one step.

Tool execution is governed by an explicit approval model: `auto` · `safe_auto` · `prompt` · `plan`
(read-only), surfaced end-to-end through GraphQL mutations and client banners, with interruption and
iteration limits.

**4 — Skills.** Markdown procedural guides the agent *discovers on demand* via `searchSkills` /
`readSkill`, rather than carrying in its system prompt. Progressive disclosure by design. Modules
contribute skills through `reactor.skills[]`.

**5 — Orchestration.** `agent_conversation` is a YAML workflow step. An agent turn becomes durable,
resumable and idempotent-on-retry (via `sessionId`), can be fed tool results from the workflow, and
can produce structured output consumed by downstream steps. Conversely, agents drive workflows
through the `workflow` macro family — authoring, validating, executing and inspecting them.

**MCP in both directions.** Reactory is an MCP **server** (SSE + JSON-RPC at `/reactor-mcp/sse`,
JWT-authenticated, sessioned), an MCP **client** (HTTP and gated stdio transports, with OAuth
including DCR and PKCE **[WIP — implemented and unit-tested, not yet E2E-validated]**), and an MCP
**connector registry** with an installation flow.

**The bridge to the platform.** There is no special AI subsystem boundary: every macro receives the
full `IReactoryContext`. Agents therefore call registered services (`@svc(list)` / `@svc(get, …)`),
run the platform's own GraphQL API, query tenant databases, and — through client-side macros —
**render live Reactory forms and any registered component into the chat panel**. That last capability
is the sharpest expression of "generative UI" in the codebase: the agent composes an interface out of
the platform's own registered building blocks.

*Evidence:* `src/modules/reactory-reactor/` throughout;
`ai/providers/providers.yaml`; `ai/macro/index.ts`; `ai/skills/index.ts`;
`workflow/steps/AgentConversationStep.ts`; `middleware/mcp/`;
`reactory-pwa-client/src/components/shared/ReactorChat/hooks/macros/form.macro.tsx`.

> **Honest read on maturity.** The conversation engine (`ReactorConversationService.ts`, ~6,500
> lines), the Redis-backed streaming stack, the provider adapters and both MCP directions are
> substantial and tested. The *wiring* lags the *building*: eight of ten authored skills are not
> registered in the catalog, two of three agentic workflows are not in the load array, the
> server-side form-generation macro is written but unreachable, and several declared files are empty
> stubs. See [§11](#11-maturity-ledger).

---

## 8. Integration engine — building anything

Reactory's integration story has three tiers.

**Tier 1 — Call anything, from anywhere.** A workflow step, a service, or an AI agent can reach:

| Protocol / target | Mechanism |
|---|---|
| REST / HTTP | `core.FetchService@1.0.0` with pluggable auth and header providers; `ApiCall` workflow step; `fetch`/`get`/`post`/… macros |
| GraphQL (internal + external) | `GraphQLQuery` / `GraphQLMutation` steps; `queryGQL` / `mutationGQL` / `schemaGQL` macros; server-side proxy calls on behalf of the user |
| gRPC | `GRPC` step; module-declared protos; Reactory also *serves* gRPC (`GRPC_ENABLED`) |
| MongoDB / PostgreSQL / MySQL / MSSQL / Databricks | Per-tenant connection factory driven by `partner.getSetting(connectionId)`; dedicated workflow steps and macros for each |
| Search | MeiliSearch behind a provider facade (`REACTORY_SEARCH_PROVIDER`) |
| Queues | BullMQ/Redis, AWS SQS, or in-memory behind one `QueueProvider` interface |
| Files | Local, Azure Blob, Azure File Share; CDN with tenant-scoped paths |
| Browser | Playwright session macros — open, navigate, click, type, evaluate, screenshot, PDF |
| MCP | Any MCP server, HTTP or stdio, with OAuth |
| In-process events | `postal` bus with typed channels (`reactory.core`, `workflow`, `file`, `reactory.plugins`, …) |

> **Gap:** there is **no SOAP client**. Legacy SOAP integrations require a build or a gateway.

**Tier 2 — Shape the data declaratively.** `ObjectMap` / `objectMapper` is used pervasively — on
form GraphQL bindings (both directions), on workflow step inputs and outputs, and on component
props. Payload reshaping between a third-party API and a Reactory form is configuration, not code.
Workflow config supports `${input.x}`, `${steps.<id>.outputs.y}` interpolation with Liquid-style
filters.

**Tier 3 — Package it as a module.** Once an integration is worth keeping, it becomes a module: its
services register by FQN, its workflow steps join the shared vocabulary, its forms become screens,
its personas become agents, its resolvers extend the graph. `reactory-zepz-quotes` is the reference
implementation of exactly this path — a third-party gRPC pricing API surfaced as Reactory services,
workflow steps, GraphQL fields, agent tools and 14 compiled UI components. Note it is a
customer-specific module rather than part of the standard distribution, so cite it internally as the
pattern to copy, but use `reactory-azure` (published as a deliberate worked example) in any
public-facing material.

**Code generators** shorten the first mile: `src/modules/reactory-core/services/generators/` produces
Reactory scaffolding from existing MongoDB, MySQL, PostgreSQL and SQL Server schemas, and there are
`schema-gen`, `service-gen` and module-scaffold CLI commands.

### 8.1 Data movement — scope and limits

The workflow engine has database connectors, transformation steps and durable execution, so it
covers a real class of data-movement work. It is **not** an ETL engine in the sense a data engineer
means, and should not be positioned against dbt, Airflow, Talend or Fivetran. The honest framing:

> A durable, resumable orchestration engine with first-class connectors for MongoDB, PostgreSQL,
> MySQL, MSSQL, HTTP, GraphQL and gRPC — suited to transactional, business-process-adjacent data
> movement at moderate volumes, with saga compensation for rollback and agent steps for LLM-based
> enrichment.

**What is genuinely strong, and rare at this price point:**

- **Durability and resumability.** A pipeline survives process restart and resumes mid-flight.
- **Saga compensation.** Declarative rollback of a partially-completed data operation.
- **Per-tenant connection resolution.** The same flow runs against each customer's own database,
  resolved from `partner.getSetting(connectionId)`.
- **LLM enrichment as a durable step.** `agent_conversation` makes classification, extraction and
  enrichment a retryable part of the pipeline rather than an external service call.
- **An extensible step vocabulary.** A module adds a step type once and every flow author gets it.

**Where it breaks, and why the volume ceiling is real:**

| Limit | Detail |
|---|---|
| **Volume ceiling is thousands, not millions** | `Foreach` fans out the entire collection at once, creating one persisted `ExecutionPointer` per item per body step, each carrying a copy of the row. On MongoDB those pointers are embedded in the workflow document, so the 16 MB BSON limit is a hard cap. On PostgreSQL every executor pass does a full delete-and-reinsert of all pointers. |
| **Multi-step foreach bodies are not iteration-safe** | Mappers cannot see the pointer's `contextItem`, so per-iteration data leaks between rows. Tracked as **P0.6** in `reactory-workflow-es/docs/specs/p0.6-foreach-scope-isolation.md`. Until it lands, keep foreach bodies to a single step. |
| **`maxConcurrency` and `indexVariable` are ignored** | Declared in the YAML schema and used in existing workflows, but silently dropped by `YamlFlowBuilder`. |
| **No streaming extraction** | Query steps call `cursor.toArray()` / `pool.query()` — full result sets in memory, then persisted into the workflow instance. Pagination is manual `limit`/`skip`. |
| **No incremental-load primitive** | No CDC, watermark or checkpoint support, and `SetVariable` is instance-scoped, so there is no cross-run state. Watermarking must be built on Redis or a Mongo collection. |
| **No bulk upsert** | MongoDB `insertMany` and single-document `upsert` exist; there is no `bulkWrite`, and SQL steps are single-statement with no transaction control across steps. |
| **Row-level errors are not isolated** | `continueOnError` works per iteration, but the error record is keyed by step id and does not capture which row failed. There is no reject-rows sink and no error threshold. |
| **Validation can fail open** | The `Validation` step implements a hand-rolled JSON Schema subset (Ajv is a dependency but unused). An array-shaped `rules` config passes without validating anything, silently. |
| **No data lineage** | No column- or dataset-level lineage. Workflow-level observability is strong (OTel spans, duration/error/retry metrics, per-instance logs); data-level observability — freshness, volume anomaly, schema drift — does not exist. |

**The `services/ETL/` subsystem is separate and narrower than its name suggests.** It is registered
and GraphQL-exposed, but the module's own README marks it *experimental*, all five processors are
hardcoded to user and demographics import, the CSV reader splits on a delimiter with no RFC-4180
quoted-field handling, `UserImportFileValidation.ts:51` calls `path.join()` with no arguments and
throws on invocation, and nothing in the codebase invokes it from a workflow. Treat it as a
user-import feature, not a general file-ingestion pipeline.

---

## 9. The development lifecycle

### 9.1 Greenfield — day 0 to first screen

What you do **not** build: tenancy, user/org/business-unit/team models, RBAC, SSO, sessions, JWT
handling, file upload and CDN, email templating and dispatch, i18n, theming, audit, rate limiting,
caching, search, telemetry, PDF generation, Excel export, a job scheduler, or a workflow runtime.

The greenfield path:

1. **Define the tenant.** A config document under `src/data/clientConfigs/<tenant>/` — key, roles,
   auth providers, theme, menus, whitelist, feature flags. Upserted to MongoDB at startup.
2. **Scaffold the module.** Via CLI, the `createModuleStructure` macro, or by hand — a directory with
   an `index.ts` implementing `IReactoryModule`.
3. **Model the domain.** Mongoose or TypeORM models registered through `module.models`, or point at
   an existing database through a tenant connection setting and use the SQL/Mongo workflow steps and
   generators.
4. **Expose it.** GraphQL SDL + resolvers in `module.graphDefinitions` — or skip this and drive
   everything from the generic data steps and services.
5. **Build the interface.** Form definitions — JSON Schema + uiSchema — from 46 shipped widgets. Each
   auto-registers as a component and becomes routable.
6. **Wire the process.** A YAML workflow, using the 35 built-in step types.
7. **Ship it.** Per-tenant Docker images, Terraform targets for AWS, DigitalOcean, Linode and
   minikube, Helm/cert-manager ingress, Istio manifests, and PM2/systemd for VM deployment.

The published cost claim from the docs — *"a small 2GB $80/month VM should suffice for up to 100
concurrent users"* — is the author's own figure and is **[unverified]** by benchmark in this
workspace. Treat it as a design target rather than a measured result.

### 9.2 Ongoing development — day 2 and beyond

This is where the architecture pays its rent.

**Runtime change without redeployment.** Forms are edited as YAML overlays deep-merged over the code
definition, saved to `$REACTORY_DATA/forms/`. Routes, menus, themes and role assignments live in the
tenant document. Workflow YAML is hot-reloaded, and schedules are watched on disk.

**JIT compilation of UI.** `$REACTORY_PLUGINS/__runtime__/` holds a source `entry.tsx` per component
plus a `.reactory-checksum`. When source changes, the server regenerates a rollup config and rebuilds
the UMD bundle; the client's plugin loader injects it as a script with a version-stamped cache
window. **62 components are currently compiled this way** — including the entire workflow management
UI, tenant administration panels, and the Zepz domain components. Bundles borrow React, MUI and the
router from the host through the component registry rather than shipping their own copies.

This is the concrete implementation of "the server delivers a rich client interface dynamically at
runtime, with auto-recompilation when source modules change."

**Governance of change.** Per-module MongoDB migrations (`migrate-mongo`, changelog collection per
module), a TypeORM migration path, an `@audit` decorator, feature flags with role-scoped
`{viewer, editor, admin}` permissions, and an effective-feature-flag GraphQL query the client reads
at runtime — which is exactly how the new form engine is being rolled out.

**Agent-assisted maintenance.** The workspace is heavily agent-driven and the repos show it: personas
like `gitguardian` (commit review), `qualityquinn` (QA) and `workflowwill` (workflow authoring); a
`CodeReview` macro family with per-framework presets; and `reactory-workflow-es/UPGRADES.md`
documenting a spec-first AI-delegation methodology with tasks tagged by agent and a self-critical
verification pass that found *"of the 23 findings, 12 are valid … 8 are false positives"*. That
verification discipline is worth highlighting as a practice, not just an artifact.

---

## 10. The open-source position

**Be precise here — the current state is inconsistent and will be challenged.**

**What is verified:**

- `reactory-core`, `reactory-express-server`, `reactory-pwa-client` and `reactory-docs` each carry
  an **MIT `LICENSE` file** (© 2024 Werner Weber).
- `reactory-workflow-es` carries an MIT `LICENSE` retaining the upstream copyright
  (© 2016 Daniel Gerlag) — correct for a fork, and worth preserving.
- `reactory-electron` declares MIT in `package.json` but **has no `LICENSE` file**.
- No proprietary runtime dependency gates the platform. Local development requires no paid service:
  MongoDB, Redis, MeiliSearch and Ollama all run locally, and the Electron build embeds MongoDB.

**What is inconsistent and needs resolving before any public launch:**

| Issue | Detail |
|---|---|
| `package.json` contradicts `LICENSE` | `reactory-core` and `reactory-pwa-client` declare `"licenses": [{ "license": "Apache-2.0" }]` while their LICENSE files say MIT. Both also use the **deprecated array form**, which npm ignores — so published packages show no SPDX licence at all. |
| Server and client are `"private": true` | Which conflicts with an open-source distribution story. |
| Module tier is commercial | `src/modules/available.json` marks 10 of 14 modules `commercial`, 2 `private`, and only `reactory-core` + `reactory-pdf-manager` as `Apache-2.0`. Each carries a `shop: https://reactory.net/shop/modules/<key>` URL. |
| Stale repository metadata | The server's `package.json` still points at a Bitbucket URL; origin is GitHub. |

**The honest positioning** is therefore *open-core*, not *open source* in the unqualified sense:

> An MIT-licensed platform — server, client, core types, desktop shell and workflow engine — with a
> commercially-licensed module marketplace layered on top. Everything needed to build and run a
> complete application is open; specific domain and vendor integrations are sold.

This is a defensible and well-understood model (GitLab, Sentry, Grafana). But it must be stated
deliberately rather than emerging from a contradiction between a LICENSE file and a `package.json`.
**Recommended action before publishing:** pick one SPDX identifier per repository, fix the
`package.json` `license` field to the standard string form, remove `private: true` from anything
intended to be distributed, and state the open-core boundary explicitly in the root README.

The manifesto (`reactory-docs/manifesto/MANIFESTO.md`) already frames the *why* better than any
marketing copy in the workspace, and its framing survives contact with the code:

> "To run a business at scale, you are currently forced to choose between two evils: the Closed
> Garden — extortionate monthly fees for bloated, rigid software where you own nothing … or the DIY
> Grind — building from scratch on an open-source foundation that lacks the heavy lifting of true
> enterprise logic, forcing engineers to waste months reinventing wheels."

That is precisely the gap the fourteen modules, the workflow engine and the RBAC model fill.

---

## 11. Maturity ledger

Nothing below undermines the platform's value — but publishing any of the overstated claims will.

### Solid

- Workflow engine (`reactory-workflow-es`) — 18/18 hardening items done, CI-verified against real
  Postgres/Mongo/Redis containers, 26 scenario specs.
- Multi-tenancy, four-dimensional RBAC, nine auth strategies (80% coverage threshold enforced in
  Jest for `src/authentication/**`).
- Service registry, DI, and the decorator suite (`@cached`, `@audit`, `@rateLimit`, telemetry).
- GraphQL composition across modules.
- The conversation engine, streaming stack and MCP server/client.
- JIT plugin compilation and the component registry — 62 live compiled components.
- Electron desktop packaging.

### Work in progress

| Item | State |
|---|---|
| Web form engine | **Two engines coexist.** The legacy in-tree rjsf v4 fork is the default; the new `@rjsf/core` 5.x engine is complete with 517 passing tests but gated behind feature flag `core.FormsEngineV5@1.0.0`, default `false`. Fork retirement deferred pending production validation. |
| React Native client | Well-built SDK layer (~9,700 LOC) with **no form rendering engine, placeholder screens and a stub login**. Its own tracker says 15%, last updated Aug 2025. Do not represent this as a working mobile client. |
| MCP OAuth | Implemented, unit-tested, self-declared as not yet E2E-validated against a live OAuth MCP server. |
| Agentic wiring | 8 of 10 authored skills unregistered; 2 of 3 agentic workflows not in the load array; the server-side form-generation macro is unreachable; several declared files are 0 bytes. |
| `reactory-kyc` | Self-reported 61.8% complete. |
| `reactory-azure` | Self-described "Example Only". |
| GraphQL subscriptions | `graphql-ws` wired client-side; **no subscription server is configured**. |
| Foreach iteration safety | Multi-step `for_each` bodies leak data between iterations (engine-level; tracked as `P0.6` in `reactory-workflow-es`). Keep bodies single-step until fixed. `maxConcurrency` and `indexVariable` are declared but silently ignored. |
| `services/ETL/` | Registered and exposed, self-described experimental, hardcoded to user/demographics import, and `UserImportFileValidation.ts:51` throws on invocation. Not a general ingestion pipeline. |
| Workflow catalog examples | `mongo_write` appears in no workflow; `SentimentAnalysisPipeline.yaml` uses `type: custom` for service calls, but `CustomStep` only echoes config back — so it fetches nothing. There is no working end-to-end data pipeline to demo. |
| Documentation | `reactory-docs` covers forms and core concepts well; plugins, server and roadmap sections are stubs. Nothing documented on the agentic layer, integrations, workflow-es, telemetry or Electron. Node version referenced is 16 (actual: 20.19.4). |

### Claims to correct in existing material

| Claim | Reality |
|---|---|
| "40+ modules" | 14 on disk and in `available.json`. |
| "15+ auth strategies" | 9, plus module-contributed. |
| "60% cost reduction / 4x faster / 65% lower cost / 99.9% uptime SLA / 40% lower TCO" | Marketing-page assertions with no sourcing anywhere in the repos. Remove or substantiate. |
| "6+ AI providers" | 10 registered; **5 with native adapters**. Both numbers are defensible if stated precisely. |
| "React Native … from the same codebase" | The type layer is shared; the client is not functional. |
| "ETL engine" / "full ETL capability" | Do not claim this. No batching, no streaming extraction, no incremental load, no bulk upsert, no row-level error isolation, no lineage. Use the framing in [§8.1](#81-data-movement--scope-and-limits). |
| `AGENT.md` module list, TypeScript version, project structure | Stale in several places. |

### Security items worth addressing before external scrutiny

- PBKDF2 at **1,000 iterations** for both `User` and `ReactoryClient` passwords — well below current
  guidance.
- CORS whitelist is the **union across all tenants**, not scoped to the requesting tenant.
- The `x-reactory-pass` server-bypass header equals `password + salt` concatenation.
- Client plugins load as plain `<script src>` from a server-supplied URI with **no SRI and no
  signature verification** — though `IReactoryForm.modules[]` carries `signed`/`signature` fields,
  indicating the intent exists.
- The `AuthDirective` denies by returning `null` rather than raising an authorization error — silent
  denial.
- CI runs a **build smoke test only** — no test, lint or type-check job. Jest runs with
  `diagnostics: false`, so type errors do not fail tests.
- A `debugger` statement sits in the service startup path (`ServiceManager.ts:306`).

---

## 12. Summary positioning

**One sentence.** Reactory is an MIT-licensed, multi-tenant application platform where enterprise
applications are described as data — JSON Schema forms, YAML workflows, YAML agents and tenant
configuration — assembled per tenant and per role by a GraphQL server, rendered by a schema-driven
client, and extended through a single module contract that spans UI, API, data, process and agency.

**One paragraph.** Reactory gives a small team the foundations an enterprise application needs —
multi-tenancy with four-dimensional RBAC, nine authentication strategies including Azure AD and Okta,
a composed GraphQL API, a durable saga-capable workflow engine with 35 built-in step types, an
integration layer reaching REST, GraphQL, gRPC, five database engines, queues and MCP, and
OpenTelemetry instrumentation throughout — and then makes the application itself declarative. Screens
are JSON Schema forms that auto-register as addressable components. Business processes are YAML
workflows with a visual designer. AI agents are YAML personas contributed by modules, whose tools are
the platform's own capabilities, and whose conversations are durable workflow steps. The server
compiles UI components just-in-time and pushes them to the client, so routes, menus, themes, forms
and plugins change without a frontend deployment. Greenfield teams get to first screen without
building the boring 60%; long-lived teams change behaviour through configuration and declaration
rather than release cycles; and integration teams package third-party systems as modules that extend
every layer at once. The platform is open under MIT, with a commercially-licensed module marketplace
layered on top.

---

## Appendix — evidence index

| Topic | Primary sources |
|---|---|
| Type contract | `reactory-core/src/types/index.d.ts` (`IReactoryContext` :11588, `IReactoryModule` :11448, `IReactoryForm` :4562, `IReactoryServiceDefinition` :9091, `FQN` :82) |
| Tenancy | `reactory-express-server/src/express/middleware/ReactoryClient.ts`; `src/modules/reactory-core/models/ReactoryClient/`; `src/data/clientConfigs/` |
| Auth & RBAC | `src/authentication/` (configure.ts, strategies/, decorators.ts, README.md); `src/modules/reactory-core/models/User.ts`; `graph/directives/AuthDirective.ts` |
| Modules | `src/modules/available.json`, `enabled-reactory.json`, `index.ts`, `README.md`; `src/modules/reactory-core/index.ts` |
| Services | `src/services/ServiceManager.ts`; `src/application/decorators/` |
| GraphQL | `src/express/middleware/ReactoryGraph.ts`; `src/models/graphql/{types,resolvers,directives}/index.ts` |
| Workflow | `reactory-workflow-es/` (README.md, docs/upgrade-plan.md, core/src/); `src/modules/reactory-core/workflow/` (ARCHITECTURE.md, YamlFlow/, WorkflowRunner/); `reactory-data/workflows/catalog/` |
| Agentic | `src/modules/reactory-reactor/` (AGENT.md, ai/providers/providers.yaml, ai/persona/, ai/macro/, ai/skills/, middleware/mcp/, workflow/steps/AgentConversationStep.ts) |
| Form engine | `reactory-pwa-client/src/components/reactory/{ReactoryForm,form,form-engine,ux/mui}/`; `docs/forms-engine/phase-5-closeout.md` |
| Component registry & plugins | `reactory-pwa-client/src/api/ReactoryApi.tsx`; `src/api/ReactoryPluginLoader/`; `src/components/index.tsx`; `reactory-data/plugins/__runtime__/` |
| Deployment | `reactory-express-server/docker/`, `config/reactory/terraform/`, `bin/` (~60 scripts) |
| Positioning source material | `reactory-docs/README.md` (the Three C's), `reactory-docs/manifesto/MANIFESTO.md`, `reactory-data/content/marketing/index.html` |
