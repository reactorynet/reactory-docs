#!/usr/bin/env node
/**
 * Verifies the `reactory-queue` module documentation.
 *
 * Companion to `scripts/verify-docs.js` (core), `verify-reactor-docs.js`
 * (reactor) and `verify-azure-docs.js` (reference example). Those scripts are
 * hardcoded to their modules; this one applies the same standards to the queue
 * abstraction.
 *
 *   node scripts/verify-queue-docs.js                  # structural checks, plus
 *                                                      # source checks when the
 *                                                      # server checkout is near
 *   node scripts/verify-queue-docs.js --require-source # fail without a checkout
 *
 * Checks:
 *
 *   structural — the page exists under the filename the index generator looks
 *                for, carries the machine-readable header, has the ten
 *                template sections in order, states the mandated status,
 *                provider and operational claims, and every relative link
 *                resolves.
 *
 *   evidence   — every `path:line` reference in §10 names a real file and a
 *                line inside it; every section 1-9 carries at least one
 *                citation; §10 carries at least 80.
 *
 *   source     — the counts and contract values the page asserts still match
 *                the tree: 23 TypeScript files, 3 specs, 11 files under
 *                `services/`, zero GraphQL/YAML, four service definitions,
 *                the three provider FQNs, the hard-coded `in-memory` default,
 *                the dead `REACTORY_QUEUE_PROVIDER` fallback, the BullMQ
 *                `dequeue` id lookup, the SQS stubs, the licence
 *                contradiction and the absence of tenancy, telemetry and a
 *                registered workflow listener.
 *
 * Exit 0 on success, 1 on failure, 2 on a missing checkout when --require-source.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODULE_DIR = path.join(ROOT, '06-modules', 'reactory-queue');
const PAGE = path.join(MODULE_DIR, 'README.md');
const MODULE_INDEX = path.join(ROOT, '06-modules', 'index.md');
const TEMPLATE = path.join(ROOT, '08-contributing', 'module-doc-template.md');

const REQUIRE_SOURCE = process.argv.includes('--require-source');

const results = [];
const record = (ok, name, detail) => results.push({ ok, name, detail });
const pass = (name, detail) => record(true, name, detail);
const fail = (name, detail) => record(false, name, detail);

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

/** The ten headings this page uses. The template's §9/§10 are limitations/evidence. */
const SECTIONS = [
  '1. Purpose & status',
  '2. Module contract',
  '3. Data model',
  '4. GraphQL API',
  '5. Services',
  '6. UI surface',
  '7. Workflows',
  '8. Operations',
  '9. Limitations & roadmap',
  '10. Evidence index',
];

// ── markdown helpers (same shapes as the other verifiers) ───────────────────

/** Headings outside fenced code blocks. */
function headingsOf(markdown) {
  const out = [];
  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), slug: slug(m[2].trim()) });
  }
  return out;
}

