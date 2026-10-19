---
title: Macros and tools
status: Partial
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-reactor@ffb54c3
audience: developer
---

# Macros and tools

A **macro** is a server function an agent can call. A **tool** is the model-facing declaration of
that macro (name, description, JSON-Schema parameters). In Reactory one `MacroComponentDefinition`
carries both, and `MacroRegistry` is the single list the conversation engine resolves against.

- Registry: `src/modules/reactory-reactor/ai/macro/index.ts:113-133`
- Definitions: `src/modules/reactory-reactor/ai/macro/<family>/`
- Instructions: `src/modules/reactory-reactor/ai/macro/INSTRUCTIONS_GUIDE.md`
- Reference list injected into prompts: `src/modules/reactory-reactor/ai/macro/macros.md`

## What is registered

| Family | Examples |
|---|---|
| `fs` | `readFile`, `readChatFile`, `snip`, `listDirectory`, `writeFile` |
| `develop` | `review`, `reviewFile` |
| `graphql` | `gql` (query), `gml` (mutation) |
| `runtime` | `toolkit`, `addToolsToSession`, `removeToolsFromSession` |
| `shell` | shell session primitives |
| `user` | `getUser`, `searchUser`, `createUser` |
| `web` | `fetch`, `http` |
| `workflow` | `svc` (service registry access) |
| `chats` | conversation control, delegation (`speakto`), `updateChatData` |
| `mcp` | MCP client tool calls |
| `projects` | project cataloguing/read surfaces |
| `graph` | system-graph traversal |
| `data` | data/SQL access |
| `develop/module` | module scaffolding |
| `playwright` | browser sessions |
| `skills` | `searchSkills`, `readSkill` |
| `support` | `getSupportTicket`, `listSupportTickets`, `createSupportTicket`, `updateSupportTicket`, `addSupportTicketComment` |

**Deliberately excluded:** `ai/macro/email/` and `ai/macro/fastai/` are stub directories and are not
spread into the registry (`src/modules/reactory-reactor/ai/macro/index.ts:116-117`). Do not describe email/FastAI macros as
available.

## The unreachable form-gen macro

`src/modules/reactory-reactor/ai/macro/develop/form/macro.ts` contains a complete, interactive `FormMacro` and exports
`FormMacroComponentRegister` (`:189`). It is **not reachable**: `src/modules/reactory-reactor/ai/macro/develop/index.ts:13-16`
exports only `CodeReviewComponentRegister` and `CodeReviewFileComponentRegister`, and `MacroRegistry`
spreads that default export. So `@FormMacro(...)` can never resolve.

What *does* work for forms is the client side: the agent emits a `form` tool call, and the PWA client
renders it (`reactory-pwa-client/.../hooks/macros/form.macro.tsx`). See
[module page §6](../06-modules/reactory-reactor/README.md).

If you are looking for "the server generates a form from a prompt", the code exists but no
deployment can call it. Treat it as roadmap (§9 of the module page).

## Executing a macro

```ts
// ai/macro/index.ts
executeMacro('@readFile(path: "...")', state)
processMacroInstructionSet(['@gql(query: "...")'], state)
```

The engine parses `@name(args)` text out of model output and calls the registered function. Two
parameter shapes are supported: legacy positional (`args`) and named (mapped by the tool schema's
property order). New macros should declare a schema.

## Approval modes

Every tool call is subject to the session's approval mode (`src/modules/reactory-reactor/ai/openai/types/chat.ts:12-17`):

| Mode | Behaviour |
|---|---|
| `auto` | Run everything. Default for `agent_conversation`. |
| `safe_auto` | Run tools flagged `safeForAutoExecution` (`src/modules/reactory-reactor/ai/openai/types/chat.ts:100`); prompt for the rest. |
| `prompt` | Prompt before every tool. |
| `plan` | Read-only tools run; anything with side effects waits. |

Tools that mutate state should never be flagged safe. Tools that only read should be.

## Iteration and interruption

| Control | Value |
|---|---|
| Session cap | `maxToolIterations` (validated `>= 1`) |
| Auto-loop cap | `conversation.maxToolIterations` else `REACTOR_MAX_TOOL_ITERATIONS`, default 200 |
| Anthropic provider loop | hard cap 25 |
| At the cap | the turn pauses with an approval request, not an error |
| Resume | `continueToolExecution` |
| Interrupt | `interruptToolExecution` |
| Client-owned tool | `ReactorPendingClientToolCalls` / `ReactorCompleteClientToolCalls` |

The two caps are a real hazard: a workflow configured for 50 iterations still stops at 25 on
Anthropic.

## Contract tests

`src/modules/reactory-reactor/ai/macro/__tests__/MacroRegistry.contract.test.ts` asserts the registry shape (expected server tool
names present, no duplicates, no client-only names addressable, no server-side definition directory
for a client macro). Add a row there when you add a tool — that file is the ratchet that keeps the
registry honest.
