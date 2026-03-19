# Glob Pattern Cheat Sheet

## What are Glob Patterns?

Glob patterns are wildcard-based path-matching expressions used across shells, build tools, linters, editors, and programming languages. They match file and directory paths without requiring regular expressions. The exact feature set varies by implementation (shell, Node.js `glob`, Python `pathlib`, `.gitignore`, etc.).

---

## Quick Reference

| Pattern | Matches |
|---|---|
| `*` | Any characters in a single path segment (no `/`) |
| `**` | Zero or more path segments (recursive) |
| `?` | Exactly one character (no `/`) |
| `[abc]` | Any one character from the set: a, b, or c |
| `[a-z]` | Any one character in the range a–z |
| `[!abc]` or `[^abc]` | Any one character NOT in the set |
| `{a,b,c}` | Brace expansion: matches a, b, or c |
| `!(pattern)` | Negation (extglob — not all tools) |
| `\` | Escape the next character |

---

## Basic Wildcards

### `*` — Single Segment Wildcard
Matches any sequence of characters **within a single directory level** (does not cross `/`).

```
*.js            → app.js, index.js, utils.js
src/*.ts        → src/app.ts, src/index.ts  (NOT src/utils/helpers.ts)
*.{js,ts}       → app.js, app.ts, index.js
README*         → README.md, README.txt, README
```

### `**` — Recursive (Globstar)
Matches **zero or more directory levels**, including nested paths.

```
**/*.js         → app.js, src/app.js, src/utils/helpers.js, a/b/c/d.js
src/**/*.ts     → src/app.ts, src/utils/helpers.ts, src/a/b/c/d.ts
**              → everything recursively (all files and directories)
src/**/test*    → src/test.ts, src/utils/testHelpers.ts, src/a/b/test.ts
```

> Note: `**` support requires globstar mode in bash (`shopt -s globstar`) and varies by tool.

### `?` — Single Character
Matches exactly one character (not `/`).

```
file?.txt       → file1.txt, fileA.txt, fileZ.txt  (NOT file10.txt)
src/?.ts        → src/a.ts, src/b.ts  (NOT src/ab.ts)
```

---

## Character Classes

### `[...]` — Character Set
Matches exactly one character from the specified set.

```
file[123].txt   → file1.txt, file2.txt, file3.txt
[Rr]eadme.md   → Readme.md, readme.md
src/[abc]*.ts  → src/app.ts, src/auth.ts, src/base.ts, src/cache.ts
```

### Character Ranges
```
[a-z]           → any lowercase letter
[A-Z]           → any uppercase letter
[0-9]           → any digit
[a-zA-Z0-9]     → any alphanumeric character
[a-z0-9_-]      → lowercase, digit, underscore, or hyphen
```

### Negated Character Class
```
[!aeiou]*       → files not starting with a vowel
[^0-9]*.ts      → .ts files not starting with a digit
```

---

## Brace Expansion `{...}`

Brace expansion generates multiple alternatives (supported in bash, zsh, Node glob, and most tools).

```
*.{js,ts}           → *.js, *.ts
src/**/*.{js,jsx}   → all .js and .jsx files under src/
{src,lib}/**/*.ts   → all .ts files under src/ and lib/
{2023,2024}-*.log   → 2023-access.log, 2024-error.log
file.{bak,old,tmp}  → file.bak, file.old, file.tmp
```

---

## Negation Patterns

How you negate depends on the tool:

### .gitignore / .npmignore Style (Leading `!`)
```gitignore
*.log           # Ignore all .log files
!important.log  # But do NOT ignore important.log
dist/           # Ignore dist directory
!dist/keep.txt  # But do NOT ignore this specific file
```

### Shell (extglob) — bash / zsh
Enable with `shopt -s extglob` (bash) or `setopt EXTENDED_GLOB` (zsh):
```bash
!(node_modules)           # Everything except node_modules
!(*.min).js               # .js files that are NOT .min.js
src/!(test|spec)/**/*.ts  # .ts files NOT in test or spec directories
```

### Node.js glob / micromatch (Negation in Array)
```js
const files = glob.sync(['src/**/*.ts', '!src/**/*.spec.ts']);
```

### Minimatch / Micromatch Negation Pattern
```
!node_modules/**
!**/*.spec.ts
!**/*.test.ts
!dist/**
```

---

## Common Patterns by Use Case

### Source Files
```
src/**/*.ts             All TypeScript files under src/
src/**/*.{ts,tsx}       TypeScript and TSX files
**/*.{js,mjs,cjs}       All JavaScript module types
src/**/!(*.spec).ts     TypeScript, excluding spec files (extglob)
```

### Test Files
```
**/*.test.{js,ts}       Jest/Vitest test files
**/*.spec.{js,ts}       Spec-style test files
**/__tests__/**/*.ts    Files in __tests__ directories
test/**/*.{js,ts}       All files in top-level test/ folder
```

### Configuration Files
```
**/*.config.{js,ts,mjs}     Build/tool config files
*.{json,yaml,yml}            Root-level config files
.env*                        All .env files (.env, .env.local, .env.production)
**/.eslintrc*                ESLint config files (any extension)
```

### Assets and Media
```
**/*.{png,jpg,jpeg,gif,webp,svg}   All images
**/*.{mp4,webm,ogg}                Videos
**/*.{woff,woff2,ttf,eot}          Fonts
public/**                          Everything in public/
```

### Log and Temp Files
```
**/*.log                Logs
**/tmp/**               Temp directories
**/.cache/**            Cache directories
**/coverage/**          Test coverage directories
```

### Build Output
```
dist/**                 dist directory
build/**                build directory
out/**                  out directory
**/*.min.{js,css}       Minified files
```

---

## Tool-Specific Behaviour

### Bash (Shell Glob)
```bash
shopt -s globstar   # Enable ** (recursive glob)
shopt -s extglob    # Enable !(pattern), +(pattern), @(pattern), *(pattern)
shopt -s nullglob   # Unmatched globs expand to empty string
shopt -s dotglob    # Include dotfiles (hidden files)

