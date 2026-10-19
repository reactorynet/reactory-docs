#!/usr/bin/env node
/**
 * Verifies the `reactory-azure` module documentation.
 *
 * Companion to `scripts/verify-docs.js` (core) and `scripts/verify-reactor-docs.js`
 * (reactor). Those scripts are hardcoded to their modules; this one applies the
 * same standards to the reference example.
 *
 *   node scripts/verify-azure-docs.js                  # structural checks, plus
 *                                                       # source checks when the
 *                                                       # server checkout is near
 *   node scripts/verify-azure-docs.js --require-source # fail without a checkout
 *
 * Checks:
 *
 *   structural  — the page exists under the filename the index generator looks
 *                 for, carries the machine-readable header, has the eleven
 *                 sections in order, states the mandated status/licence and
 *                 limitation claims, and every relative link resolves.
 *
 *   evidence    — every `path:line` reference in §11 names a real file and a
 *                 line inside it.
 *
 *   source      — the counts and contract values the page asserts still match
 *                 the tree: six TypeScript files, two service files, one storage
 *                 file, one workflow file, zero GraphQL files, zero registered
 *                 services, zero workflows, MIT in the package manifest, and
 *                 `commercial` in the registry (the contradiction the page
 *                 records).
 *
 * Exit 0 on success, 1 on failure, 2 on a missing checkout when --require-source.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODULE_DIR = path.join(ROOT, '06-modules', 'reactory-azure');
const PAGE = path.join(MODULE_DIR, 'README.md');
const MODULE_INDEX = path.join(ROOT, '06-modules', 'index.md');
const TEMPLATE = path.join(ROOT, '08-contributing', 'module-doc-template.md');
const ARCHITECTURE = path.join(ROOT, 'PLATFORM.md');

const REQUIRE_SOURCE = process.argv.includes('--require-source');

const results = [];
const record = (ok, name, detail) => results.push({ ok, name, detail });
const pass = (name, detail) => record(true, name, detail);
const fail = (name, detail) => record(false, name, detail);

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

/** The eleven headings this page uses. §9 is the worked example; §10/§11 are the template's last two. */
const SECTIONS = [
  '1. Purpose & status',
  '2. Module contract',
  '3. Data model',
  '4. GraphQL API',
  '5. Services',
  '6. UI surface',
  '7. Workflows',
  '8. Operations',
  '9. Worked example',
  '10. Limitations & roadmap',
  '11. Evidence index',
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
    if (entry.name === '.git') return [];
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
    fs.existsSync(path.join(candidate, 'src', 'modules', 'reactory-azure', 'index.ts')),
  );
}

const SERVER = resolveServerRoot();
const AZURE = SERVER ? path.join(SERVER, 'src', 'modules', 'reactory-azure') : null;

// ── structural checks ───────────────────────────────────────────────────────

function checkPageExists() {
  if (!exists(PAGE)) {
    fail('module page exists', relative(PAGE));
    return null;
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
    fail('eleven template sections present', `missing: ${missing.join(', ')}`);
    return;
  }

  const ordered = positions.every((p, i) => i === 0 || p.index > positions[i - 1].index);
  if (!ordered) {
    fail('sections in template order', positions.map((p) => `${p.section}@${p.index}`).join(', '));
    return;
  }
  pass('eleven template sections present and ordered', `${SECTIONS.length} sections`);
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
    ['states it is not a supported commercial integration', /not a supported commercial integration/i],
    ['states the reference/example status', /reference example|worked example/i],
    ['states the FQN', /core\.ReactoryAzure@1\.0\.0/],
    ['records MIT as the module licence', /authoritative licence is MIT/i],
    ['records the registry commercial value as the defect', /`commercial`|commercial.*defect|registry.*commercial/i],
    ['records zero registered services', /zero registered services|0 services/i],
    ['records zero workflow definitions', /zero workflow definitions|0 workflow definitions/i],
    ['records the empty GraphQL contribution', /graphDefinitions[\s\S]{0,80}Types: \[\]/],
    ['records that `Client` and `ResponseType` are unimported', /`Client`[\s\S]*`ResponseType`[\s\S]{0,200}(never imported|not imported|unimported)|(never imported|not imported|unimported)[\s\S]{0,200}`Client`[\s\S]*`ResponseType`/i],
    ['records the missing Graph client dependency', /@microsoft\/microsoft-graph-client/],
    ['records the `sendEmail` scope defect', /sendEmail[\s\S]{0,400}ReferenceError|ReferenceError[\s\S]{0,400}sendEmail/i],
    ['records the core direct import', /reactory-azure\/services\/graph/],
    ['records the storage scaffold as empty', /empty class|scaffold/i],
  ];

  const missing = claims.filter(([, re]) => !re.test(markdown)).map(([label]) => label);
  if (missing.length > 0) fail('mandatory claims stated', missing.join('; '));
  else pass('mandatory claims stated', `${claims.length} claims`);
}

