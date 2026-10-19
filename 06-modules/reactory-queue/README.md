---
title: reactory-queue — the queue abstraction and its three providers
status: Partial
owner: platform
verified: 2026-10-19
verifiedAgainst: reactory-express-server@dbe9501e / reactory-queue@349ce0a
audience: developer
---

![Build Anything Fast](/branding/reactory-logo.png)
# `reactory-queue` — the queue abstraction and its three providers

**FQN:** `reactory.Queue@1.0.0` · **Licence:** MIT (module manifest) / Apache-2.0 (`LICENSE`) / `private` (registry) — see §1 · **Status:** Partial — the providers work, but the module contributes no GraphQL, UI or workflow surface and has no retry, dead-letter or telemetry layer of its own.

`reactory-queue` is the transport every asynchronous module in the platform is expected to share. It defines one small interface — enqueue, dequeue, receive, delete, count, create, delete — and supplies three interchangeable implementations: an in-memory `Map`, BullMQ over Redis, and AWS SQS. A `QueueProvider` registry chooses between them at construction time.

It is **not** a job framework. It has no scheduler, no worker pool, no retry policy, no dead-letter queue, no tenancy model and no metrics. Those live in the consumers (`reactory-communicator`, `reactory-payment`, `reactory-product`) or are absent altogether. This distinction is the single most important thing to understand before adopting it.

This page follows the [module documentation template](../../08-contributing/module-doc-template.md) and uses the ten-section structure. The generated index is at [`06-modules/index.md`](../index.md); comparison implementations are [`reactory-core`](../reactory-core/README.md) and [`reactory-reactor`](../reactory-reactor/README.md).

> **Read §5 and §9 before configuring a provider.** The default provider is hard-coded to `in-memory`, `REACTORY_QUEUE_PROVIDER` never takes effect, and `QueueProvider` is an `instance`-lifecycle service — so `getService()` returns a fresh registry and fresh in-memory queues on every call. A deployment that believes it is on Redis because `REACTORY_QUEUE_BULLMQ_ENABLED=true` is still writing to process memory unless it also overrides `defaultProvider`.

---

## 1. Purpose & status

**Status: Partial.** The module loads by default, contributes four resolvable services, and all three providers implement the same interface. It contributes **zero** GraphQL types, **zero** forms, **zero** workflow definitions, **zero** routes, **zero** CLI commands and **zero** client plugins. It also has no retry/backoff, dead-letter, concurrency or telemetry implementation; those concerns are pushed to callers (see §8).

