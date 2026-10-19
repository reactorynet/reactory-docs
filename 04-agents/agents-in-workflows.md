---
title: Agents in workflows
status: Partial
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-reactor@ffb54c3
audience: developer
---

# Agents in workflows

The `agent_conversation` step makes an agent turn a **durable, retryable step** in a larger YAML
workflow. This is what separates "chat with an AI" from "use an AI inside a process".

- Step implementation: `src/modules/reactory-reactor/workflow/steps/AgentConversationStep.ts:1-52`
- Registration + designer definition: `src/modules/reactory-reactor/workflow/steps/index.ts:41-192`
- Related steps: `graph_query` (`:195`), `process_conversation` (`:204`), Playwright family (`:211`)
- Workflow load array: `src/modules/reactory-reactor/workflow/index.ts:39-55`

## Why it delegates

The step calls `reactor.ReactorConversationService@1.0.0` — `startChatSession` (with
`systemPrompt = instructions`, `toolApprovalMode = auto`) then `sendMessage`. Tool execution, persona
resolution and persistence are therefore the same code path as interactive chat. There is no second
agent runtime to keep in sync.

## Configuration

| Key | Required | Meaning |
|---|---|---|
| `personaId` | yes | The agent to converse with |
| `message` | unless `promptKey` | Prompt body; supports `${...}` substitution from workflow variables |
| `promptKey` + `promptVariables` | no | Use a named canned prompt from the persona |
| `instructions` + `promptMergeStrategy` | no | System prompt, merged `append` (default) / `prepend` / `replace` |
| `toolApprovalMode` | no | `auto` (default) / `safe_auto` / `prompt` / `plan` |
| `maxToolIterations` | no | Cap for this session |
| `sessionId` | no | Resume an existing conversation — the idempotency lever |
| `model` / `provider` | no | Per-turn override |
| `providerConfig` | no | Structured output schema, reasoning effort, sampling, modalities |
| `role` / `toolCallId` / `toolName` / `toolArgs` | no | Answer a pending client tool call |

Output: `{ sessionId, content, response }`.

## The idempotency pattern

```yaml
- id: review
  type: agent_conversation
  config:
    personaId: reactor
    sessionId: "${vars.reviewSessionId}"      # resume on retry
    instructions: "You are a careful code reviewer."
    message: "Review the diff in ${steps.diff.outputs.stdout}"
    toolApprovalMode: safe_auto
    maxToolIterations: 20
```

Persist `sessionId` (for example with `set_variable`) and feed it back on the next attempt or on a
later step that continues the same conversation. Without it, an engine retry starts a **new**
conversation — you pay twice and lose the tool results.

Resuming also re-applies the per-turn settings (`toolApprovalMode`, `model`/`provider`,
`maxToolIterations`), because the auto tool loop keys off the *stored* session mode. A resumed turn
that did not re-apply them would silently run under the old mode.

## Answering a pending tool call

When the agent asks for a client-side tool (a form, a chart, a UI action), the workflow can supply
the answer:

```yaml
- id: answer
  type: agent_conversation
  config:
    personaId: reactor
    sessionId: "${vars.agentSessionId}"
    toolCallId: "${steps.agent.outputs.response.toolCalls[0].id}"
    toolName: search_database
    message: '{"rows":[...]}'
```

`message` becomes the tool result, `role` defaults to `tool` when `toolCallId` is set, and the model
continues the turn. `sessionId` is required — you are answering a call the agent made earlier.

## Shipped workflows

| Workflow | Agentic | Loaded |
|---|---|---|
| `reactor.AgentGitCommit` | consults the agent, then runs pre-defined safe git steps | yes |
| `reactor.AgentGitWorktree` | asks GitGuardian for branch/worktree naming | yes |
| `reactor.ProcessConversationWorkflow` | post-processes a conversation into the system graph | yes |
| `reactor.CatalogProjectFolder`, `reactor.GraphExplore` | use a persona | yes |
| `core.ProcessAITicket` | uses `agent_conversation` | yes |
| `reactor.AgentInstruction` | sends a message to an agent in a chat session | **no** |
| `reactor.SessionContinuation` | resumes chat sessions after restart | **no** |

`AgentGitCommit` and `AgentGitWorktree` are the reference examples for the safe pattern: the agent
*decides*, and the workflow executes a **pre-defined** `cli_command` step. The agent never executes
arbitrary shell code (`src/modules/reactory-reactor/workflow/AgentGitCommit.yaml:1-22`).

## Two iteration caps

A step configured with `maxToolIterations: 50` still stops at **25** on Anthropic, which has a hard
provider-level cap (`src/modules/reactory-reactor/services/reactor/providers/AnthropicService.ts:50`). The session cap defaults to
`REACTOR_MAX_TOOL_ITERATIONS` = 200 for everything else
(`src/modules/reactory-reactor/services/reactor/ReactorConversationService.ts:6208`). At the cap the turn pauses with an approval
request rather than failing, and `continueToolExecution` resumes it.

## Limitations that change workflow design

- **`AgentInstruction` and `SessionContinuation` are not in the load array**
  (`src/modules/reactory-reactor/workflow/index.ts:39-55`). They exist on disk; `loadYamlWorkflow` never runs for them. Two of the
  three agent-session workflows therefore cannot run — see
  [module page §9](../06-modules/reactory-reactor/README.md).
- **Every YAML persona defaults to a Google model.** A workflow with no Google credential fails at
  persona resolution, not at the step. Pin `provider`/`model` explicitly in production flows.
- **`toolApprovalMode: prompt` is meaningless in an unattended workflow** — there is no user to
  prompt. Use `safe_auto` or `plan`.