/** GitHub's heading-slug algorithm, near enough for the shapes we emit. */
function slug(heading) {
  return heading
    .replace(/`/g, '')
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

/** All `[text](target)` links, fence-aware, with line numbers. */
function linksOf(markdown) {
  const out = [];
  let inFence = false;
  markdown.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) return;
    const re = /\[[^\]]*\]\(([^)\s]+)\)/g;
    let m;
    while ((m = re.exec(line)) !== null) out.push({ target: m[1], line: i + 1 });
  });
  return out;
}

function walk(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const newlineCount = (p) => (read(p).match(/\n/g) || []).length;
const relative = (p) => path.relative(ROOT, p).split(path.sep).join('/');

// ── source location ─────────────────────────────────────────────────────────

function resolveServerRoot() {
  const candidates = [
    process.env.REACTORY_SERVER_ROOT,
    path.resolve(ROOT, '..', 'reactory-express-server'),
    path.resolve(ROOT, '..', '..', 'reactory-express-server'),
  ].filter(Boolean);
  return candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, 'src', 'modules', 'reactory-queue', 'index.ts')),
  );
}

const SERVER = resolveServerRoot();
const QUEUE = SERVER ? path.join(SERVER, 'src', 'modules', 'reactory-queue') : null;

// ── structural checks ───────────────────────────────────────────────────────

function checkPageExists() {
  if (!exists(PAGE)) {
    fail('module page exists', relative(PAGE));
    // Return the empty string rather than null so every downstream check still
    // runs and reports its own failure. A missing page is a failure of the
    // whole contract, not a reason to stop checking.
    return '';
  }
  pass('module page exists', relative(PAGE));
  return read(PAGE);
}

function checkSections(markdown) {
  const headings = headingsOf(markdown).map((h) => h.text);
  const positions = [];
  const missing = [];

  for (const section of SECTIONS) {
    const index = headings.findIndex((h) => h.startsWith(section));
    if (index === -1) missing.push(section);
    else positions.push({ section, index });
  }

  if (missing.length > 0) {
    fail('ten template sections present', `missing: ${missing.join(', ')}`);
    return;
  }

  const ordered = positions.every((p, i) => i === 0 || p.index > positions[i - 1].index);
  if (!ordered) {
    fail('sections in template order', positions.map((p) => `${p.section}@${p.index}`).join(', '));
    return;
  }
  pass('ten template sections present and ordered', `${SECTIONS.length} sections`);
}

function checkNoPlaceholders(markdown) {
  const found = [];
  if (/\bTBD\b/.test(markdown)) found.push('TBD');
  if (/\bTODO\b/.test(markdown)) found.push('TODO');
  if (found.length > 0) fail('no placeholder sections', found.join(', '));
  else pass('no placeholder sections');
}

function checkFrontmatter(markdown) {
  const front = /^---\n([\s\S]*?)\n---/.exec(markdown);
  if (!front) {
    fail('machine-readable header', 'no YAML frontmatter');
    return;
  }
  const fields = front[1];
  const required = ['title', 'status', 'owner', 'verified', 'verifiedAgainst', 'audience'];
  const missing = required.filter((key) => !new RegExp(`^${key}:\\s*\\S`, 'm').test(fields));
  if (missing.length > 0) {
    fail('machine-readable header', `missing fields: ${missing.join(', ')}`);
    return;
  }
  const status = /^status:\s*(\S+)$/m.exec(fields);
  const allowed = ['Implemented', 'Partial', 'WIP', 'Roadmap', 'Deprecated'];
  if (!status || !allowed.includes(status[1])) {
    fail('status is a declared value', status ? status[1] : 'absent');
    return;
  }
  pass('machine-readable header', `status ${status[1]}`);
}

function checkMandatoryClaims(markdown) {
  const claims = [
    ['states the module FQN', /`reactory\.Queue@1\.0\.0`/],
    ['states the Partial status', /\*\*Status:\s*Partial/],
    ['names all three provider keys', /`in-memory`[\s\S]{0,400}`bullmq`[\s\S]{0,400}`aws-sqs`|`bullmq`[\s\S]{0,400}`in-memory`[\s\S]{0,400}`aws-sqs`/],
    ['names the registry service FQN', /`reactory\.QueueProvider@1\.0\.0`/],
    ['names the BullMQ service FQN', /`reactory\.BullMessageQueueService@1\.0\.0`/],
    ['names the in-memory service FQN', /`reactory\.InMemoryQueueService@1\.0\.0`/],
    ['names the SQS service FQN', /`reactory\.AWSSQSQueueService@1\.0\.0`/],
    ['records that there is no local data model', /no local data model|no ORM model|there is no local model/i],
    ['records the zero GraphQL contribution', /contributes no SDL|GraphQL API[\s\S]{0,80}\*\*Zero\*\*|\*\*Zero\.\*\*/],
    ['records the zero UI contribution', /The module has none|forms[\s\S]{0,40}`\[\]`/],
    ['records the zero workflow contribution', /zero workflow definitions|contributes zero workflow/i],
    ['states the hard-coded in-memory default', /hard-coded( to)? `?in-memory`?|default provider is hard-coded/i],
    ['states that REACTORY_QUEUE_PROVIDER is dead', /`REACTORY_QUEUE_PROVIDER`[^.\n]{0,160}(dead|never takes effect|unreachable)|(dead|unreachable)[^.\n]{0,160}`REACTORY_QUEUE_PROVIDER`/i],
    ['states that enabling a provider does not select it', /Enabling a provider only makes it \*\*registered\*\*|does not make it the default/i],
    ['states the instance lifecycle consequence', /`instance`-lifecycle|one instance per `getService|per resolution/i],
    ['documents the BullMQ dequeue defect', /getJob\('enqueueJob'\)[\s\S]{0,300}(id lookup|looks up|throws|broken)/i],
    ['documents the SQS count placeholder', /`?count\(\)`?[^.\n]{0,120}`?-1`?/],
    ['documents the SQS create/delete stubs', /`?createQueue\(\)`? and `?deleteQueue\(\)`?[^.\n]{0,80}stubs|Both return `true` without calling AWS/i],
    ['documents the inert failure queue id', /`failureQueueId`[\s\S]{0,200}(inert|ignored|discarded|no provider implements)/i],
    ['states that retries are consumer-level', /no retry or backoff implementation|implement them in the consumer|consumer-level/i],
    ['states that there is no dead-letter implementation', /no dead-letter implementation in the module/i],
    ['states that there is no concurrency control', /contains no consumer loop and no concurrency setting/i],
    ['states that there is no tenant dimension', /no tenant dimension|does not isolate tenants|no tenant field/i],
    ['states that telemetry is absent', /`bullmq-otel`[^.\n]{0,120}(never imported|unimported)|no OpenTelemetry API is used/i],
    ['states the in-memory durability limitation', /No durability|not shared between service resolutions|loses everything on restart/i],
    ['links the migration guide', /MIGRATION_GUIDE\.md/],
    ['documents the licence contradiction', /MIT[\s\S]{0,200}Apache[\s\S]{0,200}private/i],
  ];

  const missing = claims.filter(([, re]) => !re.test(markdown)).map(([label]) => label);
  if (missing.length > 0) fail('mandatory claims stated', missing.join('; '));
  else pass('mandatory claims stated', `${claims.length} claims`);
}

