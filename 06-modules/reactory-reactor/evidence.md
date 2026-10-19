---
title: reactory-reactor — evidence index
status: Partial
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-reactor@ffb54c3
audience: developer
---

# Evidence index — `reactory.Reactor@1.0.0`

Every claim on [README.md](./README.md) resolves to a row here. A reference is
`<path>[:<line>]`, **relative to the root of the `reactory-express-server` checkout** — the module is
a separate repository, so `src/modules/reactory-reactor/…` is the shortest unambiguous form.
`reactory-pwa-client/…` refs are resolved against that repository instead.

**This file is enforced.** `scripts/verify-reactor-docs.js` in this repository parses the tables below,
asserts that every referenced file exists, that every line number is within the file, and that the
six mandated limitations in §9 of the overview are still stated with their measured values. Adding a
claim without a line here fails the suite (`node --test test/`). The source checkout is located from
`REACTORY_SERVER_ROOT` or the sibling directory; when it is absent the citation check reports how
many refs it could not verify rather than passing silently.

---

## 1. Identity and module contract

| Claim | Ref |
|---|---|
| Module id is `reactory-reactor` | `src/modules/reactory-reactor/index.ts:19` |
| `nameSpace` is `reactory` | `src/modules/reactory-reactor/index.ts:20` |
| `version` is `1.0.0` | `src/modules/reactory-reactor/index.ts:21` |
| `name` is `Reactor`, hence FQN `reactory.Reactor@1.0.0` | `src/modules/reactory-reactor/index.ts:22` |
| Depends on `speech.SpeechService@1.0.0` | `src/modules/reactory-reactor/index.ts:23` |
| Load priority 1 | `src/modules/reactory-reactor/index.ts:24` |
| Contributes graph definitions | `src/modules/reactory-reactor/index.ts:25` |
| Contributes YAML workflows | `src/modules/reactory-reactor/index.ts:26` |
| Contributes workflow steps | `src/modules/reactory-reactor/index.ts:27` |
| Contributes forms | `src/modules/reactory-reactor/index.ts:28` |
| Contributes 32 services | `src/modules/reactory-reactor/index.ts:31` |
| `translations` is an empty array | `src/modules/reactory-reactor/index.ts:32` |
| Contributes models / DataSource | `src/modules/reactory-reactor/index.ts:35` |
| Registers `reactor-web-client-plugin` | `src/modules/reactory-reactor/index.ts:36` |
| Registers two middlewares | `src/modules/reactory-reactor/index.ts:52` |
| Registers the MCP OAuth passport provider | `src/modules/reactory-reactor/index.ts:53` |
| Registers CLI commands | `src/modules/reactory-reactor/index.ts:54` |
| `pdfs` is an empty array | `src/modules/reactory-reactor/index.ts:55` |
| `reactor` block: providers/tools/mcp/agents/macros empty, skills populated | `src/modules/reactory-reactor/index.ts:56` |
| GraphQL definitions assembly | `src/modules/reactory-reactor/graphql/index.ts:6` |
| Schema families loaded | `src/modules/reactory-reactor/graphql/schema/index.ts:3` |
| Resolver composition | `src/modules/reactory-reactor/graphql/resolvers/index.ts:13` |
| Middleware array | `src/modules/reactory-reactor/middleware/index.ts:3` |
| Service load array (32 entries) | `src/modules/reactory-reactor/services/index.ts:34` |
| `src/modules/reactory-reactor/AGENT.md` states the wrong FQN | `src/modules/reactory-reactor/AGENT.md:9` |

## 2. Purpose and status

