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

### Visual Mode:
- `v` - Character-wise visual mode
- `V` - Line-wise visual mode
- `Ctrl + v` - Block-wise visual mode (for columns)
- Select text, then `d` to delete, `y` to yank, `c` to change

### Window Management:
- `:split` or `:sp` - Split window horizontally
- `:vsplit` or `:vsp` - Split window vertically
- `Ctrl + w, w` - Switch between windows
- `Ctrl + w, q` - Close current window
- `Ctrl + w, arrow` - Navigate to window in direction

## Productivity Tips

### 1. Efficient Movement
- `0` - Start of line
- `^` - First non-blank character of line
- `$` - End of line
- `w` - Next word
- `b` - Previous word
- `%` - Jump to matching bracket/parenthesis
- `{` and `}` - Jump between paragraphs

### 2. Powerful Editing Commands
- `ci"` - Change inside quotes
- `da(` - Delete around parentheses (including parentheses)
- `vi{` - Select inside braces
- `dit` - Delete inside HTML/XML tag
- `yat` - Yank around tag

### 3. Multiple Cursors with Macros
- `qa` - Start recording macro in register 'a'
- (perform actions)
- `q` - Stop recording
- `@a` - Execute macro 'a'
- `@@` - Repeat last macro
- `10@a` - Execute macro 10 times

### 4. Search and Replace Advanced
- `:%s/old/new/g` - Replace all in file
- `:%s/old/new/gc` - Replace with confirmation
- `:5,10s/old/new/g` - Replace in lines 5-10
- `:%s/\<word\>/new/g` - Replace whole word only
- `:.,$s/old/new/g` - Replace from current line to end

### 5. Marks and Jumps
- `ma` - Set mark 'a' at current position
- `'a` - Jump to line of mark 'a'
- `` `a `` - Jump to exact position of mark 'a'
- `''` - Jump back to previous position
- `Ctrl + o` - Jump to older position
- `Ctrl + i` - Jump to newer position

### 6. Text Objects (Game Changers!)
Think: `operator + [i/a] + text-object`
- `w` - word
- `s` - sentence
- `p` - paragraph
- `"` or `'` - quotes
- `(`, `[`, `{` - brackets
- `t` - HTML/XML tags

Examples:
- `ciw` - Change inner word
- `das` - Delete a sentence
- `yip` - Yank inner paragraph
- `ci"` - Change text inside quotes

### 7. Multiple Files and Buffers
- `:e filename` - Open file
- `:bn` - Next buffer
- `:bp` - Previous buffer
- `:bd` - Close buffer
- `:buffers` or `:ls` - List all buffers
- `:b <number>` - Switch to buffer number

### 8. Command-Line Tricks
- `:!command` - Execute shell command
- `:r !command` - Insert command output
- `:%!command` - Filter file through command
- `:w !sudo tee %` - Save file with sudo (when forgot to use sudo)

### 9. Auto-completion
- `Ctrl + n` - Auto-complete word (forward)
- `Ctrl + p` - Auto-complete word (backward)
- `Ctrl + x, Ctrl + l` - Complete line
- `Ctrl + x, Ctrl + f` - Complete filename

### 10. Repeat and Efficiency
- `.` - Repeat last change (most powerful command!)
- `&` - Repeat last substitution
- `@:` - Repeat last command-line command
- `;` - Repeat last f/F/t/T motion
- `,` - Repeat last f/F/t/T motion in opposite direction

### 11. Indentation and Formatting
- `>>` - Indent line
- `<<` - Unindent line
- `=` - Auto-indent (e.g., `gg=G` to indent entire file)
- `==` - Auto-indent current line
- `5>>` - Indent 5 lines

### 12. Case Changes
- `~` - Toggle case of character
- `gU` - Make uppercase (e.g., `gUiw` for word)
- `gu` - Make lowercase (e.g., `guw` for word)
- `gUU` - Uppercase current line
- `guu` - Lowercase current line

### 13. Numbers and Arithmetic
- `Ctrl + a` - Increment number under cursor
- `Ctrl + x` - Decrement number under cursor
- `10 Ctrl + a` - Add 10 to number

### 14. Configuration Tips
Add to `~/.vimrc`:
```vim
set number              " Show line numbers
set relativenumber      " Show relative line numbers
set ignorecase          " Case insensitive search
set smartcase           " Case sensitive if uppercase used
set hlsearch            " Highlight search results
set incsearch           " Incremental search
set expandtab           " Use spaces instead of tabs
set tabstop=2           " Tab width
set shiftwidth=2        " Indent width
set autoindent          " Auto-indent new lines
set mouse=a             " Enable mouse
syntax on               " Syntax highlighting
```

### 15. Quick File Navigation
- `*` - Search for word under cursor (forward)
- `#` - Search for word under cursor (backward)
- `gd` - Go to local definition
- `gf` - Open file under cursor
- `Ctrl + ]` - Jump to tag (requires ctags)

### 16. Diff Mode
```bash
vim -d file1 file2      # Open in diff mode
```
Inside Vim:
- `:diffthis` - Make current window part of diff
- `]c` - Jump to next difference
- `[c` - Jump to previous difference
- `do` - Diff obtain (get changes from other file)
- `dp` - Diff put (put changes to other file)

### 17. Common Workflows

**Refactoring a variable name:**
```
*              # Find all occurrences
cgn            # Change next occurrence
(type new name)
.              # Repeat for each occurrence
```

**Multiple line editing:**
```
Ctrl + v       # Block visual mode
jjjj           # Select lines
I              # Insert at beginning
(type text)
Esc            # Apply to all lines
```

**Quick note-taking:**
```
:new           # New buffer
:set nobackup  # Don't create backup
:set noundofile # Don't create undo file
```

These commands should help you get started with basic file editing in Vim and improve your productivity significantly!