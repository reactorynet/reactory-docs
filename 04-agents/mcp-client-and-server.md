---
title: MCP client and server
status: Implemented
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-reactor@ffb54c3
audience: developer
---

# MCP client and server

Reactory speaks the Model Context Protocol in **both directions**:

- **Client** — Reactory agents consume external MCP tool servers (`ai/macro/mcp/`).
- **Server** — external MCP clients (Claude Desktop, IDEs, other agents) consume Reactory's own
  tools, prompts and resources (`middleware/mcp/`).

## Client: Reactory as MCP consumer

| Concern | Where |
|---|---|
| Macro family | `src/modules/reactory-reactor/ai/macro/mcp/macro.ts` |
| Catalog of known servers | `src/modules/reactory-reactor/ai/macro/mcp/catalog.ts` |
| Session config (standard vs runtime) | `src/modules/reactory-reactor/ai/macro/mcp/standard-config.ts`, `session-config.ts`, `runtime-mode.ts` |
| Registry service (discovery) | `src/modules/reactory-reactor/services/mcp/MCPRegistryService.ts:15` |
| Registry adapter | `src/modules/reactory-reactor/services/mcp/adapters/CommunityRegistryAdapter.ts` |
| OAuth provider | `src/modules/reactory-reactor/ai/macro/mcp/oauth/ReactoryMcpOAuthProvider.ts` |
| OAuth callback route | `src/modules/reactory-reactor/ai/macro/mcp/oauth/routes.ts:29` |

An MCP client session is stored on the conversation as `mcpSessions[]`
(`src/modules/reactory-reactor/models/ReactorChatState.ts` — `mcpSessions`), so the tools a session negotiated survive a page
reload and are re-established on resume.

### OAuth — what works and what has not been proven

Implemented: CSRF `state` issue/consume, PKCE client registration, metadata discovery, code exchange
via the SDK's `finishAuth(code)`, and token persistence through the shared encrypted store
(`src/modules/reactory-reactor/ai/macro/mcp/oauth/routes.ts:1-28`).

Tested: the provider is unit-tested against an in-memory `ITokenStore`
(`src/modules/reactory-reactor/ai/macro/mcp/oauth/__tests__/provider.test.ts:1`).

**Not tested: end-to-end.** No suite drives a real MCP server through the browser consent redirect.
Treat "MCP OAuth works" as *unit-tested, not E2E-validated* until that test exists. This is one of
the six mandated limitations on the
[module page](../06-modules/reactory-reactor/README.md).

## Server: Reactory as MCP provider

| Concern | Where |
|---|---|
| Express middleware | `src/modules/reactory-reactor/middleware/mcp/ReactoryMCPMiddleware.ts` |
| SSE server / session registry | `src/modules/reactory-reactor/middleware/mcp/ReactorServer.ts` |
| RPC dispatch | `src/modules/reactory-reactor/middleware/mcp/MCPRequestHandlers.ts` |
| Handlers | `middleware/mcp/handlers/` — `initialize`, `toolsList`, `toolsCall`, `resourcesList`, `resourcesGet`, `promptsList`, notifications, heartbeat |
| Types | `src/modules/reactory-reactor/middleware/mcp/types.ts` |
| Operator notes | `src/modules/reactory-reactor/middleware/mcp/README.md` |

Registered by the module: `src/modules/reactory-reactor/middleware/index.ts:3-6` includes `ReactoryMCPMiddleware`, so the server
side is **loaded by default**.

Behaviour from the implementation's own README:
- SSE transport with per-session state; stale sessions are swept every 5 minutes.
- JWT authentication; a `/login` route issues a token via standard BTOA auth.
- 1 MB request size limit, input validation and sanitisation.
- Heartbeat notifications to detect dead connections.

## What an external client sees

`tools/list` is backed by the same macro registry the internal agent uses, so a tool added for
Reactory's own agent becomes available to external MCP clients without a second implementation. That
is the main architectural reason to care about the server half: one tool surface, two consumers.

## Debugging

- `middleware/mcp/mcp.test.http` contains ready-made HTTP requests for each RPC method.
- `src/modules/reactory-reactor/middleware/mcp/README.md` documents the handler contract and the session lifecycle.
- If a tool is missing from `tools/list`, check first whether it is registered in the server
  `MacroRegistry` (`src/modules/reactory-reactor/ai/macro/index.ts:113`) — a tool that only exists client-side (`form`, `chart`,
  `d3`, `component`, `image`) will never appear.
