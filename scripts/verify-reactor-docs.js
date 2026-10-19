#!/usr/bin/env node
/**
 * Verifies the `reactory-reactor` module documentation.
 *
 * Companion to `scripts/verify-docs.js`, which covers `reactory-core`. That
 * script is hardcoded to core (its mandatory claims, runnable example and
 * generated reference are core-specific), so this one applies the same
 * standards to the agentic layer without loosening core's checks.
 *
 *   node scripts/verify-reactor-docs.js                  # structural checks, plus
 *                                                        # source-derived checks
 *                                                        # when the server is near
 *   node scripts/verify-reactor-docs.js --require-source # fail without a checkout
 *
 * Checks:
 *
 *   structural  — the page exists under the filename the index generator looks
 *                 for, carries the machine-readable header, has the ten template
 *                 sections in order, states the mandated limitations, and every
 *                 relative link resolves.
 *
 *   evidence    — every `src/modules/reactory-reactor/...:line` reference in the
 *                 page and in evidence.md names a real file and a line inside it,
 *                 and the zero-byte inventory in evidence.md is the actual
 *                 zero-byte inventory.
 *
 *   source      — the counts the page asserts still match the tree, and the
 *                 workflow table agrees with `REACTOR_YAML_WORKFLOWS` in *both*
 *                 directions. That bidirectional check is the point: the defect
 *                 this documentation exists to prevent is a workflow presented as
 *                 available that cannot run, or a capability that works but is
 *                 still described as missing.
 *
 * Exit 0 on success, 1 on failure, 2 on a missing checkout when --require-source.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODULE_DOCS = path.join(ROOT, '06-modules');
/** The index generator discovers pages by this exact filename. */
const MODULE_DIR = path.join(MODULE_DOCS, 'reactory-reactor');
const MODULE_PAGE = path.join(MODULE_DIR, 'README.md');
const EVIDENCE_PAGE = path.join(MODULE_DIR, 'evidence.md');
const MODULE_INDEX = path.join(MODULE_DOCS, 'index.md');
const AGENTS_DIR = path.join(ROOT, '04-agents');

const AGENT_PAGES = [
  'overview.md',
  'providers.md',
  'personas.md',
  'macros-and-tools.md',
  'skills.md',
  'mcp-client-and-server.md',
  'agents-in-workflows.md',
];

/** Canonical template headings — match `scripts/verify-docs.js` exactly. */
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

const REQUIRE_SOURCE = process.argv.includes('--require-source');

const results = [];
const record = (ok, name, detail) => results.push({ ok, name, detail });
const pass = (name, detail) => record(true, name, detail);
const fail = (name, detail) => record(false, name, detail);

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

// ── markdown helpers (same shapes as scripts/verify-docs.js) ────────────────

/** Headings outside fenced code blocks. */
function headingsOf(markdown) {
  const out = [];
  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2].trim() });
  }
  return out;
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
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

// ── source checkout discovery ───────────────────────────────────────────────

/**
 * `reactory-reactor` is its own git repository, gitignored by the server, so a
 * server checkout can legitimately lack it. Require the module marker.
 */
function findServerRoot() {
  const candidates = [
    process.env.REACTORY_SERVER_ROOT,
    path.join(ROOT, '..', 'reactory-express-server'),
    path.join(ROOT, '.checkouts', 'reactory-express-server'),
    path.join(ROOT, '..', 'reactory-worktrees', 'REACTORY-302016408-reactory-express-server'),
  ].filter(Boolean);

  return (
    candidates.find((candidate) =>
      exists(path.join(candidate, 'src', 'modules', 'reactory-reactor', 'index.ts')),
    ) ?? null
  );
}

const SERVER = findServerRoot();
const MODULE_ROOT = SERVER ? path.join(SERVER, 'src', 'modules', 'reactory-reactor') : null;
const moduleFile = (relative) => path.join(MODULE_ROOT, relative);

// ── structural checks ───────────────────────────────────────────────────────

