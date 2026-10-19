---
title: reactory-reactor — the agentic layer
status: Partial
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-reactor@ffb54c3
audience: developer
---

![Build Anything Fast](/branding/reactory-logo.png)
# reactory-reactor — the agentic layer

Reactor is the Reactory module that turns the platform into an agent platform: it holds the
provider registry, the conversation engine, the persona/skill/macro model, the MCP client *and*
server, browser automation, and the system graph an agent reads to understand a codebase.

This page is the reader's entry point. It is **not** an enumeration: §2, §4, §5 and §7 are owned by
the generated reference (`07-reference/modules/reactory-reactor.md`, produced by DOCS-08). Until that
file exists, the tables below state what was verified against `src/modules/reactory-reactor/index.ts`, the SDL and the service
decorators on 2026-10-19, and the [evidence index](./evidence.md) names the file and line for each
claim.

**Read this first if you are adopting the layer:** §1 tells you what is actually wired, and §9 tells
you what is not. Several capabilities in this module are authored but not reachable, and the counts
in §9 are the ones to trust over any older module `README.md`.

---

## 1. Purpose & status

### What Reactor is for

| Capability | Why it lives here |
|---|---|
| Multi-provider AI conversations | One conversation contract over OpenAI/xAI/Azure/Ollama/Copilot, Google Gemini, Anthropic and Amazon Bedrock |
| Tool-using agents | A macro registry, approval modes, an auto tool loop, and interruption/resume |
| Personas | Named agents with prompts, model/provider defaults, tool-scope and skills, loaded from YAML |
| Skills | Markdown procedures an agent loads on demand instead of carrying in its system prompt |
| MCP | Reactory as an MCP *client* (consuming external tool servers) and as an MCP *server* (exposing its own tools) |
| System graph | Projects, files, symbols and cross-project edges, plus tickets and documentation, so an agent can retrieve structure rather than grep |
| Browser automation | Playwright sessions, macros and workflow steps |
| Agentic workflows | `agent_conversation` as a durable, retryable workflow step |

### What it explicitly does not do

- It does not host or fine-tune models. Every provider call is an HTTP/SDK call to an external
  service; the module owns routing, credentials, cost and telemetry, not inference.
- It does not own identity, tenancy or RBAC. It consumes `context.user` / `context.partner` and the
  tenant-scoped repositories from `reactory-core`.
- It does not own the workflow engine. It contributes step types to `reactory-core`'s YamlFlow
  runner (`src/modules/reactory-reactor/workflow/steps/index.ts:184-214`).
- It does not ship the chat UI. It registers a client plugin
  (`src/modules/reactory-reactor/index.ts:36-51`) whose components live in the `reactory-pwa-client` repository.

### Status: `Partial`

The engine is real and in daily use; the *registry surface* around it is uneven. The honest
one-paragraph summary:

> Conversations, streaming, the tool loop, personas, the system graph and Playwright are
> implemented and exercised. Provider **metadata** is declarative (YAML) and broader than the
> provider **adapters** that can actually serve a turn. Skills and the `reactor` extension block are
> half-migrated: the in-code block declares five empty arrays, and nine skill files are zero bytes.
> Two agent-session workflows ship in the repository but are absent from the load array, so they
> cannot run.

