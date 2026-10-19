---
title: Personas
status: Implemented
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-reactor@ffb54c3
audience: developer
---

# Personas

A persona is a named agent configuration: system prompt, model/provider, tool scope, skill set and
canned prompts. Reactory uses "persona" and "agent" interchangeably; a **conversation** is one
running session of a persona.

- Loader: `src/modules/reactory-reactor/ai/persona/loader/persona-loader.ts:98`
- Definitions: `src/modules/reactory-reactor/ai/persona/<id>/agent.yaml`
- Template: `src/modules/reactory-reactor/ai/persona/loader/persona-template.yaml`
- Code-registered personas: `reactor`, `booktutor`, `dataanalytics`, `infrastructure`, `security`,
  `workflowwill` (`src/modules/reactory-reactor/models/index.ts:7-12`)

## Shipped personas

| Id | Name | Default provider / model |
|---|---|---|
| `ReactorAIPersona` (`reactor`) | Reactor | code-registered |
| `BookTutorAIPersona` | BookTutor | `google` / `GOOGLE_AI_STUDIO_MODEL_ID` (default `gemini-2.5-pro`) (`src/modules/reactory-reactor/ai/persona/booktutor/agent.yaml:6-11`) |
| `CEOClive` | CEO Clive | `google` (`src/modules/reactory-reactor/ai/persona/ceoclive/agent.yaml:9-22`) |
| `cmd` | CMD | `google` (`src/modules/reactory-reactor/ai/persona/cmd/agent.yaml:10-18`) |
| `Formidable` | Formidable Fran | `google` (`src/modules/reactory-reactor/ai/persona/formidable/agent.yaml:11-30`) |
| `GitGuardian` | Git Guardian Gwen | `google` (`src/modules/reactory-reactor/ai/persona/gitguardian/agent.yaml:9-22`) |
| `QualityQuinn` | Quality Quinn | `google` (`src/modules/reactory-reactor/ai/persona/qualityquinn/agent.yaml:10-23`) |
| `support` | Support Susan | `google` (`src/modules/reactory-reactor/ai/persona/support/agent.yaml:9-22`) |

`reactor-service-catalog-manager/` is a persona directory with a prompt and an `src/modules/reactory-reactor/index.ts`, but it is
**not imported anywhere** — it is not in `src/modules/reactory-reactor/models/index.ts` and no other module file references it, so
it cannot be selected. Treat it as an unregistered draft, not as a shipped agent.

Note that every YAML persona defaults to a **Google** model via
`${GOOGLE_AI_STUDIO_MODEL_ID:-gemini-2.5-pro}`. In a deployment without a Google credential, every
YAML persona is unavailable until its `modelId`/`providerId` is overridden — the persona itself is
valid, the provider is not (`providers.md`, "Availability is credential-driven").

## What a persona controls

| Concern | Where |
|---|---|
| System prompt / identity | `agent.yaml` + `persona.md`-style prompt files; merged with per-conversation `instructions` (`append` \| `prepend` \| `replace`) |
| Model + provider | `modelId`, `providerId`; overridable per session (`ReactorSetChatModelProvider`) and per workflow step |
| Tool scope | The persona's tool/include lists, matched against `MacroRegistry` (`ai/persona/*/toolIncludes.ts`) |
| Skills | Which skill ids the persona may load |
| Canned prompts | Named prompts rendered with `${...}` variables, callable from a workflow via `promptKey` |
| Client tools | Client-advertised tool names declared in `src/modules/reactory-reactor/ai/persona/clientTools.ts` |

## Tool scope and the client-tool trap

A persona's include list is matched against the **server** `MacroRegistry`. Five names —
`form`, `component`, `chart`, `d3`, `image` — are advertised by the **client**, not the server. They
have no registry entry, and listing them in a server include list makes the persona think it has a
tool it cannot call.

This was the defect fixed in `reactory-reactor` PR #17: the include lists were extracted to
`toolIncludes.ts` so a contract test can assert no client-only name appears in them
(`src/modules/reactory-reactor/ai/persona/clientTools.ts` documents the five names once). When you add a persona, follow the same
pattern: server tools in the include list, client tools referenced from `src/modules/reactory-reactor/ai/persona/clientTools.ts`.

## Conversation scoping

A conversation is scoped by `use_case` (`standalone`, `workflow`, `content`, `form`, …) so a chat
opened beside a content editor never resumes an unrelated chat
(`src/modules/reactory-reactor/models/ReactorChatState.ts` — `use_case` field doc). Delegations add `parentSessionId`, and the
child sessions appear as `chats` on the parent.

## Creating a persona

1. Add `ai/persona/<id>/agent.yaml` — `id`, `name`, `modelId`, `providerId`, prompt, prompts map,
   skill and tool scope.
2. If it needs code-registered behaviour, add a component registry entry and wire it in
   `src/modules/reactory-reactor/models/index.ts:7-12`.
3. Give the persona a model that is actually available in the deployment (see the Google default
   above).
4. Add the persona to whichever menu or form launches it.
