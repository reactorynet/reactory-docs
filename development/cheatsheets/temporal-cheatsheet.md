# Temporal.io Command & SDK Cheat Sheet

## What is Temporal?

Temporal is an open-source, durable execution platform that orchestrates distributed state machines and microservices. Unlike traditional workflow engines that persist mutable state snapshots, Temporal uses **Deterministic Event Sourcing with Code Replay** — state is recorded in an immutable append-only event log, and stateless worker processes rehydrate runtime stacks via fast-forward replay.

```
┌───────────────────────────┐         ┌──────────────────────────────┐
│       TEMPORAL SDK        │         │       TEMPORAL CLUSTER       │
│  (Workflows & Activities) │ ◄─────► │ (History, Matching, Frontend)│
│    Stateless Workers      │  gRPC   │   Event Sourcing & Queues    │
└───────────────────────────┘         └──────────────────────────────┘
```

---

## Quick CLI Reference

```bash
# Start a local development cluster with Web UI & persistence
temporal server start-dev

# Cluster & Namespaces
temporal operator namespace list
temporal operator namespace create my-namespace
temporal operator cluster health

# Workflows
temporal workflow list
temporal workflow start --type MyWorkflow --task-queue my-queue --workflow-id wf-101
temporal workflow show --workflow-id wf-101
temporal workflow query --workflow-id wf-101 --type getProgress
temporal workflow signal --workflow-id wf-101 --name approveBatch --input '"admin_user"'
temporal workflow cancel --workflow-id wf-101
temporal workflow terminate --workflow-id wf-101 --reason "Manual cancellation"
temporal workflow reset --workflow-id wf-101 --event-id 12 --reason "Bugfix replay"
```

---

## 1. Temporal CLI (`temporal`)

### Cluster & Namespace Administration
```bash
# List all registered namespaces
temporal operator namespace list

# Create a new namespace with 7-day retention
temporal operator namespace create --retention 7d b2b-payouts

# Describe a namespace
temporal operator namespace describe default

# Check cluster health
temporal operator cluster health
temporal operator cluster system-info
```

### Workflow Execution Management
```bash
# List active workflows (tabular)
temporal workflow list

# List all workflows including completed, failed, and canceled
temporal workflow list --all

# Filter workflows by Execution Status or Type
temporal workflow list --query 'ExecutionStatus="Running"'
temporal workflow list --query 'WorkflowType="B2BMassPayoutWorkflow" AND ExecutionStatus="Completed"'

# Start a workflow execution
temporal workflow start \
  --type B2BMassPayoutWorkflow \
  --task-queue b2b-payouts-queue \
  --workflow-id batch_2026_001 \
  --input '{"batchId":"batch_2026_001","accountId":"acc_123","rows":[]}'

# Run a workflow synchronously (blocks until completion and prints output)
temporal workflow execute \
  --type B2BMassPayoutWorkflow \
  --task-queue b2b-payouts-queue \
  --workflow-id batch_2026_002 \
  --input-file ./payload.json

# Describe workflow status & execution metadata
temporal workflow show --workflow-id batch_2026_001

# Inspect complete event history log
temporal workflow show --workflow-id batch_2026_001 --output json
```

### Interacting with Running Workflows (Signals & Queries)
```bash
# Send an asynchronous Signal into a waiting workflow
temporal workflow signal \
  --workflow-id batch_2026_001 \
  --name approveBatch \
  --input '"user_checker_werner"'

# Query in-memory workflow state (read-only, does not alter event history)
temporal workflow query \
  --workflow-id batch_2026_001 \
  --type getBatchProgress

# Request graceful cancellation (workflow handles CancellationError)
temporal workflow cancel --workflow-id batch_2026_001

# Terminate workflow immediately (unconditional hard kill)
temporal workflow terminate --workflow-id batch_2026_001 --reason "Fraud alert detected"
```

### Schedules (Cron & Recurring Workflows)
```bash
# Create a scheduled workflow (every day at 2:00 AM)
temporal schedule create \
  --schedule-id daily-ledger-recon \
  --cron "0 2 * * *" \
  --type DailyLedgerReconWorkflow \
  --task-queue recon-queue

# List and inspect schedules
temporal schedule list
temporal schedule describe --schedule-id daily-ledger-recon

# Pause, unpause, or trigger immediately
temporal schedule pause --schedule-id daily-ledger-recon --reason "Maintenance window"
temporal schedule unpause --schedule-id daily-ledger-recon
temporal schedule trigger --schedule-id daily-ledger-recon
```

---

## 2. TypeScript SDK: Workflows, Activities, and Workers

### Defining Activities (`activities.ts`)
Activities contain all non-deterministic side-effects (database queries, network calls, file I/O).