| Question | Answer | Evidence |
|---|---|---|
| What is it? | A provider-agnostic queue abstraction with in-memory, BullMQ/Redis and AWS SQS implementations | `src/modules/reactory-queue/index.ts:11-33` |
| Is it loaded by default? | Yes — the generated module barrel imports it and lists it in the module array | `src/modules/__index.ts:15`, `src/modules/__index.ts:34` |
| Is it supported? | It is shipped and consumed by communicator, payment, product and KYC, but it is `private` in the registry and partially implemented | `src/modules/available.json:46-48` |
| Does it contribute services? | Yes — four service definitions: the registry and the three providers | `src/modules/reactory-queue/services/index.ts:6-11` |
| Does it persist a model? | No — `models` is an empty array and there is no ORM model in the module | `src/modules/reactory-queue/index.ts:24`, `src/modules/reactory-queue/models/index.ts:1` |
| Does it expose GraphQL? | No — `graphDefinitions` is the empty object from `graph/index.ts` | `src/modules/reactory-queue/index.ts:19`, `src/modules/reactory-queue/graph/index.ts:1` |
| Does it have a UI? | No — `forms: []`, `clientPlugins: []`, `routes: {}` | `src/modules/reactory-queue/index.ts:21`, `:25`, `:29` |
| Does it run workflows? | No — one workflow barrel file that exports `[]` | `src/modules/reactory-queue/workflow/index.ts:1` |
| Is it durable? | Only on BullMQ and SQS; the default in-memory provider loses everything on restart and is not shared between service resolutions | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:38-46` |
| Does it do retries or DLQ? | No — no retry, backoff or dead-letter code exists in the module | `src/modules/reactory-queue/services/queue/types.ts:53-95` |
| Is it instrumented? | No — `bullmq-otel` is declared but never imported and no OpenTelemetry API is used | `src/modules/reactory-queue/package.json:11-13` |
| Is the registry's provider selectable by env? | No — `defaultProvider` is always `in-memory` before the env fallback is evaluated | `src/modules/reactory-queue/services/queue/QueueProvider.ts:65-70`, `:79` |

### The brief's file counts are not contribution counts

The ticket described the surface as "11 service files, 1 graph file, 1 form, 1 workflow". The file counts are right; the contribution counts are not. `graph/index.ts` exports an empty object, `forms/index.ts` exports an empty array and `workflow/index.ts` exports an empty array. A file that exports `[]` is not a capability, and this page counts capabilities.

| Measure | Count | Evidence |
|---|---|---|
| TypeScript files (excluding `build/`) | 23 (20 non-spec + 3 spec) | `find src/modules/reactory-queue -name '*.ts' -not -path '*/build/*'` |
| TypeScript lines (non-spec) | 1,503 | `find … -not -name '*.spec.ts' \| xargs wc -l` |
| TypeScript files under `services/` | 11 (7 source + 3 specs + `services/index.ts`) | `src/modules/reactory-queue/services/` |
| Registered service definitions | 4 | `src/modules/reactory-queue/services/index.ts:6-11` |
| Queue provider implementations | 3 | `src/modules/reactory-queue/services/queue/index.ts:14-16` |
| GraphQL SDL files | 0 | `find src/modules/reactory-queue -name '*.graphql'` |
| YAML workflow files | 0 | `find src/modules/reactory-queue -name '*.yaml' -o -name '*.yml'` |
| ORM models | 0 | `src/modules/reactory-queue/models/index.ts:1` |
| Forms | 0 | `src/modules/reactory-queue/forms/index.ts:1` |
| Workflow definitions | 0 | `src/modules/reactory-queue/workflow/index.ts:1` |
| Client plugins | 0 | `src/modules/reactory-queue/index.ts:25` |
| Routes / CLI / gRPC / views | 0 / 0 / 0 / 0 | `src/modules/reactory-queue/routes/index.ts:1`, `src/modules/reactory-queue/cli/index.ts:1`, `src/modules/reactory-queue/protobuf/index.ts:1`, `src/modules/reactory-queue/views/index.ts:1` |
| Tests | 3 spec files | `services/queue/QueueProvider.spec.ts`, `AWSSQSService.spec.ts`, `EnqueueCreateIfNotExists.spec.ts` |
| Module markdown | 1,235 lines across 5 files | `wc -l` over `README.md`, `AGENT.md` and `services/queue/*.md` |

### Licence reconciliation

Three artefacts disagree:

| Artefact | Value | Evidence |
|---|---|---|
| `package.json` | MIT | `src/modules/reactory-queue/package.json:10` |
| `LICENSE` | Apache License 2.0 | `src/modules/reactory-queue/LICENSE:1-2` |
| Registry (`available.json`) | `private` | `src/modules/available.json:48` |

The package manifest is the value npm and consumers see, and it is the value repeated by the module's own `AGENT.md`. **Treat MIT as the intended licence**, and treat the Apache-2.0 `LICENSE` file and the registry's `private` as defects to reconcile in the module repository. This documentation repository cannot change either; the generated index will keep showing `private` until `available.json` is corrected.

### What is actually wired

`QueueProvider` is resolved by name from four consumer modules. That is the real integration surface:

| Consumer | What it does | Evidence |
|---|---|---|
| `reactory-communicator` | Injects `reactory.QueueProvider@1.0.0`, creates four queues, enqueues messages, retries with exponential backoff, moves failures to `communicator.dlq` | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:62-67`, `:143-159`, `:195-203`, `:302-331`, `:372-395` |
| `reactory-payment` | Resolves the default provider, publishes `Payment.*` events, polls `payment.inbound` with `dequeue`, and dead-letters through a database inbox | `src/modules/reactory-payment/events/index.ts:279-302`, `:324-331`; `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:130-142`, `:306-320`, `:411-466` |
| `reactory-product` | Polls `payment.events` and `shop.events`, peeks with `receiveMessages`, acks with `deleteMessage` | `src/modules/reactory-product/services/ProductEventConsumerService.ts:78-93`, `:126-139` |
| `reactory-kyc` | Four queue wrappers resolve the provider, but call `addProcessor()`, which no provider implements | `src/modules/reactory-kyc/queues/VerificationQueue.ts:37-40`, `:66-78` |

`reactory-core` also declares a `QueueListener` that would drive workflows from a queue, but it is not registered as a service (see §7).

---

## 2. Module contract

The module object is declared in `src/modules/reactory-queue/index.ts:11-31`.

| Field | Value | Evidence |
|---|---|---|
| `id` | `reactory-queue` | `src/modules/reactory-queue/index.ts:12` |
| `nameSpace` | `reactory` | `src/modules/reactory-queue/index.ts:13` |
| `name` | `Queue` | `src/modules/reactory-queue/index.ts:14` |
| `version` | `1.0.0` | `src/modules/reactory-queue/index.ts:15` |
| **FQN** | **`reactory.Queue@1.0.0`** | `src/modules/available.json:46` |
| `description` | `Reactory Queue abstraction` | `src/modules/reactory-queue/index.ts:16` |
| `dependencies` | `['core.ReactoryServer@1.0.0']` | `src/modules/reactory-queue/index.ts:17` |
| `priority` | `2` | `src/modules/reactory-queue/index.ts:18` |
| `graphDefinitions` | empty object | `src/modules/reactory-queue/index.ts:19`, `src/modules/reactory-queue/graph/index.ts:1` |
| `workflows` | `[]` | `src/modules/reactory-queue/index.ts:20`, `src/modules/reactory-queue/workflow/index.ts:1` |
| `forms` | `[]` | `src/modules/reactory-queue/index.ts:21`, `src/modules/reactory-queue/forms/index.ts:1` |
| `services` | four definitions | `src/modules/reactory-queue/index.ts:22`, `src/modules/reactory-queue/services/index.ts:6-11` |
| `translations` | `[]` | `src/modules/reactory-queue/index.ts:23`, `src/modules/reactory-queue/i18n/index.ts:1` |
| `models` | `[]` | `src/modules/reactory-queue/index.ts:24`, `src/modules/reactory-queue/models/index.ts:1` |
| `clientPlugins` | `[]` | `src/modules/reactory-queue/index.ts:25` |
| `pdfs` | `[]` | `src/modules/reactory-queue/index.ts:26` |
| `passportProviders` | `[]` | `src/modules/reactory-queue/index.ts:27` |
| `grpc` | `[]` | `src/modules/reactory-queue/index.ts:28`, `src/modules/reactory-queue/protobuf/index.ts:1` |
| `routes` | `{}` | `src/modules/reactory-queue/index.ts:29`, `src/modules/reactory-queue/routes/index.ts:1` |
| `cli` | `[]` | `src/modules/reactory-queue/index.ts:30`, `src/modules/reactory-queue/cli/index.ts:1` |

The module object declares no `middleware`, `serverPlugins`, `featureFlags`, `schema` or `views`. Registrations that rely on those keys see nothing from this module.

### Contributed services

`services/index.ts` exports four service definitions, so all four are resolvable by FQN whether or not a provider is enabled:

| Service FQN | Role | Evidence |
|---|---|---|
| `reactory.QueueProvider@1.0.0` | Registry and default-provider selector | `src/modules/reactory-queue/services/queue/QueueProvider.ts:21-31` |
| `reactory.BullMessageQueueService@1.0.0` | BullMQ/Redis provider | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:23-32` |
| `reactory.InMemoryQueueService@1.0.0` | In-process provider | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:16-25` |
| `reactory.AWSSQSQueueService@1.0.0` | AWS SQS provider | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:49-58` |

### The provider registry contract

`QueueProvider` exposes more than `getDefaultProvider()`. The full public surface is:

| Method | Purpose | Evidence |
|---|---|---|
| `registerProvider(key, provider)` | Add or replace a provider; warns on overwrite | `src/modules/reactory-queue/services/queue/QueueProvider.ts:172-180` |
| `unregisterProvider(key)` | Remove a provider, returns whether it existed | `src/modules/reactory-queue/services/queue/QueueProvider.ts:183-185` |
| `getProvider(key?)` | Return a provider or `undefined`, warns when missing | `src/modules/reactory-queue/services/queue/QueueProvider.ts:192-205` |
| `getDefaultProvider()` | Shorthand for `getProvider(defaultProviderKey)` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:210-212` |
| `setDefaultProvider(key)` | Change the default at runtime; throws if not registered | `src/modules/reactory-queue/services/queue/QueueProvider.ts:218-225` |
| `getAvailableProviders()` | Registered keys, in insertion order | `src/modules/reactory-queue/services/queue/QueueProvider.ts:231-233` |
| `hasProvider(key)` | Boolean membership test | `src/modules/reactory-queue/services/queue/QueueProvider.ts:239-241` |
| `getAllProviders()` | A copy of the provider map | `src/modules/reactory-queue/services/queue/QueueProvider.ts:247-249` |
| `onStartup()` | Calls each provider's `onStartup` and swallows individual failures | `src/modules/reactory-queue/services/queue/QueueProvider.ts:254-275` |

There is no per-queue object and no `getQueue(name)`. A queue is a **string id** passed in `options.queueId`; the provider decides what that string means (see §3 and §5).

---

## 3. Data model

**There is no local data model.** `models` is `[]` (`src/modules/reactory-queue/models/index.ts:1`), no ORM entity is declared, and the module contains no migration. Persistence, where it exists at all, is owned by the backing service.

### The envelope

Every provider moves the same shape, declared in `services/queue/types.ts`:

```ts
export interface IQueueEnvelope<THeader, TBody> {
  header: THeader
  body: TBody
}
```

| Part | Type | Evidence |
|---|---|---|
| Envelope | `IQueueEnvelope<THeader, TBody>` | `src/modules/reactory-queue/services/queue/types.ts:5-8` |
| `header.id` | `string` — envelope id, repurposed as an SQS receipt handle on receive | `src/modules/reactory-queue/services/queue/types.ts:97-110` |
| `header.receivedTimestamp` | `number` | `src/modules/reactory-queue/services/queue/types.ts:105` |
| `header.provider` | `string` | `src/modules/reactory-queue/services/queue/types.ts:109` |
| `body` | `EventEnvelopeBody` — `validationResults?: string[]` in the shipped type | `src/modules/reactory-queue/services/queue/types.ts:112-119` |
| `EventEnvelope` | `IQueueEnvelope<EnvelopeHeader, EventEnvelopeBody>` | `src/modules/reactory-queue/services/queue/types.ts:119` |

The type is narrower than real use. `reactory-payment` and `reactory-product` both write `header.eventType`, `header.timestamp`, `header.correlationId` and `header.source` — none of which exist on `EnvelopeHeader` — through `any`-typed provider references (`src/modules/reactory-payment/events/index.ts:250-263`, `:291-302`; `src/modules/reactory-product/events/index.ts:95-109`). The compile-time contract therefore does not protect the event contract.

### Where the bytes actually live

| Provider | Backing store | What `queueId` means | Identifier returned by `enqueue` |
|---|---|---|---|
| `in-memory` | `Map<string, EventEnvelope[]>` on the provider instance | Key in that map; default `defaultQueue` | `` `${queueName}-${queue.length - 1}` `` |
| `bullmq` | Redis lists/streams managed by BullMQ | Ignored on `enqueue`; the instance has one mutable `this.queue` slot | `job.id` from BullMQ |
| `aws-sqs` | SQS queue | A queue URL (used verbatim) or a queue name (resolved to a URL) | `MessageId` |

Evidence: `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:38-46`, `:48-65`; `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:45-68`, `:85-104`; `src/modules/reactory-queue/services/queue/AWSSQSService.ts:141-194`, `:196-204`.

Three consequences follow, and none of them are abstracted away:

1. **No schema, no migrations, no indexes.** There is nothing to migrate and nothing to query. Message bodies are opaque JSON; the platform cannot index a field or enforce a shape at the store.
2. **No tenant column.** No model means no `clientKey`, no `partnerId` and no tenant predicate. Queue ids are global strings. See §8.7.
3. **Identifiers are provider-specific.** An id returned by one provider cannot be used to delete a message on another, and the in-memory id is positional (`src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:64`, `:75-82`).

### Operations contract

The interface is seven methods (`src/modules/reactory-queue/services/queue/types.ts:53-95`):

| Method | Contract | Evidence |
|---|---|---|
| `enqueue(message, options?)` | Return a provider id | `src/modules/reactory-queue/services/queue/types.ts:59` |
| `dequeue()` | Return and **remove** one envelope, or throw when empty | `src/modules/reactory-queue/services/queue/types.ts:63` |
| `deleteMessage(id, options?)` | Ack/remove one message by provider id | `src/modules/reactory-queue/services/queue/types.ts:68` |
| `deleteMessages(ids, options?)` | Batch form; providers implement it as `Promise.all` | `src/modules/reactory-queue/services/queue/types.ts:73` |
| `receiveMessages(options?)` | Return up to `max` envelopes; **does not remove** on any provider | `src/modules/reactory-queue/services/queue/types.ts:78` |
| `count(queueId?)` | Message count, where the backend can supply one | `src/modules/reactory-queue/services/queue/types.ts:83` |
| `createQueue(queueId)` / `deleteQueue(queueId)` | Provisioning, where the backend supports it | `src/modules/reactory-queue/services/queue/types.ts:88-94` |

`IEnqueueOptions` declares `responseQueueId` and `failureQueueId` (`src/modules/reactory-queue/services/queue/types.ts:10-28`). **No provider implements either.** BullMQ explicitly strips them before calling `add` (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:88-100`); in-memory and SQS ignore them. Do not build request/reply or failure routing on these fields.

---

## 4. GraphQL API

**Zero.** The module contributes no SDL, no type, no query, no mutation, no subscription and no directive.

| Claim | Evidence |
|---|---|
| `graphDefinitions` is an empty object | `src/modules/reactory-queue/index.ts:19`, `src/modules/reactory-queue/graph/index.ts:1` |
| No `.graphql` file exists | `find src/modules/reactory-queue -name '*.graphql'` returns nothing |
| No resolver decorator is used | no `@query`, `@mutation` or `@resolver` in the module |

**Consequence:** there is no way to inspect or control a queue through this module's GraphQL surface. If an operator needs queue statistics or a DLQ replay, the commands are in `reactory-communicator`, and they operate on the communicator's Mongo `Message` collection — **not** on the transport queue:

| Operation | Kind | What it actually reads or changes | Evidence |
|---|---|---|---|
| `communicatorQueueStats` | Query | Counts `Message` documents by partner, status, channel and priority | `src/modules/reactory-communicator/graph/resolvers/QueueResolver.ts:23-24`, `:31-46` |
| `communicatorRetryMessages` | Mutation | Resets `retryCount` on `Message` documents selected by status | `src/modules/reactory-communicator/graph/resolvers/QueueResolver.ts:157-158`, `:204-229` |
| `communicatorPurgeDLQ` | Mutation | Deletes `Message` documents past `maxRetries` | `src/modules/reactory-communicator/graph/resolvers/QueueResolver.ts:267-268`, `:285-309` |

There are equivalent REST routes at `/api/communicator/v1/admin/queue/stats`, `/queue/retry` and `/queue/dead-letter` (`src/modules/reactory-communicator/routes/admin.ts:18-19`, `:162-163`, `:262-263`). All three are communicator-owned and message-model-backed.

A developer who needs transport-level introspection today has no supported API: they must resolve the provider and call `count()` themselves, accepting that SQS returns `-1` (§5.3).

---

## 5. Services

### 5.1 How a provider is selected

Provider selection happens once, in the `QueueProvider` constructor:

1. `loadConfiguration(props)` builds a default config (`src/modules/reactory-queue/services/queue/QueueProvider.ts:74-115`).
2. `defaultProvider` in that config is the literal `'in-memory'` (`src/modules/reactory-queue/services/queue/QueueProvider.ts:76`).
3. `defaultProviderKey` is then `config.defaultProvider || process.env.REACTORY_QUEUE_PROVIDER || 'in-memory'` (`src/modules/reactory-queue/services/queue/QueueProvider.ts:65`). Because step 2 always supplies a truthy value, **the env fallback is unreachable**. `REACTORY_QUEUE_PROVIDER` is dead code.
4. `initializeProviders()` registers BullMQ only when `REACTORY_QUEUE_BULLMQ_ENABLED === 'true'`, registers in-memory unless it is explicitly disabled, and registers SQS only when `REACTORY_QUEUE_AWS_SQS_ENABLED === 'true'` (`src/modules/reactory-queue/services/queue/QueueProvider.ts:120-165`).

The practical selection matrix is therefore:

| Desired default | How to get it | Does it work through `context.getService()` without props? |
|---|---|---|
| `in-memory` | Do nothing | Yes — it is the hard-coded default |
| `bullmq` | Pass `props.queueConfig.defaultProvider = 'bullmq'` **and** enable BullMQ | No — `getService(id)` passes no props |
| `aws-sqs` | Pass `props.queueConfig.defaultProvider = 'aws-sqs'` **and** enable SQS | No — `getService(id)` passes no props |

Enabling a provider only makes it **registered**. It does not make it the default. A deployment that sets `REACTORY_QUEUE_BULLMQ_ENABLED=true` and nothing else gets two registered providers (`bullmq`, `in-memory`) and a default of `in-memory`. Every consumer that calls `getDefaultProvider()` — which is all of them (`src/modules/reactory-communicator/services/CommunicatorQueueService.ts:143`, `src/modules/reactory-payment/events/index.ts:327`, `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:156`) — keeps using memory.

The supported ways to set `props` are:

```ts
// Service registry, with props (this is the only form that carries queueConfig)
const queueProvider = context.getService<QueueProvider>('reactory.QueueProvider@1.0.0', {
  queueConfig: {
    defaultProvider: 'bullmq',
    providers: {
      bullmq: { enabled: true },
      'in-memory': { enabled: false },
    },
  },
});

// Or construct the registry directly
const queueProvider = new QueueProvider({ queueConfig: { /* … */ } }, context);
```

The merge in `loadConfiguration` is shallow per provider key: supplying `providers.bullmq` replaces the whole `bullmq` entry, including its `config` (`src/modules/reactory-queue/services/queue/QueueProvider.ts:103-111`). That is harmless for BullMQ (it ignores `config`) and relevant for SQS (see §5.6).

### 5.2 Service lifecycle — an `instance` service

`QueueProvider` declares no `lifeCycle`, and the `@service` decorator defaults to `instance` (`src/application/decorators/service.ts:36`). The platform's lifecycle reference defines `instance` as **one instance per `getService(...)` call** (`docs/SERVICE_CONTEXT_AND_LIFECYCLE.md:13-15`). The same default applies to all three providers, because none of them declares a lifecycle either (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:23-32`, `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:16-25`, `src/modules/reactory-queue/services/queue/AWSSQSService.ts:49-58`).