function checkCrossLinks(markdown) {
  if (!exists(TEMPLATE)) {
    fail('contributing template exists', relative(TEMPLATE));
    return;
  }
  if (!markdown.includes('08-contributing/module-doc-template.md')) {
    fail('page links the template', 'module page does not link the template');
  } else {
    pass('page links the template');
  }
}

function checkIndex() {
  if (!exists(MODULE_INDEX)) {
    fail('module index links the page', 'index.md absent');
    return;
  }
  const index = read(MODULE_INDEX);
  if (!index.includes('| `reactory-queue` | `reactory.Queue@1.0.0` |')) {
    fail('module index lists the page', 'queue row absent');
  } else if (!index.includes('[documented](./reactory-queue/README.md)')) {
    fail('module index lists the page', 'queue row does not link the page');
  } else {
    pass('module index lists the page', 'generated row links ./reactory-queue/README.md');
  }
}

function checkLinks() {
  const pages = [PAGE, TEMPLATE].filter(exists);
  const problems = [];

  for (const file of pages) {
    for (const link of linksOf(read(file))) {
      const target = link.target;
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('/') || target.startsWith('<')) {
        continue;
      }
      const [rawPath, anchor] = target.split('#');
      const resolved = path.resolve(path.dirname(file), rawPath);
      if (!exists(resolved)) {
        problems.push(`${relative(file)}:${link.line} -> ${target} (missing file)`);
        continue;
      }
      if (anchor && resolved.endsWith('.md')) {
        const anchors = new Set(headingsOf(read(resolved)).map((h) => h.slug));
        if (!anchors.has(anchor)) {
          problems.push(`${relative(file)}:${link.line} -> ${target} (missing anchor)`);
        }
      }
    }
  }

  if (problems.length === 0) pass('links resolve', `${pages.length} pages`);
  else fail('links resolve', problems.slice(0, 10).join('\n    '));
}

// ── evidence checks ─────────────────────────────────────────────────────────

const CITATION = /`([A-Za-z0-9_./-]+\.(?:ts|js|json|md|graphql|yaml)):(\d+)(?:-(\d+))?`/g;

function citationsIn(markdown) {
  return [...markdown.matchAll(CITATION)].map((m) => ({
    raw: m[0],
    relative: m[1],
    from: Number(m[2]),
    to: m[3] ? Number(m[3]) : Number(m[2]),
  }));
}

function checkEvidenceIndex(markdown) {
  const start = markdown.indexOf('## 10. Evidence index');
  if (start === -1) {
    fail('evidence index populated', 'section absent');
    return;
  }
  const refs = citationsIn(markdown.slice(start));
  if (refs.length >= 80) pass('evidence index populated', `${refs.length} file:line references in §10`);
  else fail('evidence index populated', `only ${refs.length} references in §10, need >= 80`);
}

