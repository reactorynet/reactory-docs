# NVM Command Cheat Sheet

## What is NVM?

Node Version Manager (NVM) is a shell script that lets you install, manage, and switch between multiple versions of Node.js on a single machine. It is installed per-user and does not require `sudo`. It works on macOS and Linux; Windows users should use [nvm-windows](https://github.com/coreybutler/nvm-windows) or [fnm](https://github.com/Schniz/fnm).

---

## Quick Reference

```bash
nvm install --lts             # Install latest LTS version
nvm use --lts                 # Switch to latest LTS
nvm ls                        # List installed versions
nvm ls-remote --lts           # List all available LTS versions
nvm current                   # Show active version
nvm alias default 20          # Set default Node.js version
node --version                # Confirm active version
```

---

## Installation

### Install / Update NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# or
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```
This adds the following to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

### Verify Installation
```bash
nvm --version
command -v nvm    # Should output "nvm"
```

### Reload Shell
```bash
source ~/.zshrc      # or ~/.bashrc
exec $SHELL -l       # Reload shell entirely
```

---

## Installing Node.js

### Install Latest LTS
```bash
nvm install --lts
nvm install lts/iron       # LTS by codename (Iron = Node 20)
nvm install lts/hydrogen   # LTS by codename (Hydrogen = Node 18)
```

### Install a Specific Version
```bash
nvm install 20             # Latest 20.x
nvm install 20.11.0        # Exact version
nvm install node           # Latest stable (current) release
nvm install 18.20.2        # Exact patch version
```

### Install and Use in One Step
```bash
nvm install 20 --default   # Install and set as default
```

### Reinstall with npm Packages from Previous Version
```bash
nvm install 20 --reinstall-packages-from=18
```
Copies globally installed npm packages from Node 18 to the new Node 20 install.

---

## Switching Versions

### Use a Version
```bash
nvm use 20            # Switch to latest installed 20.x
nvm use 18.20.2       # Switch to exact version
nvm use --lts         # Switch to latest installed LTS
nvm use node          # Switch to latest installed version
```

### Temporary Version for a Command
```bash
nvm exec 18 node --version
nvm exec 18 npm install
```
Run a single command with a specific Node version without permanently switching.

### Run a Script with a Specific Version
```bash
nvm run 18 app.js
```

---

## Default Version

### Set Default
```bash
nvm alias default 20          # Set Node 20 as default for new shells
nvm alias default lts/iron    # Set LTS Iron as default
nvm alias default node        # Always use latest installed as default
```

### View Current Default
```bash
nvm alias default
```

---

## Listing Versions

### List Installed Versions
```bash
nvm ls                        # All installed; highlights current
nvm list                      # Alias for nvm ls
```

### List Remote Available Versions
```bash
nvm ls-remote                 # All available versions (very long!)
nvm ls-remote --lts           # LTS versions only
nvm ls-remote 20              # All 20.x releases
```

### Check Current Version
```bash
nvm current
node --version
```

---

## Aliases

Aliases let you name a version for easier reference.

```bash
nvm alias default 20          # Set default
nvm alias project-foo 18.20.2 # Custom alias
nvm use project-foo           # Use alias

nvm alias                     # List all aliases
nvm unalias project-foo       # Delete an alias
```

### Built-in Aliases
```bash
nvm use default       # Use the default alias
nvm use node          # Latest installed
nvm use stable        # Stable alias
nvm use lts/*         # Latest LTS
nvm use lts/iron      # Specific LTS codename
```

---

## .nvmrc Files

`.nvmrc` allows per-project Node version pinning.

### Create a .nvmrc
```bash
node --version > .nvmrc       # Write current version
echo "20" > .nvmrc            # Major version only
echo "lts/iron" > .nvmrc      # LTS codename
```

### Use .nvmrc Automatically
```bash
nvm use           # Reads .nvmrc in current directory
nvm install       # Installs version from .nvmrc if not already installed
```

### Auto-Switch on `cd` (zsh)
Add to `~/.zshrc` to automatically switch Node versions when entering a directory with a `.nvmrc`:
```bash
autoload -U add-zsh-hook
load-nvmrc() {
  local nvmrc_path
  nvmrc_path="$(nvm_find_nvmrc)"
  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version
    nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")
    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then
      nvm use
    fi
  elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ]; then
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

### Auto-Switch (bash)
```bash
# Add to ~/.bashrc
cdnvm() {
  command cd "$@" || return $?
  local nvm_path
  nvm_path="$(nvm_find_nvmrc)"
  if [ "$nvm_path" != "" ]; then
    nvm use
  elif [ "$(nvm current)" != "$(nvm version default)" ]; then
    nvm use default
  fi
}
alias cd='cdnvm'
```

---

## Uninstalling

### Uninstall a Node Version
```bash
nvm uninstall 18.20.2
nvm uninstall lts/hydrogen
```
You cannot uninstall the currently active version — switch away first.

### Remove NVM Entirely
```bash
nvm deactivate
rm -rf "$NVM_DIR"      # ~/.nvm by default
# Then remove nvm lines from ~/.zshrc / ~/.bashrc
```

---

## npm with NVM

Each Node.js version installed by NVM has its own isolated `npm` and global npm packages.

### Upgrade npm for the Active Node Version
```bash
nvm install-latest-npm
npm install -g npm@latest
```

### List Global Packages
```bash
npm list -g --depth=0
```

### Migrate Global Packages Between Versions
```bash
nvm install 20 --reinstall-packages-from=18
```

---

## Troubleshooting

### `nvm: command not found`
```bash
# Source nvm manually
source ~/.nvm/nvm.sh

# Verify NVM_DIR is set
echo $NVM_DIR

# Check shell profile contains nvm init lines
grep -n nvm ~/.zshrc
grep -n nvm ~/.bashrc
```

### Node Version Not Persisting Across Terminal Sessions
The `nvm use` command only affects the current shell session. To make a version persist, set the default alias:
```bash
nvm alias default 20
```

### Permission Errors with Global npm Install
If you see `EACCES` errors, you are likely using the system Node instead of NVM's. Verify:
```bash
which node             # Should point to ~/.nvm/versions/node/...
nvm current            # Should show a version, not "system"
```

### Slow Shell Startup
NVM can add 200–500ms to shell startup. Lazy-load it:
```bash
# ~/.zshrc — lazy load NVM
export NVM_DIR="$HOME/.nvm"
nvm() {
  unset -f nvm
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm "$@"
}
node() {
  unset -f node
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  node "$@"
}
npm() {
  unset -f npm
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  npm "$@"
}
```

---

## NVM vs Alternatives

| Tool | Platform | Speed | Notes |
|---|---|---|---|
| **nvm** | macOS, Linux | Moderate | Most widely used, shell-based |
| **fnm** | macOS, Linux, Windows | Very fast (Rust) | `.nvmrc` compatible |
| **volta** | macOS, Linux, Windows | Fast (Rust) | Per-project pinning via `package.json` |
| **asdf** | macOS, Linux | Moderate | Universal version manager (Node, Ruby, Python...) |
| **nvm-windows** | Windows only | Moderate | Windows port of nvm |

---

## Tips and Best Practices

### Always Commit .nvmrc
Add a `.nvmrc` to every project so all contributors (and CI) use the same Node version:
```bash
echo "20" > .nvmrc
git add .nvmrc
git commit -m "Pin Node.js version to 20"
```

### Pin Exact Versions in CI
```bash
# .nvmrc for CI reproducibility
20.11.0
```

### Keep LTS for Production Projects
Use LTS versions (even-numbered major: 18, 20, 22) for production work; use `node` alias only for experimentation.

### Separate Global Packages Per Project
Avoid relying on globally installed CLIs. Use `npx` or project `devDependencies` instead:
```bash
npx create-react-app myapp    # Instead of: npm i -g create-react-app
```