| Claim | Ref |
|---|---|
| Conversation engine entry points exist | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:5626` |
| Session creation | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:10006` |
| History paging | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:4687` |
| Compaction | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:2206` |
| Streaming routes are registered | `src/modules/reactory-reactor/services/reactor/StreamingEndpoints.ts:56` |
| Streaming services are registered | `src/modules/reactory-reactor/services/index.ts:62` |
| Provider metadata is declarative YAML | `src/modules/reactory-reactor/ai/providers/providers.yaml:18` |
| Persona loader service decorated | `src/modules/reactory-reactor/ai/persona/loader/persona-loader.ts:98` |
| Skin/macro registry composition | `src/modules/reactory-reactor/ai/macro/index.ts:113` |
| System graph kernel | `src/modules/reactory-reactor/services/SystemGraphManager.ts:262` |
| Playwright service decorated | `src/modules/reactory-reactor/services/playwright/ReactorPlaywrightService.ts:24` |
| Playwright workflow steps | `src/modules/reactory-reactor/workflow/steps/playwright/index.ts:339` |
| Workflow load array | `src/modules/reactory-reactor/workflow/index.ts:39` |

## 3. Data model

| Claim | Ref |
|---|---|
| Conversation schema definition | `src/modules/reactory-reactor/models/ReactorChatState.ts:262` |
| Conversation collection is `reactor_conversations` | `src/modules/reactory-reactor/models/ReactorChatState.ts:737` |
| Conversation document fields (persona/model/provider/history/meta/tool mode/limits) | `src/modules/reactory-reactor/models/ReactorChatState.ts:113` |
| Side panel state persisted on the session | `src/modules/reactory-reactor/models/ReactorChatState.ts:186` |
| Usage ledger document shape | `src/modules/reactory-reactor/models/ReactorAIUsage.ts:5` |
| Usage model registration | `src/modules/reactory-reactor/models/ReactorAIUsage.ts:149` |
| Budget model registration | `src/modules/reactory-reactor/models/ReactorUserBudget.ts:117` |
| MCP registry model | `src/modules/reactory-reactor/models/MCPRegistry.ts:31` |
| MCP installed connector model | `src/modules/reactory-reactor/models/MCPInstalledConnector.ts:37` |
| Project model | `src/modules/reactory-reactor/models/ReactorProject.ts:172` |
| Graph node models | `src/modules/reactory-reactor/models/ReactorGraphNode.ts:285` |
| Graph link model | `src/modules/reactory-reactor/models/ReactorNodeLink.ts:42` |
| Graph perspective model | `src/modules/reactory-reactor/models/ReactorGraphPerspective.ts:54` |
| Message transcript table `reactor_conversation_messages` | `src/modules/reactory-reactor/models/ReactorConversationMessage.ts:73` |
| Why sessions are Mongo and messages are Postgres | `src/modules/reactory-reactor/models/ReactorConversationMessage.ts:16` |
| `usage_source` values (`provider`/`estimated`/`none`) | `src/modules/reactory-reactor/models/ReactorConversationMessage.ts:17` |
| Failure table `reactor_ai_failures` | `src/modules/reactory-reactor/models/ReactorAiFailure.ts:47` |
| Why failures are a separate table | `src/modules/reactory-reactor/models/ReactorAiFailure.ts:1` |
| Provider table `reactory_ai_providers` | `src/modules/reactory-reactor/models/ReactoryAiProvider.ts:27` |
| Model table `reactory_ai_models` | `src/modules/reactory-reactor/models/ReactoryAiModel.ts:25` |
| Pricing table `reactory_ai_model_pricing` | `src/modules/reactory-reactor/models/ReactoryAiModelPricing.ts:42` |
| Reactor Postgres DataSource | `src/modules/reactory-reactor/models/index.ts:40` |
| Provider seeding on boot | `src/modules/reactory-reactor/models/seedAiProviders.ts:10` |

## 4. GraphQL API

| Claim | Ref |
|---|---|
| Chat queries | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1027` |
| `ReactorPersonas` query | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1071` |
| Chat mutations | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1076` |
| Pending client tool calls query | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1028` |
| Complete client tool calls mutation | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1102` |
| Session-log mutation | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1138` |
| Capabilities/provider/model-for-persona queries | `src/modules/reactory-reactor/graphql/schema/ReactorCapabilities.graphql:37` |
| Provider admin queries | `src/modules/reactory-reactor/graphql/schema/ReactorProviders.graphql:200` |
| Provider admin mutations | `src/modules/reactory-reactor/graphql/schema/ReactorProviders.graphql:332` |
| Usage queries | `src/modules/reactory-reactor/graphql/schema/ReactorAIUsage.graphql:384` |
| Budget mutations | `src/modules/reactory-reactor/graphql/schema/ReactorAIUsage.graphql:422` |
| System-graph queries | `src/modules/reactory-reactor/graphql/schema/ReactorSystemGraph/queries.graphql:27` |
| System-graph mutations | `src/modules/reactory-reactor/graphql/schema/ReactorSystemGraph/mutations.graphql:186` |
| MCP queries | `src/modules/reactory-reactor/graphql/mcp/mcp.graphql:63` |
| MCP mutations | `src/modules/reactory-reactor/graphql/mcp/mcp.graphql:85` |