function checkCrossLinks(markdown) {
  const architecture = read(ARCHITECTURE);
  if (!architecture.includes('06-modules/reactory-azure/README.md')) {
    fail('module-system page links the example', 'PLATFORM.md does not link the module page');
  } else {
    pass('module-system page links the example', 'PLATFORM.md §5');
  }

  if (!exists(TEMPLATE)) {
    fail('contributing template exists', relative(TEMPLATE));
  } else {
    const template = read(TEMPLATE);
    if (!template.includes('../06-modules/reactory-azure/README.md')) {
      fail('template links the sample implementation', 'module-doc-template.md does not link the page');
    } else {
      pass('template links the sample implementation', 'module-doc-template.md');
    }
    if (!template.includes('#9-worked-example--how-this-module-is-built')) {
      fail('template links the worked-example anchor', 'anchor absent');
    } else {
      pass('template links the worked-example anchor');
    }
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
  if (!index.includes('| `reactory-azure` | `core.ReactoryAzure@1.0.0` |')) {
    fail('module index lists the page', 'azure row absent');
  } else if (!index.includes('[documented](./reactory-azure/README.md)')) {
    fail('module index lists the page', 'azure row does not link the page');
  } else {
    pass('module index lists the page', 'generated row links ./reactory-azure/README.md');
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
  const start = markdown.indexOf('## 11. Evidence index');
  if (start === -1) {
    fail('evidence index populated', 'section absent');
    return;
  }
  const refs = citationsIn(markdown.slice(start));
  if (refs.length >= 80) pass('evidence index populated', `${refs.length} file:line references in §11`);
  else fail('evidence index populated', `only ${refs.length} references in §11, need >= 80`);
}

function checkCitationsResolve(markdown) {
  if (!SERVER) {
    if (REQUIRE_SOURCE) fail('citations resolve', 'no checkout; set REACTORY_SERVER_ROOT');
    return;
  }

  const start = markdown.indexOf('## 11. Evidence index');
  const refs = citationsIn(start === -1 ? markdown : markdown.slice(start));
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
  else fail('citations resolve', problems.slice(0, 10).join('\n    '));
}

// ── source-derived checks ───────────────────────────────────────────────────

function checkSourceShape(markdown) {
  if (!AZURE) {
    if (REQUIRE_SOURCE) fail('azure module present', 'no checkout; set REACTORY_SERVER_ROOT');
    else process.stdout.write('\n  NOTE  reactory-azure checkout not found — source checks skipped.\n');
    return;
  }

  const tsFiles = walk(AZURE).filter((f) => f.endsWith('.ts'));
  const serviceFiles = tsFiles.filter((f) => relative(f).includes('/reactory-azure/services/'));
  const storageFiles = tsFiles.filter((f) => relative(f).includes('/reactory-azure/storage/'));
  const workflowFiles = tsFiles.filter((f) => relative(f).includes('/reactory-azure/workflows/'));
  const graphqlFiles = walk(AZURE).filter((f) => f.endsWith('.graphql'));
  const yamlFiles = walk(AZURE).filter((f) => f.endsWith('.yaml'));
  const testFiles = walk(AZURE).filter((f) => /\.(test|spec)\.ts$/.test(f) || f.includes('__tests__'));

  const shape = [
    [tsFiles.length, 6, 'TypeScript files'],
    [serviceFiles.length, 2, 'service files'],
    [storageFiles.length, 1, 'storage files'],
    [workflowFiles.length, 1, 'workflow files'],
    [graphqlFiles.length, 0, 'GraphQL files'],
    [yamlFiles.length, 0, 'YAML files'],
    [testFiles.length, 0, 'test files'],
  ];
  const wrong = shape.filter(([actual, expected]) => actual !== expected)
    .map(([actual, expected, label]) => `${label}: ${actual} (page says ${expected})`);
  if (wrong.length > 0) fail('source file counts match the page', wrong.join('; '));
  else pass('source file counts match the page', '6 TS, 2 services, 1 storage, 1 workflow, 0 GraphQL, 0 YAML, 0 tests');

  const newlines = tsFiles.reduce((sum, file) => sum + newlineCount(file), 0);
  if (newlines !== 384) fail('TypeScript line count matches', `${newlines} newlines, page says 384`);
  else pass('TypeScript line count matches', '384 newlines');

  const markdownLines = newlineCount(path.join(AZURE, 'README.md')) + newlineCount(path.join(AZURE, 'AGENT.md'));
  if (markdownLines !== 61) fail('markdown line count matches', `${markdownLines} newlines, page says 61`);
  else pass('markdown line count matches', '61 newlines (3 README + 58 AGENT)');

  if (/export default \[\];/.test(read(path.join(AZURE, 'services', 'index.ts')))) {
    pass('service array is empty', 'services/index.ts');
  } else {
    fail('service array is empty', 'services/index.ts no longer exports []');
  }

  if (/export default \[\];/.test(read(path.join(AZURE, 'workflows', 'index.ts')))) {
    pass('workflow array is empty', 'workflows/index.ts');
  } else {
    fail('workflow array is empty', 'workflows/index.ts no longer exports []');
  }

  const index = read(path.join(AZURE, 'index.ts'));
  const contract = [
    ["id: 'reactory-azure'", 'id'],
    ["nameSpace: 'core'", 'namespace'],
    ["version: '1.0.0'", 'version'],
    ["name: 'ReactoryAzure'", 'name'],
    ["dependencies: ['core.ReactoryServer@1.0.0']", 'dependency'],
    ['priority: 0', 'priority'],
    ['Resolvers: {}', 'empty resolvers'],
    ['Types: []', 'empty types'],
    ['models: []', 'empty models'],
    ['forms: []', 'empty forms'],
    ['translations: []', 'empty translations'],
    ['clientPlugins: []', 'empty client plugins'],
    ['cli: []', 'empty cli'],
    ['grpc: null', 'null grpc'],
    ['passportProviders: []', 'empty passport providers'],
    ['pdfs: []', 'empty pdfs'],
  ];
  const absent = contract.filter(([needle]) => !index.includes(needle)).map(([, label]) => label);
  if (absent.length > 0) fail('module object still matches the page', absent.join(', '));
  else pass('module object still matches the page', `${contract.length} fields`);
}

function checkPackageAndRegistry(markdown) {
  if (!AZURE) return;

  const pkg = JSON.parse(read(path.join(AZURE, 'package.json')));
  const packageProblems = [];
  if (pkg.name !== '@reactory/azure') packageProblems.push(`name ${pkg.name}`);
  if (pkg.version !== '1.1.0') packageProblems.push(`version ${pkg.version}`);
  if (!pkg.licenses || pkg.licenses[0].license !== 'MIT') packageProblems.push('licence is not MIT');
  const deps = Object.keys(pkg.dependencies || {});
  if (deps.some((d) => d.includes('microsoft-graph'))) packageProblems.push('Graph client dependency is now declared');

  if (packageProblems.length > 0) fail('package manifest matches the page', packageProblems.join('; '));
  else pass('package manifest matches the page', 'MIT, 1.1.0, no Graph client dependency');

  if (!markdown.includes('`commercial`')) {
    fail('page records the registry licence', 'commercial not mentioned');
  } else {
    pass('page records the registry licence', 'commercial recorded as the defect');
  }
}

function checkRegistry(markdown) {
  if (!SERVER) return;

  const registry = JSON.parse(read(path.join(SERVER, 'src', 'modules', 'available.json')));
  const entry = registry.find((m) => m.id === 'reactory-azure');
  if (!entry) {
    fail('registry entry present', 'reactory-azure absent from available.json');
    return;
  }

  const problems = [];
  if (entry.fqn !== 'core.ReactoryAzure@1.0.0') problems.push(`fqn ${entry.fqn}`);
  if (entry.moduleEntry !== 'reactory-azure/index.ts') problems.push(`entry ${entry.moduleEntry}`);
  if (entry.license !== 'commercial') problems.push(`licence ${entry.license} (contradiction resolved in source?)`);

  if (problems.length > 0) fail('registry still records the documented values', problems.join('; '));
  else pass('registry still records the documented values', 'commercial / core.ReactoryAzure@1.0.0');
}

function checkGraphSource(markdown) {
  if (!AZURE) return;

  const graph = read(path.join(AZURE, 'services', 'graph.ts'));
  const problems = [];

  if (!/Client\.init\(/.test(graph)) problems.push('Client.init absent');
  if (!/ResponseType\.RAW/.test(graph)) problems.push('ResponseType.RAW absent');
  if (!/Microsoft\.(BodyType|Recipient|Message)/.test(graph)) problems.push('Microsoft.* types absent');
  if (/from\s+['"]@microsoft\/microsoft-graph-client/.test(graph)) problems.push('Graph client is now imported');
  if (/from\s+['"]@microsoft\/microsoft-graph-types/.test(graph)) problems.push('Graph types are now imported');

  const sendStart = graph.indexOf('async sendEmail');
  const sendEnd = graph.indexOf('\n};', sendStart);
  const send = graph.slice(sendStart, sendEnd === -1 ? undefined : sendEnd);
  if (!/const response\s*=/.test(send)) problems.push('sendEmail response declaration absent');
  if (!/return response;/.test(send)) problems.push('sendEmail return absent');
  const catchIndex = send.indexOf('} catch');
  const returnIndex = send.lastIndexOf('return response;');
  if (catchIndex === -1) problems.push('sendEmail catch block absent');
  else if (!(catchIndex < returnIndex)) problems.push('sendEmail return is no longer outside the try block');

  if (problems.length > 0) fail('Graph wrapper still has the documented defects', problems.join('; '));
  else pass('Graph wrapper still has the documented defects', 'unimported Client/ResponseType, block-scoped sendEmail return');

  const storage = read(path.join(AZURE, 'storage', 'index.ts'));
  const uncommented = storage
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
  const storageProblems = [];
  if (!storage.includes('process.env.AZURE_STORAGE_KEY')) storageProblems.push('env key absent');
  if (!storage.includes('AnonymousCredential')) storageProblems.push('unused import absent');
  if (/\basync\b/.test(uncommented)) storageProblems.push('storage methods are no longer commented out');
  if (storageProblems.length > 0) fail('storage scaffold still matches the page', storageProblems.join('; '));
  else pass('storage scaffold still matches the page', 'empty class, env key, no live methods');

  const profile = read(path.join(SERVER, 'src', 'modules', 'reactory-core', 'resolvers', 'User', 'ProfileResolver.ts'));
  const emails = read(path.join(SERVER, 'src', 'modules', 'reactory-core', 'resolvers', 'Emails', 'UserEmails.ts'));
  if (!profile.includes('reactory-azure/services/graph') || !emails.includes('reactory-azure/services/graph')) {
    fail('core still imports the module directly', 'direct import absent; update §1 and §10');
  } else {
    pass('core still imports the module directly', 'ProfileResolver + UserEmails');
  }

  const barrel = read(path.join(SERVER, 'src', 'modules', '__index.ts'));
  if (!barrel.includes('reactory-azure/index') || !barrel.includes('core_ReactoryAzure_VER_1_0_0')) {
    fail('generated barrel still imports the module', 'azure import absent');
  } else {
    pass('generated barrel still imports the module');
  }

  if (!markdown.includes('`Client`') || !markdown.includes('`ResponseType`')) {
    fail('page names the unimported identifiers', 'Client/ResponseType missing');
  } else {
    pass('page names the unimported identifiers');
  }
}

// ── main ────────────────────────────────────────────────────────────────────

function main() {
  const markdown = checkPageExists();
  if (markdown) {
    checkSections(markdown);
    checkNoPlaceholders(markdown);
    checkFrontmatter(markdown);
    checkMandatoryClaims(markdown);
    checkCrossLinks(markdown);
    checkIndex();
    checkEvidenceIndex(markdown);
    checkCitationsResolve(markdown);
  }
  checkLinks();

  if (SERVER) {
    if (markdown) {
      checkSourceShape(markdown);
      checkPackageAndRegistry(markdown);
      checkRegistry(markdown);
      checkGraphSource(markdown);
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
