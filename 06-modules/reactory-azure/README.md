---
title: reactory-azure — the reference integration example
status: Partial
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@59639fe / reactory-azure@c962956
audience: developer
---

![Build Anything Fast](/branding/reactory-logo.png)
# `reactory-azure` — the reference integration example

**FQN:** `core.ReactoryAzure@1.0.0` · **Licence:** MIT · **Status:** reference example, not a
supported commercial integration · **Registry licence:** `commercial` (stale — see §1)

`reactory-azure` is the worked example of how to package a third-party vendor API as a Reactory
module. It wraps a subset of Microsoft Graph (profile, mail, calendar, tasks) and contains a
scaffold for Azure Blob/File Share storage.

It is **not a supported commercial integration**, and it is not a complete module. It is valuable
precisely because it is small: it shows the build order in one directory, and it shows — honestly —
which steps are optional, which are missing, and what happens when a vendor wrapper is mistaken for
a service.

This page follows the [module documentation template](../../08-contributing/module-doc-template.md)
with the optional worked-example section added, so the template's §9 and §10 appear here as §9, §10
and §11.
The architecture it implements is described in [§5 of `PLATFORM.md`](../../PLATFORM.md#5-the-module-system).
Complete implementations to compare against are [`reactory-core`](../reactory-core/README.md) and
[`reactory-reactor`](../reactory-reactor/README.md); the full registry is in the
[module index](../index.md).

> **Read §10 before adopting anything here.** The module registers **zero** extension points. Its
> two core consumers import it directly; they are not resolved through the module contract, and the
> Graph client they depend on is never imported. The generated index lists a `commercial` licence
> that the module's own manifest contradicts; §1 resolves that.

---

## 1. Purpose & status

**Status: Partial — reference example.** The module loads and two of its Graph helpers are wired into
`reactory-core`, but it contributes no services, no GraphQL, no forms, no workflows and no UI. It
should not be sold, supported or deployed as a commercial Azure integration.

| Question | Answer | Evidence |
|---|---|---|
| What is it? | A worked example of wrapping Microsoft Graph and scaffolding Azure storage | `src/modules/reactory-azure/README.md:1-2` |
| Is it supported? | No. Self-described as "purely an example submodule" | `src/modules/reactory-azure/AGENT.md:5`, `:56-58` |
| Does it load? | Yes — imported by the generated module barrel and listed in the registry | `src/modules/__index.ts:13`, `:32` |
| Do the Graph calls work? | No — `Client` and `ResponseType` are never imported; eight methods throw, `sendEmail` catches the error and returns a non-result | `src/modules/reactory-azure/services/graph.ts:12`, `:38`, `:216-225` |
| Is the type contract complete? | No — the interface declares eight of the nine implemented methods | `src/modules/reactory-azure/types.d.ts:13-30`, `src/modules/reactory-azure/services/graph.ts:105` |
| Does it contribute services? | No — `services: []` and `services/index.ts` exports an empty array | `src/modules/reactory-azure/index.ts:22`, `src/modules/reactory-azure/services/index.ts:3` |
| Does it expose GraphQL? | No — `graphDefinitions` is an empty object and an empty array | `src/modules/reactory-azure/index.ts:15-18` |
| Does it persist anything? | No — `models: []` | `src/modules/reactory-azure/index.ts:19` |
| Does it have a UI? | No — `forms: []` and `clientPlugins: []` | `src/modules/reactory-azure/index.ts:21`, `:24` |
| Does it run a workflow? | No — one workflow file, zero workflow definitions | `src/modules/reactory-azure/workflows/index.ts:3` |
| Is it commercial? | No — MIT in the package manifest; the registry value is stale | `src/modules/reactory-azure/package.json:17-21`, `src/modules/available.json:28` |

### Licence reconciliation

**The authoritative licence is MIT, and the module is example-only.** The module's own package
manifest declares MIT (`.licenses[0].license` at `src/modules/reactory-azure/package.json:17-21`)
and `AGENT.md` repeats it (`src/modules/reactory-azure/AGENT.md:12`). The platform registry disagrees:
`src/modules/available.json:28`, `src/modules/enabled-reactory.json:28` and
`src/modules/installed.json:28` all say `commercial`, and `src/modules/available.json:30` carries a
shop URL. Those three registry values are the defect. An example-only module cannot be a supported
commercial integration.

The resolution recorded here is: **example-only, MIT, not for sale.** Correcting the contradiction
requires a one-word change in each of the three registry files (`commercial` → `MIT`) and removal of
the shop URL at `src/modules/available.json:30`. This documentation repository cannot make that
change, so the generated `06-modules/index.md` will keep reproducing `commercial` from
`available.json` until the server-side metadata is fixed. Do not treat the generated column as the
authority for this module.

### What is wired

Only two `reactory-core` resolvers call into the module, and both bypass the module contract with a
direct source import:

| Consumer | What it calls | Evidence |
|---|---|---|
| `refreshProfileData` query | `MSGraph.getUserDetails(...)`, optionally fetching the avatar | `src/modules/reactory-core/resolvers/User/ProfileResolver.ts:6`, `:223`, `:254`, `:288-289` |
| `userEmails` query, when `via` includes `microsoft` | `O365.getEmails(...)` | `src/modules/reactory-core/resolvers/Emails/UserEmails.ts:9`, `:22`, `:59-62` |

`getProfileImage` is reached indirectly when `getUserDetails` is called with `profileImage: true`
(`src/modules/reactory-azure/services/graph.ts:84-86`). The remaining six Graph methods have no
caller in either repository. `sendEmail` exists only as commented-out code in core's email service
(`src/modules/reactory-core/services/EmailService.ts:135`).

**None of the nine implemented methods can execute as written.** Every method goes through
`getAuthenticatedClient`, which calls `Client.init` (`src/modules/reactory-azure/services/graph.ts:12`)
but `Client` is never imported; `getProfileImage` also references `ResponseType`
(`src/modules/reactory-azure/services/graph.ts:38`). Eight of the nine call the factory outside any
`try`, so the first call raises `ReferenceError: Client is not defined`. `sendEmail` calls the same
factory *inside* a `try` (`src/modules/reactory-azure/services/graph.ts:216-223`), so it catches and
logs that error and then returns the Express `response` object instead of a Graph result — see §5
and §10. The wiring exists; the dependency does not, and one method hides the failure.

### Measured surface

| Measure | Count | Evidence |
|---|---|---|
| TypeScript files | 6 | `find src/modules/reactory-azure -name '*.ts' -not -path '*/.git/*' \| wc -l` |
| TypeScript lines | 384 | `find ... -name '*.ts' -not -path '*/.git/*' \| xargs wc -l` |
| Service files | 2 (`services/index.ts`, `services/graph.ts`) | `src/modules/reactory-azure/services/` |
| Storage files | 1 (`storage/index.ts`) | `src/modules/reactory-azure/storage/` |
| Workflow files | 1 (`workflows/index.ts`) | `src/modules/reactory-azure/workflows/` |
| GraphQL files | 0 | `find src/modules/reactory-azure -name '*.graphql' \| wc -l` |
| YAML workflow files | 0 | `find src/modules/reactory-azure -name '*.yaml' \| wc -l` |
| Test files | 0 | no `*.test.ts`, `*.spec.ts` or `__tests__/` |
| Markdown lines | 61 (README 3 + AGENT 58) | `wc -l src/modules/reactory-azure/*.md` |

---

## 2. Module contract

The module object is declared in `src/modules/reactory-azure/index.ts:8-30`.

| Field | Value | Evidence |
|---|---|---|
| `id` | `reactory-azure` | `src/modules/reactory-azure/index.ts:9` |
| `nameSpace` | `core` | `src/modules/reactory-azure/index.ts:10` |
| `version` | `1.0.0` | `src/modules/reactory-azure/index.ts:11` |
| `name` | `ReactoryAzure` | `src/modules/reactory-azure/index.ts:12` |
| **FQN** | **`core.ReactoryAzure@1.0.0`** | `src/modules/available.json:26` |
| `dependencies` | `['core.ReactoryServer@1.0.0']` | `src/modules/reactory-azure/index.ts:13` |
| `priority` | `0` — the same priority as core | `src/modules/reactory-azure/index.ts:14` |
| `graphDefinitions` | `{ Resolvers: {}, Types: [] }` | `src/modules/reactory-azure/index.ts:15-18` |
| `models` | `[]` | `src/modules/reactory-azure/index.ts:19` |
| `workflows` | spread of an empty default export | `src/modules/reactory-azure/index.ts:20`, `src/modules/reactory-azure/workflows/index.ts:3` |
| `forms` | `[]` | `src/modules/reactory-azure/index.ts:21` |
| `services` | spread of an empty default export | `src/modules/reactory-azure/index.ts:22`, `src/modules/reactory-azure/services/index.ts:3` |
| `translations` | `[]` | `src/modules/reactory-azure/index.ts:23` |
| `clientPlugins` | `[]` | `src/modules/reactory-azure/index.ts:24` |
| `cli` | `[]` | `src/modules/reactory-azure/index.ts:25` |
| `description` | `Reactory Azure Module` | `src/modules/reactory-azure/index.ts:26` |
| `grpc` | `null` | `src/modules/reactory-azure/index.ts:27` |
| `passportProviders` | `[]` | `src/modules/reactory-azure/index.ts:28` |
| `pdfs` | `[]` | `src/modules/reactory-azure/index.ts:29` |

### Effective extension points

The module object exposes the module-system extension points. This one contributes none of the
functional ones (`description` is metadata, not a contribution):

| Extension point | Declared | Effective contribution | Evidence |
|---|---|---|---|
| GraphQL types | `Types: []` | 0 type definitions | `src/modules/reactory-azure/index.ts:15-18` |
| GraphQL resolvers | `Resolvers: {}` | 0 resolvers | `src/modules/reactory-azure/index.ts:15-18` |
| Models | `[]` | 0 collections or entities | `src/modules/reactory-azure/index.ts:19` |
| Workflows | `[...workflows]` | 0 workflow definitions | `src/modules/reactory-azure/workflows/index.ts:3` |
| Workflow steps | field absent | 0 step types | `src/modules/reactory-azure/index.ts:8-30` |
| Forms | `[]` | 0 form definitions | `src/modules/reactory-azure/index.ts:21` |
| Services | `[...services]` | 0 service definitions | `src/modules/reactory-azure/services/index.ts:3` |
| Client plugins | `[]` | 0 plugin bundles | `src/modules/reactory-azure/index.ts:24` |
| Translations | `[]` | 0 translation bundles | `src/modules/reactory-azure/index.ts:23` |
| Passport providers | `[]` | 0 auth strategies | `src/modules/reactory-azure/index.ts:28` |
| CLI | `[]` | 0 commands | `src/modules/reactory-azure/index.ts:25` |
| PDFs | `[]` | 0 PDF components | `src/modules/reactory-azure/index.ts:29` |
| gRPC | `null` | no gRPC surface | `src/modules/reactory-azure/index.ts:27` |
| Routes | field absent | no Express router | `src/modules/reactory-azure/index.ts:8-30` |
| Middleware | field absent | no middleware | `src/modules/reactory-azure/index.ts:8-30` |
| Reactor | field absent | no AI providers, agents, macros or tools | `src/modules/reactory-azure/index.ts:8-30` |
| `description` (metadata) | present | registry metadata only | `src/modules/reactory-azure/index.ts:26` |

### Load order and identity drift

`priority: 0` is the same priority as `core.ReactoryServer@1.0.0`, so the only ordering guarantee is
the dependency edge at `src/modules/reactory-azure/index.ts:13`. The registry's FQN
(`src/modules/available.json:26`) puts the module in the `core` namespace, even though it lives in
its own repository and package.

The package identity does not match the module identity: `package.json` declares
`@reactory/azure` at version `1.1.0` (`src/modules/reactory-azure/package.json:2-3`), while the
module object declares version `1.0.0` and FQN `core.ReactoryAzure@1.0.0`
(`src/modules/reactory-azure/index.ts:11-12`, `src/modules/available.json:26`). Nothing consumes the
package version at runtime, but anyone pinning `@reactory/azure@1.1.0` is not pinning the module
version they think they are.

---

## 3. Data model

**There is no data model.** The module owns no collections, no entities and no migrations. It reads
Microsoft's data through Graph and writes nothing locally.

| Store | Present | Evidence |
|---|---|---|
| Mongoose collections | 0 | `models: []` at `src/modules/reactory-azure/index.ts:19`; no `models/` directory |
| TypeORM entities | 0 | same |
| Migrations | 0 | no `migrations/` directory |
| Blob metadata | 0 | no model; `storage/index.ts` is an empty class |
| Queue storage | 0 | no queue abstraction |
| Table storage | 0 | no table abstraction |

The only typed contract is `Reactory.MicrosoftGraph.Service.IMicrosoftGraph` in
`src/modules/reactory-azure/types.d.ts:13-30`. It is a TypeScript interface, not a persisted entity.

That is a defensible choice for a thin vendor wrapper: most integrations should not create a local
mirror of the vendor's domain. It becomes a problem only when the module claims storage. If Azure
Blob is a file backend, the record that matters is core's `reactory_files` collection
(`src/modules/reactory-core/models/CoreFile.ts:283`), managed by `ReactoryFileService`
(`src/modules/reactory-core/services/ReactoryFileService.ts:106`). A storage contribution should
extend that path, not create a parallel class with no model and no consumer. This module does
neither.

### Blob, queue and table coverage

| Azure storage family | Present | Evidence |
|---|---|---|
| Blob | Scaffolded class only; all methods commented out | `src/modules/reactory-azure/storage/index.ts:10-86` |
| File Share | SDK imported, credential never used | `src/modules/reactory-azure/storage/index.ts:1-3` |
| Queue | None | no file or reference |
| Table | None | no file or reference |

---

## 4. GraphQL API

**There is no GraphQL API.** The module contributes zero type definitions and zero resolvers:

```ts
graphDefinitions: {
  Resolvers: {},
  Types: [],
},
```

Evidence: `src/modules/reactory-azure/index.ts:15-18`.

| Surface | Count | Evidence |
|---|---|---|
| SDL files | 0 | no `*.graphql` file in the module |
| Type definitions | 0 | `Types: []` at `src/modules/reactory-azure/index.ts:17` |
| Root queries | 0 | `Resolvers: {}` at `src/modules/reactory-azure/index.ts:16` |
| Root mutations | 0 | same |
| Subscriptions | 0 | same |
| Directives | 0 | no `graphDefinitions.Directives` |

Registration is aggregation, not magic. `src/models/graphql/types/index.ts:6-16` walks
`modules.enabled`, reads `installedModule.graphDefinitions.Types` and pushes each entry into the
schema. `src/models/graphql/resolvers/index.ts:19` does the same for the resolver map. An empty
array and an empty object contribute nothing. A module that omits `graphDefinitions` entirely also
contributes nothing; the empty object here is documentation of intent, not a surface.

### Consequence

No client can call Azure through GraphQL. There is no `azure` query, no `sendMicrosoftMail`
mutation, and no way to ask the platform for a Microsoft profile through the schema. The only
wired Graph behaviour is the two core resolvers listed in §1. They bypass the module contract by
importing `services/graph.ts` directly, and they still fail at `Client.init` because the Graph client
is never imported.

### What a real contribution looks like

A functioning module passes an actual definitions object, as `reactory-google` does at
`src/modules/reactory-google/index.ts:20` (`graphDefinitions: GraphqlDefinitions`). The composition
points are the same ones core uses: `src/models/graphql/types/index.ts:6-16` for types,
`src/models/graphql/resolvers/index.ts:19` for resolvers, and
`src/models/graphql/directives/index.ts:6` for directives. The module contract does not validate the
shape; a malformed object fails later, during schema composition.

---

## 5. Services

**There are two service files and zero registered services.**

| File | What it contains | Registered? | Evidence |
|---|---|---|---|
| `services/index.ts` | `export default [];` | No | `src/modules/reactory-azure/services/index.ts:3` |
| `services/graph.ts` | A plain object `MSGraph` with nine Graph methods; the interface declares eight | No | `src/modules/reactory-azure/services/graph.ts:27` |

`services/index.ts` exports an empty array, so `services: [...services]` in the module object
resolves to `services: []` (`src/modules/reactory-azure/index.ts:22`). The service registry walks
each enabled module and logs `Module <name>: (0) services found.` for an empty array
(`src/services/ServiceManager.ts:51`); it never reaches the object in `graph.ts`.

### What the Graph object wraps

`MSGraph` is annotated `Reactory.MicrosoftGraph.Service.IMicrosoftGraph`, declared at
`src/modules/reactory-azure/types.d.ts:13-30`. That interface declares **eight** operations; the
implementation has **nine**. `getEmails` is implemented
(`src/modules/reactory-azure/services/graph.ts:105`) but is not declared on the interface — and it is
one of the two methods `reactory-core` actually calls. The annotation at
`src/modules/reactory-azure/services/graph.ts:27` therefore makes `getEmails` an excess property and
keeps it out of the exported type; §10 records the two compiler diagnostics this produces.

Each **declared** method is a thin call to Microsoft Graph with a caller-supplied OAuth access
token. The table below lists all nine implemented methods and marks the undeclared one.

| Method | Graph endpoint | API version | Notes | Evidence |
|---|---|---|---|---|
| `getProfileImage` | `GET /me/photos/{size}/$value` | v1.0 | Returns a `data:image/jpeg;base64,...` string; logs and returns `null` on failure | `src/modules/reactory-azure/services/graph.ts:28-63` |
| `getUserDetails` | `GET /me?$select=mail,givenName,surname` | v1.0 | Optionally fetches the avatar and attaches it as `avatar` | `src/modules/reactory-azure/services/graph.ts:64-91` |
| `getEvents` | `GET /me/events` | v1.0 | Calendar events; no caller in either repository | `src/modules/reactory-azure/services/graph.ts:93-103` |
| `getEmails` | `GET /me/messages` | v1.0 | Supports `filter.search`; swallows errors and returns `[]`. **Not declared on `IMicrosoftGraph`** — see §10 | `src/modules/reactory-azure/services/graph.ts:105-133` |
| `getTasks` | `GET /me/outlook/tasks` | beta | Accepts a `filter` argument but ignores it | `src/modules/reactory-azure/services/graph.ts:135-143` |
| `getTask` | `GET /me/outlook/tasks/{id}` | beta | Single task; no caller | `src/modules/reactory-azure/services/graph.ts:145-153` |
| `createTask` | `POST /me/outlook/tasks` | beta | Builds `startDateTime`/`dueDateTime`; no caller | `src/modules/reactory-azure/services/graph.ts:167-191` |
| `deleteTask` | `DELETE /me/outlook/tasks/{id}` | beta | Returns the (usually empty) delete response; no caller | `src/modules/reactory-azure/services/graph.ts:155-165` |
| `sendEmail` | `POST /me/sendMail` | beta | Calls the factory inside a `try`; catches and logs `Client is not defined`, then returns the Express `response` export — a failed send looks like success | `src/modules/reactory-azure/services/graph.ts:4`, `:193-226` |

There is no identity service in the Azure AD/Entra sense. `getUserDetails` reads the signed-in
user's profile; there is no user creation, group management, directory lookup, app-only token
acquisition or tenant administration.

### Why `MSGraph` is not a service

The Reactory service registry does not discover arbitrary exported objects. It requires a service
definition with an FQN, a namespace, a name, a version and a factory. `MSGraph` has none of those.

| Registry requirement | `MSGraph` | Evidence |
|---|---|---|
| `id` (FQN) | Absent | `src/modules/reactory-azure/services/graph.ts:27` |
| `nameSpace` | Absent | `src/modules/reactory-azure/services/graph.ts:27` |
| `name` | Absent | `src/modules/reactory-azure/services/graph.ts:27` |
| `version` | Absent | `src/modules/reactory-azure/services/graph.ts:27` |
| `serviceType` | Absent | `src/modules/reactory-azure/services/graph.ts:27` |
| `lifeCycle` | Absent | `src/modules/reactory-azure/services/graph.ts:27` |
| Service factory (`service`) | Absent | `src/modules/reactory-azure/services/graph.ts:27` |
| Listed in `module.services` | No — array is empty | `src/modules/reactory-azure/services/index.ts:3` |
| Resolvable via `context.getService` | No | `src/services/ServiceManager.ts:44-93` |

A correct definition is small. The shape used by core's `EmailService` is at
`src/modules/reactory-core/services/EmailService.ts:226-236`; a decorated definition with
dependencies is at `src/modules/reactory-google/services/TasksService.ts:197-211`. The illustrative
form below is **not** present in the module:

```ts
// Illustrative only — this definition does not exist in reactory-azure.
const MicrosoftGraphServiceDefinition: Reactory.Service.IReactoryServiceDefinition<IMicrosoftGraph> = {
  id: 'core.MicrosoftGraphService@1.0.0',
  name: 'MicrosoftGraphService',
  nameSpace: 'core',
  version: '1.0.0',
  serviceType: 'integration',
  lifeCycle: 'request',
  dependencies: [],
  service: (props, context) => new MicrosoftGraphService(props, context),
};
```

Exporting that from `services/index.ts` and importing it into `module.services` is the single change
that would make the wrapper resolvable by FQN. Until then, the only way to use it is the same direct
import core uses, which couples every consumer to the vendor module's file layout.

---

## 6. UI surface

**There is no UI surface.** The module contributes no form definitions, no client plugin bundles, no
routes and no translations.

| Surface | Count | Evidence |
|---|---|---|
| Forms | 0 | `forms: []` at `src/modules/reactory-azure/index.ts:21` |
| Client plugins | 0 | `clientPlugins: []` at `src/modules/reactory-azure/index.ts:24` |
| Translations | 0 | `translations: []` at `src/modules/reactory-azure/index.ts:23` |
| Express routes | 0 | no `routes` field in the module object |
| Middleware | 0 | no `middleware` field in the module object |
| Menus | 0 | no client config changes in this repository |

Form contributions are aggregated by `FormService`, which walks `modules.enabled` and reads
`module.forms` (`src/modules/reactory-core/services/FormService.ts:43-52`). An empty array adds
nothing, so the PWA has no Azure form to render. Client plugins are registered from
`module.clientPlugins`; an empty array means no bundle is loaded, so there is no custom widget,
panel or screen.

This is consistent with the two reachable entry points in §1: they are server-side resolvers, not
forms. It also means the example cannot be demonstrated through the UI without first adding a
GraphQL surface and a form definition.

---

## 7. Workflows

**There is one workflow file and zero workflow definitions.** The file exists only to export an
empty array:

```ts
// src/modules/reactory-azure/workflows/index.ts
export default [];
```

Evidence: `src/modules/reactory-azure/workflows/index.ts:3`. The module object spreads it at
`src/modules/reactory-azure/index.ts:20`, so `module.workflows` is `[]`. There are no YAML files, no
registered workflows and no contributed step types.

| Measure | Count | Evidence |
|---|---|---|
| Workflow source files | 1 | `src/modules/reactory-azure/workflows/index.ts` |
| Workflow definitions | 0 | `src/modules/reactory-azure/workflows/index.ts:3` |
| YAML workflow files | 0 | no `*.yaml` in the module |
| `workflowSteps` contributions | 0 | field absent from `src/modules/reactory-azure/index.ts:8-30` |

Workflow contributions are validated through `module.workflows`
(`src/modules/reactory-core/services/SystemService.ts:152`) and consumed by the workflow runner,
which filters entries to the shape it understands. A file that exports `[]` is inert: it is not a
workflow, and the "1 workflow" count in a file inventory is a file count, not a capability count.
The module cannot start a flow, cannot be a step in someone else's flow, and adds nothing to the
YAML step vocabulary.

If this module were to automate Microsoft operations, the useful contribution would be a workflow
definition in `module.workflows` or a new step type in `module.workflowSteps`. Neither is present.

---

## 8. Operations

The module has almost no operations surface. It has no connection string, no tenant configuration,
no app registration and no secret storage. What it does have is a per-user access token passed into
a Graph client.

### Credential handling

| Concern | Implementation | Evidence |
|---|---|---|
| Graph authentication | Caller-supplied OAuth access token, injected into the Graph client per call | `src/modules/reactory-azure/services/graph.ts:10-23` |
| Token source | `user.authentications`, provider `microsoft`, supplied by the calling core resolver | `src/modules/reactory-core/resolvers/User/ProfileResolver.ts:215`, `src/modules/reactory-core/resolvers/Emails/UserEmails.ts:19` |
| App-only / client credentials | None | no `clientId`, `clientSecret` or `tenantId` in the module |
| Token refresh inside the module | None | core refreshes for the profile path at `src/modules/reactory-core/resolvers/User/ProfileResolver.ts:25`, `:253`; the email path has no refresh |
| Graph debug logging | Hardcoded `debugLogging: true` | `src/modules/reactory-azure/services/graph.ts:16` |
| Secrets manager integration | None | no core credential or vault service is used |
| Per-tenant configuration | None | no tenant key is read anywhere in the module |

Passing a raw access token is normal for a delegated Graph call, but the hardcoded debug logging is
not: it can emit request metadata into the server log. An expired token on the email path is
indistinguishable from "no mail", because `getEmails` catches the error and returns the empty array
it initialised (`src/modules/reactory-azure/services/graph.ts:108`, `:128-132`).

### Azure Storage credentials

`storage/index.ts` reads a single environment variable at module load:

```ts
export const defaultAzureProps = {
  account: 'devstoreaccount1',
  accountKey: process.env.AZURE_STORAGE_KEY,
};
```

Evidence: `src/modules/reactory-azure/storage/index.ts:5-8`.

| Setting | Read? | Notes |
|---|---|---|
| `AZURE_STORAGE_KEY` | Yes, at import time | No validation; `undefined` is accepted silently |
| `AZURE_STORAGE_ACCOUNT` | No | Account hardcoded to the Azurite emulator name `devstoreaccount1` |
| `AZURE_STORAGE_CONNECTION_STRING` | No | No connection string support |
| SAS token | No | `AnonymousCredential` is imported but never used (`storage/index.ts:1-3`) |
| Per-tenant storage account | No | no tenant lookup |

The default account is the Azurite emulator (`devstoreaccount1`), so the scaffold is aimed at local
development, not production. There is no code path that constructs a `BlobServiceClient`,
`ShareServiceClient` or `StorageSharedKeyCredential`.

### Package dependencies

`package.json` declares three Azure packages and no Graph client:

```json
"@azure/msal-browser": "3.19.0",
"@azure/storage-blob": "12.23.0",
"@azure/storage-file-share": "12.23.0"
```

Evidence: `src/modules/reactory-azure/package.json:29-33`.

`@azure/msal-browser` is a browser library; it is not usable in this server module. The code needs
`@microsoft/microsoft-graph-client` for `Client` and `ResponseType`
(`src/modules/reactory-azure/services/graph.ts:12`, `:38`), and `@microsoft/microsoft-graph-types`
for the `Microsoft.*` types (`src/modules/reactory-azure/types.d.ts:2`,
`src/modules/reactory-azure/services/graph.ts:196-204`). Neither Graph package appears in
`package.json` or the server lockfile. The Graph code therefore depends on undeclared packages and
on identifiers that are never imported.

### Operational summary

- **Connection strings:** none.
- **Per-tenant configuration:** none.
- **Credential storage:** none in this module; delegated tokens live on the user record.
- **Rotation/refresh:** handled outside the module, and only on the profile path.
- **Observability:** hardcoded Graph debug logging; no metrics, retries or rate limiting.
- **Failure behaviour:** `getEmails` returns `[]`; `sendEmail` catches the error, logs it, and
  returns the Express `response` export — a failed send is indistinguishable from a successful one.

---

## 9. Worked example — how this module is built

This is the canonical build order for a vendor integration module. Each step states the job, shows
what `reactory-azure` does, and names the file and line. Where the example stops, the step says so.
**Copy the structure; do not copy the gaps.**

### 9.1 The build order at a glance

| # | Step | `reactory-azure` | Verdict |
|---|---|---|---|
| 1 | Declare the module in the registry | Registry entry with FQN `core.ReactoryAzure@1.0.0` | Done, but licence metadata is wrong |
| 2 | Write the module object | `index.ts` with identity and dependency | Done, with every payload empty |
| 3 | Wrap the vendor API | `services/graph.ts` with nine methods, eight of them declared | Wrapper exists; not registered; one method missing from the interface |
| 4 | Decide the data model | `models: []` | No persistence; defensible |
| 5 | Expose GraphQL | `graphDefinitions: { Resolvers: {}, Types: [] }` | Not done |
| 6 | Contribute workflows | `workflows: [...[]]` | Not done |
| 7 | Contribute forms and UI | `forms: []`, `clientPlugins: []` | Not done |
| 8 | Scaffold storage | `storage/index.ts` with all code commented out | Not usable |
| 9 | Register at runtime | Barrelled import; zero contributions | Loads, but inert |
| 10 | Verify and document | This page and `scripts/verify-azure-docs.js` | Done |

### 9.2 Step 1 — declare the module

The registry entry is the platform's source of truth for the FQN, the entry path and the licence.
For this module it is `src/modules/available.json:23-31`; the same object is copied into
`src/modules/enabled-reactory.json:23-31` and `src/modules/installed.json:23-31`.

```json
{
  "id": "reactory-azure",
  "name": "Reactory Azure",
  "key": "reactory-azure",
  "fqn": "core.ReactoryAzure@1.0.0",
  "moduleEntry": "reactory-azure/index.ts",
  "license": "commercial",
  "git": "git@github.com:reactorynet/reactory-azure.git",
  "shop": "https://reactory.net/shop/modules/reactory-azure"
}
```

Evidence: `src/modules/available.json:23-31`.

At startup the generated barrel imports the entry module
(`src/modules/__index.ts:13`) and adds it to the enabled array (`src/modules/__index.ts:32`). The
FQN is not recomputed there; it comes from the registry. That is why the licence contradiction in
§1 is a registry problem, and why the generator's `06-modules/index.md` inherits it.

**Lesson:** keep `fqn`, `moduleEntry`, `license` and the package manifest consistent. This module
gets `fqn` and `moduleEntry` right and `license` wrong.

### 9.3 Step 2 — write the module object

The object is `src/modules/reactory-azure/index.ts:8-30`. The essential shape is:

```ts
const reactoryAzure: Reactory.Server.IReactoryModule = {
  id: 'reactory-azure',
  nameSpace: 'core',
  version: '1.0.0',
  name: 'ReactoryAzure',
  dependencies: ['core.ReactoryServer@1.0.0'],
  priority: 0,
  graphDefinitions: { Resolvers: {}, Types: [] },
  models: [],
  workflows: [...workflows],
  forms: [],
  services: [...services],
  translations: [],
  clientPlugins: [],
  cli: [],
  description: 'Reactory Azure Module',
  grpc: null,
  passportProviders: [],
  pdfs: [],
};
```

Two details matter for ordering. `dependencies: ['core.ReactoryServer@1.0.0']` states the edge; the
dependency loader resolves core first. `priority: 0` is not a tie-breaker against core — a module
that needs core to be registered should not rely on priority, only on the dependency edge.

**Lesson:** every field you leave empty is a capability you do not have. The module object is not a
wish list; it is the complete contribution.

### 9.4 Step 3 — wrap the vendor API

The wrapper is `src/modules/reactory-azure/services/graph.ts`. It has three parts:

1. A client factory that accepts a token and an API version
   (`src/modules/reactory-azure/services/graph.ts:10-23`).
2. A TypeScript interface declaring **eight** of the nine operations
   (`src/modules/reactory-azure/types.d.ts:13-30`). `getEmails` is implemented at
   `src/modules/reactory-azure/services/graph.ts:105` but never declared — see §10.
3. A plain object annotated with that interface
   (`src/modules/reactory-azure/services/graph.ts:27`), which is why the ninth method is an excess
   property rather than a silent omission.

The factory is the useful part to copy:

```ts
const getAuthenticatedClient = (accessToken: string, apiVersion = 'v1.0') => {
  const client = Client.init({
    defaultVersion: apiVersion,
    debugLogging: true,
    authProvider: (done) => done(null, accessToken),
  });
  return client;
};
```

Evidence: `src/modules/reactory-azure/services/graph.ts:10-23`.

The wrapper is not a service. It has no FQN, no namespace, no version and no factory definition; it
is a default export of an object (`src/modules/reactory-azure/services/graph.ts:27`,
`:229`). `services/index.ts` does not import it (`src/modules/reactory-azure/services/index.ts:3`),
and the module object only spreads that empty array
(`src/modules/reactory-azure/index.ts:22`). The service registry therefore logs `(0) services
found` and never sees `MSGraph` (`src/services/ServiceManager.ts:51`).

**Lesson:** an API wrapper becomes a module service when you export a definition with an `id`, a
`nameSpace`, a `name`, a `version` and a `service` factory, and add it to `module.services`. The
illustrative definition in §5 shows the missing step; `src/modules/reactory-google/services/index.ts:13-26`
shows a real module doing it.

### 9.5 Step 4 — decide the data model

The module declares `models: []` (`src/modules/reactory-azure/index.ts:19`) and has no `models/`
directory, no migrations and no collections. For a read-through vendor wrapper that is correct:
Microsoft owns the data, and there is nothing local to persist.

The mistake would be to add persistence for its own sake. If the storage scaffold were to become
real, the correct integration point is core's file model, not a new collection:
`reactory_files` is defined at `src/modules/reactory-core/models/CoreFile.ts:283` and managed by
`ReactoryFileService` at `src/modules/reactory-core/services/ReactoryFileService.ts:106`. A vendor
storage backend should extend that contract (or provide a remote target) so files remain visible to
the platform. A parallel `AzureBlobStorage` class with no model and no consumer does not.

**Lesson:** "no model" is a legitimate answer. "A storage class that stores nothing" is not.

### 9.6 Step 5 — expose GraphQL

The module declares an empty GraphQL contribution
(`src/modules/reactory-azure/index.ts:15-18`). The composition points are:

| Composition | Source | What it reads |
|---|---|---|
| Types | `src/models/graphql/types/index.ts:6-16` | `installedModule.graphDefinitions.Types` |
| Resolvers | `src/models/graphql/resolvers/index.ts:19` | `installedModule.graphDefinitions.Resolvers` |
| Directives | `src/models/graphql/directives/index.ts:6` | module-contributed directives |

An empty `Types` array and an empty `Resolvers` object add nothing. The module has no schema file,
so there is no type to compose and no field to resolve.

A real module passes populated definitions. `reactory-google` does exactly that at
`src/modules/reactory-google/index.ts:20` (`graphDefinitions: GraphqlDefinitions`). The shape is not
validated at the module boundary; an empty object is accepted silently, which is why this omission
does not fail startup.

**Lesson:** GraphQL is optional only if a service is present. A module with neither is unreachable
from the client and from `context.getService`.

### 9.7 Step 6 — contribute workflows

The module spreads `workflows` into the object (`src/modules/reactory-azure/index.ts:20`), but the
source file exports `[]` (`src/modules/reactory-azure/workflows/index.ts:3`). There are no YAML
files and no `workflowSteps` field.

The workflow runner consumes definitions from `module.workflows`, and core validates each entry at
`src/modules/reactory-core/services/SystemService.ts:152`. A module that wants to automate vendor
operations either registers a workflow definition or contributes a step type; this one does
neither. The single file is a placeholder, not a workflow.

**Lesson:** `workflows: [...workflows]` is not a contribution. The spread of an empty default export
is still an empty array.

### 9.8 Step 7 — contribute forms and UI

The module declares `forms: []` (`src/modules/reactory-azure/index.ts:21`) and `clientPlugins: []`
(`:24`). `FormService` walks enabled modules and reads `module.forms`
(`src/modules/reactory-core/services/FormService.ts:43-52`); an empty array adds no form to the
registry. Client plugins are loaded from `module.clientPlugins`; an empty array loads no bundle.

There is no route, middleware, menu or translation contribution either. The module object has no
`routes`, `middleware` or `reactor` field. So the PWA has no Azure screen, no Azure menu entry and no
Azure widget. The only UI path is indirect: the core profile and email screens call the two
resolvers in §1.

**Lesson:** a server-only integration can legitimately have no UI. It should then say so, rather than
leave `forms` and `clientPlugins` as unexplained empty arrays.

### 9.9 Step 8 — scaffold storage

`storage/index.ts` is the clearest example of a scaffold that is not an implementation.

| Part | What it does | Evidence |
|---|---|---|
| Import | Imports `AnonymousCredential` from `@azure/storage-file-share`; never uses it | `src/modules/reactory-azure/storage/index.ts:1-3` |
| Defaults | `account: 'devstoreaccount1'`, `accountKey: process.env.AZURE_STORAGE_KEY` | `src/modules/reactory-azure/storage/index.ts:5-8` |
| Class | `class AzureBlobStorage { constructor() {} ... }` | `src/modules/reactory-azure/storage/index.ts:10-11` |
| Implementation | Every method is commented out, lines 12-85 | `src/modules/reactory-azure/storage/index.ts:12-85` |
| Export | `export default AzureBlobStorage` | `src/modules/reactory-azure/storage/index.ts:88` |

After comments are stripped, the class has one member: an empty constructor. Nothing imports the
file; `grep -rn "storage" --include='*.ts' src/modules/reactory-azure | grep -v storage/index.ts`
returns nothing. The commented code also targets the pre-v12 Azure SDK API (`StorageURL`,
`Aborter`, `ShareURL`, `DirectoryURL`, `FileURL`, `ContainerURL`), while `package.json` pins
`@azure/storage-file-share` 12.23.0 (`src/modules/reactory-azure/package.json:32`). Uncommenting it
would not compile.

**Lesson:** either implement the storage service and register it, or delete the scaffold. An empty
class that is never imported teaches the wrong pattern twice — once for storage, once for module
contributions.

### 9.10 Step 9 — register at runtime

At startup the generated barrel imports the module (`src/modules/__index.ts:13`) and adds it to the
enabled array (`src/modules/__index.ts:32`). From there the contribution points are independent:

| Runtime consumer | What it does with this module | Result |
|---|---|---|
| `ServiceManager` | Iterates `module.services` | Logs `(0) services found` (`src/services/ServiceManager.ts:51`) |
| GraphQL type aggregator | Iterates `graphDefinitions.Types` | Adds nothing (`src/models/graphql/types/index.ts:6-16`) |
| GraphQL resolver aggregator | Iterates `graphDefinitions.Resolvers` | Adds nothing (`src/models/graphql/resolvers/index.ts:19`) |
| `FormService` | Iterates `module.forms` | Adds nothing (`src/modules/reactory-core/services/FormService.ts:43-52`) |
| Workflow runner | Reads `module.workflows` | Adds nothing (`src/modules/reactory-core/services/SystemService.ts:152`) |

The module is loaded. It is not registered as a capability. That distinction — a module that loads
versus a module that contributes — is the single most important thing this example teaches.

### 9.11 Step 10 — verify the build

These commands are the quickest way to confirm the contract. Run them from the server repository
root:

```bash
# 1. The module object and its empty payloads
grep -n "services:\|workflows:\|forms:\|graphDefinitions\|models:" \
  src/modules/reactory-azure/index.ts

# 2. Service surface: two files, zero definitions
find src/modules/reactory-azure/services -name '*.ts' | wc -l    # 2
cat src/modules/reactory-azure/services/index.ts                 # export default [];

# 3. Workflow surface: one file, zero definitions
cat src/modules/reactory-azure/workflows/index.ts                # export default [];

# 4. GraphQL surface: zero files
find src/modules/reactory-azure -name '*.graphql' | wc -l         # 0

# 5. Storage is not wired
grep -rn "AzureBlobStorage" --include='*.ts' src/modules/reactory-azure \
  | grep -v 'storage/index.ts'                                    # no output
```

The documentation suite adds a structural check:

```bash
node scripts/verify-azure-docs.js --require-source
```

### 9.12 What a complete vendor module looks like

`reactory-google` is the same idea taken to completion. Compare the module objects:

| Contribution | `reactory-azure` | `reactory-google` | Evidence |
|---|---|---|---|
| `graphDefinitions` | Empty object and array | `GraphqlDefinitions` | `src/modules/reactory-google/index.ts:20` |
| `workflows` | Spread of `[]` | `Workflows` | `src/modules/reactory-google/index.ts:21` |
| `forms` | `[]` | `Forms` | `src/modules/reactory-google/index.ts:22` |
| `services` | Spread of `[]` | Ten service definitions | `src/modules/reactory-google/services/index.ts:13-26` |
| `models` | `[]` | `Models` | `src/modules/reactory-google/index.ts:24` |
| `middleware` | Absent | `Middlewares` | `src/modules/reactory-google/index.ts:25` |
| `cli` | `[]` | `CliCommands` | `src/modules/reactory-google/index.ts:26` |
| `routes` | Absent | `/google` router | `src/modules/reactory-google/index.ts:27-30` |
| `reactor` | Absent | Macros and tools | `src/modules/reactory-google/index.ts:33-39` |

`reactory-google` also shows the service shape this module lacks: a decorated class with an FQN
(`src/modules/reactory-google/services/TasksService.ts:13-24`), a definition object
(`:197-211`) and a populated export array (`src/modules/reactory-google/services/index.ts:13-26`).
Read both pages together: Google is the destination, Azure is the smallest honest skeleton.

### 9.13 Copy checklist

| Step | Must exist in a new module | `reactory-azure` has it? |
|---|---|---|
| 1 | `available.json` entry with matching FQN, entry path and licence | FQN and entry path yes; licence no |
| 2 | `index.ts` module object with a dependency edge | Yes |
| 3 | At least one service definition with an FQN, exported from `services/index.ts` | No |
| 4 | A model, or an explicit statement that the vendor owns the data | Explicit by omission; no model |
| 5 | GraphQL definitions, or a service that replaces them | No |
| 6 | Workflow definitions or step types, if the integration automates work | No |
| 7 | Forms and client plugins, if the integration has a UI | No |
| 8 | Storage implemented and registered, if storage is claimed | No |
| 9 | Runtime contribution visible in the service/GraphQL/form registries | No |
| 10 | Tests and an evidence index | No tests; this page is the evidence index |

---

## 10. Limitations & roadmap

### Limitations

| # | Limitation | Measured value | Evidence |
|---|---|---|---|
| 1 | No service is registered; `MSGraph` is unreachable by FQN | 0 services | `src/modules/reactory-azure/services/index.ts:3`, `src/modules/reactory-azure/index.ts:22` |
| 2 | No GraphQL surface | 0 SDL files, 0 types, 0 resolvers | `src/modules/reactory-azure/index.ts:15-18` |
| 3 | No workflow surface | 1 file, 0 workflow definitions | `src/modules/reactory-azure/workflows/index.ts:3` |
| 4 | No UI surface | 0 forms, 0 client plugins, 0 routes | `src/modules/reactory-azure/index.ts:21`, `:24` |
| 5 | No data model or migrations | 0 models, 0 migrations | `src/modules/reactory-azure/index.ts:19` |
| 6 | Storage scaffold is an empty class and is never imported | 1 file, 0 methods after comments | `src/modules/reactory-azure/storage/index.ts:10-88` |
| 7 | Graph code references identifiers that are never imported | `Client` at `:12`, `ResponseType` at `:38`, `Microsoft.*` at `:196-204` | `src/modules/reactory-azure/services/graph.ts:12`, `:38`, `:196-204` |
| 8 | Graph client dependency is undeclared | `@microsoft/microsoft-graph-client` absent from `package.json` and lockfile | `src/modules/reactory-azure/package.json:29-33` |
| 9 | `sendEmail` cannot report a failed send | Graph call is inside `try` at `:217`; `Client is not defined` is caught at `:221-223` and logged; `return response` at `:225` returns the Express export imported at `:4` | `src/modules/reactory-azure/services/graph.ts:4`, `:216-225` |
| 9a | `IMicrosoftGraph` omits `getEmails` | interface declares 8 methods; implementation has 9 | `src/modules/reactory-azure/types.d.ts:13-30`, `src/modules/reactory-azure/services/graph.ts:105` |
| 9b | The omission is a compile error in a `noImplicitAny` project, not a style issue | `TS2353` on the annotated object literal; `TS2339` at core's call site | `src/modules/reactory-azure/services/graph.ts:27`, `src/modules/reactory-core/resolvers/Emails/UserEmails.ts:22` |
| 10 | `getEmails` hides failures as empty results | returns `[]` after catch | `src/modules/reactory-azure/services/graph.ts:108`, `:128-132` |
| 11 | `getTasks` accepts a filter and ignores it | signature at `:135`, no filter use in `:136-140` | `src/modules/reactory-azure/services/graph.ts:135-143` |
| 12 | Graph debug logging is hardcoded on | `debugLogging: true` | `src/modules/reactory-azure/services/graph.ts:16` |
| 13 | Core bypasses the module contract with direct imports | 2 direct imports in core | `src/modules/reactory-core/resolvers/User/ProfileResolver.ts:6`, `src/modules/reactory-core/resolvers/Emails/UserEmails.ts:9` |
| 14 | Registry licence contradicts the module manifest and status | `commercial` vs MIT / example-only | `src/modules/available.json:28`, `src/modules/reactory-azure/package.json:17-21` |
| 15 | Package version and module version disagree | `1.1.0` vs `1.0.0` | `src/modules/reactory-azure/package.json:3`, `src/modules/reactory-azure/index.ts:11` |
| 16 | `AGENT.md` documents a storage path that does not exist | says `storage/AzureBlobStorage.ts`; actual is `storage/index.ts` | `src/modules/reactory-azure/AGENT.md:25`, `src/modules/reactory-azure/storage/index.ts:10` |
| 17 | `AGENT.md` endpoint table differs from the code | says `/me/photo/$value`; code uses `/me/photos/{size}/$value` | `src/modules/reactory-azure/AGENT.md:34`, `src/modules/reactory-azure/services/graph.ts:34` |
| 18 | No tests | 0 test files | no `*.test.ts`, `*.spec.ts` or `__tests__/` |

Limitation 13 is the architectural one. Because `reactory-core` imports
`@reactory/server-modules/reactory-azure/services/graph` directly
(`src/modules/reactory-core/resolvers/User/ProfileResolver.ts:6`,
`src/modules/reactory-core/resolvers/Emails/UserEmails.ts:9`), the integration is a compile-time
dependency of core rather than a runtime module contribution. Removing the module from
`enabled-reactory.json` would not remove the import; replacing it with another vendor module would
require editing core. That is the opposite of the module system's purpose.

Limitations 7–9b mean the wrapper is neither runnable nor type-safe nor reliable.

`Client` and `ResponseType` are never imported and the Graph client package is not declared, so the
eight methods that call the factory outside a `try` throw `ReferenceError: Client is not defined` —
including the `getUserDetails` path core actually calls. `sendEmail` is worse than broken: it catches
that same error, logs it, and returns a truthy Express object, so a failed send is indistinguishable
from a successful one. That is the defect a reader is most likely to reproduce, and it is invisible
in the return value.

Separately, the interface declares eight of the nine implemented operations. `getEmails` — one of the
two methods core actually calls — is an excess property on the annotated object literal (`TS2353`)
and absent from the exported type (`TS2339` at the core call site). Declaring
`getEmails(token: string, filter: any): Promise<any>` on `IMicrosoftGraph` is the one-line fix. This
page records the wiring, not a working integration.

### Roadmap

Roadmap content belongs in the platform maturity ledger, not in a module page; that ledger is not
present in this repository. The candidates raised by the evidence above are:

- **Fix the licence metadata.** Change `commercial` to `MIT` in the three registry files and remove
  the shop URL, or deliberately relicense the module and stop calling it an example.
- **Make `MSGraph` a service.** Export a definition with
  `id: 'core.MicrosoftGraphService@1.0.0'`, add it to `module.services`, and have core resolve it
  with `context.getService` instead of importing the file.
- **Declare the Graph dependency.** Add `@microsoft/microsoft-graph-client` and import `Client` and
  `ResponseType`; add `@microsoft/microsoft-graph-types` for the `Microsoft.*` types.
- **Fix `sendEmail`.** The call is inside the `try` and the `return response` at `:225` falls through
to the Express import at `:4`, so every failure returns a truthy non-result. Hoist the result into a
variable that is actually in scope at the return, return the Graph result on success, and rethrow or
return a typed error on failure.
- **Declare `getEmails` on the interface.** Add
  `getEmails(token: string, filter: any): Promise<any>` to `IMicrosoftGraph`
  (`src/modules/reactory-azure/types.d.ts:13-30`). That removes the `TS2353` excess-property error at
  `src/modules/reactory-azure/services/graph.ts:27` and the `TS2339` at
  `src/modules/reactory-core/resolvers/Emails/UserEmails.ts:22` in one line.
- **Decide the storage question.** Either implement `AzureBlobStorage` against the v12 SDK as a
  registered file backend, or delete `storage/` from the example.
- **Correct `AGENT.md`.** Point at `storage/index.ts`, fix the profile-image endpoint, and state that
  the module registers no services or workflows.
- **Add tests.** At minimum, a unit test for `sendEmail` and `getEmails` failure behaviour, and a
  contract test that asserts the module's service array is either populated or explicitly empty.

---

## 11. Evidence index

Every claim in this page resolves to a file and a line in the
`reactory-express-server` checkout. Module paths are written in full
(`src/modules/reactory-azure/...`) so they resolve from the server root.

### Identity, status and licence

| # | Claim | Evidence |
|---|---|---|
| 1 | The module describes itself as example-only | `src/modules/reactory-azure/README.md:1-2` |
| 2 | `AGENT.md` calls it a reference implementation | `src/modules/reactory-azure/AGENT.md:5` |
| 3 | `AGENT.md` declares MIT | `src/modules/reactory-azure/AGENT.md:12` |
| 4 | `AGENT.md` records package `@reactory/azure` 1.1.0 | `src/modules/reactory-azure/AGENT.md:13` |
| 5 | `AGENT.md` records the core dependency | `src/modules/reactory-azure/AGENT.md:14` |
| 6 | `AGENT.md` says the module is an example, not a product | `src/modules/reactory-azure/AGENT.md:56-58` |
| 7 | Package name and version | `src/modules/reactory-azure/package.json:2-3` |
| 8 | Package licence is MIT | `src/modules/reactory-azure/package.json:17-21` |
| 9 | Registry entry for the module | `src/modules/available.json:23-31` |
| 10 | Registry FQN is `core.ReactoryAzure@1.0.0` | `src/modules/available.json:26` |
| 11 | Registry licence is `commercial` | `src/modules/available.json:28` |
| 12 | Registry carries a shop URL | `src/modules/available.json:30` |
| 13 | Enabled registry repeats `commercial` | `src/modules/enabled-reactory.json:28` |
| 14 | Installed registry repeats `commercial` | `src/modules/installed.json:28` |
| 15 | Generated barrel imports the module | `src/modules/__index.ts:13` |
| 16 | Generated barrel adds it to the enabled array | `src/modules/__index.ts:32` |

### Module contract

| # | Claim | Evidence |
|---|---|---|
| 17 | Module id | `src/modules/reactory-azure/index.ts:9` |
| 18 | Namespace is `core` | `src/modules/reactory-azure/index.ts:10` |
| 19 | Module version is `1.0.0` | `src/modules/reactory-azure/index.ts:11` |
| 20 | Module name is `ReactoryAzure` | `src/modules/reactory-azure/index.ts:12` |
| 21 | Dependency on core | `src/modules/reactory-azure/index.ts:13` |
| 22 | Priority `0` | `src/modules/reactory-azure/index.ts:14` |
| 23 | Empty GraphQL definitions | `src/modules/reactory-azure/index.ts:15-18` |
| 24 | Empty model array | `src/modules/reactory-azure/index.ts:19` |
| 25 | Workflow spread | `src/modules/reactory-azure/index.ts:20` |
| 26 | Empty forms array | `src/modules/reactory-azure/index.ts:21` |
| 27 | Service spread | `src/modules/reactory-azure/index.ts:22` |
| 28 | Empty translations array | `src/modules/reactory-azure/index.ts:23` |
| 29 | Empty client plugins array | `src/modules/reactory-azure/index.ts:24` |
| 30 | Empty CLI array | `src/modules/reactory-azure/index.ts:25` |
| 31 | Null gRPC contribution | `src/modules/reactory-azure/index.ts:27` |
| 32 | Empty passport providers array | `src/modules/reactory-azure/index.ts:28` |
| 33 | Empty PDF array | `src/modules/reactory-azure/index.ts:29` |

### Services and Graph wrapper

| # | Claim | Evidence |
|---|---|---|
| 34 | Service array is empty | `src/modules/reactory-azure/services/index.ts:3` |
| 35 | `MSGraph` is a plain object, not a definition | `src/modules/reactory-azure/services/graph.ts:27` |
| 36 | Graph client factory and per-call token | `src/modules/reactory-azure/services/graph.ts:10-23` |
| 37 | Graph client is created with `Client.init` | `src/modules/reactory-azure/services/graph.ts:12` |
| 38 | Debug logging is hardcoded on | `src/modules/reactory-azure/services/graph.ts:16` |
| 39 | Profile-image method | `src/modules/reactory-azure/services/graph.ts:28-63` |
| 40 | Profile-image endpoint | `src/modules/reactory-azure/services/graph.ts:34` |
| 41 | Profile image returns a data URI | `src/modules/reactory-azure/services/graph.ts:57-58` |
| 42 | Profile-image errors return `null` | `src/modules/reactory-azure/services/graph.ts:59-62` |
| 43 | User-details method | `src/modules/reactory-azure/services/graph.ts:64-91` |
| 44 | User-details `$select` fields | `src/modules/reactory-azure/services/graph.ts:77` |
| 45 | Avatar is merged into the user object | `src/modules/reactory-azure/services/graph.ts:84-86` |
| 46 | Events method | `src/modules/reactory-azure/services/graph.ts:93-103` |
| 47 | Emails method | `src/modules/reactory-azure/services/graph.ts:105-133` |
| 48 | Email search branch | `src/modules/reactory-azure/services/graph.ts:111-117` |
| 49 | Email errors are swallowed | `src/modules/reactory-azure/services/graph.ts:128-132` |
| 50 | Tasks method ignores its filter | `src/modules/reactory-azure/services/graph.ts:135-143` |
| 51 | Single-task method | `src/modules/reactory-azure/services/graph.ts:145-153` |
| 52 | Delete-task method | `src/modules/reactory-azure/services/graph.ts:155-165` |
| 53 | Create-task method | `src/modules/reactory-azure/services/graph.ts:167-191` |
| 54 | Send-email method | `src/modules/reactory-azure/services/graph.ts:193-226` |
| 55 | `Microsoft.*` types used without a value import | `src/modules/reactory-azure/services/graph.ts:196-204` |
| 56 | Send-email declares `const response` inside `try`, shadowing the Express import only within that block | `src/modules/reactory-azure/services/graph.ts:217` |
| 57 | Send-email's `return response` resolves to the Express `response` import, not the block-scoped `const` | `src/modules/reactory-azure/services/graph.ts:4`, `:225` |
| 57a | The Graph factory call is inside the `try`, so `Client is not defined` is caught and logged | `src/modules/reactory-azure/services/graph.ts:216-223` |
| 58 | Service registry logs `(0) services found` | `src/services/ServiceManager.ts:51` |
| 59 | Service registry iterates `module.services` | `src/services/ServiceManager.ts:44-93` |
| 60 | GraphQL type aggregation | `src/models/graphql/types/index.ts:6-16` |
| 61 | GraphQL resolver aggregation | `src/models/graphql/resolvers/index.ts:19` |
| 62 | Form aggregation | `src/modules/reactory-core/services/FormService.ts:43-52` |
| 63 | Workflow validation | `src/modules/reactory-core/services/SystemService.ts:152` |

### Types, storage and workflows

| # | Claim | Evidence |
|---|---|---|
| 64 | Graph interface declares eight methods | `src/modules/reactory-azure/types.d.ts:13-30` |
| 64a | `getEmails` is implemented but not declared on the interface | `src/modules/reactory-azure/services/graph.ts:105` |
| 64b | `MSGraph` is annotated with `IMicrosoftGraph`, making `getEmails` an excess property (`TS2353`) | `src/modules/reactory-azure/services/graph.ts:27` |
| 64c | Core calls the undeclared `getEmails` through the typed export (`TS2339`) | `src/modules/reactory-core/resolvers/Emails/UserEmails.ts:22` |
| 65 | Graph types are imported type-only | `src/modules/reactory-azure/types.d.ts:2` |
| 66 | Storage imports `AnonymousCredential` | `src/modules/reactory-azure/storage/index.ts:1-3` |
| 67 | Storage defaults and env key | `src/modules/reactory-azure/storage/index.ts:5-8` |
| 68 | Storage class and empty constructor | `src/modules/reactory-azure/storage/index.ts:10-11` |
| 69 | Storage implementation is commented out | `src/modules/reactory-azure/storage/index.ts:12-85` |
| 70 | Storage default export | `src/modules/reactory-azure/storage/index.ts:88` |
| 71 | Workflow file exports an empty array | `src/modules/reactory-azure/workflows/index.ts:3` |
| 72 | `AGENT.md` names a storage file that does not exist | `src/modules/reactory-azure/AGENT.md:25` |
| 73 | `AGENT.md` profile-image endpoint differs from code | `src/modules/reactory-azure/AGENT.md:34` |
| 74 | Package storage dependency version | `src/modules/reactory-azure/package.json:32` |
| 75 | Package has no Graph client dependency | `src/modules/reactory-azure/package.json:29-33` |

### Consumers and comparison

| # | Claim | Evidence |
|---|---|---|
| 76 | Core imports `MSGraph` directly | `src/modules/reactory-core/resolvers/User/ProfileResolver.ts:6` |
| 77 | Core reads the Microsoft authentication record | `src/modules/reactory-core/resolvers/User/ProfileResolver.ts:215` |
| 78 | Core calls `getUserDetails` | `src/modules/reactory-core/resolvers/User/ProfileResolver.ts:223` |
| 79 | Core calls `getUserDetails` after refresh | `src/modules/reactory-core/resolvers/User/ProfileResolver.ts:254` |
| 80 | Core merges the returned avatar | `src/modules/reactory-core/resolvers/User/ProfileResolver.ts:288-289` |
| 81 | Core imports `O365` directly | `src/modules/reactory-core/resolvers/Emails/UserEmails.ts:9` |
| 82 | Core calls `getEmails` | `src/modules/reactory-core/resolvers/Emails/UserEmails.ts:22` |
| 83 | Core chooses the Microsoft mail path | `src/modules/reactory-core/resolvers/Emails/UserEmails.ts:59-62` |
| 84 | `sendEmail` is commented out in core's email service | `src/modules/reactory-core/services/EmailService.ts:135` |
| 85 | Core file collection is `reactory_files` | `src/modules/reactory-core/models/CoreFile.ts:283` |
| 86 | Core file service class | `src/modules/reactory-core/services/ReactoryFileService.ts:106` |
| 87 | Google passes `graphDefinitions` | `src/modules/reactory-google/index.ts:20` |
| 88 | Google passes workflows | `src/modules/reactory-google/index.ts:21` |
| 89 | Google passes forms | `src/modules/reactory-google/index.ts:22` |
| 90 | Google passes models | `src/modules/reactory-google/index.ts:24` |
| 91 | Google passes middleware | `src/modules/reactory-google/index.ts:25` |
| 92 | Google passes CLI | `src/modules/reactory-google/index.ts:26` |
| 93 | Google mounts routes | `src/modules/reactory-google/index.ts:27-30` |
| 94 | Google contributes reactor macros and tools | `src/modules/reactory-google/index.ts:33-39` |
| 95 | Google exports ten service definitions | `src/modules/reactory-google/services/index.ts:13-26` |
| 96 | Google's decorated service definition | `src/modules/reactory-google/services/TasksService.ts:13-24` |
| 97 | Google's plain definition object | `src/modules/reactory-google/services/TasksService.ts:197-211` |
| 98 | Canonical mock service definition in core | `src/modules/reactory-core/services/EmailService.ts:226-236` |
| 99 | Canonical decorated service definition in Slack | `src/modules/reactory-slack/services/SlackReaderService.ts:27-35` |
| 100 | TypeScript path alias for module imports | `tsconfig.json:19` |
