# Reactory Documentation -- Agent Context

## What Is This Project

This is the central documentation repository for the Reactory platform. It contains developer guides, architecture overviews, SDLC documentation, development cheatsheets, roadmap, funding materials, and branding assets.

This is a **pure documentation project** -- there is no application code, no build system, no `package.json`, and no static site generator. All content is hand-authored Markdown files consumed directly from GitHub or via a Markdown viewer.

## Directory Structure

```
reactory-docs/
  README.md                          # Main entry point and platform overview
  install.md                         # Installation guide (links to server/client repos)
  LICENSE                            # MIT license
  branding/                          # Brand assets (logos, architecture diagrams, PNGs)
  img/                               # General images (banner, logos -- lowercase filenames)
  development/
    index.md                         # Development docs table of contents
    coreconcepts.md                  # Core design philosophy (Three C's, velocity, modules)
    conduct.md                       # Code of conduct
    tools.md                         # Required development tools
    upgrading.md                     # Version upgrade guide (semver)
    cheatsheets/                     # Developer reference sheets
      git-cheatsheet.md              # Git commands reference
      kubernetes-cheatsheet.md       # Kubernetes reference (1300 lines)
      python-cheatsheet.md           # Python reference (1528 lines)
      rsync-cheatsheet.md            # Rsync reference
      vi.md                          # Vi/Vim reference
      vim-cheatsheet.md              # Extended Vim reference
    datamapping/
      objectmapping.md               # Object-mapper usage in client and server
    forms/
      overview.md                    # ReactoryFormComponent, JSON Schema forms, widgets
      widgets/
        built-in.md                  # 40+ built-in UX widgets catalog
        MaterialListWidget-*.md      # Detailed widget configuration example
    plugins/                         # Plugin system docs
      overview.md                    # Placeholder ("Coming Soon")
      client.md                      # Placeholder ("TBC")
      server.md                      # Placeholder ("TBC")
      upgrade.md                     # Upgrading beta plugins to v1
    server/
      overview.md                    # Placeholder ("Coming Soon")
  funding/
    investors.md                     # Investor relations / angel investor pitch
    Reactory - RAD - Overview.pdf    # PDF pitch deck
  roadmap/
    products.md                      # 26+ products/modules with development status
    reactory-client.md               # Placeholder
    reactory-native.md               # Placeholder
    reactory-server.md               # Placeholder
  typescript/
    readme.md                        # TypeScript recommendation
    pdfs/                            # TypeScript reference PDFs (Classes, Interfaces, etc.)
    pngs/                            # TypeScript reference PNGs
```

## Content Status

| Section | Status |
|---|---|
| README.md, install.md | Complete |
| development/index.md, coreconcepts.md | Complete |
| development/forms/ | Complete (overview + widgets catalog) |
| development/cheatsheets/ | Complete (6 cheatsheets) |
| development/datamapping/ | Complete |
| development/plugins/ | Mostly stubs -- only `upgrade.md` has content |
| development/server/ | Stub ("Coming Soon") |
| roadmap/products.md | Complete (26+ products with status) |
| roadmap/ (other files) | Stubs |
| funding/ | Complete |
| typescript/ | Reference material |

## Authoring Conventions

### Markdown Format
- Use standard GitHub-flavored Markdown
- No MDX, no frontmatter/YAML metadata, no templating
- Start pages with a banner image: `![Build Anything Fast](/branding/reactory-logo.png)`
- Use relative `.md` file paths for cross-references (e.g., `[Core Concepts](coreconcepts.md)`)
- Use relative paths for image references (e.g., `../branding/reactory-logo.png`)

### Image Assets
- `branding/` contains primary brand assets (capitalized filenames: `Asynchronous.png`, `Scalability.png`)
- `img/` contains general images (lowercase filenames: `asynchronous.png`, `scalability.png`)
- Prefer `branding/` for new documentation

### Content Guidelines
- Follow the Three C's philosophy (Convention, Configuration, Customization)
- Document new features, modules, and APIs as they are developed
- Keep documentation current with the codebase
- Add new guides in the appropriate development or topic folder
- Sections marked "TBC" or "Coming Soon" need content contributions
- Keep `development/index.md` table of contents updated when adding new pages
- Verify relative links resolve correctly when adding new pages

## Platform Context

This documentation covers:
- **Reactory Server** (`reactory-express-server`) -- Express/Node.js backend with GraphQL
- **Reactory Web Client** (`reactory-pwa-client`) -- React PWA with Material UI
- **Reactory Native Client** (`reactory-native`) -- React Native mobile app
- **Reactory Core** (`reactory-core`) -- Shared TypeScript types and utilities
- **Reactory Data** (`reactory-data`) -- Assets, plugins, themes, i18n, workflows

## No Build or Test Commands

This is a Markdown-only repository. There are no build, test, lint, or deploy commands. Contributions are verified by reviewing rendered Markdown and checking that relative links resolve correctly.