## 5. Services

| Claim | Ref |
|---|---|
| Service load array | `src/modules/reactory-reactor/services/index.ts:34` |
| Provider services registered (OpenAI/Google/Anthropic/Ollama) | `src/modules/reactory-reactor/services/index.ts:43` |
| `ReactorConversationService` decorated | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:341` |
| Approval-mode setter | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:2399` |
| Iteration-cap setter | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:2595` |
| Resume after limit | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:2631` |
| Interrupt tool execution | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:2746` |
| Macro execution | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:7492` |
| Tool execution | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:7922` |
| Client tool completion | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:7948` |
| Pending client tool calls | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:9604` |
| Streaming session manager service | `src/modules/reactory-reactor/services/reactor/StreamingSessionManager.ts:15` |
| Streaming transport manager service | `src/modules/reactory-reactor/services/reactor/StreamingTransportManager.ts:26` |
| Shell session manager service | `src/modules/reactory-reactor/services/reactor/ShellSessionManager.ts:89` |
| Streaming conversation service decorated but unregistered | `src/modules/reactory-reactor/services/reactor/StreamingConversationService.ts:16` |
| Bedrock service authored | `src/modules/reactory-reactor/services/reactor/providers/AWSBedrockService.ts:53` |
| Bedrock service absent from load array | `src/modules/reactory-reactor/services/index.ts:34` |
| Provider response adapters registered | `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:262` |
| Adapter map (12 provider keys, 5 implementations) | `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:544` |
| Adapter lookup | `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:1102` |
| Provider listing | `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:580` |
| Default context length 200000 | `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:23` |
| Playwright session lifecycle | `src/modules/reactory-reactor/services/playwright/ReactorPlaywrightService.ts:97` |
| Playwright screenshot/PDF | `src/modules/reactory-reactor/services/playwright/ReactorPlaywrightService.ts:289` |
| System graph subgraph | `src/modules/reactory-reactor/services/SystemGraphManager.ts:262` |
| System graph search | `src/modules/reactory-reactor/services/SystemGraphManager.ts:433` |
| System graph path finding | `src/modules/reactory-reactor/services/SystemGraphManager.ts:498` |
| System graph link CRUD | `src/modules/reactory-reactor/services/SystemGraphManager.ts:594` |
| Project cataloguing | `src/modules/reactory-reactor/services/SystemGraphManager.ts:744` |
| Ticket linking | `src/modules/reactory-reactor/services/SystemGraphManager.ts:1167` |
| Catalog job queue | `src/modules/reactory-reactor/services/SystemGraphManager.ts:1317` |
| Usage recording | `src/modules/reactory-reactor/services/reactor/ReactorAIUsageService.ts:133` |
| Budget check | `src/modules/reactory-reactor/services/reactor/ReactorAIUsageService.ts:283` |
| Budget administration | `src/modules/reactory-reactor/services/reactor/ReactorAIUsageService.ts:694` |
| Usage analytics summary | `src/modules/reactory-reactor/services/reactor/ReactorUsageAnalyticsService.ts:497` |
| Failure recording | `src/modules/reactory-reactor/services/reactor/ReactorUsageAnalyticsService.ts:958` |
| Persona loader decorated | `src/modules/reactory-reactor/ai/persona/loader/persona-loader.ts:98` |
| MCP registry service | `src/modules/reactory-reactor/services/mcp/MCPRegistryService.ts:15` |
| Document chunking service | `src/modules/reactory-reactor/services/reactor/DocumentChunkingService.ts:44` |

## 6. UI surface

| Claim | Ref |
|---|---|
| 25 form definitions registered | `src/modules/reactory-reactor/forms/index.ts:26` |
| Client plugin registration | `src/modules/reactory-reactor/index.ts:36` |
| Side panel mutation | `src/modules/reactory-reactor/graphql/schema/ReactorChat.graphql:1112` |
| Side panel state on the session document | `src/modules/reactory-reactor/models/ReactorChatState.ts:186` |
| Reactor menus registered in client config | `src/data/clientConfigs/reactory/menus/main.ts:19` |
| Client advertises `form`, `component`, `chart`, `d3`, `image` as client-only tools | `src/modules/reactory-reactor/ai/persona/clientTools.ts:1` |
| Client form-rendering macro | `reactory-pwa-client/src/components/shared/ReactorChat/hooks/macros/form.macro.tsx:1` |
| Client chart macro | `reactory-pwa-client/src/components/shared/ReactorChat/hooks/macros/chart.macro.tsx:63` |
| Client D3 macro | `reactory-pwa-client/src/components/shared/ReactorChat/hooks/macros/d3.macro.tsx:1` |
| Client side-panel macro | `reactory-pwa-client/src/components/shared/ReactorChat/hooks/macros/sidePanelState.macro.tsx:1` |
| Client side panel component | `reactory-pwa-client/src/components/shared/ReactorChat/components/SidePanel.tsx:1` |
| Client macro registry | `reactory-pwa-client/src/components/shared/ReactorChat/hooks/macros/index.ts:1` |

## 7. Workflows

| Claim | Ref |
|---|---|
| `agent_conversation` step registered | `src/modules/reactory-reactor/workflow/steps/index.ts:186` |
| `graph_query` step registered | `src/modules/reactory-reactor/workflow/steps/index.ts:195` |
| `process_conversation` step registered | `src/modules/reactory-reactor/workflow/steps/index.ts:204` |
| Playwright step family registered | `src/modules/reactory-reactor/workflow/steps/index.ts:211` |
| `agent_conversation` designer definition | `src/modules/reactory-reactor/workflow/steps/index.ts:41` |
| Designer default `maxToolIterations: 10` | `src/modules/reactory-reactor/workflow/steps/index.ts:89` |
| `agent_conversation` config contract | `src/modules/reactory-reactor/workflow/steps/AgentConversationStep.ts:1` |
| `agent_conversation` output contract | `src/modules/reactory-reactor/workflow/steps/AgentConversationStep.ts:46` |
| Workflow load array (11 entries) | `src/modules/reactory-reactor/workflow/index.ts:39` |
| Core-namespace agentic pipeline entries | `src/modules/reactory-reactor/workflow/index.ts:52` |
| `AgentInstruction` exists on disk, not loaded | `src/modules/reactory-reactor/workflow/AgentInstruction.yaml:1` |
| `SessionContinuation` exists on disk, not loaded | `src/modules/reactory-reactor/workflow/SessionContinuation.yaml:1` |
| `AgentGitCommit` is agentic | `src/modules/reactory-reactor/workflow/AgentGitCommit.yaml:1` |
| `AgentGitWorktree` is agentic | `src/modules/reactory-reactor/workflow/AgentGitWorktree.yaml:1` |
| `ProcessConversationWorkflow` step | `src/modules/reactory-reactor/workflow/ProcessConversationWorkflow.yaml:1` |

## 8. Operations

| Claim | Ref |
|---|---|
| Provider registry entries (9) | `src/modules/reactory-reactor/ai/providers/providers.yaml:18` |
| Operator overlay is merged, later wins | `src/modules/reactory-reactor/ai/providers/provider-loader.ts:206` |
| Env interpolation `${VAR:-default}` | `src/modules/reactory-reactor/ai/providers/provider-loader.ts:138` |
| Availability is credential-driven | `src/modules/reactory-reactor/ai/providers/provider-loader.ts:161` |
| Missing `contextLength` report | `src/modules/reactory-reactor/ai/providers/provider-loader.ts:321` |
| Provider credential env var shape | `src/modules/reactory-reactor/ai/providers/providers.yaml:29` |
| Provider admin mutations | `src/modules/reactory-reactor/graphql/schema/ReactorProviders.graphql:332` |
| Per-user provider auth prefix | `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:13` |
| Approval modes enum | `src/modules/reactory-reactor/ai/openai/types/chat.ts:12` |
| `safeForAutoExecution` flag | `src/modules/reactory-reactor/ai/openai/types/chat.ts:100` |
| Auto tool-loop cap from env, default 200 | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:6208` |
| Pause-at-limit behaviour | `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:6657` |
| Anthropic hard cap of 25 | `src/modules/reactory-reactor/services/reactor/providers/AnthropicService.ts:50` |
| Anthropic agentic loop | `src/modules/reactory-reactor/services/reactor/providers/AnthropicService.ts:1409` |
| Streaming route inventory | `src/modules/reactory-reactor/services/reactor/StreamingEndpoints.ts:56` |
| Usage ledger fields | `src/modules/reactory-reactor/models/ReactorAIUsage.ts:5` |
| Failure telemetry rationale | `src/modules/reactory-reactor/models/ReactorAiFailure.ts:1` |