Consequences:

- Every `getService('reactory.QueueProvider@1.0.0')` builds a new `Map` and new provider objects. In-memory queues are **per resolution**, not per process.
- `onStartup()` runs on a throwaway instance when the framework resolves the service to call the hook; its in-memory health check message is discarded with that instance.
- A producer that resolves the provider, enqueues, and then drops the reference leaves the message in an unreachable `Map`. A consumer that resolves later sees an empty one.
- BullMQ and SQS are unaffected in practice because their state is external, but the registry (including any runtime `registerProvider`/`setDefaultProvider` call) is per instance.

This is a defect, not a design choice the documentation can paper over. Until it is fixed, hold a single `QueueProvider` reference for the lifetime of the producer/consumer (as `CommunicatorQueueService` does after `initialize()`) rather than calling `getService` per operation.

### 5.3 Provider capability matrix

Legend: **Yes** = implemented and usable; **Partial** = present but with a documented caveat; **No** = absent or a stub.

| Capability | `in-memory` | `bullmq` | `aws-sqs` |
|---|---|---|---|
| Durable across restart | No | Yes (Redis) | Yes |
| Addressed by `options.queueId` | Yes | **No** — single mutable slot | Yes (URL or name) |
| `createIfNotExists` honoured | Yes | Inherent (BullMQ creates on `add`) | Yes (`GetQueueUrl` → `CreateQueue`) |
| `createQueue()` actually provisions | Yes | Yes (but drops connection config) | **No** — returns `true` without calling AWS |
| `deleteQueue()` actually deletes | Yes (map delete) | Partial — drains and closes the client | **No** — returns `true` without calling AWS |
| `count()` | Exact | Exact | **No** — returns `-1` |
| `dequeue()` removes | Yes | **Broken** — `getJob('enqueueJob')` is an id lookup | Yes-ish — receive without delete; redelivers after visibility timeout |
| `receiveMessages()` removes | No (peek) | No (peek) | No (peek; becomes invisible for the visibility timeout) |
| Ack by id returned from `enqueue` | Yes (positional id) | Yes (`job.id`) | No — the delete path needs a receipt handle |
| Ack after `receiveMessages` | **No** — envelope id is not the queue id | **No** — job data omits the job id | **Yes** — receipt handle is written into `header.id` |
| Startup health check | Enqueue then shift | Add job and start a `Worker` | Send to `HEALTH_CHECK_SQS_QUEUE_URL`, skipped when unconfigured |
| Config source | None | Environment only | Props or environment |

Evidence: §5.4–§5.6 below and the evidence index in §10.

### 5.4 `InMemoryQueueService`

The default provider and the only one that works without external infrastructure.

**Configuration:** none. It always creates `defaultQueue` and `healthCheckQueue` at construction (`src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:40-46`). Queue names are read from `DEFAULT_QUEUE_NAME` and `HEALTH_CHECK_QUEUE_NAME` at module import (`src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:12-14`).

**Behaviour:**

| Operation | Behaviour | Evidence |
|---|---|---|
| `enqueue` | Appends to the named array; unknown queues throw unless `createIfNotExists` is set | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:48-65` |
| `dequeue` | `Array.shift()` — FIFO, removes | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:67-73` |
| `receiveMessages` | `slice(0, max)` — FIFO, does not remove | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:88-94` |
| `deleteMessage` | Parses the positional id and `splice`s that index | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:75-82` |
| `count` | Array length, `0` for an unknown queue | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:96-99` |
| `createQueue` | `true` when created, `false` when it already existed | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:101-107` |
| `deleteQueue` | `Map.delete` result | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:109-111` |
| `onStartup` | Enqueues a health check then shifts it off | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:113-138` |

**Constraints you must design around:**

- **No durability and no cross-instance sharing.** The array lives on the service object; with the `instance` lifecycle that object is per resolution (§5.2).
- **Positional ids are unstable.** The id is `${queueName}-${length - 1}`. Deleting an earlier message shifts every later index, so an old id then deletes the wrong envelope or nothing. A queue name containing `-` breaks the parse entirely (`split('-')` takes the first two segments) (`src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:64`, `:76-78`).
- **No blocking read.** `dequeue` throws immediately when empty; consumers must poll.

**Use it for:** unit tests, single-process development, and CLI flows where a message never outlives the process. **Do not use it for:** anything that must survive a restart, cross a process boundary, or be observed by a second service resolution.

### 5.5 `BullMessageQueueService`

The production default when Redis is available.