ls **/*.ts          # All .ts files recursively (requires globstar)
echo !(*.log)       # All files except .log (requires extglob)
```

### zsh
```zsh
setopt GLOB_STAR_SHORT   # Enable ** by default
setopt EXTENDED_GLOB     # Enable negation and advanced patterns
setopt DOT_GLOB          # Include dotfiles

ls **/*.ts
ls ^*.log            # zsh negation syntax (excludes .log files)
ls **/*(.)           # Only regular files (zsh glob qualifier)
ls **/*(/)           # Only directories
```

### Node.js (glob / fast-glob / micromatch)
```js
import { glob } from 'glob';
import fg from 'fast-glob';

// glob
const files = await glob('src/**/*.ts', { ignore: ['**/*.spec.ts'] });

// fast-glob
const entries = await fg(['src/**/*.ts', '!src/**/*.spec.ts']);
const all = await fg('**/*', { dot: true, onlyFiles: false });
```

### Python (pathlib / glob)
```python
from pathlib import Path
import glob

# pathlib
list(Path('src').rglob('*.py'))        # Recursive
list(Path('.').glob('src/**/*.ts'))    # From root

# glob module
import glob
glob.glob('src/**/*.py', recursive=True)
glob.glob('*.{json,yaml}')             # Note: no brace expansion in Python glob
```

### Java (PathMatcher / Ant-style)
```java
PathMatcher matcher = FileSystems.getDefault()
    .getPathMatcher("glob:src/**/*.java");

// Ant-style (Spring, Maven, Gradle)
// *  = single segment
// ** = multiple segments
// ?  = single character
"src/**/*.java"
"**/*Test.java"
"src/main/**"
```

---

## .gitignore Patterns

`.gitignore` uses a subset of glob syntax with some special rules:

```gitignore
# Ignore all .log files anywhere
*.log

# Ignore a specific directory
node_modules/
dist/
build/
.cache/

# Ignore a file only at the root
/secrets.env

# Ignore a pattern in any directory
**/temp/

# Allow a specific file even if the pattern above would ignore it
!dist/.gitkeep

# Ignore files with specific names
*.DS_Store
Thumbs.db
*.swp
*.swo

# Ignore by extension in specific directory
logs/*.log

# Ignore all .env files except template
.env*
!.env.example
```

---

## ESLint / Prettier Ignore Files

```
# .eslintignore / .prettierignore
node_modules/
dist/
build/
coverage/
**/*.min.js
public/static/
```

---

## tsconfig.json include / exclude

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.spec.ts",
    "**/*.test.ts"
  ]
}
```

---

## Tips and Gotchas

### Trailing Slash Means Directory
```
dist/       → the dist directory (not a file named dist)
dist        → could be a file or directory named dist
```

### Dotfiles are Hidden by Default
Most glob implementations do **not** match files starting with `.` unless explicitly configured:
```bash
shopt -s dotglob     # bash
ls -a **             # Shows dotfiles in shell
fg('**', { dot: true })    # fast-glob
glob('**', { dot: true })  # glob (Node)
```

### `**` Must Be Its Own Segment
```
src/**.ts       → same as src/*.ts in most tools (NOT recursive)
src/**/*.ts     → correct recursive pattern
```

### Brace Expansion is Not Regex
```
{jpg,jpeg}      → matches literally "jpg" or "jpeg" (not a character class)
[jp][pe][gg]    → character class approach — different meaning
```

### Windows Path Separators
On Windows, some tools require forward slashes in glob patterns even though the OS uses backslashes:
```
src/**/*.ts     → use forward slashes in globs (even on Windows)
src\**\*.ts     → may work in native Windows tools but avoid in cross-platform configs
```

### Test Your Globs
```bash
# Preview matches in bash
echo src/**/*.ts

# Node.js quick test
node -e "const {glob} = require('glob'); glob('src/**/*.ts').then(f => console.log(f))"

# Python quick test
python3 -c "from pathlib import Path; print(list(Path('.').glob('src/**/*.ts')))"
```
