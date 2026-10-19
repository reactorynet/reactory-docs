---
title: The agentic layer — five layers
status: Partial
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-reactor@ffb54c3
audience: developer
---

# The agentic layer

Reactory's agentic layer is **one module** (`reactory.Reactor@1.0.0`) with **five layers**. Keeping
them separate in your head is the difference between "the agent is broken" and "the agent has no
tool for that".

```
  ┌──────────────────────────────────────────────────────────────┐
  │ 5. Workflows      agent_conversation as a durable step       │
  ├──────────────────────────────────────────────────────────────┤
  │ 4. Skills         markdown procedures loaded on demand       │
  ├──────────────────────────────────────────────────────────────┤
  │ 3. Tools/macros   what the model may call                    │
  ├──────────────────────────────────────────────────────────────┤
  │ 2. Personas       who is answering, with which model/tools   │
  ├──────────────────────────────────────────────────────────────┤
  │ 1. Providers      where the tokens come from                 │
  └──────────────────────────────────────────────────────────────┘
```

| Layer | Question it answers | Page |
|---|---|---|
| Providers | Where do completions come from, and with whose credentials? | [providers.md](./providers.md) |
| Personas | Who is the agent — prompt, model, tool scope, skills? | [personas.md](./personas.md) |
| Tools / macros | What can the agent *do*? | [macros-and-tools.md](./macros-and-tools.md) |
| Skills | What does the agent *know how to do*? | [skills.md](./skills.md) |
| Workflows | How does an agent turn become a durable step? | [agents-in-workflows.md](./agents-in-workflows.md) |

Two cross-cutting surfaces have their own page: [mcp-client-and-server.md](./mcp-client-and-server.md)
(the agent talking to external tool servers, and other agents talking to Reactory).

## The request path

```
client (PWA ReactorChat)
  └─ ReactorSendMessage mutation  ──┐
                                    ├─► ReactorConversationService.sendMessage
workflow (agent_conversation step) ─┘        │
                                             ├─ resolve persona         (PersonaLoaderService)
                                             ├─ resolve provider+model  (ReactorProviderService)
                                             ├─ assemble context        (history window + skills)
                                             ├─ call provider           (OpenAIService / GoogleAIService /
                                             │                           AnthropicService / OllamaAIService)
                                             ├─ execute tool calls      (MacroRegistry, approval mode)
                                             └─ persist + emit          (Postgres transcript, Mongo session,
                                                                          SSE events, usage ledger)
```

Both entry points converge on the same service. That is deliberate: there is no second agent runtime,
so an approval-mode bug or a tool-scope bug cannot exist in only one path.

Evidence: `src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:5626`
(`sendMessage`), `:10006` (`startChatSession`);
`src/modules/reactory-reactor/workflow/steps/AgentConversationStep.ts:1-52`.

## What "agent" means here

Reactory uses "persona" and "agent" interchangeably for the *configuration* of an agent, and
"conversation"/"session" for one running instance of it. A **delegation** is a persona starting a
child conversation with another persona (`chats` macro, `action: speakto`); the child session records
`parentSessionId`.

## Status

The layer is `Partial`, not `Implemented`. Read the limitations before designing on it:

- [Module page §9](../06-modules/reactory-reactor/README.md) is the
  authoritative list — providers registered vs adapters that can serve, skills registered vs
  authored, workflows in the load array, unreachable macros, MCP OAuth validation, zero-byte files.
- Two facts to carry into any design review: **the `reactor` block in `src/modules/reactory-reactor/index.ts` declares five empty
  arrays** (capabilities are registered elsewhere), and **the server advertises some tools the client
  owns** (`form`, `component`, `chart`, `d3`, `image`).
