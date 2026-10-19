# Module documentation template

![Build Anything Fast](/branding/reactory-logo.png)

Every page under [`06-modules/`](../06-modules/index.md) follows the same ten-section structure. The
structure exists so a reader can compare modules and so the generated reference and the verification
scripts can find the same headings in every page.

The **canonical sample implementation** of this template is
[`reactory-azure`](../06-modules/reactory-azure/README.md). It is a small, honest worked example:
its page follows the template and adds a step-by-step build walkthrough in §9. Start with
[the worked example](../06-modules/reactory-azure/README.md#9-worked-example--how-this-module-is-built)
when you are writing a new module page, and use the section list below as the checklist.

Two completed module pages are also worth reading for depth:
[`reactory-core`](../06-modules/reactory-core/README.md) (the canonical implementation of the
contract) and [`reactory-reactor`](../06-modules/reactory-reactor/README.md) (the agentic layer with
a separate evidence index).

## Frontmatter

Module pages carry a YAML header. All six fields are required:

```yaml
---
title: <module-id> — <short description>
status: Implemented | Partial | WIP | Roadmap | Deprecated
owner: <team>
verified: YYYY-MM-DD
verifiedAgainst: <repository>@<commit> / <module-repository>@<commit>
audience: developer
---
```

`status` is a statement about what is wired, not what is intended. Use `Partial` when the module
loads but a material part of its declared surface is missing; say which part in §10.

## The ten sections

1. **Purpose & status** — what the module is, what it is not, whether it is supported, and the
   licence. Resolve any registry/manifest contradiction explicitly. State the FQN. Give the reader
   the shortest path to the truth about reachability.
2. **Module contract** — the module object: `id`, `nameSpace`, `version`, `name`, FQN,
   `dependencies`, `priority`, and each extension point it contributes. For empty extension points,
   say so; do not omit them.
3. **Data model** — collections, entities, migrations and any external store. If there is no local
   model, say that and explain why. Do not invent a model for a thin vendor wrapper.
4. **GraphQL API** — SDL files, type names, root queries, mutations, subscriptions, directives and
   the composition point that loads them. If the answer is zero, say zero.
5. **Services** — every registered service, its FQN, what vendor API it wraps, its lifecycle and its
   dependencies. Distinguish a service definition from a plain exported object.
6. **UI surface** — forms, client plugins, routes, middleware, menus and translations. If the module
   is server-only, say so.
7. **Workflows** — workflow definitions, YAML files, step types and how they are registered. A file
   that exports an empty array is not a workflow; state the capability count, not the file count.
8. **Operations** — connection strings, credential handling, token refresh, per-tenant
   configuration, secret storage, retry/rate-limiting and observability. Name the environment
   variables and where they are read.
9. **Limitations & roadmap** — measured limitations with file and line evidence, followed by
   roadmap candidates. Roadmap intent is not behaviour; keep it separate.
10. **Evidence index** — one table row per claim, with a `path:line` reference relative to the
    source checkout. The index is the page's proof, not an appendix.

### The worked example section

A module page may add one section between §8 and §9 to teach how the module is built. Use the
heading:

```markdown
## 9. Worked example — how this module is built
```

Then shift limitations and evidence to §10 and §11. The section should map every step of the build
order — registry → module object → services → data model → GraphQL → workflows → forms/UI →
storage → runtime registration → verification — to a real file and line, and should be explicit
about which steps the sample omits. [`reactory-azure`](../06-modules/reactory-azure/README.md) is the
reference for this shape.

## Evidence rules

- Every factual claim in the page has a row in the evidence index with `path:line`.
- A path without a line is acceptable for a whole-file artifact; a line range is better.
- If a claim is about absence (zero services, zero SDL files), give the enumeration that proves it
  and a command in the measurement section.
- Line numbers must resolve inside the file. The verification script checks this; a stale citation is
  a failure, not a formatting nit.
- Do not cite `AGENT.md` as authority for behaviour. It is a summary and it drifts. Cite the source.

## Verification

Each documented module has a verifier in `scripts/`:

```bash
node scripts/verify-docs.js --require-source          # reactory-core
node scripts/verify-reactor-docs.js --require-source  # reactory-reactor
node scripts/verify-azure-docs.js --require-source    # reactory-azure
```

The verifiers check the frontmatter, the section order, the mandatory limitation statements, the
evidence index and that every relative link resolves. Run the one for the module you changed before
opening a pull request.

## Generated pages

[`06-modules/index.md`](../06-modules/index.md) and everything under
[`07-reference/`](../07-reference/modules/reactory-core.md) are generated. Do not edit them by hand.
Add the module page as `06-modules/<module-id>/README.md`, then regenerate the index:

```bash
export REACTORY_SERVER_ROOT=../reactory-express-server
node scripts/generate-core-module-reference.js
```

The generator discovers pages by the `06-modules/<module-id>/README.md` filename. A page with any
other name is invisible to the index even if every link to it resolves.
