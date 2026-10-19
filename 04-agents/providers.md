---
title: AI providers
status: Partial
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-reactor@ffb54c3
audience: developer
---

# AI providers

A provider is a **credential + endpoint + model catalogue**. It is not the code that talks to it —
that is an adapter. Reactory keeps the two separate so a new model can be added without a deploy,
while a new *protocol* still needs code.

- Registry: `src/modules/reactory-reactor/ai/providers/providers.yaml`
- Loader: `src/modules/reactory-reactor/ai/providers/provider-loader.ts`
- Runtime service: `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts`
- Seed to Postgres: `src/modules/reactory-reactor/models/seedAiProviders.ts:10`
- Admin API: `ReactorAiProvidersAdmin`, `ReactorAiModelsAdmin`, `ReactorCreateAiProvider`,
  `ReactorUpdateAiProvider`, `ReactorTestAiProvider`, `ReactorSyncAiProvidersFromYaml`
  (`src/modules/reactory-reactor/graphql/schema/ReactorProviders.graphql:200-346`)

## What is registered today

**9 providers** in the module registry: `openai` (`src/modules/reactory-reactor/ai/providers/providers.yaml:18`), `xai` (`:258`), `google`
(`:536`), `copilot` (`:832`), `azure-openai` (`:906`), `anthropic` (`:1022`), `amazon` (`:1222`),
`cohere` (`:1279`), `ollama` (`:1367`).

**2 more** can appear from the operator overlay `~/.reactor/providers.yaml` (currently `llamacpp` and
`deepseek`). The merged registry is therefore deployment-specific — never quote "10 providers" as a
platform constant without saying where it was measured.

**5 response-adapter implementations** serve that registry
(`src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:262-555`): OpenAI-compatible (openai, xai, azure-openai, copilot, ollama,
llamacpp, vllm, deepseek), Google, Amazon, Anthropic, Cohere.

**4 provider *services*** are registered to actually run a turn: OpenAI, Google, Anthropic, Ollama
(`src/modules/reactory-reactor/services/index.ts:43-47`). `AWSBedrockService` exists (`src/modules/reactory-reactor/services/reactor/providers/AWSBedrockService.ts:53`) but is
not in the load array, so `amazon` is a registered provider with an adapter and no reachable
implementation. This is the concrete meaning of "10 providers registered / 5 native adapters" in the
module ticket: breadth in metadata, depth in a subset.

## Resolution order

1. **Module YAML** — shipped with the module.
2. **Operator overlay** — `~/.reactor/providers.yaml`, same `id` replaces, new `id` adds
   (`src/modules/reactory-reactor/ai/providers/provider-loader.ts:206`).
3. **Database** — seeded from YAML on first boot, then authoritative for what is enabled, and
   editable through the admin mutations.

`${VAR}` / `${VAR:-default}` is interpolated across the YAML, including endpoint URLs
(`src/modules/reactory-reactor/ai/providers/provider-loader.ts:138`). That is how `OPENAI_API_URL` and friends override a base URL per
deployment.

## Credentials

- Each provider declares `credentialRequirements` and `credentialEnvVars`
  (`src/modules/reactory-reactor/ai/providers/providers.yaml:29` is the OpenAI example: `apiKey: OPENAI_API_KEY`).
- **Availability is credential-driven**: a provider is `available` only if at least one declared env
  var is non-empty (`src/modules/reactory-reactor/ai/providers/provider-loader.ts:161`). Registered ≠ usable.
- Per-user credentials are encrypted and stored under `ai-provider:<id>`. The resolution order is
  session → user → app → persona → environment (`ResolvedCredentials.source` in
  `src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts`).
- Admin surfaces mask keys (`maskKey`), they never return them.

## Model metadata that changes behaviour

| Field | Effect |
|---|---|
| `contextLength` | Context window. Absent → `DEFAULT_CONTEXT_LENGTH = 200000` (`src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:23`) with a WARN, because an invented limit is how a conversation gets capped at a number no model has. Gaps are reported at load (`src/modules/reactory-reactor/ai/providers/provider-loader.ts:321`). |
| `sampling` (`temperature`/`topP`/`topK`) | Newer Anthropic models **reject** these with a 400; declaring `false` suppresses the parameter (`src/modules/reactory-reactor/ai/providers/provider-loader.ts:8-24`). |
| `thinking` (`adaptive`/`budget`/`none`) | Selects the request shape for extended thinking. `budget_tokens` on an adaptive-only model is a 400 (`src/modules/reactory-reactor/ai/providers/provider-loader.ts:26-44`). |
| `capabilities` | Drives `ReactorModelsForPersona` — a persona only sees models that cover its required capabilities. |
| Cost columns | Feed the usage ledger and budget enforcement; `inputCostPerTokenUsdCents`/`outputCostPerTokenUsdCents` are per-million-style integer cents. |

## Adding a provider

| You want to… | Do this | Deploy needed? |
|---|---|---|
| Add a model to an existing provider family | Add a model entry to YAML (or `ReactorCreateAiModel`) | YAML: yes at boot; mutation: no |
| Add an OpenAI-compatible endpoint | Add a provider entry with an OpenAI-compatible `id` and add the id to the adapter map (`src/modules/reactory-reactor/services/reactor/ReactorProviderService.ts:544-551`) | Yes (adapter map is code) |
| Add a new protocol | Write a service extending `AIProviderBase`, register it in `src/modules/reactory-reactor/services/index.ts` | Yes |
| Rotate a key | Change the env var / per-user credential; no registry change | No |