## 9. Limitations

| Claim | Ref |
|---|---|
| 9 provider entries in the module registry | `src/modules/reactory-reactor/ai/providers/providers.yaml:18` |
| Provider ids: xai, google, copilot, azure-openai, anthropic, amazon, cohere, ollama | `src/modules/reactory-reactor/ai/providers/providers.yaml:258` |
| 5 adapter implementations | `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:262` |
| 4 provider services registered | `src/modules/reactory-reactor/services/index.ts:43` |
| 9 skills registered | `src/modules/reactory-reactor/ai/skills/index.ts:5` |
| Last registered skill | `src/modules/reactory-reactor/ai/skills/index.ts:140` |
| Zero-byte skill placeholder (`macro-building`) | `src/modules/reactory-reactor/ai/skills/macro-building/reactory-macro-creation.md` |
| `FormMacro` definition | `src/modules/reactory-reactor/ai/macro/develop/form/macro.ts:189` |
| `FormMacro` excluded from the registry | `src/modules/reactory-reactor/ai/macro/develop/index.ts:13` |
| MCP OAuth callback route | `src/modules/reactory-reactor/ai/macro/mcp/oauth/routes.ts:29` |
| MCP OAuth unit test | `src/modules/reactory-reactor/ai/macro/mcp/oauth/__tests__/provider.test.ts:1` |
| Email/FastAI stubs deliberately excluded | `src/modules/reactory-reactor/ai/macro/index.ts:116` |
| Empty arrays in the `reactor` block | `src/modules/reactory-reactor/index.ts:57` |
| `StreamingConversationService` unregistered | `src/modules/reactory-reactor/services/reactor/StreamingConversationService.ts:16` |
| Bedrock authored, unregistered | `src/modules/reactory-reactor/services/reactor/providers/AWSBedrockService.ts:53` |
| The system-graph doc page is empty | `src/modules/reactory-reactor/docs/reactor-system-graph.md` |
| `src/modules/reactory-reactor/specification.md` is a design record | `src/modules/reactory-reactor/specification.md:1` |

