---
title: Skills
status: Partial
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-reactor@ffb54c3
audience: developer
---

# Skills

A skill is a **markdown procedure** an agent loads on demand, instead of carrying every instruction in
its system prompt. Two macros make it work: `searchSkills(query)` finds them, `readSkill(id)` returns
the full text.

- Definitions: `src/modules/reactory-reactor/ai/skills/index.ts`
- Content: `src/modules/reactory-reactor/ai/skills/<family>/*.md`
- Macros: `src/modules/reactory-reactor/ai/macro/skills/`
- Declared shape: `ISkillDefinition` in `src/modules/reactory-reactor/ai/openai/types/chat.ts`

## Registered skills (9)

| Id | Covers |
|---|---|
| `reactory.queryingDataAndVisualizing@1.0.0` | Connection discovery, count-first querying, large exports, chart/D3 output |
| `reactory.analyzeLogs@1.0.0` | Searching/parsing JSON logs without burning context |
| `reactory.graphCatalogWalkAndLink@1.0.0` | System-graph traversal and evidence-backed edge creation |
| `reactory.remoteDeployment@1.0.0` | SSH hosts, podman deployment, i18n/widget asset packaging |
| `reactory.kubernetesDeployment@1.0.0` | Kubernetes + GitOps (ArgoCD) deployment and hot-patching |
| `reactory.temporalWorkflowBridge@1.0.0` | When durable execution on Temporal is warranted; the bridge pattern |
| `reactory.maestroMobileTesting@1.0.0` | Maestro mobile UI automation |
| `reactory.managingPhonetics@1.0.0` | Speech-service pronunciations, lexicons, IPA |
| `reactory.awsHostingCostEstimation@1.0.0` | AWS Price List API–backed cost estimation |

Evidence: `src/modules/reactory-reactor/ai/skills/index.ts:5-146` (ids at `:5`, `:20`, `:35`, `:50`, `:65`, `:81`, `:108`,
`:124`, `:140`).

## The gap is empty files, not missing registrations

This is the part to read before assuming a skill exists because a folder does.

| Directory | State |
|---|---|
| `form-building/` | 5 files, **all 0 bytes** — no content to load |
| `graphql/` | 2 files, **both 0 bytes** |
| `services/` | 1 file, **0 bytes** |
| `macro-building/` | 1 file, **0 bytes** |

Measured 2026-10-19: **18 skill files exist; 9 have content and all 9 are registered; 9 are 0
bytes.** Nothing that was written is unregistered — the four families above are placeholders.

The ticket's figure was "8 of 10 authored skills unregistered", and it does not survive measurement.
The real defect is worse in one direction and better in another: `form-building` and `graphql` are
the skills a *form-building agent* would need, and they are empty, so an agent asked to build a form
has no procedure to load. Registering them without content would make `readSkill` return an empty
string, which is why they are left out of the array rather than half-wired.

The measured basis and the exact counts are in
[module page §9](../06-modules/reactory-reactor/README.md) and
[evidence.md](../06-modules/reactory-reactor/evidence.md).

## Adding a skill

1. Write `ai/skills/<family>/<topic>.md`. It should read as a procedure an agent can follow, not as
   reference prose — the audience is a model with tools, not a browser.
2. Register it in `src/modules/reactory-reactor/ai/skills/index.ts` with a unique FQN-style `id`
   (`reactory.<name>@<version>`), a `description` that tells the model *when* to load it, `tags`
   used by `searchSkills`, `roles`, and at least one `examples` entry showing the two macro calls.
3. Point `filePath` at the file with `require.resolve(...)` so a missing file fails at load, not at
   `readSkill` time.
4. Add the skill id to the personas that should see it.
5. Keep the FQN stable. Skills are referenced by id in persona configuration and in tool output.

## Design constraints

- **Load, don't inject.** The point of a skill is to keep the system prompt small. A skill that is
  always relevant belongs in the persona prompt, not in a skill file.
- **Skills are procedures, not documentation.** If the content is an enumeration (step types, widget
  names), link to the generated reference instead of copying it — copies rot.
- **A zero-byte skill is a lie.** Remove the file or write it; do not register an empty one.
