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

## Tips and Best Practices

### Basic Safety
- Always use -n (dry run) first when you're unsure about what changes will be made, especially with --delete.
- Use rsync over ssh for secure transfers by specifying -e ssh.
- Be cautious with --delete; it does not move files to trash but deletes them permanently.

## Productivity Tips

### 1. Trailing Slashes Matter!
```bash
rsync -av /source/ /destination/   # Copies contents of source
rsync -av /source /destination/    # Copies source directory itself
```
**Rule:** Trailing slash on source = copy contents; no slash = copy directory.

### 2. Resume Interrupted Transfers
```bash
rsync -avP source/ destination/
```
The `-P` flag is crucial for large transfers - it shows progress AND keeps partial files.

### 3. Bandwidth Throttling for Production Systems
```bash
rsync -av --bwlimit=1000 source/ user@host:destination/
```
Limit to 1000 KBytes/sec to avoid saturating network during business hours.

### 4. Exclude Multiple Patterns
```bash
rsync -av \
  --exclude='node_modules' \
  --exclude='*.log' \
  --exclude='.git' \
  --exclude='dist/' \
  source/ destination/
```

### 5. Using an Exclude File
Create `.rsync-exclude`:
```
node_modules/
.git/
*.log
.DS_Store
*.tmp
```
Then use:
```bash
rsync -av --exclude-from='.rsync-exclude' source/ destination/
```

### 6. Include/Exclude Patterns for Selective Sync
```bash
# Only sync .txt and .pdf files
rsync -av --include='*.txt' --include='*.pdf' --exclude='*' source/ dest/

# Sync everything except large files
rsync -av --exclude='*.iso' --exclude='*.mp4' source/ dest/
```

### 7. Sync with Backup of Changed Files
```bash
rsync -av --backup --backup-dir=../backup-$(date +%Y%m%d) source/ dest/
```
Changed files are moved to backup directory before being overwritten.

### 8. Compare Directories Before Syncing
```bash
rsync -avni source/ destination/
```
The `-n` (dry-run) and `-i` (itemize changes) flags show exactly what would change.

### 9. Speed Up Transfers with Compression
```bash
rsync -avz source/ user@remote:destination/
```
Use `-z` for slow connections. Skip it for fast local networks (compression overhead).

### 10. Preserve Everything (Complete Backup)
```bash
rsync -aHAXv --numeric-ids source/ destination/
```
- `-H`: Preserve hard links
- `-A`: Preserve ACLs
- `-X`: Preserve extended attributes
- `--numeric-ids`: Keep user/group IDs (useful for system backups)

### 11. Sync Only Newer Files
```bash
rsync -avu source/ destination/
```
The `-u` flag skips files that are newer on the receiver.

### 12. Limit Transfer Rate and Show Progress
```bash
rsync -avP --bwlimit=5000 source/ user@host:destination/
```
Perfect for large backups during work hours.

### 13. Delete After Transfer (Safer)
```bash
rsync -av --delete-after source/ destination/
```
Files are deleted after the transfer completes (safer than default --delete-before).

### 14. Remote to Remote Sync
```bash
rsync -av user1@host1:source/ user2@host2:destination/
```
Note: Data goes through your local machine, so it's not as efficient as direct transfer.

### 15. Sync with SSH on Custom Port
```bash
rsync -av -e "ssh -p 2222" source/ user@host:destination/
```

### 16. Show Transfer Statistics
```bash
rsync -av --stats source/ destination/
```
Displays useful statistics about the transfer at the end.

### 17. Sync with Checksum (More Accurate)
```bash
rsync -avc source/ destination/
```
The `-c` flag compares by checksum instead of timestamp/size (slower but more accurate).

## Advanced Use Cases

### Incremental Backups
```bash
#!/bin/bash
# Create dated backup with hardlinks to previous backup
DEST=/backups
CURRENT=$DEST/current
BACKUP=$DEST/backup-$(date +%Y%m%d-%H%M%S)

rsync -av --delete --link-dest=$CURRENT /source/ $BACKUP/
rm -f $CURRENT
ln -s $BACKUP $CURRENT
```

### Mirror Website with Permissions
```bash
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --chown=www-data:www-data \
  ~/project/ user@server:/var/www/html/
```

### Sync Database Dumps
```bash
rsync -av --remove-source-files \
  /tmp/db-dumps/ user@backup-server:/backups/databases/
```
Moves files after successful transfer.

### Continuous Sync with Watch
```bash
while true; do
  rsync -av --delete source/ destination/
  sleep 60
done
```
Or use `fswatch`/`inotify` for more efficient monitoring.

### Parallel Rsync for Multiple Directories
```bash
#!/bin/bash
# Sync multiple directories in parallel
dirs=("dir1" "dir2" "dir3")
for dir in "${dirs[@]}"; do
  rsync -av "source/$dir/" "destination/$dir/" &
done
wait
echo "All syncs complete"
```

## Common Rsync Scenarios

### Scenario 1: Development to Production
```bash
# Dry run first
rsync -avnc --delete \
  --exclude='.env' \
  --exclude='node_modules' \
  ~/project/ user@prod:/var/www/app/

# If looks good, remove -n
rsync -avc --delete \
  --exclude='.env' \
  --exclude='node_modules' \
  ~/project/ user@prod:/var/www/app/
```

### Scenario 2: Daily Backups with Rotation
```bash
#!/bin/bash
DATE=$(date +%A)  # Monday, Tuesday, etc.
rsync -av --delete \
  --link-dest=/backups/latest \
  /source/ /backups/$DATE/
ln -snf /backups/$DATE /backups/latest
```

### Scenario 3: Sync Only Modified Files (Quick Deploy)
```bash
rsync -avzu --progress \
  --exclude='*.log' \
  ./dist/ user@server:/var/www/html/
```

## Performance Optimization

### 1. Use -W for Fast Local Networks
```bash
rsync -avW source/ destination/
```
Skip delta-transfer algorithm for whole file transfers (faster on fast networks).

### 2. Increase Batch Size
```bash
rsync -av --max-size=100M source/ destination/
```
Skip large files that rarely change.

### 3. Use Multiple Connections
```bash
# Install and use parallel
ls source/ | parallel -j 4 rsync -av source/{} destination/
```

### 4. Optimize for SSD Destinations
```bash
rsync -av --no-whole-file source/ destination/
```

## Troubleshooting

### Permission Denied Errors
```bash
# If you have sudo on remote
rsync -av --rsync-path="sudo rsync" source/ user@host:destination/
```

### Handle Spaces in Filenames
```bash
rsync -av "source dir/" "destination dir/"
```
Always quote paths with spaces.

### Check What's Taking Space
```bash
rsync -av --stats --dry-run source/ destination/ | grep "Total file size"
```

### Verify Transfer Integrity
```bash
rsync -av --checksum source/ destination/
```

## Rsync vs Other Tools

- **rsync vs scp**: rsync is faster for updates (only transfers changes)
- **rsync vs cp**: rsync can resume, shows progress, works over network
- **rsync vs tar**: rsync preserves incremental state better
- **rsync vs cloud sync**: rsync gives you full control, works anywhere
