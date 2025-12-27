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
- **BusyBox Vi**: If this is BusyBox's vi, some advanced features (like redo or complex macros) might be missing, but navigation, editing, and saving should work fine.
- **No Arrow Keys?** If arrow keys don't work, stick to `h`, `j`, `k`, `l`.
- **Stuck?** If you can't exit, try `Esc` then `:q!` to force quit.

## Productivity Tips

### 1. Word Navigation
- `w`: Jump to start of next word
- `b`: Jump to start of previous word
- `e`: Jump to end of word
- `5w`: Jump forward 5 words (combine with any number)

### 2. Efficient Deletion
- `dw`: Delete word
- `d$`: Delete from cursor to end of line
- `d0`: Delete from cursor to start of line
- `d5d` or `5dd`: Delete 5 lines

### 3. Copy and Paste (Yank)
- `yy`: Copy (yank) current line
- `5yy`: Copy 5 lines
- `p`: Paste after cursor
- `P`: Paste before cursor
- `yw`: Yank word

### 4. Quick Edits
- `A`: Jump to end of line and enter Insert Mode (faster than `$a`)
- `I`: Jump to start of line and enter Insert Mode (faster than `0i`)
- `o`: Open new line below and enter Insert Mode
- `O`: Open new line above and enter Insert Mode
- `r`: Replace single character (no need to enter Insert Mode)
- `R`: Replace mode - overwrite multiple characters

### 5. Line Numbers
- `:set number`: Show line numbers
- `:set nonumber`: Hide line numbers
- `5G` or `:5`: Jump to line 5

### 6. Search and Replace Patterns
- `:%s/old/new/g`: Replace all occurrences in file
- `:s/old/new/g`: Replace all occurrences in current line
- `:%s/old/new/gc`: Replace with confirmation for each
- `:5,10s/old/new/g`: Replace in lines 5-10

### 7. Multiple Actions
- `.`: Repeat last command (super useful!)
- `3.`: Repeat last command 3 times

### 8. Visual Selection (if available)
- `v`: Enter visual mode (character selection)
- `V`: Enter visual line mode
- Use movement keys to select, then `d` to delete, `y` to yank

### 9. Auto-completion (may not work in minimal vi)
- `Ctrl + n`: Auto-complete word (in Insert Mode)
- `Ctrl + p`: Auto-complete previous match

### 10. Marks and Jumps
- `ma`: Set mark 'a' at current position
- `'a`: Jump to mark 'a'
- `''`: Jump back to previous position

### 11. Working with Multiple Files
- `:e filename`: Open another file
- `:w newfile`: Save current content to new file
- `:r filename`: Insert contents of another file at cursor

### 12. Remember These Time-Savers
- `C`: Delete from cursor to end of line and enter Insert Mode (equals `d$i`)
- `D`: Delete from cursor to end of line (equals `d$`)
- `J`: Join current line with next line
- `~`: Toggle case of character under cursor

### 13. Practice Makes Perfect
The key to vi efficiency is muscle memory. The commands might seem cryptic at first, but after a few sessions:
- Keep hands on home row (no reaching for mouse or arrow keys)
- Combine commands with numbers: `3dd`, `5j`, `2dw`
- Think in terms of operators (d, y, c) + motions (w, $, G)

### 14. Common Pattern: Operator + Motion
Vi follows a grammar: `[number][operator][motion]`
- `d2w`: Delete 2 words
- `y3j`: Yank 3 lines down
- `c$`: Change to end of line