**Configuration:** environment only. The constructor builds two `Queue` objects from `REACTORY_REDIS_HOST`, `REACTORY_REDIS_PORT` and `REACTORY_REDIS_PASSWORD`, each defaulting to `localhost:6379`, password `reactory` (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:48-68`). Queue names come from `DEFAULT_QUEUE_NAME` and `HEALTH_CHECK_QUEUE_NAME` (`:12-15`). **Props are assigned but never read** (`:49-50`), so the `config.redis` block that `QueueProvider` builds (`src/modules/reactory-queue/services/queue/QueueProvider.ts:80-88`) has no effect. Setting Redis through `props.queueConfig` does nothing; set the environment variables.

**Behaviour:**

| Operation | Behaviour | Evidence |
|---|---|---|
| `enqueue` | Strips `queueId`, `createIfNotExists`, `responseQueueId`, `failureQueueId`; forwards other options as BullMQ `JobsOptions`; adds a job named `enqueueJob` to `this.queue` | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:85-104` |
| `dequeue` | `this.queue.getJob('enqueueJob')` — an **id** lookup for the literal string `enqueueJob`, not a read of the next waiting job | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:106-114` |
| `receiveMessages` | `getJobs(['active', 'waiting'], 0, max ?? 10)` and returns `job.data` only | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:127-130` |
| `deleteMessage` | `getJob(id)` then `job.remove()`; missing ids are silently ignored | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:116-121` |
| `count` | `this.queue.count()` | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:132-134` |
| `createQueue` | Replaces `this.queue` with `new Queue(queueId)` — **no connection options**, so BullMQ falls back to its own defaults, not the environment connection used above | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:136-139` |
| `deleteQueue` | `drain()` then `close()`; does not obliterate the queue | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:141-145` |
| `onStartup` | Adds a health-check job and starts a `Worker` on the health queue | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:147-170` |

**The `dequeue` defect is real.** BullMQ job ids are generated on `add` (the module's own test fixture returns `defaultQueue-job-id`), so `getJob('enqueueJob')` finds nothing and `dequeue()` throws `No message found in queue.` The unit test passes only because it mocks `getJob` to return a job (`src/modules/reactory-queue/services/queue/EnqueueCreateIfNotExists.spec.ts:293-301`). Any consumer that relies on `dequeue` on BullMQ — including `reactory-payment`'s inbound consumer — will drain nothing.

**Single-queue addressing.** `enqueue`, `receiveMessages`, `count` and `deleteMessage` all use the mutable `this.queue` slot and ignore `options.queueId`. `createQueue(queueId)` is the only way to switch queues, and doing so creates a new client without the connection options. Callers that must address multiple queues select one before each operation (`src/modules/reactory-payment/events/index.ts:352-366`; `src/modules/reactory-product/services/ProductEventConsumerService.ts:128-139`).

**Use it for:** durable production queues when Redis is already operated for the platform, and when you want BullMQ job options (`priority`, `delay`, `attempts`, `backoff`, `jobId`). **Avoid it for:** concurrent multi-queue producers in one process until the single-slot and `dequeue` defects are fixed.

### 5.6 `AWSSQSQueueService`

The AWS-native provider.

**Configuration:** props take precedence over environment.

| Setting | Prop | Environment | Default |
|---|---|---|---|
| Region | `props.region` | `AWS_REGION` | `us-east-1` |
| Credentials | `props.credentials` | AWS default provider chain | none |
| Default queue | `props.queueUrl` | `DEFAULT_SQS_QUEUE_URL` | placeholder URL |
| Health queue | `props.healthCheckQueueUrl` | `HEALTH_CHECK_SQS_QUEUE_URL` | placeholder URL |
| Create propagation delay | `props.createQueuePropagationMs` | `SQS_QUEUE_CREATION_PROPAGATION_MS` | `1000` ms |

Evidence: `src/modules/reactory-queue/services/queue/AWSSQSService.ts:30-39`, `:86-96`.

The defaults are deliberately unusable placeholders (`region default-region`, account `123456789012`), and `onStartup` refuses to run a health check unless a real URL was supplied (`src/modules/reactory-queue/services/queue/AWSSQSService.ts:290-309`). That guard matters: without it every boot attempted a doomed health check and logged `CredentialsProviderError`.

**Behaviour:**

| Operation | Behaviour | Evidence |
|---|---|---|
| `enqueue` | Resolves `queueId` to a URL, sends JSON, returns `MessageId`; retries once after `CreateQueue` to absorb SQS consistency lag | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:206-227` |
| `receiveMessages` | Long-polls for 10 s, `max ?? 10`, rewrites `header.id` to the receipt handle | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:249-263` |
| `dequeue` | `receiveMessages({ max: 1 })` — returns the message but **does not delete it** | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:229-235` |
| `deleteMessage` | Deletes by receipt handle from **`this.queueUrl`**, ignoring `options.queueId` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:237-243` |
| `count` | Returns `-1` (placeholder) | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:265-269` |
| `createQueue` | Returns `true` without calling AWS | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:271-274` |
| `deleteQueue` | Returns `true` without calling AWS | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:276-279` |
| `onStartup` | Sends one health-check message when configured; warns and skips otherwise | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:299-334` |

`enqueue` is the only method that actually implements `createIfNotExists`: it resolves a bare name through `GetQueueUrl`, and calls `CreateQueue` only when the flag is set and the queue is genuinely missing (`src/modules/reactory-queue/services/queue/AWSSQSService.ts:141-194`). A `queueId` that is already an `http(s)` URL is used verbatim (`:148`).

**Use it for:** AWS-native deployments with no Redis, cross-account or cross-region queues, and workloads that already use SQS IAM and dead-letter queues at the AWS level. **Do not** trust `count()`, `createQueue()` or `deleteQueue()`, and do not mix queues within one provider if you intend to ack: `deleteMessage` always uses the configured `queueUrl`, so a message received from a queue selected by URL is acked on the wrong queue.

### 5.7 Choosing a provider

| If you need… | Choose | Because |
|---|---|---|
| Fast tests with no infrastructure | `in-memory` | No connection, no cleanup; every operation is synchronous in-process |
| A single-process demo or CLI run | `in-memory` | Adequate, but hold the provider reference (§5.2) |
| Durable queues with retries, delays and priorities | `bullmq` | The only provider that passes BullMQ `JobsOptions` through (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:85-104`) |
| No Redis in the estate, AWS-native IAM/DLQ | `aws-sqs` | Native queue provisioning and receipt-handle acks |
| Cross-region or cross-account delivery | `aws-sqs` | SQS URLs and IAM travel better than a Redis host |
| Multiple queues in one process | `in-memory` or `aws-sqs` | BullMQ has one mutable queue slot (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:77-84`) |

### 5.8 Configuration recipes

**A. Development — do nothing.**

```bash
# QueueProvider registers in-memory and selects it by default.
```

**B. BullMQ — environment is authoritative.**

```bash
REACTORY_QUEUE_BULLMQ_ENABLED=true
REACTORY_REDIS_HOST=reactory-redis
REACTORY_REDIS_PORT=6379
REACTORY_REDIS_PASSWORD=change-me
DEFAULT_QUEUE_NAME=defaultQueue
HEALTH_CHECK_QUEUE_NAME=healthCheckQueue
```

To make BullMQ the **default**, pass props when resolving (the env var alone will not do it):

```ts
const queueProvider = context.getService<QueueProvider>('reactory.QueueProvider@1.0.0', {
  queueConfig: {
    defaultProvider: 'bullmq',
    providers: { bullmq: { enabled: true }, 'in-memory': { enabled: false } },
  },
});
```

**C. AWS SQS — props or environment.**

```bash
REACTORY_QUEUE_AWS_SQS_ENABLED=true
AWS_REGION=eu-west-1
DEFAULT_SQS_QUEUE_URL=https://sqs.eu-west-1.amazonaws.com/123456789012/reactory-events
HEALTH_CHECK_SQS_QUEUE_URL=https://sqs.eu-west-1.amazonaws.com/123456789012/reactory-health
SQS_QUEUE_CREATION_PROPAGATION_MS=1000
```

Credentials come from the AWS default provider chain unless `props.credentials` is supplied. To select SQS as the default, pass `defaultProvider: 'aws-sqs'` with the same `getService(id, props)` form.

**D. A working produce/consume example (provider-agnostic).**

```ts
import type { QueueProvider } from '@reactory/server-modules/reactory-queue/services/queue';
import type { EventEnvelope } from '@reactory/server-modules/reactory-queue/services/queue/types';

const registry = context.getService<QueueProvider>('reactory.QueueProvider@1.0.0');
const queue = registry.getDefaultProvider();
if (!queue) throw new Error('No queue provider available');

const queueId = 'my.events';
await queue.createQueue(queueId); // harmless when the backend auto-creates

await queue.enqueue(
  {
    header: { id: `${Date.now()}`, receivedTimestamp: Date.now(), provider: 'my-module' },
    body: { payload: 'hello' },
  } as EventEnvelope,
  { queueId, createIfNotExists: true },
);

const batch = await queue.receiveMessages({ queueId, max: 10 });
for (const envelope of batch) {
  // … handle idempotently …
  await queue.deleteMessage(String(envelope.header.id), { queueId, reason: 'processed' });
}
```

The example above is correct for in-memory and SQS. It is **not** correct for BullMQ: `queueId` is ignored on both the write and read paths, `createQueue(queueId)` must be called to select the queue, and `deleteMessage` needs the BullMQ job id, which `receiveMessages` does not return. For BullMQ, use `dequeue()` after `createQueue()` once the `dequeue` defect is fixed, or call BullMQ directly.

### 5.9 Migrating from direct provider construction

The module ships a contributor guide at [`services/queue/MIGRATION_GUIDE.md`](https://github.com/reactorynet/reactory-queue/blob/master/services/queue/MIGRATION_GUIDE.md). Its step-by-step shape is sound; two of its claims are not. Folded in and corrected:

| Step | Do this | Correction to the shipped guide |
|---|---|---|
| 1 | Resolve `reactory.QueueProvider@1.0.0` instead of constructing `InMemoryQueueService`/`BullMessageQueueService` | — |
| 2 | Always null-check `getDefaultProvider()`; it returns `undefined` when the configured key is not registered | — |
| 3 | Create the queue before enqueueing, or pass `createIfNotExists: true` | `createIfNotExists` is meaningful on in-memory and SQS; BullMQ creates implicitly |
| 4 | Keep one provider reference for the producer/consumer lifetime | The guide does not mention the `instance` lifecycle |
| 5 | Select the backend with `getService(id, props)` and `queueConfig.defaultProvider` | The guide says `REACTORY_QUEUE_PROVIDER` selects the backend. It does not; the env var is shadowed (`src/modules/reactory-queue/services/queue/QueueProvider.ts:65`, `:75`) |
| 6 | In tests, construct `new QueueProvider({ queueConfig: … }, mockContext)` and inject it | — |
| 7 | Match the read/ack primitive to the provider: `dequeue` removes, `receiveMessages` peeks, SQS acks by receipt handle | The guide does not distinguish them |
| 8 | Re-run the consumer's idempotency tests under redelivery | — |

The guide's "Common Issues" section is still useful for the two failure modes it names (provider not found; default provider `undefined`). It should not be followed for backend selection until `REACTORY_QUEUE_PROVIDER` is fixed.

---

## 6. UI surface

**The module has none.** `forms` is `[]`, `clientPlugins` is `[]`, `routes` is `{}`, `views` is `[]` and there are no translations (`src/modules/reactory-queue/index.ts:21`, `:23`, `:25`, `:29`; `src/modules/reactory-queue/forms/index.ts:1`; `src/modules/reactory-queue/routes/index.ts:1`; `src/modules/reactory-queue/views/index.ts:1`; `src/modules/reactory-queue/i18n/index.ts:1`).

Queue **operations** do have a UI, but it belongs to `reactory-communicator` and manages communicator messages, not the transport:

| Surface | What it offers | Evidence |
|---|---|---|
| `CommunicatorDLQManager` form | Inspect, retry one, retry all, purge DLQ | `src/modules/reactory-communicator/forms/DLQManagementForm.ts:3-13`, `:19-24` |
| Admin REST routes | `/queue/stats`, `/queue/retry`, `/queue/dead-letter` | `src/modules/reactory-communicator/routes/admin.ts:18-19`, `:162-163`, `:262-263` |
| GraphQL | `communicatorQueueStats`, `communicatorRetryMessages`, `communicatorPurgeDLQ` | `src/modules/reactory-communicator/graph/resolvers/QueueResolver.ts:23-24`, `:157-158`, `:267-268` |

`reactory-communicator` is not documented yet (see the module index), so these surfaces have no page of their own. This page records them only to prevent the false conclusion that the queue module has an operator UI.

---

## 7. Workflows

**The module contributes zero workflow definitions.** `workflow/index.ts` exports `[]` (`src/modules/reactory-queue/workflow/index.ts:1`) and `index.ts` spreads it (`src/modules/reactory-queue/index.ts:20`). There are no YAML workflow files and no registered step types.

There is, however, a **dormant integration point** in `reactory-core`:

| Element | What it does | Evidence |
|---|---|---|
| `reactory.WorkflowQueueListener@1.0.0` | A service that polls queues and invokes a workflow per envelope | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:13-24` |
| Dependency | Declares `reactory.QueueProvider@1.0.0` | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:19-21` |
| Startup | Resolves the provider; throws if absent | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:54-62` |
| Poll | `setTimeout` loop, default 5,000 ms, `receiveMessages({ queueId, max: 10 })` | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:45-48`, `:150-176` |
| Dispatch | Requires `body.workflowId`, then calls the injected `WorkflowInvoker` | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:181-208` |
| Ack | Deletes on success and on malformed input; leaves the message on handler error | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:190`, `:202`, `:204-207` |

**It is not registered.** `QueueListener` does not appear in `reactory-core`'s `services/index.ts` array (`src/modules/reactory-core/services/index.ts:39-74`), and a search of the module finds only the class and its spec. No module instantiates it. Its `startListening()` additionally throws unless `setWorkflowInvoker()` was called (`src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:88-92`), and nothing in the platform calls that setter.

The workflow-backed integration therefore exists as **one unregistered service, zero definitions and zero call sites**. The consumers that actually move work (`reactory-communicator`, `reactory-payment`, `reactory-product`) call their handlers directly from polling loops or service methods; they do not go through the workflow engine.

If you are wiring a queue to a workflow today, you must:

1. Register a `QueueListener` instance (or your own service) in a module's `services` array.
2. Call `setWorkflowInvoker(...)` with the platform workflow invoker during startup.
3. Call `startListening([...queueIds])` after `onStartup`.
4. Ensure the provider you resolved is the durable one — the listener calls `getDefaultProvider()`, so the default defect in §5.1 applies.

None of that is provided by this module.

---

## 8. Operations

### 8.1 Connection settings and credentials

| Variable | Read at | Default | Applies to |
|---|---|---|---|
| `REACTORY_QUEUE_PROVIDER` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:65` | — | **Dead** — shadowed by the literal `in-memory` default |
| `REACTORY_QUEUE_BULLMQ_ENABLED` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:79` | `false` | Registers BullMQ when exactly `'true'` |
| `REACTORY_QUEUE_AWS_SQS_ENABLED` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:93` | `false` | Registers SQS when exactly `'true'` |
| `REACTORY_REDIS_HOST` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:82`, `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:55`, `:63`, `:157` | `localhost` | BullMQ only |
| `REACTORY_REDIS_PORT` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:83`, `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:56`, `:64`, `:158` | `6379` | BullMQ only |
| `REACTORY_REDIS_PASSWORD` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:84`, `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:57`, `:65`, `:159` | `reactory` | BullMQ only |
| `AWS_REGION` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:95`, `src/modules/reactory-queue/services/queue/AWSSQSService.ts:87` | `us-east-1` | SQS |
| `DEFAULT_SQS_QUEUE_URL` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:96`, `src/modules/reactory-queue/services/queue/AWSSQSService.ts:31`, `:294` | placeholder | SQS |
| `HEALTH_CHECK_SQS_QUEUE_URL` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:32`, `:295` | placeholder | SQS |
| `SQS_QUEUE_CREATION_PROPAGATION_MS` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:38`, `:94-96` | `1000` | SQS |
| `DEFAULT_QUEUE_NAME` | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:13`, `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:12` | `defaultQueue` | BullMQ, in-memory |
| `HEALTH_CHECK_QUEUE_NAME` | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:14`, `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:13` | `healthCheckQueue` | BullMQ, in-memory |

Queue-name variables are destructured at module import (`const { … } = process.env`), so changing them at runtime has no effect. Redis and AWS settings are read at construction, so a process restart is required.

Credentials:

- **BullMQ:** a password in an environment variable, with the literal `reactory` default (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:57`). There is no TLS, username, sentinel or cluster option in the module. Treat the default password as a development placeholder, never a production default.
- **SQS:** the AWS SDK default credential chain (`src/modules/reactory-queue/services/queue/AWSSQSService.ts:86-89`) or `props.credentials`. Nothing is persisted by the module.
- **No secret manager integration** exists in the module; `context` is available but unused for configuration.