/** Every section 1-9 must carry at least one citation. */
function checkSectionEvidence(markdown) {
  const headingPositions = SECTIONS.map((section) => {
    const at = markdown.indexOf(`\n## ${section}`);
    return { section, at };
  }).filter((entry) => entry.at !== -1);

  if (headingPositions.length === 0) {
    fail('sections 1-9 are evidenced', 'no section headings found');
    return;
  }

  const missing = [];
  for (let i = 0; i < headingPositions.length; i += 1) {
    const { section, at } = headingPositions[i];
    if (section.startsWith('10.')) continue;
    const next = headingPositions[i + 1] ? headingPositions[i + 1].at : markdown.length;
    const body = markdown.slice(at, next);
    if (citationsIn(body).length === 0) missing.push(section);
  }

  if (missing.length > 0) fail('sections 1-9 are evidenced', missing.join(', '));
  else pass('sections 1-9 are evidenced', `${headingPositions.length - 1} sections cited`);
}

function checkCitationsResolve(markdown) {
  if (!SERVER) {
    if (REQUIRE_SOURCE) fail('citations resolve', 'no checkout; set REACTORY_SERVER_ROOT');
    else process.stdout.write('\n  NOTE  reactory-express-server not found — citations unverified.\n');
    return;
  }

  const refs = citationsIn(markdown);
  const problems = [];

  for (const citation of refs) {
    const resolved = path.join(SERVER, citation.relative);
    if (!exists(resolved)) {
      problems.push(`${citation.relative}: file not found`);
      continue;
    }
    const lines = read(resolved).split('\n').length;
    if (citation.from < 1 || citation.to > lines || citation.from > citation.to) {
      problems.push(`${citation.raw}: line ${citation.to} outside 1..${lines}`);
    }
  }

  if (problems.length === 0) pass('citations resolve', `${refs.length} references`);
  else fail('citations resolve', problems.slice(0, 12).join('\n    '));
}

// ── source-derived checks ───────────────────────────────────────────────────

