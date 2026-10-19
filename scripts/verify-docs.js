#!/usr/bin/env node
/**
 * Verifies the module documentation in this corpus.
 *
 * `reactory-docs` is a Markdown-only repository: there is no `package.json`, no
 * jest and no build step, so this is a dependency-free Node script. It is the
 * CI guard that replaces the review-by-eyeball the AGENT.md used to describe.
 *
 *   node scripts/verify-docs.js                  # structural checks, plus
 *                                                # generated/freshness checks
 *                                                # when the server source is
 *                                                # reachable
 *   node scripts/verify-docs.js --require-source # fail if the server checkout is
 *                                                # missing (use in CI)
 *
 * Checks fall into two groups:
 *
 *   structural — always run. Template sections, frontmatter, the mandatory
 *                limitation statements, the evidence index, and link resolution
 *                within the module documentation tree.
 *
 *   source-derived — run when `reactory-express-server` can be located (via
 *                REACTORY_SERVER_ROOT or the sibling search in
 *                scripts/generate-core-module-reference.js). These compare the
 *                committed generated reference against a fresh run and check
 *                that the counts stated in the narrative match the source.
 *
 * Exit code 0 on success, 1 on any failure, 2 on a missing source checkout when
 * `--require-source` was passed.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODULE_DIR = path.join(ROOT, '06-modules', 'reactory-core');
const MODULE_PAGE = path.join(MODULE_DIR, 'README.md');
const MODULE_INDEX = path.join(ROOT, '06-modules', 'index.md');
const GENERATED = path.join(ROOT, '07-reference', 'modules', 'reactory-core.md');

const REQUIRE_SOURCE = process.argv.includes('--require-source');

const results = [];
const record = (ok, name, detail) => results.push({ ok, name, detail });
const pass = (name, detail) => record(true, name, detail);
const fail = (name, detail) => record(false, name, detail);

const read = (p) => fs.readFileSync(p, 'utf8');

// ── markdown helpers ────────────────────────────────────────────────────────

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

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// ── structural checks ───────────────────────────────────────────────────────

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

function checkPageExists() {
  if (!fs.existsSync(MODULE_PAGE)) {
    fail('module page exists', `missing ${path.relative(ROOT, MODULE_PAGE)}`);
    return null;
  }
  pass('module page exists', path.relative(ROOT, MODULE_PAGE));
  return read(MODULE_PAGE);
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
  // 1. The ETL path is a user import feature, not an ingestion pipeline.
  const etl =
    /services\/ETL`? is a user\/demographics import feature/i.test(markdown)
    && /not a general ingestion pipeline/i.test(markdown);
  if (etl) pass('ETL is stated as user import, not ingestion');
  else fail('ETL is stated as user import, not ingestion', 'statement not found');

  const processors = [
    'core.UserFileImportCSV2JSON@1.0.0',
    'core.UserFileImportPreview@1.0.0',
    'core.UserFileImportValidation@1.0.0',
    'core.UserFileImportProcessGeneral@1.0.0',
    'core.UserFileImportProcessDemographics@1.0.0',
  ];
  const missingProcessors = processors.filter((p) => !markdown.includes(p));
  if (missingProcessors.length === 0) pass('all five ETL processors named');
  else fail('all five ETL processors named', `missing: ${missingProcessors.join(', ')}`);

  // 2. UserImportFileValidation throws on invocation, with the mechanism.
  const throws =
    /UserImportFileValidation`? throws on invocation/i.test(markdown)
    && markdown.includes('path.join()')
    && markdown.includes('EISDIR');
  if (throws) pass('UserImportFileValidation failure is explained');
  else fail('UserImportFileValidation failure is explained', 'statement or mechanism not found');
}

function checkRunnableExample(markdown) {
  const yaml = 'workflows/examples/EngineHello.yaml';
  if (!markdown.includes(yaml)) {
    fail('runnable example present', `${yaml} not referenced`);
    return;
  }
  if (!/mutation RunEngineHello/.test(markdown) || !/startWorkflow\(/.test(markdown)) {
    fail('runnable example present', 'no startWorkflow invocation');
    return;
  }
  if (!markdown.includes('reactory-examples.EngineHello@1.0.0')) {
    fail('runnable example present', 'workflow id not shown');
    return;
  }
  pass('runnable example present', 'EngineHello + startWorkflow invocation');
}

function checkEvidenceIndex(markdown) {
  const start = markdown.indexOf('## 10. Evidence index');
  if (start === -1) {
    fail('evidence index populated', 'section absent');
    return;
  }
  const section = markdown.slice(start);
  const refs = section.match(/`[^`]*src\/modules\/reactory-core\/[^`]*:\d+/g) || [];
  if (refs.length >= 20) pass('evidence index populated', `${refs.length} file:line references`);
  else fail('evidence index populated', `only ${refs.length} references, need >= 20`);
}

function checkIndex(markdown) {
  if (!fs.existsSync(MODULE_INDEX)) {
    fail('module index links the page', 'index.md absent');
    return;
  }
  const index = read(MODULE_INDEX);
  const links = linksOf(index).map((l) => l.target);
  if (!links.includes('./reactory-core/README.md')) {
    fail('module index links the page', './reactory-core/README.md not linked');
  } else {
    pass('module index links the page');
  }

  if (!index.includes('`reactory-core`') || !index.includes('`core.ReactoryServer@1.0.0`')) {
    fail('module index carries the FQN', 'row or FQN missing');
  } else {
    pass('module index carries the FQN');
  }

  // The narrative page must not contradict the index it is listed in.
  if (markdown && !markdown.includes('core.ReactoryServer@1.0.0')) {
    fail('page states the FQN', 'FQN absent from the module page');
  } else if (markdown) {
    pass('page states the FQN', 'core.ReactoryServer@1.0.0');
  }
}

function checkLinks() {
  const OWNED = [path.join(ROOT, '06-modules'), path.join(ROOT, '07-reference')];
  const ownedFiles = OWNED.filter((d) => fs.existsSync(d)).flatMap(walkMarkdown);
  const allFiles = walkMarkdown(ROOT).filter((f) => !f.includes(`${path.sep}.git${path.sep}`));
  const otherFiles = allFiles.filter((f) => !ownedFiles.includes(f));

  const resolve = (file, target) => {
    const [rawPath, anchor] = target.split('#');
    const resolved = path.resolve(path.dirname(file), rawPath);
    return { resolved, anchor };
  };

  const isResolvableTarget = (target) =>
    !/^[a-z][a-z0-9+.-]*:/i.test(target)   // external scheme
    && !target.startsWith('#')              // in-page anchor
    && !target.startsWith('/')              // site-absolute
    && !target.startsWith('<');             // placeholder token

  const problems = [];
  const inspect = (file, onlyIntoOwned) => {
    for (const link of linksOf(read(file))) {
      const target = link.target;
      if (!isResolvableTarget(target)) continue;
      const { resolved, anchor } = resolve(file, target);
      if (onlyIntoOwned && !OWNED.some((d) => resolved.startsWith(d))) continue;

      if (!fs.existsSync(resolved)) {
        problems.push(`${path.relative(ROOT, file)}:${link.line} -> ${target} (missing file)`);
        continue;
      }
      if (anchor && resolved.endsWith('.md')) {
        const anchors = new Set(headingsOf(read(resolved)).map((h) => h.slug));
        if (!anchors.has(anchor)) {
          problems.push(`${path.relative(ROOT, file)}:${link.line} -> ${target} (missing anchor)`);
        }
      }
    }
  };

  ownedFiles.forEach((file) => inspect(file, false));
  otherFiles.forEach((file) => inspect(file, true));

  if (problems.length === 0) {
    pass('links resolve', `${ownedFiles.length} pages in the module tree, plus inbound links`);
  } else {
    fail('links resolve', problems.slice(0, 10).join('\n    '));
  }
}

// ── source-derived checks ───────────────────────────────────────────────────

function loadGenerator() {
  try {
    return require('./generate-core-module-reference.js');
  } catch (error) {
    fail('generator loads', error.message);
    return null;
  }
}

function checkGenerated(markdown, generator) {
  if (!fs.existsSync(GENERATED)) {
    fail('generated reference committed', path.relative(ROOT, GENERATED));
    return;
  }

  const committed = read(GENERATED);

  if (!committed.includes('GENERATED FILE — DO NOT EDIT')) {
    fail('generated reference is marked generated', 'warning banner absent');
  } else {
    pass('generated reference is marked generated');
  }

  const requiredHeadings = [
    '## 2. Module contract',
    '## 3. Data model',
    '## 4. GraphQL surface',
    '## 5. Services',
    '## 6. Forms',
    '## 7. Workflows',
    '## 8. Operations surface',
  ];
  const missing = requiredHeadings.filter((h) => !committed.includes(h));
  if (missing.length > 0) fail('generated reference covers template sections', missing.join(', '));
  else pass('generated reference covers template sections 2-8');

  const fresh = generator.render();
  if (committed !== fresh) {
    fail('generated reference is fresh', 'differs from a fresh generation — run node scripts/generate-core-module-reference.js');
  } else {
    pass('generated reference is fresh');
  }

  if (fs.existsSync(MODULE_INDEX) && read(MODULE_INDEX) !== generator.renderIndex()) {
    fail('module index is fresh', 'differs from a fresh generation');
  } else {
    pass('module index is fresh');
  }

  // Counts stated in the narrative must match the source.
  const prose = markdown.replace(/\s+/g, ' ');
  const services = generator.serviceCatalog();
  const forms = generator.formCatalog();
  const models = generator.modelCatalog();
  const workflows = generator.workflowCatalog();
  const graph = generator.graphSurface();
  const flags = generator.featureFlags();
  const migrations = generator.migrationCatalog();
  const typeorm = models.filter((m) => m.kind === 'typeorm').length;

  const expectations = [
    [`${services.length} service definitions`, 'service definition count'],
    [`${forms.length} form definitions`, 'form definition count'],
    [`${workflows.yaml.length} YAML files`, 'YAML flow file count'],
    [`${workflows.registeredYaml.length} of them are registered`, 'registered flow count'],
    [`${workflows.registeredSteps.length} step types`, 'step type count'],
    [`${graph.names.size} unique type names`, 'GraphQL type count'],
    [`${graph.rootFields.Query.length} queries`, 'query count'],
    [`${graph.rootFields.Mutation.length} mutations`, 'mutation count'],
    [`${graph.authUsages.length} \`@auth\` usages`, 'auth directive count'],
    [`${flags.length} flags`, 'feature flag count'],
    [`${models.length} collections and entities`, 'model count'],
    [`${typeorm} typeorm entities`, 'typeorm entity count'],
    [`${migrations.length} timestamped migrations`, 'migration count'],
  ];

  const wrong = expectations.filter(([needle]) => !prose.includes(needle)).map(([, label]) => label);
  if (wrong.length > 0) {
    fail('narrative counts match the source', `mismatch: ${wrong.join(', ')}`);
  } else {
    pass('narrative counts match the source', `${expectations.length} counts`);
  }

  // Registration regressions in the generator itself.
  const ids = services.map((s) => s.id);
  const duplicated = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicated.length > 0) fail('service catalogue has unique ids', duplicated.join(', '));
  else pass('service catalogue has unique ids', `${ids.length} services`);

  if (!ids.includes('core.ReactoryModuleGenerator@1.0.0')) {
    fail('service ids are read from the definition', 'core.ReactoryModuleGenerator@1.0.0 missing — nested id picked up?');
  } else {
    pass('service ids are read from the definition');
  }

  const selfDependencies = services.filter((s) => s.dependencies.some((d) => d.startsWith(s.id)));
  if (selfDependencies.length > 0) {
    fail('no service depends on itself', selfDependencies.map((s) => s.id).join(', '));
  } else {
    pass('no service depends on itself');
  }

  // The ticket's framing numbers are file counts, not capability counts.
  const userProcessors = services.filter((s) => s.id.includes('UserFileImport'));
  if (userProcessors.length !== 5) {
    fail('ETL processor set is five', `${userProcessors.length} found`);
  } else if (!userProcessors.every((s) => s.file.includes('services/ETL/Processors/'))) {
    fail('ETL processors live under services/ETL/Processors', 'unexpected path');
  } else {
    pass('ETL processor set is five, all user import');
  }
}

function checkSchemaClaims(generator) {
  const sdlPath = path.join(generator.SERVER, 'src/modules/reactory-core/graph/types/System/Workflow.graphql');
  if (!fs.existsSync(sdlPath)) {
    fail('SDL readable', path.relative(generator.SERVER, sdlPath));
    return;
  }
  const sdl = read(sdlPath);

  if (/startWorkflow\(\s*workflowId:\s*String!/m.test(sdl)) {
    pass('startWorkflow signature matches the SDL');
  } else {
    fail('startWorkflow signature matches the SDL', 'SDL does not declare workflowId: String!');
  }

  const typeBlock = /^(?:extend\s+)?type WorkflowInstance\s*\{([\s\S]*?)^\}/m.exec(sdl);
  if (!typeBlock) {
    fail('WorkflowInstance type readable', 'not found in SDL');
    return;
  }
  const fields = new Set(
    [...typeBlock[1].matchAll(/^ {2}([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(|:)/gm)].map((m) => m[1]),
  );
  const exampleFields = ['id', 'name', 'nameSpace', 'version', 'status', 'startTime', 'endTime', 'duration', 'error'];
  const absent = exampleFields.filter((f) => !fields.has(f));
  if (absent.length > 0) {
    fail('workflow example selects real fields', `absent from WorkflowInstance: ${absent.join(', ')}`);
  } else {
    pass('workflow example selects real fields');
  }

  const markdown = read(MODULE_PAGE);
  if (markdown.includes('startedAt') || markdown.includes('completedAt')) {
    fail('no invented WorkflowInstance fields', 'startedAt/completedAt do not exist on the type');
  } else {
    pass('no invented WorkflowInstance fields');
  }

  // Mutations the SystemDashboard form binds but the schema does not define.
  const mutations = new Set(generator.graphSurface().rootFields.Mutation.map((m) => m.field));
  const dead = ['pauseWorkflowSystem', 'resumeWorkflowSystem', 'reloadWorkflowConfigurations'].filter((m) => mutations.has(m));
  if (dead.length > 0) fail('dead form mutations documented as dead', `now defined: ${dead.join(', ')}`);
  else pass('dead form mutations documented as dead');
}

// ── main ────────────────────────────────────────────────────────────────────

function main() {
  const markdown = checkPageExists();
  if (markdown) {
    checkSections(markdown);
    checkNoPlaceholders(markdown);
    checkFrontmatter(markdown);
    checkMandatoryClaims(markdown);
    checkRunnableExample(markdown);
    checkEvidenceIndex(markdown);
    checkIndex(markdown);
  }
  checkLinks();

  const generator = loadGenerator();
  const sourceAvailable = Boolean(generator && generator.SERVER);

  if (sourceAvailable) {
    if (markdown) checkGenerated(markdown, generator);
    checkSchemaClaims(generator);
  } else if (REQUIRE_SOURCE) {
    fail('server source available', 'cannot locate reactory-express-server; set REACTORY_SERVER_ROOT');
  } else {
    process.stdout.write(
      '\n  NOTE  reactory-express-server not found — skipping the generated-file,\n' +
      '        count and schema checks. Pass --require-source in CI to make this\n' +
      '        an error instead.\n',
    );
  }

  const failures = results.filter((r) => !r.ok);
  for (const r of results) {
    process.stdout.write(`${r.ok ? '  ok  ' : '  FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}\n`);
  }

  process.stdout.write(`\n${results.length - failures.length}/${results.length} checks passed\n`);
  if (sourceAvailable) {
    process.stdout.write(`source: ${generator.SERVER}\n`);
  }

  if (failures.length > 0) process.exit(1);
  process.exit(0);
}

main();
