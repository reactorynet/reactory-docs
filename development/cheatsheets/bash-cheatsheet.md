# Bash Command Line Cheat Sheet

## Basic Navigation

### Directory Navigation
```bash
pwd                    # Print working directory
ls                     # List files and directories
ls -l                  # Long format listing
ls -la                 # List all files including hidden
cd                     # Change to home directory
cd <directory>         # Change to specific directory
cd ..                  # Go up one directory
cd -                   # Switch to previous directory
pushd <dir>            # Push directory to stack and change
popd                   # Pop directory from stack
```

### File Operations
```bash
touch <file>           # Create empty file or update timestamp
cat <file>             # Display file contents
less <file>            # View file with pagination
head <file>            # Show first 10 lines
head -20 <file>        # Show first 20 lines
tail <file>            # Show last 10 lines
tail -20 <file>        # Show last 20 lines
cp <source> <destination>  # Copy files/directories
mv <source> <destination>  # Move/Rename files/directories
rm <file>              # Remove file
rm -rf <directory>     # Remove directory and contents recursively
mkdir <directory>      # Create directory
mkdir -p <path>        # Create nested directories
```

## File and Directory Management

### File Operations
```bash
find . -name "*.txt"       # Find files by name
find . -type f -name "*.log"  # Find files by type and name
grep "pattern" <file>      # Search for pattern in file
grep -r "pattern" .        # Recursively search in current directory
find . -name "*.js" -exec grep -l "function" {} \;  # Find files containing pattern
```

### File Permissions
```bash
chmod 755 <file>         # Set permissions (rwxr-xr-x)
chmod +x <file>          # Make file executable
chown user:group <file>  # Change ownership
chown -R user:group <dir> # Recursively change ownership
```

## Process Management

### Process Information
```bash
ps aux                 # Show all running processes
ps -ef                 # Alternative process listing
top                    # Show processes in real-time
htop                   # Enhanced process viewer
kill <pid>             # Kill process by ID
kill -9 <pid>          # Force kill process
pkill <name>           # Kill process by name
```

### Process Control
```bash
bg                     # Resume job in background
fg                     # Bring job to foreground
jobs                   # List background jobs
Ctrl+Z                 # Suspend current process
Ctrl+C                 # Interrupt current process
```

## Text Processing and Pipes

### Basic Text Operations
```bash
wc <file>              # Count lines, words, and characters
wc -l <file>           # Count lines only
sort <file>            # Sort lines
uniq                   # Remove duplicate lines
cut -d':' -f1 <file>   # Extract field from delimited file
awk '{print $1}' <file> # Print first field using awk
sed 's/old/new/g' <file>  # Replace text in file
```

### Pipelines and Redirection
```bash
command1 | command2    # Pipe output of command1 to command2
command1 > file        # Redirect stdout to file
command1 >> file       # Append stdout to file
command1 2> file       # Redirect stderr to file
command1 &> file       # Redirect both stdout and stderr
command1 2>&1 file     # Alternative syntax for redirecting stderr to stdout
```

## Environment and Shell Configuration

### Environment Variables
```bash
echo $PATH             # Show PATH variable
export VAR=value       # Set environment variable
echo $VAR              # Print variable value
unset VAR              # Unset variable
env                    # Show all environment variables
```

### Shell Features
```bash
history                # Show command history
!!                     # Repeat last command
!n                     # Repeat command number n
!string                # Repeat last command starting with string
Ctrl+R                 # Search command history
alias ll='ls -la'      # Create alias
unalias ll             # Remove alias
```

## System Information and Monitoring

### System Overview
```bash
uname -a               # System information
df -h                  # Disk space usage
free -h                # Memory usage
uptime                 # System uptime
whoami                 # Current user
who                    # Logged-in users
date                   # Current date/time
cal                    # Calendar
```

### Network Information
```bash
ifconfig               # Network interface information
ip addr                # Modern network interface info
ping <host>            # Test network connectivity
nslookup <host>        # DNS lookup
dig <host>             # DNS lookup with more info
netstat -tuln          # Show listening ports
ss -tuln               # Modern version of netstat
```

## File Compression and Archiving

### Compression Commands
```bash
gzip <file>            # Compress file
gzip -d <file.gz>      # Decompress file
tar -czf archive.tar.gz <files>  # Create compressed tar archive
tar -xzf archive.tar.gz  # Extract compressed tar archive
tar -czf archive.tar.gz --exclude='node_modules' <files>  # Exclude directories
```

## Advanced Bash Features

### File Globbing
```bash
*.txt                  # All .txt files in current directory
src/**/*.js            # All .js files recursively in src/
[0-9]*                 # Files starting with numbers
??.txt                 # Files with exactly 2 characters + .txt
```

### Command Substitution
```bash
echo $(date)           # Execute command and substitute output
echo `date`            # Alternative syntax
ls -l $(which command) # Use command output as argument
```

### Shell Expansion
```bash
echo ~                 # Home directory
echo ~user             # User's home directory
echo $HOME             # Home directory using variable
echo {1..5}            # Generate sequence: 1 2 3 4 5
echo {a..z}            # Generate alphabet: a b c ... z
```

