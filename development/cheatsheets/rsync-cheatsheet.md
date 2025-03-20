## Basic Usage:
```bash
rsync [options] source destination
```
## Commonly Used Options:
```
-a, --archive: Archive mode; equals -rlptgoD (no -H,-A,-X). Preserves permissions, timestamps, symbolic links, etc.
-r: recursive mode
-l: copy symlinks as symlinks
-p: preserve permissions
-t: preserve modification times
-g: preserve group
-o: preserve owner (super-user only)
-D: same as --devices --specials
-v, --verbose: Increase verbosity. Use multiple times for more detail (e.g., -vv).
-z, --compress: Compress file data during the transfer.
-P: Equivalent to --partial --progress. Shows progress and preserves partial transfers.
-h, --human-readable: Output numbers in a human-readable format.
--delete: Delete extraneous files from destination dirs.
-n, --dry-run: Show what would have been transferred but don't actually perform the transfer.
-e, --rsh=COMMAND: Specify the remote shell to use (e.g., -e ssh).
--exclude=PATTERN: Exclude files matching PATTERN.
--include=PATTERN: Don't exclude files matching PATTERN.
--filter=RULE: Add a file-filtering RULE.
--bwlimit=RATE: Limit I/O bandwidth; RATE is KBytes per second.
-b, --backup: Make backups (see also --backup-dir).
--backup-dir=DIR: Make backups into hierarchy based in DIR.
--update: Skip files that are newer on the receiver.
--max-size=SIZE: Skip files over SIZE bytes.
--min-size=SIZE: Skip files under SIZE bytes.
```

## Common Commands:
Basic Copy (Local to Local)
```bash
rsync -av source/ destination/
```
Copy with Compression
```bash
rsync -avz source/ user@host:destination/
```
Sync Directories (Preserve Partial Transfers for Large Files)
```bash
rsync -avP source/ destination/
```
Remote to Local
```bash
rsync -av user@remote_host:source/ destination/
```
Local to Remote
```bash
rsync -av source/ user@remote_host:destination/
```
Sync Two Directories While Deleting Files Not Present in Source
```bash
rsync -av --delete source/ destination/
```
Using Exclude/Include Filters
```bash
rsync -av --include="*.txt" --exclude="*" source/ destination/
```
Using a Filter File
```bash
rsync -av --filter='merge,filter.txt' source/ destination/
```
Dry Run to Preview Changes
```bash
rsync -avn source/ destination/
```

Tips:
Always use -n (dry run) first when you're unsure about what changes will be made, especially with --delete.
Use rsync over ssh for secure transfers by specifying -e ssh.
Be cautious with --delete; it does not move files to trash but deletes them permanently.