```typescript
// workflows/activities.ts
export interface PayoutResult {
  payoutId: string;
  status: 'DELIVERED' | 'FAILED';
}

export async function reserveFundsActivity(accountId: string, amount: number): Promise<string> {
  // Database mutation / ledger API call
  return `res_${Date.now()}`;
}

export async function createPayoutActivity(rowId: string, amount: number, iban: string): Promise<PayoutResult> {
  // Bank API call with Idempotency Key
  return { payoutId: `pay_${rowId}`, status: 'DELIVERED' };
}

export async function releaseFundsActivity(reservationId: string): Promise<void> {
  // Compensation / Saga rollback
}
```

### Defining Workflows (`workflows.ts`)
Workflows orchestrate activities, handle signals, and maintain durable state deterministically.

```typescript
// workflows/workflows.ts
import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  sleep,
} from '@temporalio/workflow';
import type * as activities from './activities';

// 1. Configure Activity Proxies (timeouts & retry policies)
const { reserveFundsActivity, createPayoutActivity, releaseFundsActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumAttempts: 5,
    nonRetryableErrorTypes: ['InvalidIbanError', 'AccountNotFoundError'],
  },
});

// 2. Define Signals & Queries
export const approveSignal = defineSignal<[string]>('approveBatch');
export const getProgressQuery = defineQuery<{ settled: number; total: number }>('getProgress');

// 3. Workflow Implementation
export async function B2BMassPayoutWorkflow(input: {
  batchId: string;
  accountId: string;
  rows: Array<{ rowId: string; amount: number; iban: string }>;
}): Promise<{ batchId: string; status: string }> {
  let isApproved = false;
  let approver = '';
  let settledCount = 0;

  // Signal & Query Handlers
  setHandler(approveSignal, (userId: string) => {
    isApproved = true;
    approver = userId;
  });

  setHandler(getProgressQuery, () => ({
    settled: settledCount,
    total: input.rows.length,
  }));

  // Step 1: Reserve Funds
  const totalAmount = input.rows.reduce((sum, r) => sum + r.amount, 0);
  const reservationId = await reserveFundsActivity(input.accountId, totalAmount);

  // Step 2: Durable Saga Try-Catch Block
  try {
    // Wait for Human Approval (Maker/Checker) up to 7 days with ZERO CPU/RAM
    const approved = await condition(() => isApproved, '7 days');
    if (!approved) throw new Error('Batch approval timed out');

    // Step 3: Fan-out Payout Activities
    for (const row of input.rows) {
      await createPayoutActivity(row.rowId, row.amount, row.iban);
      settledCount++;
    }

    return { batchId: input.batchId, status: 'SETTLED' };
  } catch (error) {
    // Saga Rollback / Compensation
    await releaseFundsActivity(reservationId);
    throw error;
  }
}
```

### Running the Worker (`worker.ts`)

```typescript
// workflows/worker.ts
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'b2b-payouts-queue',
    workflowsPath: require.resolve('./workflows'),
    activities,
    maxConcurrentActivityTaskExecutions: 20,
    maxConcurrentWorkflowTaskExecutions: 20,
  });

  console.log('Worker listening on task queue: b2b-payouts-queue');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

## 3. Client Interaction (`@temporalio/client`)

### Starting, Querying, and Signaling from Application Code

```typescript
import { Connection, Client } from '@temporalio/client';
import { B2BMassPayoutWorkflow, approveSignal, getProgressQuery } from './workflows';

async function main() {
  // Connect to Temporal
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection, namespace: 'default' });

  // 1. Start Workflow (Non-blocking)
  const handle = await client.workflow.start(B2BMassPayoutWorkflow, {
    taskQueue: 'b2b-payouts-queue',
    workflowId: 'payroll_batch_101',
    args: [{
      batchId: 'payroll_batch_101',
      accountId: 'acc_acme_gbp',
      rows: [{ rowId: 'r1', amount: 2500, iban: 'GB33BUKB20201555555555' }],
    }],
  });

  console.log(`Workflow started: ${handle.workflowId} (${handle.firstExecutionRunId})`);

  // 2. Query Live Progress
  const progress = await handle.query(getProgressQuery);
  console.log(`Progress: ${progress.settled} / ${progress.total}`);

  // 3. Send Signal (Maker/Checker Approval)
  await handle.signal(approveSignal, 'user_checker_werner');

  // 4. Wait for Result
  const result = await handle.result();
  console.log('Workflow Completed:', result);
}
```

---

## 4. Reactory Integration (`reactory-temporal`)

### Reactory Workflow YAML Step Macro
```yaml
name: ExecuteB2BPayoutBatch
steps:
  - id: startTemporalPayout
    macro: temporalStartWorkflow
    params:
      workflowType: "B2BMassPayoutWorkflow"
      workflowId: "batch_{{vars.batchId}}"
      taskQueue: "b2b-payouts-queue"
      args:
        - batchId: "{{vars.batchId}}"
          accountId: "{{vars.accountId}}"
          rows: "{{vars.validRows}}"