## 10. Zero-byte file inventory

Produced by:

```bash
find src/modules/reactory-reactor -type f -size 0 \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort | wc -l   # 40
```

```
src/modules/reactory-reactor/ai/decorators/toolDecorator.ts
src/modules/reactory-reactor/ai/macro/chats/description.md
src/modules/reactory-reactor/ai/macro/develop/form/index.ts
src/modules/reactory-reactor/ai/macro/develop/form/types.ts
src/modules/reactory-reactor/ai/macro/develop/review/frameworks/presets/java-spring.ts
src/modules/reactory-reactor/ai/macro/develop/review/frameworks/presets/java-vanilla.ts
src/modules/reactory-reactor/ai/macro/develop/review/frameworks/presets/nodejs-express.ts
src/modules/reactory-reactor/ai/macro/develop/review/readme.md
src/modules/reactory-reactor/ai/macro/email/macro.ts
src/modules/reactory-reactor/ai/macro/email/readme.md
src/modules/reactory-reactor/ai/macro/email/types.ts
src/modules/reactory-reactor/ai/macro/fastai/macro.ts
src/modules/reactory-reactor/ai/macro/fastai/readme.md
src/modules/reactory-reactor/ai/macro/fastai/types.ts
src/modules/reactory-reactor/ai/macro/fs/WriteFile.ts
src/modules/reactory-reactor/ai/macro/graphql/readme.md
src/modules/reactory-reactor/ai/macro/shell/readme.md
src/modules/reactory-reactor/ai/macro/user/readme.md
src/modules/reactory-reactor/ai/macro/web/readme.md
src/modules/reactory-reactor/ai/openai/chat/index.ts
src/modules/reactory-reactor/ai/skills/form-building/grid-basics.md
src/modules/reactory-reactor/ai/skills/form-building/grid-with-custom-widgets.md
src/modules/reactory-reactor/ai/skills/form-building/grid-with-details-panel.md
src/modules/reactory-reactor/ai/skills/form-building/simple-page.md
src/modules/reactory-reactor/ai/skills/form-building/tabbed-interfaces.md
src/modules/reactory-reactor/ai/skills/graphql/resolver-classes.md
src/modules/reactory-reactor/ai/skills/graphql/schema-inference.md
src/modules/reactory-reactor/ai/skills/macro-building/reactory-macro-creation.md
src/modules/reactory-reactor/ai/skills/services/writing-services.md
src/modules/reactory-reactor/ai/training/index.ts
src/modules/reactory-reactor/build/post-build.sh
src/modules/reactory-reactor/build/pre-build.sh
src/modules/reactory-reactor/cli/reactor-cli/messages/goodbye.txt
src/modules/reactory-reactor/cli/reactor-cli/messages/help.txt
src/modules/reactory-reactor/docs/reactor-system-graph.md
src/modules/reactory-reactor/forms/widgets/lib/three/OrbitControls-global.js
src/modules/reactory-reactor/forms/widgets/test-gltf-loader.html
src/modules/reactory-reactor/middleware/.env.local
src/modules/reactory-reactor/services/reactor/ReactorConversationStorage.ts
src/modules/reactory-reactor/services/reactor/ReactorMacroProviderService.ts
```

