# Vi Cheat Sheet

## Starting Vi
Open a file:
```bash
vi filename
```
Example:
```bash
vi ~/.bashrc
```
If the file doesn’t exist, it’ll be created when you save.

## Modes
Vi has two main modes:
- **Command Mode**: For navigation and commands (default when you start).
- **Insert Mode**: For editing text (enter this to type).

Switch between modes:
- To Insert Mode: Press `i` (insert at cursor) or `a` (append after cursor).
- To Command Mode: Press `Esc`.

## Basic Navigation (Command Mode)
Move cursor:
- `h`: Left
- `j`: Down
- `k`: Up
- `l`: Right

Jump around:
- `0`: Start of line
- `$`: End of line
- `gg`: Start of file
- `G`: End of file
- `<number>G`: Go to line number (e.g., `5G` for line 5)

## Editing (Insert Mode)
- Enter Insert Mode: `i` (before cursor) or `a` (after cursor).
- Type your text (e.g., `export PS1='\u@\h:\w\$ '`).
- Exit Insert Mode: `Esc`.

## Deleting (Command Mode)
- `x`: Delete character under cursor.
- `dd`: Delete current line.
- `<number>dd`: Delete multiple lines (e.g., `3dd` deletes 3 lines).

## Saving and Quitting (Command Mode)
- Save changes: `:w` (write) then `Enter`.
- Quit without saving: `:q` then `Enter`.
- Save and quit: `:wq` or `ZZ` (uppercase, no colon needed).
- Force quit (discard changes): `:q!` (useful if stuck).

## Common Commands (Command Mode)
- Undo: `u`
- Redo: `Ctrl + r` (may not work in minimal vi)
- Search: `/text` (then `Enter`; `n` for next match, `N` for previous)
- Replace (basic): `:%s/old/new/g` (replace all occurrences of "old" with "new")

## Example: Editing .bashrc
Open the file:
```bash
vi ~/.bashrc
```
Move to the end: `G`

Enter Insert Mode: `a`

Type:
```bash
export PS1='\u@\h:\w\$ '
```
Exit Insert Mode: `Esc`

Save and quit: `:wq` then `Enter`

Reload the shell:
```bash
source ~/.bashrc
```

## Tips for Minimal Vi
- **BusyBox Vi**: If this is BusyBox’s vi, some advanced features (like redo or complex macros) might be missing, but navigation, editing, and saving should work fine.
- **No Arrow Keys?** If arrow keys don’t work, stick to `h`, `j`, `k`, `l`.
- **Stuck?** If you can’t exit, try `Esc` then `:q!` to force quit.