```

### Reactory GraphQL BFF Mutations
```graphql
# Start a durable workflow execution
mutation StartBatch {
  temporalStartWorkflow(input: {
    workflowType: "B2BMassPayoutWorkflow"
    workflowId: "batch_2026_001"
    taskQueue: "b2b-payouts-queue"
    args: [{
      batchId: "batch_2026_001",
      accountId: "acc_acme_gbp",
      rows: [...]
    }]
  }) {
    workflowId
    runId
    status
  }
}

# Signal workflow on Maker/Checker approval
mutation ApproveBatch {
  temporalSignalWorkflow(input: {
    workflowId: "batch_2026_001"
    signalName: "approveBatch"
    args: ["user_checker_werner"]
  })
}
```

---

## 5. Podman Local Development Stack

### `docker-compose-temporal.yaml`
```yaml
name: reactory-temporal
services:
  temporal_postgresql:
    image: docker.io/library/postgres:16-alpine
    container_name: reactory-temporal-postgresql
    restart: unless-stopped
    environment:
      POSTGRES_USER: temporal
      POSTGRES_PASSWORD: temporal_password
      POSTGRES_DB: temporal
    volumes:
      - temporal_postgres_data:/var/lib/postgresql/data
    networks:
      - temporal-network

  temporal_server:
    image: docker.io/temporalio/auto-setup:1.24.2
    container_name: reactory-temporal-server
    restart: unless-stopped
    ports:
      - "7233:7233"
    environment:
      - DB=postgres12
      - DB_PORT=5432
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal_password
      - POSTGRES_SEEDS=temporal_postgresql
    networks:
      - temporal-network
    depends_on:
      - temporal_postgresql

  temporal_ui:
    image: docker.io/temporalio/ui:2.30.0
    container_name: reactory-temporal-ui
    restart: unless-stopped
    ports:
      - "8233:8080"
    environment:
      - TEMPORAL_ADDRESS=temporal_server:7233
    networks:
      - temporal-network
    depends_on:
      - temporal_server

  temporal_admin_tools:
    image: docker.io/temporalio/admin-tools:latest
    container_name: reactory-temporal-admin-tools
    restart: unless-stopped
    stdin_open: true
    tty: true
    environment:
      - TEMPORAL_ADDRESS=temporal_server:7233
    networks:
      - temporal-network
    depends_on:
      - temporal_server

volumes:
  temporal_postgres_data:

networks:
  temporal-network:
    driver: bridge
```

### Commands
```bash
# Start Temporal Stack in Podman
podman-compose -f docker/config/docker-compose-temporal.yaml up -d

# Verify Container Status
podman ps --filter name=reactory-temporal

# Open Web UI
open http://localhost:8233

# Stop Stack
podman-compose -f docker/config/docker-compose-temporal.yaml down
```

---

## 6. Golden Rules & Determinism Invariants

| ❌ NEVER DO inside a Workflow | ✅ DO INSTEAD |
|---|---|
| `Math.random()` | Pass random values from an Activity or client input |
| `Date.now()` or `new Date()` | Use Temporal's deterministic `workflow.now()` |
| `setTimeout()` or `setInterval()` | Use `await workflow.sleep('2h')` or `condition()` |
| Direct `fetch()`, `axios`, or DB calls | Move all side-effects into **Activities** |
| Global mutable state across workflows | Keep state scoped inside the workflow function |
| Non-deterministic thread races | Use Temporal's deterministic promises and select APIs |

---

## 7. History Size Management (`continueAsNew`)

Temporal workflows have a soft limit of **50,000 events** (~50MB history). For massive batches or infinite polling loops, use `continueAsNew`:

```typescript
import { continueAsNew } from '@temporalio/workflow';

export async function ChunkedBatchWorkflow(batchId: string, remainingRows: Row[]): Promise<void> {
  const chunkSize = 500;
  const currentChunk = remainingRows.slice(0, chunkSize);
  const remaining = remainingRows.slice(chunkSize);

  // Process current chunk
  for (const row of currentChunk) {
    await processRowActivity(row);
  }

  // Continue as new execution with clean history
  if (remaining.length > 0) {
    await continueAsNew<typeof ChunkedBatchWorkflow>(batchId, remaining);
  }
}
```