| Surface | Status | Why |
|---|---|---|
| Conversation engine (sessions, turns, history windows, compaction) | Implemented | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:5626` (`sendMessage`), `:10006` (`startChatSession`), `:2206` (`compactConversation`) |
| Streaming (SSE transport, session manager, shell PTY) | Implemented | `src/modules/reactory-reactor/services/reactor/StreamingEndpoints.ts:56` registers the routes; `StreamingSessionManager`, `StreamingTransportManager`, `ShellSessionManager` are in the service load array (`src/modules/reactory-reactor/services/index.ts:62-64`) |
| Provider metadata registry | Implemented (declarative) | `src/modules/reactory-reactor/ai/providers/providers.yaml` — 9 entries; DB seeding at `src/modules/reactory-reactor/models/seedAiProviders.ts:14` |
| Provider adapters | Partial | 5 adapter implementations, 4 registered provider services (see §5, §9) |
| Personas | Implemented | `src/modules/reactory-reactor/ai/persona/loader/persona-loader.ts:98-104`; 7 `agent.yaml` files + 6 code-registered persona components (`src/modules/reactory-reactor/models/index.ts:7-12`) |
| Tools / macros | Partial | `src/modules/reactory-reactor/ai/macro/index.ts:113-133`; one authored macro family is unreachable (§9) |
| Skills | Partial | `src/modules/reactory-reactor/ai/skills/index.ts:5-146` registers 9; 9 declared files are 0 bytes (§9) |
| MCP client | Partial | `ai/macro/mcp/`; OAuth is unit-tested, not E2E-validated (§9) |
| MCP server | Implemented | `middleware/mcp/` loaded by `src/modules/reactory-reactor/middleware/index.ts:3-6` |
| System graph | Implemented | `src/modules/reactory-reactor/services/SystemGraphManager.ts:262` (subgraph), `:433` (search), `:498` (path) |
| Playwright | Implemented | `src/modules/reactory-reactor/services/playwright/ReactorPlaywrightService.ts:97-307`; 7 workflow steps (`src/modules/reactory-reactor/workflow/steps/playwright/index.ts:339-393`) |
| Agentic workflows | Partial | 13 YAML workflows on disk, 11 in the load array (`src/modules/reactory-reactor/workflow/index.ts:39-55`) |
| UI | Partial | Server contributes forms + a plugin; the chat components are in another repository (§6) |

---

## 2. Module contract

**FQN: `reactory.Reactor@1.0.0`** — `nameSpace: 'reactory'` + `name: 'Reactor'` + `version: '1.0.0'`.

| Field | Value | Evidence |
|---|---|---|
| `id` | `reactory-reactor` | `src/modules/reactory-reactor/index.ts:19` |
| `nameSpace` | `reactory` | `src/modules/reactory-reactor/index.ts:20` |
| `version` | `1.0.0` | `src/modules/reactory-reactor/index.ts:21` |
| `name` | `Reactor` | `src/modules/reactory-reactor/index.ts:22` |
| `dependencies` | `['speech.SpeechService@1.0.0']` | `src/modules/reactory-reactor/index.ts:23` |
| `priority` | `1` (loads early — other modules' agent surfaces depend on it) | `src/modules/reactory-reactor/index.ts:24` |
| License | `commercial` | `src/modules/available.json` (reactor entry) |

> **Do not trust `src/modules/reactory-reactor/AGENT.md` for the FQN.** It states `reactory.reactory-reactor@1.0.0`; the
> resolution rule composes nameSpace + name + version, which is `reactory.Reactor@1.0.0`. The repo
> file is stale and, under the documentation ownership model, is not normative for a capability or
> identity claim.

### Contributed extension points

Every entry below is present on the module object (`src/modules/reactory-reactor/index.ts:25-64`). "Contributes" means the
platform loader actually receives it.

| Extension point | What Reactor contributes | Evidence |
|---|---|---|
| `graphDefinitions` | Resolvers + SDL + directives for the Reactor namespace | `src/modules/reactory-reactor/index.ts:25`, `src/modules/reactory-reactor/graphql/index.ts:6-10` |
| `workflows` | 11 YAML workflows (8 `reactor.*`, 3 `core.*`) | `src/modules/reactory-reactor/index.ts:26`, `src/modules/reactory-reactor/workflow/index.ts:39-55` |
| `workflowSteps` | `agent_conversation`, `graph_query`, `process_conversation`, 7 Playwright steps | `src/modules/reactory-reactor/index.ts:27`, `src/modules/reactory-reactor/workflow/steps/index.ts:184-214` |
| `forms` | 25 form component definitions from 22 directories | `src/modules/reactory-reactor/index.ts:28-30`, `src/modules/reactory-reactor/forms/index.ts:1-26` |
| `services` | 32 service classes | `src/modules/reactory-reactor/index.ts:31`, `src/modules/reactory-reactor/services/index.ts:34-67` |
| `translations` | **Empty array** — no translation strings contributed | `src/modules/reactory-reactor/index.ts:32-34` |
| `models` | Mongo models + the Reactor Postgres DataSource and its entities | `src/modules/reactory-reactor/index.ts:35`, `src/modules/reactory-reactor/models/index.ts:40` |
| `clientPlugins` | `reactor-web-client-plugin` (web, role `USER`) | `src/modules/reactory-reactor/index.ts:36-51` |
| `middleware` | MCP server middleware + chat streaming middleware | `src/modules/reactory-reactor/index.ts:52`, `src/modules/reactory-reactor/middleware/index.ts:3-6` |
| `passportProviders` | MCP OAuth callback provider | `src/modules/reactory-reactor/index.ts:53`, `src/modules/reactory-reactor/ai/macro/mcp/oauth/routes.ts:29` |
| `cli` | `reactor` CLI commands | `src/modules/reactory-reactor/index.ts:54` |
| `pdfs` | **Empty array** | `src/modules/reactory-reactor/index.ts:55` |
| `reactor` | The AI block — see below | `src/modules/reactory-reactor/index.ts:56-63` |

### The `reactor` block

```ts
reactor: {
  providers: [],   // empty
  tools: [],       // empty
  mcp: [],         // empty
  agents: [],      // empty
  macros: [],      // empty
  skills: ReactorSkills,  // 9 definitions
}
```

**Five of the six arrays are empty** (`src/modules/reactory-reactor/index.ts:57-61`). This is the single most misleading thing
about the module's declared surface: reading `src/modules/reactory-reactor/index.ts` alone suggests Reactor contributes no
providers, tools, agents or macros, while in practice it contributes all of them through *other*
extension points:

| Thing the `reactor` block would name | Where it is actually contributed |
|---|---|
| AI providers | `services` (provider services) + `src/modules/reactory-reactor/ai/providers/providers.yaml` seeded to `reactory_ai_providers` |
| Tools / macros | `src/modules/reactory-reactor/ai/macro/index.ts` `MacroRegistry` (imported by the conversation engine, not by `src/modules/reactory-reactor/index.ts`) |
| Agents | `ai/persona/*/agent.yaml` via `PersonaLoaderService`, plus code-registered persona components |
| MCP | `middleware` (server) + `ai/macro/mcp` (client) |
| Skills | `reactor.skills` — the one array that is populated |

Treat the `reactor` block as **declared-but-unmigrated**. A capability claim must be traced to the
place that actually registers it, not to this block.

---

## 3. Data model

Reactor is deliberately split across two stores. The split is documented in the entity itself
(`src/modules/reactory-reactor/models/ReactorConversationMessage.ts:16-40`): the session document stays in Mongo, the
append-heavy message log is Postgres, so a long conversation cannot push a document toward the
16 MB BSON ceiling and windowed reads become indexed SQL.

### MongoDB

| Collection | Purpose | Notable fields | Evidence |
|---|---|---|---|
| `reactor_conversations` | One document per chat session | `personaId`, `modelId`, `providerId`, `user`, `history[]`, `meta`, `title/summary/tags/icon/color`, `toolApprovalMode`, `maxToolIterations`, `mcpSessions[]`, `sidePanelState`, `use_case`, `edges[]`, `clientKey`, `parentSessionId`, `sseSessionId` | `src/modules/reactory-reactor/models/ReactorChatState.ts:262`, `:737` |
| `reactor_ai_usage` | Per-turn usage ledger (tokens, cost, latency, tools, status) | `userId`, `chatSessionId`, `parentSessionId`, `personaId`, `provider`, `model`, `promptTokens`, `completionTokens`, `costUsdCents`, `durationMs`, `timeToFirstTokenMs`, `use_case`, `status` | `src/modules/reactory-reactor/models/ReactorAIUsage.ts:149`, `:5-32` |
| `reactor_user_budgets` | Per-user spend ceiling | `userId`, budget + period | `src/modules/reactory-reactor/models/ReactorUserBudget.ts:117` |
| `mcpregistries` (default pluralisation) | MCP registry entries | `name`, `type`, `url`, `credentials`, `enabled` | `src/modules/reactory-reactor/models/MCPRegistry.ts:31` |
| `mcpinstalledconnectors` (default pluralisation) | Installed MCP connectors | `registryId`, `transport`, `config`, `status`, `organizationId` | `src/modules/reactory-reactor/models/MCPInstalledConnector.ts:37` |
| `reactor_projects` | Catalogued project | repo path/url, project types, owner | `src/modules/reactory-reactor/models/ReactorProject.ts:172` |
| `reactor_nodes`, `reactor_node_links`, `reactor_node_categories`, `reactor_node_metric_types` | The system graph | node type/category, edge type, source/target, metrics | `src/modules/reactory-reactor/models/ReactorGraphNode.ts:285-309`, `src/modules/reactory-reactor/models/ReactorNodeLink.ts:42` |
| `reactor_graph_perspectives` | Saved graph views | filter + layout | `src/modules/reactory-reactor/models/ReactorGraphPerspective.ts:54` |

### PostgreSQL (Reactor DataSource)

| Table | Purpose | Evidence |
|---|---|---|
| `reactor_conversation_messages` | The message transcript: role, content, tool calls/results, provider response JSONB, usage, `seq` (unique per conversation), `archived`, `search_text` | `src/modules/reactory-reactor/models/ReactorConversationMessage.ts:73` |
| `reactor_ai_failures` | Failed turns, separate from the transcript so error rate can be computed per provider/model | `src/modules/reactory-reactor/models/ReactorAiFailure.ts:47` |
| `reactory_ai_providers` | Provider registry (seeded from YAML, editable via GraphQL) | `src/modules/reactory-reactor/models/ReactoryAiProvider.ts:27` |
| `reactory_ai_models` | Models per provider, capability/limit/cost columns | `src/modules/reactory-reactor/models/ReactoryAiModel.ts:25` |
| `reactory_ai_model_pricing` | Pricing overrides | `src/modules/reactory-reactor/models/ReactoryAiModelPricing.ts:42` |

Notes that matter to an integrator:

- **Tenancy.** Message rows and failure rows carry `client_key` (`ClientKeyColumn`); the
  conversation document carries `clientKey` because listing, "is this conversation blank?" and
  resume must scope on the same value (`src/modules/reactory-reactor/models/ReactorChatState.ts` — `clientKey` field doc).
- **Personas are not a database model.** They are YAML (`ai/persona/<id>/agent.yaml`) plus code
  registry entries; the loader resolves them (`src/modules/reactory-reactor/ai/persona/loader/persona-loader.ts:98-104`).
- **Skills are not a database model either.** They are in-code definitions with a file path
  (`src/modules/reactory-reactor/ai/skills/index.ts`).
- **MCP connection state** is the installed-connector document plus encrypted tokens in the shared
  OAuth token store, not a Reactor table.

---

## 4. GraphQL API

Reactor composes six schema families plus a system-graph family and an MCP family.

| Family | What it exposes | Evidence |
|---|---|---|
| Chat | `ReactorConversations`, `ReactorConversation`, `ReactorConversationHistory` (cursor paging), `ReactorConversationArchivedHistory`, `ReactorPendingClientToolCalls` | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1027-1036` |
| Chat mutations | start session, send message, execute macro/tool, complete client tool calls, set approval mode, set max iterations, set model/provider, set side panel, update chat data, rate message, compact, interrupt, attach/detach files, pin folders/perspectives, delete session, voice session | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1076-1140` |
| Personas | `ReactorPersonas` | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1071` |
| Providers | `ReactorProviders`, `ReactorCapabilities`, `ReactorModelsForPersona`, plus admin CRUD (`ReactorAiProvidersAdmin`, `ReactorAiModelsAdmin`, `ReactorCreateAiProvider`…`ReactorSyncAiProvidersFromYaml`) | `src/modules/reactory-reactor/graphql/schema/ReactorCapabilities.graphql:37-46`, `src/modules/reactory-reactor/graphql/schema/ReactorProviders.graphql:200-215`, `:332-346` |
| Usage & budgets | `ReactorAIUsageSummary`, `ReactorAIUsageList`, `ReactorMyAIUsage`, `ReactorUserBudgets`, `ReactorSetUserBudget`, bulk variants | `src/modules/reactory-reactor/graphql/schema/ReactorAIUsage.graphql:384-400`, `:422-430` |
| System graph | catalog nodes/categories, project lookup/metrics, job status, node links, indexing, external sources | `src/modules/reactory-reactor/graphql/schema/ReactorSystemGraph/queries.graphql:27-49`, `src/modules/reactory-reactor/graphql/schema/ReactorSystemGraph/mutations.graphql:186-215` |
| MCP | `mcpRegistrySearch`, `mcpRegistryList`, `mcpRegistryConnectorDetails`, `installMCPConnector` | `src/modules/reactory-reactor/graphql/mcp/mcp.graphql:63-90` |

The enumerated field list (with `@auth` directives) is generated reference, not this page. Two
observations that belong in prose because they change how you use the API:

1. **History is paged, not dumped.** `ReactorConversationHistory(id, before, limit)` returns a page
   with an `oldestId` cursor; the session's `history` array is not the read contract
   (`src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1032`).
2. **Provider admin is a real surface.** Providers and models can be created, edited, disabled,
   tested and re-synced from YAML at runtime — the YAML is a seed, not the only source of truth
   (`src/modules/reactory-reactor/graphql/schema/ReactorProviders.graphql:332-346`).

---

## 5. Services

`src/modules/reactory-reactor/services/index.ts:34-67` registers **32** service classes. They fall into six groups.

### Conversation engine

| Service id | Responsibility |
|---|---|
| `reactor.ReactorConversationService@1.0.0` | The engine: `startChatSession` (`:10006`), `sendMessage` (`:5626`), history paging (`:4687`), compaction (`:2206`), approval mode (`:2399`), iteration cap (`:2595`), interruption (`:2746`), resume (`:2631`), macro/tool execution (`:7492`, `:7922`), client tool completion (`:7948`), pending client tool calls (`:9604`) |
| `reactor.ReactorMessageProcessingService@1.0.0` | Generic request path (`ReactorSendGenericRequest`) |
| `reactor.ReactorCapabilityService@1.0.0` | Resolves models compatible with a persona's capabilities |
| `reactor.AIPersonaProvider@1.0.0` | Persona lookup used by the conversation service |
| `reactor.PersonaLoaderService@1.0.0` | Loads/merges persona YAML (`src/modules/reactory-reactor/ai/persona/loader/persona-loader.ts:98`) |
| `reactor.ReactorMacroService@1.0.0` | Macro registry access for the engine |
| `reactor.DocumentChunkingService@1.0.0` | Chunking for retrieval/RAG (`src/modules/reactory-reactor/services/reactor/DocumentChunkingService.ts:44`) |

### Streaming stack

| Service id | Responsibility |
|---|---|
| `reactor.StreamingSessionManager@1.0.0` | Session lifecycle for SSE channels (`src/modules/reactory-reactor/services/reactor/StreamingSessionManager.ts:15`) |
| `reactor.StreamingTransportManager@1.0.0` | Transport fan-out (`src/modules/reactory-reactor/services/reactor/StreamingTransportManager.ts:26`) |
| `reactor.ShellSessionManager@1.0.0` | Interactive PTY sessions streamed over SSE (`src/modules/reactory-reactor/services/reactor/ShellSessionManager.ts:89`) |

HTTP routes are registered by `StreamingEndpoints.setupRoutes`
(`src/modules/reactory-reactor/services/reactor/StreamingEndpoints.ts:56`): SSE connection, event send, session create/status/
close, health/stats/debug, and the shell open/input/resize/close family.

`reactor.StreamingConversationService@1.0.0` is **decorated but not registered** — it is referenced
only by its own test (`src/modules/reactory-reactor/services/reactor/StreamingConversationService.ts:16`). See §9.

### Provider adapters

| Service id | Registered in load array? |
|---|---|
| `reactor.OpenAIService@1.0.0` | Yes (`src/modules/reactory-reactor/services/index.ts:43`) |
| `reactor.GoogleAIService@1.0.0` | Yes (`:45`) |
| `reactor.AnthropicService@1.0.0` | Yes (`:46`) |
| `reactor.OllamaAIService@1.0.0` | Yes (`:47`) |
| `reactor.AWSBedrockService@1.0.0` | **No** — authored (`src/modules/reactory-reactor/services/reactor/providers/AWSBedrockService.ts:53`) but absent from the load array |

Separately, `ReactorProviderService` registers **response adapters** keyed by provider id
(`src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:262-555`). There are **5 adapter implementations**
(OpenAI-compatible, Google, Amazon, Anthropic, Cohere) mapped to 12 provider keys, including
`llamacpp`, `vllm` and `deepseek` which have no YAML entry in the module registry and only resolve if
a user overlay adds them (`src/modules/reactory-reactor/ai/providers/provider-loader.ts:206-224`).

### Playwright

`reactor.ReactorPlaywrightService@1.0.0` (`src/modules/reactory-reactor/services/playwright/ReactorPlaywrightService.ts:24-28`)
owns browser sessions: `createSession`/`closeSession`, navigate, click, type, select, press,
content, inspect, wait, evaluate, screenshot, PDF (`:97-307`). It is reachable three ways: the
`playwright` macro family, the workflow steps, and (through the tool registry) an agent.

### System graph

`reactor.SystemGraphManager@1.0.0` (`src/modules/reactory-reactor/services/SystemGraphManager.ts:56-61`) is the graph kernel:
`getChildren`, `getLinks`, `getNodeLinks`, `getSubgraph` (`:262`), `searchNodes` (`:433`),
`findPath` (`:498`), link CRUD (`:594-622`), `catalogProject` (`:744`), project lookup (`:731`),
`linkExternalProjects` (`:943`), `linkTicketMentions` (`:1167`), catalog job queue (`:1317`).

Project processors (Java, T-SQL, C#, NodeJS, React Native, Python, BackStage, File, Markdown) and
graph providers (Jira, Database) are services too (`src/modules/reactory-reactor/services/index.ts:50-59`) — they are the
per-language half of cataloguing.

### Usage and budgets

`reactor.ReactorAIUsageService@1.0.0` (`recordUsage` `:133`, `checkUserBudget` `:283`,
`getUsageSummary` `:439`, budgets `:694-898`) and
`reactor.ReactorUsageAnalyticsService@1.0.0` (`getUsageSummary` `:497`, `getUsageList` `:806`,
`getConsumptionForUser` `:907`, `recordFailure` `:958`).

### MCP

`reactor.MCPRegistryService@1.0.0` (`src/modules/reactory-reactor/services/mcp/MCPRegistryService.ts:15-19`) with a pluggable
registry adapter (`CommunityRegistryAdapter`) — see §5 of the agent docs for the consumer side.

---

## 6. UI surface

Reactor's UI is split across two repositories, and that split is the main source of confusion when
reading `src/modules/reactory-reactor/readme.md`.

### Server side (this module)

| Surface | What ships | Evidence |
|---|---|---|
| Forms | 22 form directories, 127 TypeScript files, 25 registered definitions — graph explorer, project workspace (overview, metrics, history, incidents, security, team, deployments, documentation, info panel), provider and model create/edit grids, service catalogue, usage dashboard, budget admin, Git commit | `src/modules/reactory-reactor/forms/index.ts:1-26` |
| Client plugin | `reactor-web-client-plugin`, platform `web`, role `USER`, loaded from `API_URI_ROOT/plugins/...` | `src/modules/reactory-reactor/index.ts:36-51` |
| Chat-driven UI state | `ReactorSetSidePanelState`, `ReactorUpdateChatTools`, `ReactorSyncClientCapabilities`, `ReactorAttachUserFileToSession`, `ReactorPinFolderToSession`, `ReactorPinGraphPerspectiveToSession` | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1076-1130` |
| Persisted side panel | `sidePanelState` on the conversation document (items, active item, open flag) | `src/modules/reactory-reactor/models/ReactorChatState.ts:186-200` |
| Menus | Reactor chat, projects, graph, AI providers, AI models | `src/data/clientConfigs/reactory/menus/main.ts:19-54` |

### Client side (`reactory-pwa-client`)

The chat experience — transcript, composer, side panel, shell widget — is
`src/components/shared/ReactorChat/`. Rendering is driven by **client-side macros**, one module per
rendering concern:

| Macro | Renders |
|---|---|
| `form.macro.tsx` | A Reactory form inside the transcript |
| `chart.macro.tsx` | Chart widgets (bar, line, pie, funnel) |
| `d3.macro.tsx` | D3 visualisations |
| `sidePanelState.macro.tsx` | Side-panel open/close/activate |
| `graphPerspective.macro.tsx` | A pinned system-graph view |
| `image.macro.tsx`, `component.macro.tsx`, `hostField.macro.tsx` | Image, arbitrary component, host field |
| `runtime.macro.tsx`, `amq.macro.tsx`, `login.macro.tsx`, `logout.macro.tsx` | Runtime/queue/auth actions |

**The `form`, `component`, `chart`, `d3` and `image` tool names are advertised by the client, not the
server.** They have no `MacroRegistry` entry and must not be treated as server tools
(`src/modules/reactory-reactor/ai/persona/clientTools.ts`). This is the mechanism behind "the agent can render a form" — the
server emits a tool call, the client macro renders it.

---

## 7. Workflows

### Steps contributed

| Step type | Purpose | Evidence |
|---|---|---|
| `agent_conversation` | Run a durable conversation turn with a persona, with auto tool approval | `src/modules/reactory-reactor/workflow/steps/index.ts:186`, `src/modules/reactory-reactor/workflow/steps/AgentConversationStep.ts:1-52` |
| `graph_query` | Query/walk the system graph (node, nodes, children, links, subgraph, search, path) | `src/modules/reactory-reactor/workflow/steps/index.ts:195` |
| `process_conversation` | Analyse a conversation and register its references in the graph | `src/modules/reactory-reactor/workflow/steps/index.ts:204` |
| `playwright_session`, `playwright_navigate`, `playwright_action`, `playwright_evaluate`, `playwright_inspect`, `playwright_screenshot`, `playwright` | Browser automation as steps | `src/modules/reactory-reactor/workflow/steps/playwright/index.ts:339-393` |

### `agent_conversation`

This is the feature that makes the agentic layer a *platform* capability rather than a chat
feature: an agent turn becomes a persistable, retryable step inside a larger flow.

| Config | Meaning |
|---|---|
| `personaId` (required) | Which agent to talk to |
| `message` / `promptKey` + `promptVariables` | Prompt body, or a named canned prompt from the persona |
| `instructions` + `promptMergeStrategy` | System prompt, merged `append` (default), `prepend` or `replace` |
| `toolApprovalMode` | `auto` (default), `safe_auto`, `prompt`, `plan` |
| `maxToolIterations` | Cap on the auto tool loop for this session |
| `sessionId` | Resume an existing conversation — the idempotency lever for engine retries |
| `model` / `provider` | Per-turn override |
| `providerConfig` | Structured output, reasoning effort, sampling, response modalities |
| `role` / `toolCallId` / `toolName` / `toolArgs` | Reply to a pending client tool call |

Output: `{ sessionId, content, response }`. Persist `sessionId` and feed it back so a retry resumes
the same conversation instead of starting a new one (`src/modules/reactory-reactor/workflow/steps/AgentConversationStep.ts:46-50`).

**Why this matters operationally:** the step delegates entirely to
`reactor.ReactorConversationService@1.0.0`, so tool execution, persona resolution and persistence are
the same code path as interactive chat. There is no second agent runtime to reason about.

### Workflows shipped

13 YAML files exist on disk; **11 are in the load array** (`src/modules/reactory-reactor/workflow/index.ts:39-55`):

| Workflow | Namespace | Agentic? | Loaded |
|---|---|---|---|
| `AgentGitCommit` | `reactor` | Yes — consults the agent, then executes a pre-defined safe git step | Yes |
| `AgentGitWorktree` | `reactor` | Yes — asks GitGuardian for branch/worktree names | Yes |
| `CatalogAgentMemory` | `reactor` | No | Yes |
| `CatalogProjectFolder` | `reactor` | Uses a persona | Yes |
| `CatalogProjectGraph` | `reactor` | No | Yes |
| `SyncExternalSources` | `reactor` | No | Yes |
| `GraphExplore` | `reactor` | Uses a persona | Yes |
| `ProcessConversationWorkflow` | `reactor` | Yes — post-processes a conversation into the graph | Yes |
| `ProcessAITicket` | `core` | Uses `agent_conversation` | Yes |
| `DispatchAITickets` | `core` | No | Yes |
| `RequestAIRouting` | `core` | No | Yes |
| `AgentInstruction` | `reactor` | Yes — "sends a message to an AI agent within a chat session" | **No** |
| `SessionContinuation` | `reactor` | Yes — resumes chat sessions after restart | **No** |

The two unloaded files are on disk and look shippable; they are simply not in
`REACTOR_YAML_WORKFLOWS`, so `loadYamlWorkflow` never runs for them. See §9.

---

## 8. Operations

### Provider configuration and overrides

Resolution order (later wins), all inside `src/modules/reactory-reactor/ai/providers/provider-loader.ts:206-224`:

1. `src/modules/reactory-reactor/ai/providers/providers.yaml` — the module registry, 9 providers: `openai` (`:18`), `xai`
   (`:258`), `google` (`:536`), `copilot` (`:832`), `azure-openai` (`:906`), `anthropic` (`:1022`),
   `amazon` (`:1222`), `cohere` (`:1279`), `ollama` (`:1367`).
2. `~/.reactor/providers.yaml` — operator overlay. Entries with the same `id` **replace** the module
   entry; new ids are added. In the current workstation checkout this adds `llamacpp` and `deepseek`.
3. `reactory_ai_providers` / `reactory_ai_models` — seeded from YAML on first boot
   (`src/modules/reactory-reactor/models/seedAiProviders.ts:10`), then editable at runtime through the admin mutations
   (`ReactorCreateAiProvider`, `ReactorUpdateAiProvider`, `ReactorDeleteAiProvider`,
   `ReactorSyncAiProvidersFromYaml`).

Details that bite:

- `${VAR}` and `${VAR:-default}` are interpolated across the YAML, including endpoint URLs
  (`src/modules/reactory-reactor/ai/providers/provider-loader.ts:138`).
- **Availability is credential-driven**: a provider is `available` only when at least one declared
  credential env var is non-empty (`src/modules/reactory-reactor/ai/providers/provider-loader.ts:161`). A provider row with no
  `OPENAI_API_KEY` etc. is registered but unusable.
- Per-user credential overrides are encrypted and keyed `ai-provider:<id>`
  (`src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts` — `AUTH_KEY_PREFIX`), and resolved in the order
  session → user → app → persona → environment (`ResolvedCredentials.source`).
- A model that declares no `contextLength` falls back to `DEFAULT_CONTEXT_LENGTH = 200000`
  (`src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:23`) and the fallback is logged at WARN; gaps are
  reported at load time by `findMissingContextLengths` (`src/modules/reactory-reactor/ai/providers/provider-loader.ts:321`).

### Approval model

`ToolApprovalMode` (`src/modules/reactory-reactor/ai/openai/types/chat.ts:12-17`):

| Mode | Behaviour |
|---|---|
| `auto` | Execute every tool without asking. Default for `agent_conversation`. |
| `safe_auto` | Auto-execute tools marked safe (`safeForAutoExecution`), prompt for the rest. |
| `prompt` | Ask before executing any tool. |
| `plan` | Read-only tools auto-execute; anything with side effects requires approval. |

Set per session through `setChatToolApprovalMode` (`src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:2399`)
or the `ReactorSetChatToolApprovalMode` mutation, and per workflow step through the step config.

### Iteration and interruption limits

| Limit | Value | Where |
|---|---|---|
| Session `maxToolIterations` | Set per conversation; validated `>= 1` | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:2595-2608` |
| Auto tool loop cap | `conversation.maxToolIterations` else `REACTOR_MAX_TOOL_ITERATIONS`, default **200** | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:6208-6209` |
| Anthropic provider loop | Hard cap **25** iterations | `services/reactor/services` → `src/modules/reactory-reactor/services/reactor/providers/AnthropicService.ts:50` |
| `agent_conversation` designer default | `maxToolIterations: 10` | `src/modules/reactory-reactor/workflow/steps/index.ts:89` |
| Pause at limit | Emits an approval request instead of failing the turn | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:6657-6703` |
| Resume | `continueToolExecution` | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:2631` |
| Interrupt | `interruptToolExecution` — stops the in-flight tool, keeps the session | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:2746` |
| Client-side tool wait | `ReactorPendingClientToolCalls` + `ReactorCompleteClientToolCalls` | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1028`, `:1102` |

Two different caps is a real operational hazard: a step can be configured to 50 iterations and still
stop at 25 on Anthropic, or run to 200 on OpenAI-compatible providers.

### Telemetry

| Signal | Where it lands | Evidence |
|---|---|---|
| Per-turn usage (tokens, cost, latency, TTFT, tools, status) | `reactor_ai_usage` | `src/modules/reactory-reactor/models/ReactorAIUsage.ts:5-32` |
| Usage envelope on the transcript row | `reactor_conversation_messages` (`provider_response.usage`, `usage_source`: `provider` \| `estimated` \| `none`) | `src/modules/reactory-reactor/models/ReactorConversationMessage.ts:17-27` |
| Failed turns | `reactor_ai_failures` (separate table, per provider/model) | `src/modules/reactory-reactor/models/ReactorAiFailure.ts:1-47` |
| Budget enforcement | `checkUserBudget` before a turn | `src/modules/reactory-reactor/services/reactor/ReactorAIUsageService.ts:283` |
| Query surface | `ReactorAIUsageSummary/List`, `ReactorMyAIUsage`, `ReactorUserBudgets` | `src/modules/reactory-reactor/graphql/schema/ReactorAIUsage.graphql:384-430` |
| Session log | `ReactorSessionLog` + per-session log file | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1138` |

`usage_source: 'estimated'` exists specifically so a derived figure is never billed or reported as a
measured one (`src/modules/reactory-reactor/models/ReactorConversationMessage.ts:17-27`).

### Failure modes worth knowing before an incident

| Symptom | Cause | Where |
|---|---|---|
| Provider registered, every turn "unavailable" | No credential env var set | `src/modules/reactory-reactor/ai/providers/provider-loader.ts:161` |
| Unknown persona at workflow run | `personaId` does not resolve; the step converts the error response into a failed step | `src/modules/reactory-reactor/workflow/steps/AgentConversationStep.ts:63-80` |
| Turn stops mid-tool-loop | Iteration cap (session or provider) — not an outage | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:6657` |
| Context "cap" that matches no model | Model declares no `contextLength`; 200 000 fallback used | `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:23` |
| Conversation appears empty across tenants | Pre-`clientKey` documents; backfill needed | `src/modules/reactory-reactor/models/ReactorChatState.ts` — `clientKey` field doc |

---

## 9. Limitations & roadmap

This section is the boundary. Anything claimed elsewhere in the corpus that contradicts it is wrong.

### The six mandated limitations (measured 2026-10-19)

| # | Limitation | Measured value | Evidence |
|---|---|---|---|
| 1 | **Providers registered vs adapters.** The ticket's figure was "10 providers registered / 5 native adapters". Measured today: **9** provider entries in the module registry, **11** after the operator overlay, **5** response-adapter implementations, and **4** registered provider *services* (the fifth, Bedrock, is authored but unloaded). | 9 / 11 / 5 / 4 | `src/modules/reactory-reactor/ai/providers/providers.yaml` (9 `- id:` entries at lines 18, 258, 536, 832, 906, 1022, 1222, 1279, 1367); `src/modules/reactory-reactor/ai/providers/provider-loader.ts:206-224`; `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:262-555`; `src/modules/reactory-reactor/services/index.ts:43-47` |
| 2 | **Skills.** The ticket's figure was "8 of 10 authored skills unregistered". Measured: **18** skill markdown files are declared; **9** have content and **all 9 are registered** in `src/modules/reactory-reactor/ai/skills/index.ts`; the other **9 are 0 bytes**, so four whole families (`form-building/` ×5, `graphql/` ×2, `macro-building/` ×1, `services/` ×1) are empty placeholders. Nothing with content is unregistered; the gap is empty files, not missing registrations. | 18 declared / 9 registered / 9 empty | `src/modules/reactory-reactor/ai/skills/index.ts:5-146`; 0-byte list in [evidence.md](./evidence.md) |
| 3 | **Agentic workflows.** 13 YAML workflows on disk, **11 in the load array**. Of the three agent-*session* workflows (`AgentInstruction`, `SessionContinuation`, `ProcessConversationWorkflow`), **2 are not loaded** — `src/modules/reactory-reactor/workflow/AgentInstruction.yaml` and `src/modules/reactory-reactor/workflow/SessionContinuation.yaml` cannot run. | 11 / 13 loaded | `src/modules/reactory-reactor/workflow/index.ts:39-55`; `src/modules/reactory-reactor/workflow/AgentInstruction.yaml:1-4`; `src/modules/reactory-reactor/workflow/SessionContinuation.yaml:1-4` |
| 4 | **The server-side form-generation macro is unreachable.** `src/modules/reactory-reactor/ai/macro/develop/form/macro.ts` defines a complete `FormMacro` and exports `FormMacroComponentRegister`, but `src/modules/reactory-reactor/ai/macro/develop/index.ts:13-16` exports only the two code-review registers, so `FormMacro` is never in `MacroRegistry`. The `@form(...)` tool an agent is told about is a **client** macro (`src/modules/reactory-reactor/ai/persona/clientTools.ts`), not this one. | Unreachable | `src/modules/reactory-reactor/ai/macro/develop/form/macro.ts:189-198`; `src/modules/reactory-reactor/ai/macro/develop/index.ts:13-16`; `src/modules/reactory-reactor/ai/macro/index.ts:113-133` |
| 5 | **MCP OAuth is implemented and unit-tested, not E2E-validated.** The callback route, state/CSRF handling, PKCE client registration and token persistence exist; the test suite covers the provider in isolation with an in-memory token store. No test drives a real MCP server through the consent redirect. | Unit-tested only | `src/modules/reactory-reactor/ai/macro/mcp/oauth/routes.ts:1-29`; `src/modules/reactory-reactor/ai/macro/mcp/oauth/__tests__/provider.test.ts:1-20` |
| 6 | **Several declared files are 0 bytes.** 40 files under the module are empty, including `src/modules/reactory-reactor/services/reactor/ReactorConversationStorage.ts`, `src/modules/reactory-reactor/services/reactor/ReactorMacroProviderService.ts`, `src/modules/reactory-reactor/ai/decorators/toolDecorator.ts`, `src/modules/reactory-reactor/ai/macro/develop/form/index.ts`, `src/modules/reactory-reactor/ai/macro/develop/form/types.ts`, `src/modules/reactory-reactor/ai/openai/chat/index.ts`, `src/modules/reactory-reactor/ai/training/index.ts`, `src/modules/reactory-reactor/docs/reactor-system-graph.md`, 5 `ai/skills/form-building/*.md` and both `ai/skills/graphql/*.md`. Two of those are named after services that do not exist and are imported by nothing. | 40 files | [evidence.md](./evidence.md) §0-byte |

### Additional limitations verified in the same pass

| Limitation | Evidence |
|---|---|
| The `reactor` extension block declares 5 empty arrays — providers, tools, agents, macros and MCP are all registered elsewhere. Any tooling that reads the block will under-report the module. | `src/modules/reactory-reactor/index.ts:56-63` |
| `reactor.StreamingConversationService@1.0.0` is decorated but not registered; only its unit test references it. | `src/modules/reactory-reactor/services/reactor/StreamingConversationService.ts:16` |
| The `reactor-service-catalog-manager` persona directory is never imported, so it cannot be selected — an unregistered draft, not a shipped agent. | `src/modules/reactory-reactor/ai/persona/reactor-service-catalog-manager/index.ts:1` |
| `reactor.AWSBedrockService@1.0.0` is authored but absent from the service load array, so Amazon Bedrock cannot serve a turn despite `amazon` being a registered provider with an adapter. | `src/modules/reactory-reactor/services/reactor/providers/AWSBedrockService.ts:53`; `src/modules/reactory-reactor/services/index.ts:34-67` |
| `ai/macro/email/` and `ai/macro/fastai/` are stub directories and are deliberately excluded from `MacroRegistry`. | `src/modules/reactory-reactor/ai/macro/index.ts:116-117` |
| The module `src/modules/reactory-reactor/specification.md` and `src/modules/reactory-reactor/docs/research.md` are design records, not descriptions of behaviour; `src/modules/reactory-reactor/docs/reactor-system-graph.md` is 0 bytes. | `src/modules/reactory-reactor/specification.md`, `src/modules/reactory-reactor/docs/research.md`, `src/modules/reactory-reactor/docs/reactor-system-graph.md` |
| The module `src/modules/reactory-reactor/AGENT.md` states the wrong FQN (`reactory.reactory-reactor@1.0.0`). | `src/modules/reactory-reactor/AGENT.md` header vs `src/modules/reactory-reactor/index.ts:20-22` |

### Roadmap (not implemented — do not describe as available)

| Item | Why it is roadmap rather than status |
|---|---|
| Load `AgentInstruction` and `SessionContinuation` | They exist and are referenced by the workflow README; they are one array entry each away from working. |
| Register `AWSBedrockService` | The adapter is written; only the load array is missing. |
| Delete or implement the 0-byte service and macro files | Leaving the names in place makes imports look plausible and silently resolve to `undefined`. |
| Wire `FormMacro` into `MacroRegistry` or delete it | Currently the only server-side form-generation path, and unreachable. |
| MCP OAuth E2E | Needs a real consent-flow test, not a unit fake. |
| Migrate the `reactor` block | Either populate the five arrays or remove them; the current shape misleads every reader. |

---

## 10. Evidence index

Every claim above resolves to a `file:line` in `reactory-express-server`. The **full index** — 168
references grouped by template section, the 40-file zero-byte inventory, and the command behind each
count — is [evidence.md](./evidence.md), checked by `scripts/verify-reactor-docs.js`.

The highest-value claims, for a reviewer who wants to spot-check without opening the appendix:

| Claim | Reference |
|---|---|
| Module id, namespace, version, name | `src/modules/reactory-reactor/index.ts:19` |
| Extension points and the `reactor` block | `src/modules/reactory-reactor/index.ts:25` |
| Reactor block declares five empty arrays | `src/modules/reactory-reactor/index.ts:56` |
| Service load array (32 entries) | `src/modules/reactory-reactor/services/index.ts:34` |
| Provider services registered | `src/modules/reactory-reactor/services/index.ts:43` |
| Provider registry (9 entries) | `src/modules/reactory-reactor/ai/providers/providers.yaml:18` |
| Response adapters (5 implementations) | `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:262` |
| Bedrock authored but unloaded | `src/modules/reactory-reactor/services/reactor/providers/AWSBedrockService.ts:53` |
| Conversation engine entry points | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:5626` |
| Streaming routes registered | `src/modules/reactory-reactor/services/reactor/StreamingEndpoints.ts:56` |
| Transcript table | `src/modules/reactory-reactor/models/ReactorConversationMessage.ts:73` |
| Failure table | `src/modules/reactory-reactor/models/ReactorAiFailure.ts:47` |
| Chat query/mutation surface | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1027` |
| Provider admin mutations | `src/modules/reactory-reactor/graphql/schema/ReactorProviders.graphql:332` |
| Approval-mode enum | `src/modules/reactory-reactor/ai/openai/types/chat.ts:12` |
| Auto tool-loop cap (default 200) | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:6208` |
| Anthropic hard cap (25) | `src/modules/reactory-reactor/services/reactor/providers/AnthropicService.ts:50` |
| `agent_conversation` step registered | `src/modules/reactory-reactor/workflow/steps/index.ts:186` |
| Workflow load array (11 of 13) | `src/modules/reactory-reactor/workflow/index.ts:39` |
| `AgentInstruction` exists, not loaded | `src/modules/reactory-reactor/workflow/AgentInstruction.yaml:1` |
| `SessionContinuation` exists, not loaded | `src/modules/reactory-reactor/workflow/SessionContinuation.yaml:1` |
| `FormMacro` defined | `src/modules/reactory-reactor/ai/macro/develop/form/macro.ts:189` |
| `FormMacro` omitted from the registry | `src/modules/reactory-reactor/ai/macro/develop/index.ts:13` |
| MCP OAuth callback route | `src/modules/reactory-reactor/ai/macro/mcp/oauth/routes.ts:29` |
| MCP OAuth unit test | `src/modules/reactory-reactor/ai/macro/mcp/oauth/__tests__/provider.test.ts:1` |
| Skill registry (9 registered) | `src/modules/reactory-reactor/ai/skills/index.ts:5` |
| Zero-byte service placeholder | `src/modules/reactory-reactor/services/reactor/ReactorConversationStorage.ts` |
| Zero-byte macro placeholder | `src/modules/reactory-reactor/services/reactor/ReactorMacroProviderService.ts` |
| Client-advertised tool names | `src/modules/reactory-reactor/ai/persona/clientTools.ts:1` |
| System graph kernel | `src/modules/reactory-reactor/services/SystemGraphManager.ts:262` |
| Playwright service | `src/modules/reactory-reactor/services/playwright/ReactorPlaywrightService.ts:24` |

Platform-level claims (providers, personas, tools, skills, MCP, workflow integration) are indexed on
the agent pages under [`04-agents/`](../../04-agents/overview.md).
