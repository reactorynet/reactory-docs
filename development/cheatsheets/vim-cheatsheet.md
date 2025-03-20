## Editing in vim

### Basic Navigation:
- `h` - Move left
- `j` - Move down
- `k` - Move up
- `l` - Move right
- `gg` - Go to the top of the file
- `G` - Go to the bottom of the file
- `:n` - Go to line number `n`

### Insert Mode:
- `i` - Insert before the cursor
- `I` - Insert at the beginning of the line
- `a` - Append after the cursor
- `A` - Append at the end of the line
- `o` - Open a new line below the current line
- `O` - Open a new line above the current line
- `Esc` - Exit insert mode

### Editing:
- `x` - Delete the character under the cursor
- `dd` - Delete the current line
- `yy` - Yank (copy) the current line
- `p` - Paste after the cursor
- `u` - Undo the last change
- `Ctrl + r` - Redo the last undone change

### Saving and Exiting:
- `:w` - Save the file
- `:q` - Quit Vim
- `:wq` - Save and quit
- `:q!` - Quit without saving

### Searching:
- `/pattern` - Search for `pattern`
- `n` - Repeat the search in the same direction
- `N` - Repeat the search in the opposite direction

These commands should help you get started with basic file editing in Vim.