## Useful Shortcuts and Tips

### Navigation Shortcuts
```bash
Ctrl+A                 # Move to beginning of line
Ctrl+E                 # Move to end of line
Ctrl+U                 # Cut from cursor to beginning of line
Ctrl+K                 # Cut from cursor to end of line
Ctrl+W                 # Cut last word
```

### Command Editing
```bash
Ctrl+R                 # Search command history
Ctrl+L                 # Clear screen
Ctrl+C                 # Cancel current command
Ctrl+Z                 # Suspend current command
```

### Process Management
```bash
Ctrl+Z                 # Suspend current job
jobs                   # List suspended jobs
fg %1                  # Bring job 1 to foreground
bg %1                  # Resume job 1 in background
```

## Productivity Tips

### 1. Use Tab Completion
Always use tab completion to avoid typing errors:
```bash
ls /ho<TAB>        # Completes to /home/
cd ~/Doc<TAB>      # Completes to ~/Documents/
```

### 2. Create Useful Aliases
Add to your `.bashrc` or `.zshrc`:
```bash
alias ll='ls -la'
alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'
alias h='history'
```

### 3. Use History Effectively
```bash
# Search through history
Ctrl+R then type part of command
# Execute command from history
!123              # Execute command number 123
!grep             # Execute last command starting with grep
```

### 4. Efficient File Searching
```bash
# Find files quickly
find . -name "*.js" -type f -size +10M  # Find large JS files
find . -type d -name "node_modules"     # Find directories
```

### 5. Process Monitoring
```bash
# Monitor system resources
top -p $(pgrep node)  # Monitor Node.js processes
watch -n 1 df -h      # Update disk usage every second
```

### 6. Working with Large Files
```bash
# Handle large files efficiently
tail -n 1000 large.log    # Get last 1000 lines
head -n 1000 large.log    # Get first 1000 lines
split -l 1000 large.log   # Split into 1000-line chunks
```

### 7. Quick Directory Navigation
```bash
# Use pushd/popd for directory stack
pushd /path/to/dir
pushd /another/path
popd        # Return to previous directory
dirs -l     # List directory stack
```

### 8. Pattern Matching with Globbing
```bash
# Find files with specific patterns
ls *.js                    # All JavaScript files
ls src/*.{js,ts}           # JavaScript and TypeScript files
ls src/**/*.{js,ts}        # Recursive with globstar
ls [0-9]*                  # Files starting with numbers
ls [A-Z]*                  # Files starting with uppercase letters
```

## Common Bash Workflows

### 1. Development Environment Setup
```bash
# Create project structure
mkdir -p project/{src,tests,docs,config}
cd project
touch README.md
git init
```

### 2. Log Analysis
```bash
# Tail and grep logs
tail -f app.log | grep ERROR
# Find errors in log files
grep -r "ERROR" logs/
# Count log entries
grep -c "ERROR" app.log
```

### 3. Backup and Sync
```bash
# Create backup with timestamp
tar -czf backup-$(date +%Y%m%d).tar.gz /important/data
# Sync directories
rsync -av source/ destination/
```

### 4. Process Management
```bash
# Check if process is running
pgrep node
# Kill all processes with name
pkill -f "node app.js"
# Monitor resource usage
htop
```

### 5. File Management
```bash
# Find and remove large files
find . -type f -size +100M -exec ls -lh {} \;
# Clean up temporary files
find /tmp -type f -mtime +7 -delete
# Count files in directories
find . -type d -exec sh -c 'echo "$1: $(find "$1" -type f | wc -l) files"' _ {} \;
```

## Troubleshooting and Debugging

### 1. Debugging Scripts
```bash
# Run script with debug output
bash -x script.sh
# Enable debugging in script
set -x  # Enable debug output
set +x  # Disable debug output
```

### 2. Check File Issues
```bash
# Check file permissions
ls -l filename
# Check file type
file filename
# Check if file is executable
test -x filename && echo "executable"
```

### 3. Network Troubleshooting
```bash
# Test connectivity
ping google.com
# Check ports
telnet hostname port
# Test DNS resolution
nslookup hostname
```

## Important Notes

### 1. Be Careful with rm -rf
Always double-check before using:
```bash
# Safe approach
rm -i file        # Interactive mode
rm -rf dir/       # Dangerous - use with extreme caution
# Better alternatives
find . -name "*.tmp" -delete
```

### 2. Use Quotes for Filenames with Spaces
```bash
# Good
mv "file with spaces.txt" "new name.txt"
# Bad
mv file with spaces.txt new name.txt  # Will fail
```

### 3. Environment Variables
```bash
# Check if variable is set
test -z "$VAR" && echo "VAR is not set"
# Use default values
echo ${VAR:-default_value}
# Set variable with default
VAR=${VAR:-default}
```

This cheat sheet covers the most frequently used bash commands and concepts for software engineers. Use it as a reference for daily development tasks and system administration.