### 8.2 Startup and health checks

| Provider | Startup action | Failure handling | Evidence |
|---|---|---|---|
| `in-memory` | Enqueue a health-check envelope, then shift it off | No `try`; a malformed queue state throws | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:113-138` |
| `bullmq` | Add a health-check job and start a `Worker` on `healthCheckQueue` | Worker `failed` event logs; the `add` itself is not caught | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:147-170` |
| `aws-sqs` | Send a health-check message | Skips with a warning when no URL is configured; logs send failures without throwing | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:290-334` |
| `QueueProvider` | Calls every registered provider's `onStartup`, catching each | A failing provider is logged; the others still start | `src/modules/reactory-queue/services/queue/QueueProvider.ts:254-275` |

Because `QueueProvider` is an `instance` service, this startup work runs on whichever instance the framework resolves. With in-memory, the health check is discarded with that instance and proves nothing about the instance a producer later receives.

### 8.3 Delivery semantics and acknowledgements

No provider guarantees exactly-once. The ack model differs enough that a consumer written for one provider will silently misbehave on another:

| Provider | Read primitive | Removes on read? | How to ack | Redelivery risk |
|---|---|---|---|---|
| `in-memory` | `dequeue` | Yes | Not needed after `dequeue` | None in-process; lost on restart |
| `in-memory` | `receiveMessages` | No | `deleteMessage(queueName-index)` | The id is positional and shifts; ack may delete the wrong message |
| `bullmq` | `dequeue` | Intended yes — **currently throws** | Not applicable while broken | Messages accumulate unread |
| `bullmq` | `receiveMessages` | No | `deleteMessage(job.id)` — but `job.data` carries no id | Ack by envelope id is a no-op; the batch redelivers forever |
| `aws-sqs` | `receiveMessages` | No (invisible for the visibility timeout) | `deleteMessage(receiptHandle)` — written into `header.id` | Redelivers after the visibility timeout if not acked |
| `aws-sqs` | `dequeue` | No delete | Same receipt handle | Redelivers after the visibility timeout |

Evidence: `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:67-94`; `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:106-130`; `src/modules/reactory-queue/services/queue/AWSSQSService.ts:229-263`; `src/modules/reactory-queue/services/queue/types.ts:53-95`.

The two production consumers chose opposite primitives for this reason:

- `reactory-payment` uses `dequeue` and re-enqueues on failure because a peek+ack loop never drains on in-memory or BullMQ (`src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:30-39`, `:306-320`).
- `reactory-product` uses `receiveMessages` + `deleteMessage` and documents that the BullMQ provider cannot ack by envelope id (`src/modules/reactory-product/services/ProductEventConsumerService.ts:26-31`, `:326-331`).

### 8.4 Retry and backoff

**The module has no retry or backoff implementation.** There is no attempt counter, no delay calculation and no redelivery policy in any provider. What exists:

| Layer | Policy | Evidence |
|---|---|---|
| Module | None | `src/modules/reactory-queue/services/queue/types.ts:53-95` (no retry method or option) |
| BullMQ pass-through | If the caller supplies `attempts`/`backoff`/`delay` in `enqueue` options, they reach `queue.add` | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:86-102`; test at `src/modules/reactory-queue/services/queue/EnqueueCreateIfNotExists.spec.ts:259-274` |
| `reactory-communicator` | 5 attempts (`MAX_RETRIES`), delay `2^retryCount × 1000 ms`, then `communicator.retry`, then `communicator.dlq` | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:39-49`, `:302-331`, `:372-395` |
| `reactory-payment` | `REACTORY_PAYMENT_CONSUMER_MAX_ATTEMPTS` (default 3), persisted in a database ledger, re-enqueue on failure | `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:182-185`, `:411-466` |
| `reactory-product` | No retry counter; failed envelopes stay unacked and are re-read on the next poll | `src/modules/reactory-product/services/ProductEventConsumerService.ts:155-161`, `:326-331` |

If you want retries, you implement them in the consumer. If you use BullMQ and supply `attempts`/`backoff`, BullMQ performs them; the module neither configures nor documents a default.

### 8.5 Dead-letter behaviour

**There is no dead-letter implementation in the module.** `failureQueueId` is declared on `IEnqueueOptions` and discarded by every provider (`src/modules/reactory-queue/services/queue/types.ts:13`; `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:92`, `:100`). There is no DLQ naming convention, no max-attempt enforcement and no poison-message quarantine.

The two usable patterns in the platform are consumer-owned:

| Pattern | Mechanism | Evidence |
|---|---|---|
| Queue-based DLQ | A `communicator.dlq` queue; failures enqueue there after 5 attempts and the message document is marked `DEAD_LETTER` | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:47`, `:309-311`, `:378-395`, `:398-406` |
| Database ledger | A `reactory_payment_inbound_events` row transitions to `DEAD_LETTERED` when attempts exceed the cap; the transport message is dropped | `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:452-466`; `src/modules/reactory-payment/models/InboundEvent.ts:16-31` |