## 11. Measurement commands

Every count in `README.md` was produced by one of these, run from the repository root:

```bash
# Markdown volume (matches the ticket's 14,867 lines)
find src/modules/reactory-reactor -name '*.md' -not -path '*/node_modules/*' \
  -not -path '*/.git/*' -exec cat {} + | wc -l                       # 14867

# Code surface
find src/modules/reactory-reactor/services -name '*.ts' | wc -l       # 175
find src/modules/reactory-reactor/forms -name '*.ts' | wc -l          # 127
find src/modules/reactory-reactor/forms -mindepth 1 -maxdepth 1 -type d | wc -l  # 22
ls src/modules/reactory-reactor/workflow/*.yaml | wc -l               # 13

# Provider registry
grep -c '^  - id:' src/modules/reactory-reactor/ai/providers/providers.yaml          # 9
grep -c '^  - id:' ~/.reactor/providers.yaml                                        # 2 (operator overlay)

# Adapter implementations (5) vs adapter keys (12)
grep -c 'this.adapters.set(' src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts

# Workflows in the load array (11 of 13)
grep -c "name: '" src/modules/reactory-reactor/workflow/index.ts

# Skills: registered vs authored vs empty
grep -c "id: 'reactory\." src/modules/reactory-reactor/ai/skills/index.ts            # 9
find src/modules/reactory-reactor/ai/skills -name '*.md' | wc -l                     # 18
find src/modules/reactory-reactor/ai/skills -name '*.md' -size +0 | wc -l            # 9
find src/modules/reactory-reactor/ai/skills -name '*.md' -size 0 | wc -l             # 9

# Zero-byte files
find src/modules/reactory-reactor -type f -size 0 \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | wc -l                         # 40
```
