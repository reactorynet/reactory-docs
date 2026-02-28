# Copilot Instructions for Reactory Documentation

## Project Overview

This is the central documentation repository for the Reactory platform. It contains developer guides, architecture overviews, SDLC documentation, cheatsheets, roadmap, and branding assets. This is a **pure documentation project** -- there is no application code, no build system, no package.json, and no static site generator.

## Content Format

- All documentation is authored in **plain Markdown** (`.md` files)
- No MDX, no frontmatter/YAML metadata, no templating
- Content is consumed directly from GitHub or via a Markdown viewer
- Images are PNG files stored in `branding/` and `img/` directories

## Directory Structure

```
reactory-docs/
  README.md                    # Main entry point and platform overview
  install.md                   # Installation guide
  branding/                    # Brand assets (logos, architecture diagrams)
  img/                         # General images (banner, logos)
  development/
    index.md                   # Development docs table of contents
    coreconcepts.md            # Core design philosophy (Three C's, velocity, modules)
    conduct.md                 # Code of conduct
    tools.md                   # Required development tools
    upgrading.md               # Version upgrade guide
    cheatsheets/               # Reference sheets (git, kubernetes, python, rsync, vi/vim)
    datamapping/               # Object-mapper usage documentation
    forms/
      overview.md              # ReactoryFormComponent, JSON Schema forms, widgets
      widgets/
        built-in.md            # 40+ built-in UX widgets catalog
    plugins/                   # Plugin system docs (mostly stubs)
    server/                    # Server module docs (stubs)
  funding/                     # Investor relations and pitch materials
  roadmap/
    products.md                # 26+ products/modules with development status
  typescript/                  # TypeScript reference PDFs and cheat sheets
```

## Conventions

### Writing Documentation
- Use standard Markdown syntax with GitHub-flavored extensions
- Start pages with a banner image: `![Build Anything Fast](/branding/reactory-logo.png)`
- Use relative `.md` file paths for cross-references (e.g., `[Core Concepts](coreconcepts.md)`)
- Use relative paths for image references (e.g., `../branding/reactory-logo.png`)
- Organize content by SDLC phase or development topic

### Content Guidelines
- Follow the Three C's (Convention, Configuration, Customization) as a guiding principle
- Document new features, modules, and APIs as they are developed
- Keep documentation current with the codebase
- Add new guides in the appropriate development or topic folder
- Many sections are stubs marked "TBC" or "Coming Soon" -- these need content

### Image Assets
- `branding/` contains the primary brand assets (capitalized filenames like `Asynchronous.png`)
- `img/` contains general-use images (lowercase filenames like `asynchronous.png`)
- Prefer referencing images from `branding/` in new documentation

## Platform Context

This documentation covers the following Reactory components:
- **Reactory Server** (`reactory-express-server`) -- Express/Node.js backend with GraphQL APIs
- **Reactory Web Client** (`reactory-pwa-client`) -- React PWA with Material UI
- **Reactory Native Client** (`reactory-native`) -- React Native mobile app
- **Reactory Core** (`reactory-core`) -- Shared TypeScript types and utilities

## Contribution Notes

- No build or test commands -- this is a Markdown-only repository
- Verify that relative links resolve correctly when adding new pages
- Keep the table of contents in `development/index.md` updated when adding new sections
- Use descriptive commit messages, optionally prefixed with ticket IDs (e.g., `DOC-1:`)