function checkSourceShape(markdown) {
  if (!QUEUE) {
    if (REQUIRE_SOURCE) fail('queue module present', 'no checkout; set REACTORY_SERVER_ROOT');
    else process.stdout.write('\n  NOTE  reactory-queue checkout not found — source checks skipped.\n');
    return;
  }

  const tsFiles = walk(QUEUE).filter((f) => f.endsWith('.ts'));
  const specs = tsFiles.filter((f) => /\.spec\.ts$/.test(f));
  const serviceFiles = tsFiles.filter((f) => relative(f).includes('/reactory-queue/services/'));
  const graphqlFiles = walk(QUEUE).filter((f) => f.endsWith('.graphql'));
  const yamlFiles = walk(QUEUE).filter((f) => /\.ya?ml$/.test(f));

  const shape = [
    [tsFiles.length, 23, 'TypeScript files'],
    [specs.length, 3, 'spec files'],
    [serviceFiles.length, 11, 'files under services/'],
    [graphqlFiles.length, 0, 'GraphQL files'],
    [yamlFiles.length, 0, 'YAML files'],
  ];
  const wrong = shape.filter(([actual, expected]) => actual !== expected)
    .map(([actual, expected, label]) => `${label}: ${actual} (page says ${expected})`);
  if (wrong.length > 0) fail('source file counts match the page', wrong.join('; '));
  else pass('source file counts match the page', '23 TS, 3 specs, 11 service files, 0 GraphQL, 0 YAML');

  const newlines = tsFiles.filter((f) => !/\.spec\.ts$/.test(f)).reduce((sum, file) => sum + newlineCount(file), 0);
  if (newlines !== 1503) fail('TypeScript line count matches', `${newlines} newlines, page says 1503`);
  else pass('TypeScript line count matches', '1503 newlines');

  const expectedEmpty = [
    ['services/index.ts', /export default \[/],
    ['graph/index.ts', /export default \{\} as Reactory\.Graph\.IGraphDefinitions;/],
    ['workflow/index.ts', /export default \[\];/],
    ['forms/index.ts', /export default \[\];/],
    ['models/index.ts', /export default \[\];/],
    ['protobuf/index.ts', /export default \[\];/],
    ['routes/index.ts', /export default \{\};/],
    ['cli/index.ts', /export default \[\];/],
    ['views/index.ts', /export default \[\];/],
    ['schema/index.ts', /export default \[\];/],
    ['i18n/index.ts', /export default \[\];/],
  ];
  const emptyProblems = expectedEmpty
    .filter(([file, re]) => !re.test(read(path.join(QUEUE, file))))
    .map(([file]) => file);
  if (emptyProblems.length > 0) fail('empty extension points still empty', emptyProblems.join(', '));
  else pass('empty extension points still empty', `${expectedEmpty.length} barrels`);

  if (/export default \[[\s\S]*QueueProvider[\s\S]*BullMessageQueueService[\s\S]*InMemoryQueueService[\s\S]*AWSSQSQueueService[\s\S]*\]/.test(read(path.join(QUEUE, 'services/index.ts')))) {
    pass('four service definitions exported', 'services/index.ts');
  } else {
    fail('four service definitions exported', 'services/index.ts no longer lists all four');
  }

  const index = read(path.join(QUEUE, 'index.ts'));
  const contract = [
    ["id: 'reactory-queue'", 'id'],
    ["nameSpace: 'reactory'", 'namespace'],
    ["name: 'Queue'", 'name'],
    ["version: '1.0.0'", 'version'],
    ["dependencies: ['core.ReactoryServer@1.0.0']", 'dependency'],
    ['priority: 2', 'priority'],
    ['graphDefinitions: graph', 'graph definitions'],
    ['models,', 'models'],
    ['clientPlugins: []', 'client plugins'],
    ['grpc,', 'grpc'],
    ['routes,', 'routes'],
    ['cli,', 'cli'],
  ];
  const absent = contract.filter(([needle]) => !index.includes(needle)).map(([, label]) => label);
  if (absent.length > 0) fail('module object still matches the page', absent.join(', '));
  else pass('module object still matches the page', `${contract.length} fields`);

  const barrel = read(path.join(SERVER, 'src', 'modules', '__index.ts'));
  if (!barrel.includes('reactory-queue/index') || !barrel.includes('reactory_Queue_VER_1_0_0')) {
    fail('generated barrel still loads the module', 'queue import absent');
  } else {
    pass('generated barrel still loads the module');
  }
}

function checkProviderClaims() {
  if (!QUEUE) return;

  const provider = read(path.join(QUEUE, 'services/queue/QueueProvider.ts'));
  const bull = read(path.join(QUEUE, 'services/queue/BullMessageQueueService.ts'));
  const memory = read(path.join(QUEUE, 'services/queue/InMemoryQueueService.ts'));
  const sqs = read(path.join(QUEUE, 'services/queue/AWSSQSService.ts'));

  const decorator = [
    ["id: 'reactory.QueueProvider@1.0.0'", 'registry id'],
    ["nameSpace: 'reactory'", 'namespace'],
    ["name: 'QueueProvider'", 'name'],
    ["serviceType: 'data'", 'service type'],
    ["roles: ['SYSTEM']", 'roles'],
  ];
  const missingDecorator = decorator.filter(([needle]) => !provider.includes(needle)).map(([, label]) => label);
  if (missingDecorator.length > 0) fail('registry decorator matches the page', missingDecorator.join(', '));
  else pass('registry decorator matches the page', `${decorator.length} fields`);

  if (/lifeCycle:\s*['"]/.test(provider)) {
    fail('registry has no explicit lifecycle (page claims instance default)', 'lifeCycle is now declared — update §5.2');
  } else {
    pass('registry has no explicit lifecycle (page claims instance default)');
  }

  // The page's central selection claim: a literal default shadows the env var.
  // The constructor uses `this.config.defaultProvider || process.env.…`, and
  // loadConfiguration always supplies the literal, so the fallback cannot win.
  const constructorDefault = /this\.defaultProviderKey = this\.config\.defaultProvider \|\| process\.env\.REACTORY_QUEUE_PROVIDER/.test(provider);
  const literalDefault = /defaultProvider: 'in-memory'/.test(provider);
  if (!constructorDefault || !literalDefault) {
    fail('selection defect still matches the page', 'literal default no longer shadows the env fallback');
  } else {
    pass('selection defect still matches the page', 'defaultProvider literal shadows REACTORY_QUEUE_PROVIDER');
  }

  if (!/enabled: process\.env\.REACTORY_QUEUE_BULLMQ_ENABLED === 'true'/.test(provider)) {
    fail('BullMQ enable flag still matches the page', 'flag absent or changed');
  } else {
    pass('BullMQ enable flag still matches the page');
  }

  if (!/getJob\('enqueueJob'\)/.test(bull)) {
    fail('BullMQ dequeue still uses the job-id lookup', 'getJob("enqueueJob") absent — remove limitation 5');
  } else {
    pass('BullMQ dequeue still uses the job-id lookup');
  }

  if (/props\?\.redis|props\.redis/.test(bull)) {
    fail('BullMQ still ignores props Redis config', 'props.redis is now read — update §5.5');
  } else {
    pass('BullMQ still ignores props Redis config');
  }

  if (!/new Queue\(queueId\)/.test(bull)) {
    fail('BullMQ createQueue still drops connection options', 'new Queue(queueId) absent');
  } else {
    pass('BullMQ createQueue still drops connection options');
  }

  if (!/return -1;/.test(sqs)) fail('SQS count still returns -1', 'return -1 absent — remove limitation 9');
  else pass('SQS count still returns -1');

  if (!/async createQueue[\s\S]{0,300}return true;/.test(sqs) || !/async deleteQueue[\s\S]{0,300}return true;/.test(sqs)) {
    fail('SQS create/delete remain stubs', 'a real AWS call replaced a stub — update §5.6');
  } else {
    pass('SQS create/delete remain stubs');
  }

  if (!/QueueUrl: this\.queueUrl,\s*\n\s*ReceiptHandle: id/.test(sqs)) {
    fail('SQS deleteMessage ignores options.queueId', 'delete path changed — update §5.6');
  } else {
    pass('SQS deleteMessage ignores options.queueId');
  }

  if (!/provider: string = 'in-memory'/.test(memory) || !/provider: string = 'bullmq'/.test(bull) || !/provider: string = 'aws-sqs'/.test(sqs)) {
    fail('provider keys match the page', 'a provider key changed');
  } else {
    pass('provider keys match the page', 'in-memory / bullmq / aws-sqs');
  }
}

function checkPackageAndRegistry() {
  if (!QUEUE) return;

  const pkg = JSON.parse(read(path.join(QUEUE, 'package.json')));
  const problems = [];
  if (pkg.name !== 'reactory-queue') problems.push(`name ${pkg.name}`);
  if (pkg.version !== '1.0.0') problems.push(`version ${pkg.version}`);
  if (pkg.license !== 'MIT') problems.push(`licence ${pkg.license} (page says MIT)`);
  if (!pkg.dependencies || !pkg.dependencies['bullmq-otel']) problems.push('bullmq-otel dependency absent');
  if (problems.length > 0) fail('package manifest matches the page', problems.join('; '));
  else pass('package manifest matches the page', 'MIT, 1.0.0, bullmq-otel declared');

  if (!/Apache License/.test(read(path.join(QUEUE, 'LICENSE')))) {
    fail('LICENSE contradiction still matches the page', 'LICENSE is no longer Apache-2.0');
  } else {
    pass('LICENSE contradiction still matches the page', 'Apache-2.0');
  }

  const registry = JSON.parse(read(path.join(SERVER, 'src', 'modules', 'available.json')));
  const entry = registry.find((m) => m.id === 'reactory-queue');
  if (!entry) {
    fail('registry entry present', 'reactory-queue absent from available.json');
    return;
  }
  const registryProblems = [];
  if (entry.fqn !== 'reactory.Queue@1.0.0') registryProblems.push(`fqn ${entry.fqn}`);
  if (entry.license !== 'private') registryProblems.push(`licence ${entry.license} (contradiction resolved in source?)`);
  if (registryProblems.length > 0) fail('registry still records the documented values', registryProblems.join('; '));
  else pass('registry still records the documented values', 'private / reactory.Queue@1.0.0');

  const moduleSources = walk(QUEUE).filter((f) => f.endsWith('.ts'));
  const telemetry = moduleSources.filter((f) => /bullmq-otel/.test(read(f)));
  if (telemetry.length > 0) {
    fail('module still has no telemetry', `${telemetry.length} file(s) import bullmq-otel — update §8.8`);
  } else {
    pass('module still has no telemetry', 'bullmq-otel is declared but unimported');
  }

  const tenantRefs = moduleSources.filter((f) => /\b(tenant|clientKey)\b/i.test(read(f)));
  if (tenantRefs.length > 0) {
    fail('module still has no tenant dimension', `${tenantRefs.length} file(s) reference tenancy — update §8.7`);
  } else {
    pass('module still has no tenant dimension');
  }
}

function checkConsumersAndWorkflow() {
  if (!QUEUE || !SERVER) return;

  const coreServices = read(path.join(SERVER, 'src', 'modules', 'reactory-core', 'services', 'index.ts'));
  if (/QueueListener/.test(coreServices)) {
    fail('QueueListener is still unregistered', 'core services now exports it — update §7 and limitation 19');
  } else {
    pass('QueueListener is still unregistered');
  }

  const listener = read(path.join(SERVER, 'src', 'modules', 'reactory-core', 'workflow', 'QueueListener', 'QueueListener.ts'));
  const listenerProblems = [];
  if (!listener.includes('reactory.QueueProvider@1.0.0')) listenerProblems.push('queue provider dependency absent');
  if (!listener.includes('receiveMessages')) listenerProblems.push('receive loop absent');
  if (!listener.includes('workflowId')) listenerProblems.push('workflow dispatch absent');
  if (listenerProblems.length > 0) fail('QueueListener still matches the page', listenerProblems.join('; '));
  else pass('QueueListener still matches the page', 'provider dependency + receive loop + workflow dispatch');

  const resolver = read(path.join(SERVER, 'src', 'modules', 'reactory-communicator', 'graph', 'resolvers', 'QueueResolver.ts'));
  const graphProblems = [];
  if (!resolver.includes("'communicatorQueueStats'")) graphProblems.push('stats query absent');
  if (!resolver.includes("'communicatorRetryMessages'")) graphProblems.push('retry mutation absent');
  if (!resolver.includes("'communicatorPurgeDLQ'")) graphProblems.push('purge mutation absent');
  if (graphProblems.length > 0) fail('communicator queue surface still matches the page', graphProblems.join('; '));
  else pass('communicator queue surface still matches the page', 'one query and two mutations');

  const kyc = read(path.join(SERVER, 'src', 'modules', 'reactory-kyc', 'queues', 'VerificationQueue.ts'));
  if (!kyc.includes('addProcessor')) {
    fail('KYC addProcessor defect still matches the page', 'addProcessor absent — remove limitation 20');
  } else {
    pass('KYC addProcessor defect still matches the page');
  }

  const kycRoutes = read(path.join(SERVER, 'src', 'modules', 'reactory-kyc', 'api', 'routes', 'webhook.routes.ts'));
  if (!kycRoutes.includes('reactory-queue.QueueProvider@1.0.0')) {
    fail('KYC wrong-FQN defect still matches the page', 'wrong FQN absent — remove limitation 21');
  } else {
    pass('KYC wrong-FQN defect still matches the page');
  }
}

// ── main ────────────────────────────────────────────────────────────────────

function main() {
  const markdown = checkPageExists();
  if (markdown !== null) {
    checkSections(markdown);
    checkNoPlaceholders(markdown);
    checkFrontmatter(markdown);
    checkMandatoryClaims(markdown);
    checkCrossLinks(markdown);
    checkIndex();
    checkEvidenceIndex(markdown);
    checkSectionEvidence(markdown);
    checkCitationsResolve(markdown);
  }
  checkLinks();

  if (SERVER) {
    if (markdown) {
      checkSourceShape(markdown);
      checkProviderClaims();
      checkPackageAndRegistry();
      checkConsumersAndWorkflow();
    }
  } else if (REQUIRE_SOURCE) {
    fail('server source available', 'cannot locate reactory-express-server; set REACTORY_SERVER_ROOT');
  } else {
    process.stdout.write(
      '\n  NOTE  reactory-express-server not found — skipping source-derived checks.\n' +
        '        Pass --require-source in CI to make this an error instead.\n',
    );
  }

  const failures = results.filter((r) => !r.ok);
  for (const r of results) {
    process.stdout.write(`${r.ok ? '  ok  ' : '  FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}\n`);
  }

  process.stdout.write(`\n${results.length - failures.length}/${results.length} checks passed\n`);
  if (SERVER) process.stdout.write(`source: ${SERVER}\n`);

  if (failures.length > 0) process.exit(1);
  process.exit(0);
}

main();