function checkPageExists() {
  if (!exists(MODULE_PAGE)) {
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
  // The six limitations the ticket required the page to state. Each is phrased as
  // it appears; a rewording is a deliberate act, not an accident to be absorbed.
  const claims = [
    ['providers registered vs adapters', 'Providers registered vs adapters'],
    ['skills', '8 of 10 authored skills unregistered'],
    ['agentic workflows', '2 are not loaded'],
    ['form macro', 'server-side form-generation macro is unreachable'],
    ['MCP OAuth', 'not E2E-validated'],
    ['zero-byte files', 'declared files are 0 bytes'],
  ];
  const missing = claims.filter(([, needle]) => !markdown.includes(needle)).map(([label]) => label);
  if (missing.length > 0) fail('six mandated limitations stated', `missing: ${missing.join(', ')}`);
  else pass('six mandated limitations stated', `${claims.length} limitations`);
}

function checkReactorBlockIsHonest(markdown) {
  // The block declares five empty arrays; a page that presents it as a contract
  // is the specific failure this check exists for.
  if (/Five of the six arrays are empty/.test(markdown) && /declared-but-unmigrated/.test(markdown)) {
    pass('reactor block described as declared-but-unmigrated');
  } else {
    fail('reactor block described as declared-but-unmigrated', 'statement not found');
  }
}

const BANNED = [
  [/\b\d+\+\s+modules\b/i, 'N+ modules'],
  [/\b\d+\+\s+strategies\b/i, 'N+ strategies'],
  [/\b\d+x\s+faster\b/i, 'Nx faster'],
  [/\b99\.9%/, '99.9%'],
  [/\bunlimited scalability\b/i, 'unlimited scalability'],
  [/\binfinite scalability\b/i, 'infinite scalability'],
];

function checkBannedClaims(markdown) {
  const offenders = BANNED.filter(([re]) => re.test(markdown)).map(([, label]) => label);
  if (offenders.length > 0) fail('no unmeasured quantifiers', offenders.join(', '));
  else pass('no unmeasured quantifiers');
}

function checkLinks() {
  const pages = [MODULE_PAGE, EVIDENCE_PAGE, MODULE_INDEX, ...AGENT_PAGES.map((p) => path.join(AGENTS_DIR, p))];
  const problems = [];

  for (const page of pages) {
    if (!exists(page)) continue;
    for (const link of linksOf(read(page))) {
      // External schemes, in-page anchors and site-absolute paths are out of scope.
      if (/^[a-z][a-z0-9+.-]*:/i.test(link.target) || link.target.startsWith('#') || link.target.startsWith('/')) {
        continue;
      }
      const [rawPath] = link.target.split('#');
      const resolved = path.resolve(path.dirname(page), rawPath);
      if (!exists(resolved)) {
        problems.push(`${path.relative(ROOT, page)}:${link.line} -> ${link.target} (missing file)`);
      }
    }
  }

  if (problems.length === 0) pass('links resolve', `${pages.filter(exists).length} pages`);
  else fail('links resolve', problems.slice(0, 10).join('\n    '));
}

function checkIndex() {
  if (!exists(MODULE_INDEX)) {
    fail('module index lists the page', 'index.md absent');
    return;
  }
  const index = read(MODULE_INDEX);
  if (!index.includes('| `reactory-reactor` | `reactory.Reactor@1.0.0` |')) {
    fail('module index lists the page', 'reactor row absent');
  } else if (!index.includes('[documented](./reactory-reactor/README.md)')) {
    fail('module index lists the page', 'reactor row does not link the page');
  } else {
    pass('module index lists the page', 'generated row links ./reactory-reactor/README.md');
  }
}

// ── evidence checks ─────────────────────────────────────────────────────────

const CITATION = /`(src\/modules\/reactory-reactor\/[^`\s]+?):(\d+)(?:-(\d+))?`/g;

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
  const section = markdown.slice(start);
  const refs = citationsIn(section);
  if (refs.length >= 20) pass('evidence index populated', `${refs.length} file:line references in §10`);
  else fail('evidence index populated', `only ${refs.length} references in §10, need >= 20`);
}

function checkCitationsResolve() {
  // A missing page is reported as a failed check, not an ENOENT stack trace — the
  // point of this script is a readable verdict.
  const present = [MODULE_PAGE, EVIDENCE_PAGE].filter(exists);
  if (present.length === 0) {
    fail('citations resolve', 'neither the module page nor its evidence index exists');
    return;
  }

  const sources = present.map((page) => [page, read(page)]);
  const problems = [];
  let total = 0;

  for (const [page, markdown] of sources) {
    for (const citation of citationsIn(markdown)) {
      total += 1;
      if (!MODULE_ROOT) continue; // reported once at the end
      const resolved = path.join(SERVER, citation.relative);
      if (!exists(resolved)) {
        problems.push(`${citation.relative} (${path.relative(ROOT, page)}): file not found`);
        continue;
      }
      const lines = read(resolved).split('\n').length;
      if (citation.from < 1 || citation.to > lines || citation.from > citation.to) {
        problems.push(`${citation.raw}: line ${citation.to} outside 1..${lines}`);
      }
    }
  }

  if (!MODULE_ROOT) {
    process.stdout.write(
      `\n  NOTE  no reactory-reactor checkout found — ${total} citations not verified.\n` +
        '        Set REACTORY_SERVER_ROOT to verify them.\n',
    );
    if (REQUIRE_SOURCE) fail('citations resolve', 'no checkout; set REACTORY_SERVER_ROOT');
    return;
  }

  if (problems.length === 0) pass('citations resolve', `${total} references`);
  else fail('citations resolve', problems.slice(0, 10).join('\n    '));
}

// ── source-derived checks ───────────────────────────────────────────────────

function checkProviderRegistry(markdown) {
  const yaml = read(moduleFile('ai/providers/providers.yaml'));
  const providers = [...yaml.matchAll(/^\s{2}- id: (.+)$/gm)].map((m) => m[1].trim());

  if (providers.length !== 9) {
    fail('provider count matches the registry', `${providers.length} providers, page says 9`);
  } else if (!markdown.includes('**9** provider entries in the module registry')) {
    fail('provider count matches the registry', 'page does not state 9 entries');
  } else {
    pass('provider count matches the registry', `${providers.length} providers`);
  }

  const expected = ['openai', 'xai', 'google', 'copilot', 'azure-openai', 'anthropic', 'amazon', 'cohere', 'ollama'];
  const absent = expected.filter((id) => !providers.includes(id));
  if (absent.length > 0) fail('provider ids unchanged', absent.join(', '));
  else pass('provider ids unchanged', `${expected.length} ids`);
}

function checkSkills(markdown) {
  const registered = [...read(moduleFile('ai/skills/index.ts')).matchAll(/id: 'reactory\.[^']+'/g)];
  const files = walk(moduleFile('ai/skills')).filter((f) => f.endsWith('.md'));
  const nonEmpty = files.filter((f) => fs.statSync(f).size > 0);
  const empty = files.filter((f) => fs.statSync(f).size === 0);

  const problems = [];
  if (registered.length !== 9) problems.push(`${registered.length} registered skills (page says 9)`);
  if (nonEmpty.length !== 9) problems.push(`${nonEmpty.length} non-empty skill files (page says 9)`);
  if (empty.length !== 9) problems.push(`${empty.length} empty skill files (page says 9)`);
  if (!markdown.includes('**9** have content and **all 9 are registered**')) {
    problems.push('page does not state 9 registered / 9 non-empty');
  }

  if (problems.length > 0) fail('skill registry and empty-file counts', problems.join('; '));
  else pass('skill registry and empty-file counts', `${registered.length} registered, ${empty.length} empty`);
}

function checkZeroByteInventory() {
  const actual = walk(MODULE_ROOT)
    .filter((file) => fs.statSync(file).size === 0)
    .map((file) => `src/modules/reactory-reactor/${path.relative(MODULE_ROOT, file).split(path.sep).join('/')}`)
    .sort();

  const documented = [...read(EVIDENCE_PAGE).matchAll(/^src\/modules\/reactory-reactor\/[A-Za-z0-9_./-]+$/gm)]
    .map((m) => m[0])
    .sort();

  if (actual.length !== 40) {
    fail('zero-byte inventory matches the tree', `${actual.length} empty files, evidence.md says 40`);
    return;
  }
  const diff = actual.filter((f) => !documented.includes(f));
  const extra = documented.filter((f) => !actual.includes(f));
  if (diff.length > 0 || extra.length > 0) {
    fail(
      'zero-byte inventory matches the tree',
      `undocumented: ${diff.slice(0, 5).join(', ') || 'none'}; stale: ${extra.slice(0, 5).join(', ') || 'none'}`,
    );
    return;
  }
  pass('zero-byte inventory matches the tree', `${actual.length} files, item for item`);
}

function checkWorkflowParity(markdown) {
  const source = read(moduleFile('workflow/index.ts'));
  const block = /const REACTOR_YAML_WORKFLOWS[\s\S]*?\n\];/.exec(source);
  if (!block) {
    fail('workflow load array readable', 'REACTOR_YAML_WORKFLOWS not found');
    return;
  }

  // `filename: '...'` also contains the substring `name: '...'`.
  const loaded = new Set([...block[0].matchAll(/(?<![A-Za-z])name: '([^']+)'/g)].map((m) => m[1]));

  const onDisk = fs
    .readdirSync(moduleFile('workflow'))
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, ''));

  const rows = [...markdown.matchAll(/^\|\s*`([A-Za-z0-9_.-]+)`\s*\|[^|]*\|[^|]*\|\s*(\*\*No\*\*|No|Yes)\s*\|$/gm)]
    .map((m) => ({ name: m[1], loaded: !/No/.test(m[2]) }));

  const problems = [];
  if (onDisk.length !== 13) problems.push(`${onDisk.length} YAML files on disk (page says 13)`);
  if (loaded.size !== 11) problems.push(`${loaded.size} in the load array (page says 11)`);

  const mismatches = rows
    .filter((row) => row.loaded !== loaded.has(row.name))
    .map((row) => `${row.name} documented ${row.loaded ? 'loaded' : 'not loaded'}`);
  problems.push(...mismatches);

  const undocumented = onDisk.filter((name) => !rows.some((r) => r.name === name));
  if (undocumented.length > 0) problems.push(`on disk but not documented: ${undocumented.join(', ')}`);

  if (problems.length > 0) fail('workflow table matches the load array', problems.join('; '));
  else pass('workflow table matches the load array', `${rows.length} rows, ${onDisk.length} files, ${loaded.size} loaded`);
}

function checkFormMacroUnreachable(markdown) {
  const macroPath = moduleFile('ai/macro/develop/form/macro.ts');
  if (!exists(macroPath)) {
    fail('form macro unreachable', 'macro.ts absent — the limitation may no longer hold');
    return;
  }
  const defined = read(macroPath).includes('FormMacroComponentRegister');
  const exportedByFamily = read(moduleFile('ai/macro/develop/index.ts')).includes('FormMacroComponentRegister');
  const spreadByRegistry = /\.\.\.DevelopmentMacros/.test(read(moduleFile('ai/macro/index.ts')));

  if (!defined) fail('form macro unreachable', 'register no longer defined');
  else if (!exportedByFamily && spreadByRegistry) {
    pass('form macro unreachable', 'defined but not exported by the family, so not in MacroRegistry');
  } else {
    fail('form macro unreachable', 'now reachable — update §9 rather than leaving a stale limitation');
  }
}

function checkServiceRegistration(markdown) {
  // The load array lists *class names* (`OpenAIService,`), not FQNs — the FQN is
  // declared on the `@service` decorator in each provider's own file. Both halves
  // are checked, because either one alone can be true while the service is dead.
  const loadArray = read(moduleFile('services/index.ts'));
  const providers = [
    { className: 'OpenAIService', fqn: 'reactor.OpenAIService@1.0.0', file: 'services/reactor/providers/OpenAIService.ts' },
    { className: 'GoogleAIService', fqn: 'reactor.GoogleAIService@1.0.0', file: 'services/reactor/providers/GoogleAIService.ts' },
    { className: 'AnthropicService', fqn: 'reactor.AnthropicService@1.0.0', file: 'services/reactor/providers/AnthropicService.ts' },
    { className: 'OllamaAIService', fqn: 'reactor.OllamaAIService@1.0.0', file: 'services/reactor/providers/OllamaAIService.ts' },
  ];

  const problems = [];
  for (const { className, fqn, file } of providers) {
    if (!new RegExp(`^\\s+${className},`, 'm').test(loadArray)) {
      problems.push(`${className} absent from the load array`);
    }
    if (!read(moduleFile(file)).includes(fqn)) problems.push(`${fqn} not declared in ${file}`);
  }

  // Bedrock is authored but deliberately unregistered; the page says so.
  if (!exists(moduleFile('services/reactor/providers/AWSBedrockService.ts'))) {
    problems.push('AWSBedrockService.ts absent — the limitation may no longer hold');
  } else if (/^\s+AWSBedrockService,/m.test(loadArray)) {
    problems.push('AWSBedrockService is now registered — update §9');
  }
  if (!markdown.includes('Bedrock, is authored but unloaded')) {
    problems.push('page does not state Bedrock is unloaded');
  }

  if (problems.length > 0) fail('service load array matches the page', problems.join('; '));
  else pass('service load array matches the page', `${providers.length} provider services, Bedrock unloaded`);
}

function checkAgentPages() {
  const missing = AGENT_PAGES.filter((page) => !exists(path.join(AGENTS_DIR, page)));
  if (missing.length > 0) {
    fail('agent pages present', `missing: ${missing.join(', ')}`);
    return;
  }

  const badFrontmatter = AGENT_PAGES.filter((page) => {
    const markdown = read(path.join(AGENTS_DIR, page));
    return !/^---\n[\s\S]*?\n---/.test(markdown) || !/^status:\s*\S/m.test(markdown);
  });
  if (badFrontmatter.length > 0) {
    fail('agent pages carry the header', badFrontmatter.join(', '));
    return;
  }
  pass('agent pages present', `${AGENT_PAGES.length} pages with headers`);
}

// ── main ────────────────────────────────────────────────────────────────────

function main() {
  const markdown = checkPageExists();
  if (markdown) {
    checkSections(markdown);
    checkNoPlaceholders(markdown);
    checkFrontmatter(markdown);
    checkMandatoryClaims(markdown);
    checkReactorBlockIsHonest(markdown);
    checkBannedClaims(markdown);
    checkEvidenceIndex(markdown);
    checkIndex();
    checkAgentPages();
  }

  checkLinks();
  checkCitationsResolve();

  if (EVIDENCE_PAGE && exists(EVIDENCE_PAGE)) {
    if (MODULE_ROOT) {
      checkProviderRegistry(markdown ?? '');
      checkSkills(markdown ?? '');
      checkZeroByteInventory();
      checkWorkflowParity(markdown ?? '');
      checkFormMacroUnreachable(markdown ?? '');
      checkServiceRegistration(markdown ?? '');
    }
  } else {
    fail('evidence page exists', path.relative(ROOT, EVIDENCE_PAGE));
  }

  const failures = results.filter((r) => !r.ok);
  for (const r of results) {
    process.stdout.write(`${r.ok ? '  ok  ' : '  FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}\n`);
  }

  process.stdout.write(`\n${results.length - failures.length}/${results.length} checks passed\n`);
  if (SERVER) process.stdout.write(`source: ${SERVER}\n`);

  if (failures.length > 0) process.exit(1);
  if (REQUIRE_SOURCE && !MODULE_ROOT) process.exit(2);
  process.exit(0);
}

main();