AWS SQS's native redrive policy is **not** configured by this module: `createQueue` is a stub that does not call AWS (`src/modules/reactory-queue/services/queue/AWSSQSService.ts:271-274`), so any redrive/DLQ configuration must be provisioned outside the platform.

### 8.6 Concurrency

The module contains no consumer loop and no concurrency setting:

- The only `Worker` it creates is the BullMQ **health check** worker (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:154-160`). It is not a general-purpose consumer and is closed on completion (`:162-165`).
- Consumers poll on intervals: `QueueListener` defaults to 5,000 ms and runs one `setTimeout` chain per queue (`src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:45-48`, `:150-176`); payment defaults to 5,000 ms with a `processing` guard (`src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:172-175`, `:255-258`); product defaults to 5,000 ms and is safe to call concurrently (`src/modules/reactory-product/services/ProductEventConsumerService.ts:88-93`, `:115-118`).
- Batch sizes are consumer settings: 10 in `QueueListener`, `REACTORY_PAYMENT_CONSUMER_BATCH` (25) in payment, `REACTORY_PRODUCT_CONSUMER_BATCH` (25) in product.
- There is no lock, lease or visibility-timeout control in the module. SQS's default visibility timeout applies; in-memory and BullMQ have none.

Horizontal scaling therefore duplicates polling across processes. In-memory state is not shared at all; BullMQ relies on job locking inside `getJobs`/`dequeue` (the latter broken); SQS relies on visibility timeouts. Consumers must be idempotent.

### 8.7 Tenant scoping

**There is no tenant dimension anywhere in the module.** A search for `tenant`, `clientKey` or `organization` across its TypeScript sources returns nothing. Queue ids are plain strings (`src/modules/reactory-queue/services/queue/types.ts:11`, `:31`, `:40`, `:46`), the envelope header has no tenant field (`src/modules/reactory-queue/services/queue/types.ts:97-110`), and no provider partitions by tenant.

What the platform does instead:

| Consumer | Tenancy approach | Evidence |
|---|---|---|
| `reactory-payment` | **Deliberately tenant-agnostic.** The inbox dedupes on globally unique `eventId`; `organization` is informational only and may be absent | `src/modules/reactory-payment/models/InboundEvent.ts:21-24`, `:31`, `:66-67` |
| `reactory-product` | Tenant fields are carried in event payloads, not used to select or partition a queue | no tenant reference in `ProductEventConsumerService.ts`; queue ids are fixed names (`src/modules/reactory-product/events/index.ts:85-89`) |
| `reactory-communicator` | Message documents are partner-scoped, but the queue id is a fixed name (`communicator.primary`, etc.) | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:43-48`, `:149-159`; partner scoping at `src/modules/reactory-communicator/graph/resolvers/QueueResolver.ts:31-46` |

**Guidance if you need tenant isolation:**

1. **Do not assume the provider isolates tenants.** It does not.
2. Encode the tenant in the **queue id at the call site** (for example `tenant.<id>.events`) and create that queue per tenant. This works on in-memory and SQS; on BullMQ it requires `createQueue(queueId)` before each operation because of the single-slot defect.
3. Always put the tenant in the envelope header as well, and authorise against it in the handler. A queue id is not an access-control boundary.
4. Expect operational cost: one queue per tenant multiplies connections (BullMQ) or queue resources (SQS). Prefer a shared queue with a tenant header unless isolation is a contractual requirement.
5. Deduplicate on a globally unique envelope id, not on `(tenant, id)`, unless you have proven ids are only unique within a tenant. The payment module chose global uniqueness for exactly this reason.

### 8.8 Telemetry and observability

**None in the module.** There is no `@metric`, `@counter`, `@gauge`, no OpenTelemetry import and no logger dependency. `bullmq-otel` is declared in `package.json` but never imported anywhere in the module (`src/modules/reactory-queue/package.json:11-13`; a search for `bullmq-otel` in `src/modules/reactory-queue` returns nothing). `reactory-telemetry` contains no queue instrumentation.

What you get today:

| Signal | Where | Evidence |
|---|---|---|
| Provider registration, default selection, startup | `context.log` / `context.warn` / `context.error` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:131-162`, `:198-201`, `:254-275` |
| Health-check success/failure | `context.log` / `context.error` | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:149-169`; `src/modules/reactory-queue/services/queue/AWSSQSService.ts:330-332` |
| Enqueue/retry/DLQ counters (communicator only) | `@metric` / `@counter` decorators on `CommunicatorQueueService` | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:175-185`, `:293-301`, `:364-371` |
| Provider-level introspection | `count()` — exact on in-memory/BullMQ, `-1` on SQS | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:96-99`; `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:132-134`; `src/modules/reactory-queue/services/queue/AWSSQSService.ts:265-269` |

There are no queue depth gauges, no enqueue latency histograms, no consumer lag metrics and no trace propagation. `header` has no trace id field, although `correlationId` is used by payment and product as a business correlation key (`src/modules/reactory-payment/events/index.ts:254-256`).

### 8.9 Failure-mode table

| Symptom | Likely cause | Evidence | Action |
|---|---|---|---|
| Messages disappear on restart | Using the default in-memory provider | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:38-46` | Enable a durable provider **and** set `defaultProvider` via props |
| Producer enqueues, consumer sees nothing | Different `QueueProvider` instances, so different in-memory maps | `src/modules/reactory-queue/services/queue/QueueProvider.ts:21-31`; `docs/SERVICE_CONTEXT_AND_LIFECYCLE.md:13-15` | Hold one provider reference per process |
| `REACTORY_QUEUE_PROVIDER=bullmq` has no effect | Env fallback is shadowed by the literal default | `src/modules/reactory-queue/services/queue/QueueProvider.ts:65`, `:75` | Pass `queueConfig.defaultProvider` in props |
| BullMQ is enabled but traffic is still in memory | Enabling registers a provider; it does not change the default | `src/modules/reactory-queue/services/queue/QueueProvider.ts:120-165` | Set `defaultProvider: 'bullmq'` |
| `dequeue()` throws `No message found in queue.` on BullMQ | `getJob('enqueueJob')` is an id lookup | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:106-114` | Use `receiveMessages` or call BullMQ directly until fixed |
| SQS `count()` is `-1` | Placeholder return | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:265-269` | Use CloudWatch `ApproximateNumberOfMessages` |
| SQS `createQueue()` reports success but no queue exists | Stub returns `true` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:271-274` | Pre-provision queues or use `createIfNotExists` on enqueue |
| Ack on SQS deletes from the wrong queue | `deleteMessage` uses `this.queueUrl` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:237-243` | Use one provider instance per queue URL |
| Ack after `receiveMessages` does nothing (BullMQ/in-memory) | Envelope id is not the provider id | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:127-130`; `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:88-94` | Use `dequeue`, or map envelope → provider id yourself |
| KYC queue wrappers fail with `addProcessor is not a function` | Method is not on `IQueueService` | `src/modules/reactory-kyc/queues/VerificationQueue.ts:66-78`; `src/modules/reactory-queue/services/queue/types.ts:53-95` | Register handlers outside the provider, or implement `addProcessor` |
| KYC webhook routes cannot resolve the provider | Wrong FQN `reactory-queue.QueueProvider@1.0.0` | `src/modules/reactory-kyc/api/routes/webhook.routes.ts:65`, `:98`, `:132` | Use `reactory.QueueProvider@1.0.0` |
| `getService('reactory.QueueProvider@1.0.0')` returns a new object every time | `instance` lifecycle | `src/modules/reactory-queue/services/queue/QueueProvider.ts:21-31`; `src/application/decorators/service.ts:36` | Cache the reference |

---

## 9. Limitations & roadmap

### Limitations

Each item is a measured property of the code, not a preference. Items marked **[consumer must compensate]** are not fixed by configuration.

1. **`REACTORY_QUEUE_PROVIDER` is dead.** `loadConfiguration` always returns `defaultProvider: 'in-memory'`, so the env fallback in the constructor can never be reached (`src/modules/reactory-queue/services/queue/QueueProvider.ts:65`, `:75`). **[consumer must compensate]**
2. **Enabling a provider does not select it.** `initializeProviders` registers BullMQ/SQS when their flags are true, but the default remains `in-memory` (`src/modules/reactory-queue/services/queue/QueueProvider.ts:120-165`). Every consumer calls `getDefaultProvider()` (`src/modules/reactory-communicator/services/CommunicatorQueueService.ts:143`; `src/modules/reactory-payment/events/index.ts:327`; `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:156`). **[consumer must compensate]**
3. **`QueueProvider` and all providers are `instance`-lifecycle.** The decorator defaults to `instance` and none overrides it (`src/application/decorators/service.ts:36`; `src/modules/reactory-queue/services/queue/QueueProvider.ts:21-31`; the three provider decorators). In-memory queues are therefore per resolution. **[consumer must compensate]**
4. **BullMQ ignores configured Redis.** The constructor reads `process.env` only and never reads `props`; `config.redis` from `QueueProvider` is decorative (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:48-68`; `src/modules/reactory-queue/services/queue/QueueProvider.ts:80-88`).
5. **BullMQ `dequeue()` is broken.** `getJob('enqueueJob')` looks up a job by id, and ids are generated; the unit test mocks the call (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:106-114`; `src/modules/reactory-queue/services/queue/EnqueueCreateIfNotExists.spec.ts:293-301`).
6. **BullMQ addresses one queue at a time.** `enqueue`, `receiveMessages`, `count` and `deleteMessage` ignore `queueId` and share `this.queue` (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:77-84`, `:85-104`, `:127-145`).
7. **BullMQ `createQueue` drops connection settings.** `new Queue(queueId)` is called without the environment connection used by the constructor, so it falls back to BullMQ's own defaults (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:53-59`, `:136-139`).
8. **BullMQ read paths do not expose ids.** `receiveMessages` maps `job.data` only, so `deleteMessage(envelope.header.id)` cannot ack (`src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:127-130`).
9. **SQS `count()` returns `-1`.** (`src/modules/reactory-queue/services/queue/AWSSQSService.ts:265-269`.)
10. **SQS `createQueue()` and `deleteQueue()` are stubs.** Both return `true` without calling AWS (`src/modules/reactory-queue/services/queue/AWSSQSService.ts:271-279`).
11. **SQS acks ignore `options.queueId`.** `deleteMessage` always uses `this.queueUrl`, so multi-queue use deletes on the wrong queue (`src/modules/reactory-queue/services/queue/AWSSQSService.ts:237-243`).
12. **SQS `dequeue()` does not delete.** It calls `receiveMessages({ max: 1 })`; the message reappears after the visibility timeout (`src/modules/reactory-queue/services/queue/AWSSQSService.ts:229-235`).
13. **`responseQueueId` and `failureQueueId` are inert.** Declared in the contract, discarded by BullMQ and ignored by the others (`src/modules/reactory-queue/services/queue/types.ts:12-13`; `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:92`, `:99-100`).
14. **In-memory ids are positional and fragile.** `` `${queueName}-${index}` `` plus `split('-')` breaks on hyphenated queue names and stale ids delete the wrong element (`src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:64`, `:75-82`).
15. **No retry, backoff or dead-letter layer.** Nothing in the module implements them; the platform relies on two consumer-specific schemes (`src/modules/reactory-communicator/services/CommunicatorQueueService.ts:302-395`; `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:411-466`).
16. **No telemetry.** `bullmq-otel` is declared but unimported, and no OpenTelemetry API is used (`src/modules/reactory-queue/package.json:11-13`).
17. **No GraphQL, forms, routes, CLI or workflows.** All extension points are empty; the operator UI and mutations live in `reactory-communicator` and act on Mongo documents, not queues (`src/modules/reactory-queue/index.ts:19-30`; `src/modules/reactory-communicator/graph/resolvers/QueueResolver.ts:23-24`, `:157-158`, `:267-268`).
18. **No tenant isolation.** No tenant field, queue partitioning or authorisation anywhere in the module or its providers (§8.7).
19. **`WorkflowQueueListener` is unregistered and unreachable.** It exists in `reactory-core` but is absent from the service array, and its invoker setter is never called (`src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:13-24`, `:88-92`; `src/modules/reactory-core/services/index.ts:39-74`).
20. **KYC queue wrappers target a method that does not exist.** `addProcessor()` is called on the provider, but `IQueueService` does not declare it and no implementation provides it (`src/modules/reactory-kyc/queues/VerificationQueue.ts:66-78`; `src/modules/reactory-queue/services/queue/types.ts:53-95`).
21. **KYC webhook routes use the wrong FQN.** `reactory-queue.QueueProvider@1.0.0` is not a registered service id (`src/modules/reactory-kyc/api/routes/webhook.routes.ts:65`, `:98`, `:132`; the correct id is `src/modules/reactory-queue/services/queue/QueueProvider.ts:22`).
22. **The licence is stated three ways.** MIT in `package.json`, Apache-2.0 in `LICENSE`, `private` in the registry (`src/modules/reactory-queue/package.json:10`; `LICENSE:1-2`; `src/modules/available.json:48`).

### Roadmap candidates

These are proposals, not behaviour. They are ordered by how much pain they remove per unit of change.

1. **Fix selection.** Make `defaultProvider` fall back to `REACTORY_QUEUE_PROVIDER` instead of hard-coding `in-memory`, and add a startup log that states the resolved default and the registered providers.
2. **Give the registry a lifecycle.** Mark `QueueProvider` (and the providers) `singleton`, or document and enforce a per-process holder. This is the precondition for in-memory being usable at all.
3. **Fix BullMQ addressing.** Read `job.id` in `receiveMessages`, implement `dequeue` with `getNextJob`/`Worker`, and carry the connection options into `createQueue`.
4. **Implement the SQS stubs.** `count()` via `GetQueueAttributes`, and real `CreateQueue`/`DeleteQueue` including a redrive policy.
5. **Add a retry/DLQ contract.** At minimum, document a naming convention and provide an opt-in attempts/backoff wrapper that all three providers share.
6. **Add telemetry.** Import `bullmq-otel` (already a dependency), add queue depth and enqueue/consume counters, and propagate `correlationId` into spans.
7. **Add a tenant-aware addressing helper.** A documented `queueId(tenant, stream)` convention plus a header field, without pretending the provider isolates tenants.
8. **Retire the stale contributor docs.** `AGENT.md` claims gRPC, GraphQL and OpenTelemetry support; all three are false (`src/modules/reactory-queue/AGENT.md:5`, `:59-63`). Fold the useful parts of `IMPLEMENTATION_SUMMARY.md` into this page and reduce the module repository to a thin code-adjacent README.

---

## 10. Evidence index

Every row is a claim made above and the source line that proves it. Paths are relative to the `reactory-express-server` checkout; `src/modules/reactory-queue/**` is the module's own nested repository at `349ce0a`.

### Module contract and status

| Claim | Evidence |
|---|---|
| Module object declares the queue module | `src/modules/reactory-queue/index.ts:11-31` |
| Module id, namespace and name | `src/modules/reactory-queue/index.ts:12-14` |
| Module version `1.0.0` | `src/modules/reactory-queue/index.ts:15` |
| Module dependency on core | `src/modules/reactory-queue/index.ts:17` |
| Module priority `2` | `src/modules/reactory-queue/index.ts:18` |
| Graph definitions are the empty object | `src/modules/reactory-queue/index.ts:19` |
| Graph barrel exports `{}` | `src/modules/reactory-queue/graph/index.ts:1` |
| Workflows come from an empty array | `src/modules/reactory-queue/index.ts:20` |
| Workflow barrel exports `[]` | `src/modules/reactory-queue/workflow/index.ts:1` |
| Forms are empty | `src/modules/reactory-queue/index.ts:21` |
| Forms barrel exports `[]` | `src/modules/reactory-queue/forms/index.ts:1` |
| Services are the four definitions | `src/modules/reactory-queue/index.ts:22` |
| Service array lists the registry and three providers | `src/modules/reactory-queue/services/index.ts:6-11` |
| Translations are empty | `src/modules/reactory-queue/index.ts:23` |
| Translations barrel exports `[]` | `src/modules/reactory-queue/i18n/index.ts:1` |
| Models are empty | `src/modules/reactory-queue/index.ts:24` |
| Models barrel exports `[]` | `src/modules/reactory-queue/models/index.ts:1` |
| Client plugins are empty | `src/modules/reactory-queue/index.ts:25` |
| PDFs are empty | `src/modules/reactory-queue/index.ts:26` |
| Passport providers are empty | `src/modules/reactory-queue/index.ts:27` |
| gRPC is empty | `src/modules/reactory-queue/index.ts:28` |
| gRPC barrel exports `[]` | `src/modules/reactory-queue/protobuf/index.ts:1` |
| Routes are an empty object | `src/modules/reactory-queue/index.ts:29` |
| Routes barrel exports `{}` | `src/modules/reactory-queue/routes/index.ts:1` |
| CLI is empty | `src/modules/reactory-queue/index.ts:30` |
| CLI barrel exports `[]` | `src/modules/reactory-queue/cli/index.ts:1` |
| Views barrel exports `[]` | `src/modules/reactory-queue/views/index.ts:1` |
| Schema barrel exports `[]` | `src/modules/reactory-queue/schema/index.ts:1` |
| Module is imported by the generated barrel | `src/modules/__index.ts:15` |
| Module is included in the module array | `src/modules/__index.ts:34` |
| Registry FQN is `reactory.Queue@1.0.0` | `src/modules/available.json:46` |
| Registry entry is `private` | `src/modules/available.json:48` |
| Package manifest declares MIT | `src/modules/reactory-queue/package.json:10` |
| LICENSE is Apache-2.0 | `src/modules/reactory-queue/LICENSE:1-2` |
| `bullmq-otel` is declared | `src/modules/reactory-queue/package.json:11-13` |
| `AGENT.md` falsely claims GraphQL, gRPC and OpenTelemetry | `src/modules/reactory-queue/AGENT.md:5` |
| `AGENT.md` repeats the feature claims | `src/modules/reactory-queue/AGENT.md:59-63` |

### Provider registry and selection

| Claim | Evidence |
|---|---|
| Registry service id | `src/modules/reactory-queue/services/queue/QueueProvider.ts:22` |
| Registry namespace, name and version | `src/modules/reactory-queue/services/queue/QueueProvider.ts:25-27` |
| Registry service type is `data` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:30` |
| Registry roles are `SYSTEM` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:31` |
| Registry declares no lifecycle, so it defaults to `instance` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:21-31`; `src/application/decorators/service.ts:36` |
| `instance` means one object per `getService` call | `docs/SERVICE_CONTEXT_AND_LIFECYCLE.md:13-15` |
| Constructor loads config and resolves the default key | `src/modules/reactory-queue/services/queue/QueueProvider.ts:64-68` |
| Env fallback is after a truthy default | `src/modules/reactory-queue/services/queue/QueueProvider.ts:65` |
| Default config hard-codes `in-memory` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:76` |
| BullMQ is enabled only by env `'true'` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:79` |
| BullMQ config carries Redis host/port/password | `src/modules/reactory-queue/services/queue/QueueProvider.ts:80-88` |
| In-memory is enabled by default | `src/modules/reactory-queue/services/queue/QueueProvider.ts:89-91` |
| SQS is enabled only by env `'true'` | `src/modules/reactory-queue/services/queue/QueueProvider.ts:93` |
| SQS config carries region and queue URL | `src/modules/reactory-queue/services/queue/QueueProvider.ts:94-97` |
| Props merge is shallow per provider key | `src/modules/reactory-queue/services/queue/QueueProvider.ts:103-111` |
| BullMQ registration path | `src/modules/reactory-queue/services/queue/QueueProvider.ts:124-136` |
| In-memory registration path (unless explicitly disabled) | `src/modules/reactory-queue/services/queue/QueueProvider.ts:138-150` |
| SQS registration path | `src/modules/reactory-queue/services/queue/QueueProvider.ts:152-164` |
| Register/unregister provider | `src/modules/reactory-queue/services/queue/QueueProvider.ts:172-185` |
| Get provider by key and warning | `src/modules/reactory-queue/services/queue/QueueProvider.ts:192-205` |
| Get default provider | `src/modules/reactory-queue/services/queue/QueueProvider.ts:210-212` |
| Set default provider throws when absent | `src/modules/reactory-queue/services/queue/QueueProvider.ts:218-225` |
| List, test and copy providers | `src/modules/reactory-queue/services/queue/QueueProvider.ts:231-249` |
| Registry startup fans out and swallows failures | `src/modules/reactory-queue/services/queue/QueueProvider.ts:254-275` |
| Registry `toString` uses FQN | `src/modules/reactory-queue/services/queue/QueueProvider.ts:279-281` |

### Types and envelope

| Claim | Evidence |
|---|---|
| Envelope is `{ header, body }` | `src/modules/reactory-queue/services/queue/types.ts:5-8` |
| Enqueue options include queue id and create flag | `src/modules/reactory-queue/services/queue/types.ts:10-28` |
| `responseQueueId` and `failureQueueId` are declared | `src/modules/reactory-queue/services/queue/types.ts:12-13` |
| `createIfNotExists` is declared | `src/modules/reactory-queue/services/queue/types.ts:27` |
| Interface declares seven operations | `src/modules/reactory-queue/services/queue/types.ts:53-95` |
| `dequeue` returns an envelope | `src/modules/reactory-queue/services/queue/types.ts:63` |
| `receiveMessages` returns a batch | `src/modules/reactory-queue/services/queue/types.ts:78` |
| `count` is part of the contract | `src/modules/reactory-queue/services/queue/types.ts:83` |
| Queue create/delete are part of the contract | `src/modules/reactory-queue/services/queue/types.ts:88-94` |
| Header carries id, timestamp and provider | `src/modules/reactory-queue/services/queue/types.ts:97-110` |
| Body carries optional validation results | `src/modules/reactory-queue/services/queue/types.ts:112-119` |
| `EventEnvelope` alias | `src/modules/reactory-queue/services/queue/types.ts:119` |
| `QueueServiceType` alias | `src/modules/reactory-queue/services/queue/types.ts:121` |

### In-memory provider

| Claim | Evidence |
|---|---|
| In-memory service id and roles | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:16-25` |
| Provider key is `in-memory` | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:37` |
| Storage is a `Map` on the instance | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:38` |
| Default and health queues are created at construction | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:40-46` |
| Enqueue appends and honours `createIfNotExists` | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:48-65` |
| Unknown queue throws without the flag | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:52-58` |
| Message id is position-based | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:64` |
| Dequeue shifts (removes) | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:67-73` |
| Delete parses the id and splices | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:75-82` |
| Receive peeks with `slice` | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:88-94` |
| Count returns array length or zero | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:96-99` |
| Create queue returns whether it changed | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:101-107` |
| Delete queue deletes the map entry | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:109-111` |
| Startup health check enqueues then shifts | `src/modules/reactory-queue/services/queue/InMemoryQueueService.ts:113-138` |

### BullMQ provider

| Claim | Evidence |
|---|---|
| BullMQ service id and roles | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:23-32` |
| Provider key is `bullmq` | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:44` |
| Queue names come from env at import | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:12-15` |
| Constructor assigns props but never reads them | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:49-50` |
| Connection is built from `process.env` only | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:53-59` |
| Health queue uses the same env connection | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:61-67` |
| Enqueue strips contract fields and forwards job options | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:85-104` |
| Contract fields are explicitly voided | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:96-100` |
| Dequeue looks up the literal id `enqueueJob` | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:106-114` |
| Test mocks `getJob` to make dequeue pass | `src/modules/reactory-queue/services/queue/EnqueueCreateIfNotExists.spec.ts:293-301` |
| Delete looks up by job id | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:116-121` |
| Receive maps job data only | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:127-130` |
| Count delegates to the active queue | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:132-134` |
| Create queue replaces the slot without connection options | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:136-139` |
| Delete queue drains and closes | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:141-145` |
| Startup adds a health job and starts a worker | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:147-170` |
| Worker is closed on completion | `src/modules/reactory-queue/services/queue/BullMessageQueueService.ts:162-165` |
| Job options such as `attempts` and `delay` pass through | `src/modules/reactory-queue/services/queue/EnqueueCreateIfNotExists.spec.ts:259-274` |

### SQS provider

| Claim | Evidence |
|---|---|
| SQS service id and roles | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:49-58` |
| Provider key is `aws-sqs` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:70` |
| Queue URL and health URL come from props or env | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:30-32`, `:92-93` |
| Region and credentials come from props or env | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:86-89` |
| Creation propagation delay is configurable | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:38`, `:94-96` |
| Only genuine missing-queue errors lead to create | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:99-122` |
| A URL queue id is used verbatim | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:148` |
| Bare names are resolved with `GetQueueUrl` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:155-172` |
| `createIfNotExists` triggers `CreateQueue` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:174-190` |
| Enqueue retries once after creation | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:206-227` |
| Dequeue receives one without deleting | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:229-235` |
| Delete uses `this.queueUrl` and a receipt handle | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:237-243` |
| Receive long-polls for 10 seconds | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:249-254` |
| Receive writes the receipt handle into `header.id` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:257-261` |
| Count returns `-1` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:265-269` |
| Create queue is a stub returning `true` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:271-274` |
| Delete queue is a stub returning `true` | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:276-279` |
| Startup skips when no real URL is configured | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:290-309` |
| Startup sends a health check when configured | `src/modules/reactory-queue/services/queue/AWSSQSService.ts:311-334` |

### Consumers and operations

| Claim | Evidence |
|---|---|
| Communicator injects the registry by FQN | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:62-67` |
| Communicator resolves the default provider | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:143` |
| Communicator creates four named queues | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:43-48`, `:149-159` |
| Communicator enqueues with queue id and create flag | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:195-203` |
| Communicator caps retries at five | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:39-49`, `:309-311` |
| Communicator uses exponential backoff | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:321-331` |
| Communicator moves exhausted messages to `communicator.dlq` | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:364-395` |
| Communicator marks dead-lettered messages | `src/modules/reactory-communicator/services/CommunicatorQueueService.ts:398-406` |
| Payment publishes through the default provider | `src/modules/reactory-payment/events/index.ts:279-302` |
| Payment queue names are `payment.events` and `payment.inbound` | `src/modules/reactory-payment/events/index.ts:243-248` |
| Payment resolves and verifies the provider | `src/modules/reactory-payment/events/index.ts:324-331` |
| Payment creates queues once per provider | `src/modules/reactory-payment/events/index.ts:336-350` |
| Payment selects the BullMQ queue slot | `src/modules/reactory-payment/events/index.ts:352-366` |
| Payment consumer declares the queue dependency | `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:130-142` |
| Payment consumer defaults to three attempts | `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:182-185` |
| Payment consumer is opt-in | `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:210-216` |
| Payment consumer takes with `dequeue` | `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:306-320` |
| Payment consumer claims in a ledger | `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:418-450` |
| Payment ledger dead-letters past the cap | `src/modules/reactory-payment/queues/PaymentInboundQueueConsumer.ts:452-466` |
| Payment inbox is deliberately not tenant-scoped | `src/modules/reactory-payment/models/InboundEvent.ts:21-24` |
| Payment inbox has a unique event id | `src/modules/reactory-payment/models/InboundEvent.ts:31` |
| Product consumer resolves the provider | `src/modules/reactory-product/services/ProductEventConsumerService.ts:78-86` |
| Product consumer polls every five seconds | `src/modules/reactory-product/services/ProductEventConsumerService.ts:88-93` |
| Product consumer receives and acks | `src/modules/reactory-product/services/ProductEventConsumerService.ts:126-139`, `:326-331` |
| Product queue names are fixed | `src/modules/reactory-product/events/index.ts:67-89` |
| QueueListener declares a queue dependency | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:13-24` |
| QueueListener polls every five seconds | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:45-48`, `:150-176` |
| QueueListener requires a workflow invoker | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:88-92` |
| QueueListener dispatches on `body.workflowId` | `src/modules/reactory-core/workflow/QueueListener/QueueListener.ts:181-208` |
| QueueListener is absent from the core service array | `src/modules/reactory-core/services/index.ts:39-74` |
| Communicator exposes queue stats as a query | `src/modules/reactory-communicator/graph/resolvers/QueueResolver.ts:23-24` |
| Communicator exposes retry and purge mutations | `src/modules/reactory-communicator/graph/resolvers/QueueResolver.ts:157-158`, `:267-268` |
| Communicator admin routes expose queue operations | `src/modules/reactory-communicator/routes/admin.ts:18-19`, `:162-163`, `:262-263` |
| DLQ management form exists in communicator | `src/modules/reactory-communicator/forms/DLQManagementForm.ts:3-13`, `:19-24` |
| KYC wrappers call `addProcessor` | `src/modules/reactory-kyc/queues/VerificationQueue.ts:66-78` |
| KYC webhook routes use the wrong FQN | `src/modules/reactory-kyc/api/routes/webhook.routes.ts:65`, `:98`, `:132` |
