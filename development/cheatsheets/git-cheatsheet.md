# Git Command Cheat Sheet

## Getting Started

### Initialize a Repository
```bash
git init
```
Create a new Git repository in the current directory.

### Clone a Repository
```bash
git clone <repository-url>
git clone <repository-url> <directory-name>
```
Clone a remote repository to your local machine.

### Configure Git
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --list
```
Set up your identity and view configuration.

## Basic Workflow

### Check Status
```bash
git status
git status -s  # Short format
```
View the status of your working directory and staging area.

### Add Files
```bash
git add <file>
git add .  # Add all changes
git add -A  # Add all changes including deletions
git add -p  # Interactive staging
```
Stage changes for commit.

### Commit Changes
```bash
git commit -m "Commit message"
git commit -am "Message"  # Add and commit tracked files
git commit --amend  # Amend the last commit
git commit --amend --no-edit  # Amend without changing message
```
Save your staged changes to the repository.

### View History
```bash
git log
git log --oneline  # Condensed view
git log --graph --oneline --all  # Visual branch graph
git log -p  # Show patches (diffs)
git log --since="2 weeks ago"
git log --author="Name"
git log --grep="search term"
```
View commit history.

## Branching and Merging

### Branch Management
```bash
git branch  # List local branches
git branch -a  # List all branches (local + remote)
git branch <branch-name>  # Create new branch
git branch -d <branch-name>  # Delete branch (safe)
git branch -D <branch-name>  # Force delete branch
git branch -m <old-name> <new-name>  # Rename branch
```
Create and manage branches.

### Switch Branches
```bash
git checkout <branch-name>
git checkout -b <new-branch>  # Create and switch
git switch <branch-name>  # Modern alternative
git switch -c <new-branch>  # Create and switch
```
Navigate between branches.

### Merging
```bash
git merge <branch-name>
git merge --no-ff <branch-name>  # Create merge commit
git merge --squash <branch-name>  # Squash all commits
```
Combine branches.

### Rebasing
```bash
git rebase <branch>
git rebase -i HEAD~<n>  # Interactive rebase last n commits
git rebase --continue  # Continue after resolving conflicts
git rebase --abort  # Cancel rebase
```
Reapply commits on top of another branch.

## Remote Repositories

### Remote Management
```bash
git remote -v  # List remotes
git remote add <name> <url>  # Add remote
git remote remove <name>  # Remove remote
git remote rename <old> <new>  # Rename remote
git remote set-url <name> <new-url>  # Change remote URL
```
Manage remote repositories.

### Fetching and Pulling
```bash
git fetch  # Download objects and refs
git fetch --all  # Fetch from all remotes
git fetch --prune  # Remove deleted remote branches
git pull  # Fetch and merge
git pull --rebase  # Fetch and rebase
```
Get changes from remote repositories.

### Pushing
```bash
git push
git push -u origin <branch>  # Set upstream and push
git push --all  # Push all branches
git push --tags  # Push all tags
git push --force-with-lease  # Safer force push
git push origin --delete <branch>  # Delete remote branch
```
Upload local changes to remote.

## Undoing Changes

### Discard Changes
```bash
git checkout -- <file>  # Discard unstaged changes
git restore <file>  # Modern alternative
git restore --staged <file>  # Unstage file
git clean -fd  # Remove untracked files and directories
git clean -fdn  # Dry run
```
Revert working directory changes.

### Reset
```bash
git reset <file>  # Unstage file
git reset --soft HEAD~1  # Undo commit, keep changes staged
git reset --mixed HEAD~1  # Undo commit, unstage changes
git reset --hard HEAD~1  # Undo commit, discard changes
```
Move HEAD and optionally modify staging area and working directory.

### Revert
```bash
git revert <commit-hash>
git revert HEAD  # Revert last commit
git revert --no-commit <commit-hash>  # Revert without committing
```
Create new commit that undoes changes from a previous commit.

## Stashing

### Save and Apply Changes
```bash
git stash  # Save changes temporarily
git stash save "Description"  # Save with message
git stash list  # List all stashes
git stash apply  # Apply most recent stash
git stash apply stash@{n}  # Apply specific stash
git stash pop  # Apply and remove stash
git stash drop stash@{n}  # Delete specific stash
git stash clear  # Delete all stashes
git stash show -p  # Show stash diff
```
Temporarily store modified tracked files.

## Tagging

### Create and Manage Tags
```bash
git tag  # List tags
git tag <tag-name>  # Create lightweight tag
git tag -a <tag-name> -m "Message"  # Create annotated tag
git tag -d <tag-name>  # Delete local tag
git push origin <tag-name>  # Push tag to remote
git push origin --tags  # Push all tags
git push origin --delete <tag-name>  # Delete remote tag
```
Mark specific points in repository history.

## Differences and Comparisons

### View Differences
```bash
git diff  # Show unstaged changes
git diff --staged  # Show staged changes
git diff HEAD  # Show all uncommitted changes
git diff <branch1> <branch2>  # Compare branches
git diff <commit1> <commit2>  # Compare commits
git diff --stat  # Show file change statistics
```
Compare changes between commits, branches, and working directory.

## Inspection and Search

### Show Commit Details
```bash
git show <commit-hash>
git show <commit-hash>:<file>  # Show file at specific commit
git show --stat <commit-hash>  # Show commit statistics
```
Display information about commits.

### Search
```bash
git grep "search term"  # Search working directory
git grep "search term" <branch>  # Search specific branch
git log -S "search term"  # Find commits that added/removed term
git blame <file>  # Show who changed each line
```
Find content and track changes.

### Find Commits
```bash
git bisect start  # Start binary search
git bisect bad  # Mark current commit as bad
git bisect good <commit>  # Mark commit as good
git bisect reset  # End bisect session
```
Use binary search to find which commit introduced a bug.

## Advanced Operations

### Cherry-Pick
```bash
git cherry-pick <commit-hash>
git cherry-pick <commit1> <commit2>  # Pick multiple commits
git cherry-pick --continue  # Continue after conflict
git cherry-pick --abort  # Cancel cherry-pick
```
Apply specific commits from one branch to another.

### Reflog
```bash
git reflog  # Show reference logs
git reflog show <branch>  # Show reflog for specific branch
```
View history of HEAD movements (useful for recovering lost commits).

### Submodules
```bash
git submodule add <url> <path>  # Add submodule
git submodule init  # Initialize submodules
git submodule update  # Update submodules
git submodule update --remote  # Update to latest remote
```
Manage repositories within repositories.

### Worktree
```bash
git worktree add <path> <branch>  # Create new worktree
git worktree list  # List all worktrees
git worktree remove <path>  # Remove worktree
```
Work on multiple branches simultaneously.

## Configuration Tips

### Useful Aliases
Add these to your `.gitconfig` file or use `git config --global alias.<name> <command>`:

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.lg "log --graph --oneline --decorate --all"
git config --global alias.undo 'reset --soft HEAD~1'
```

### Improve Git Output
```bash
git config --global color.ui auto  # Colorize output
git config --global core.pager 'less -R'  # Better paging
git config --global help.autocorrect 1  # Auto-correct mistyped commands
```

## Productivity Tips

### 1. Use .gitignore Effectively
Create a `.gitignore` file to exclude files you don't want to track:
```bash
# Dependencies
node_modules/
*.log

# Environment files
.env
.env.local

# Build outputs
dist/
build/
```

### 2. Interactive Staging
Use `git add -p` to review and stage changes in chunks. This helps create more focused commits.

### 3. Commit Message Convention
Follow a consistent commit message format:
```
<type>(<scope>): <subject>

<body>

<footer>
```
Types: feat, fix, docs, style, refactor, test, chore

### 4. Keep Commits Small and Focused
Each commit should represent a single logical change. This makes:
- Code reviews easier
- Debugging simpler (git bisect)
- Reverting changes safer

### 5. Use Git Hooks
Automate tasks with hooks (`.git/hooks/`):
- `pre-commit`: Run linters/formatters
- `commit-msg`: Validate commit messages
- `pre-push`: Run tests before pushing

### 6. Leverage Git Worktrees
Instead of stashing or switching branches frequently, use worktrees to work on multiple branches simultaneously:
```bash
git worktree add ../feature-branch feature-branch
```

### 7. Use --force-with-lease Instead of --force
When you must force push, use `--force-with-lease` to avoid overwriting others' work:
```bash
git push --force-with-lease
```

### 8. Quick Branch Switching
Switch to previous branch:
```bash
git checkout -  # or git switch -
```

### 9. Find Which Commit Changed a Line
```bash
git blame -L <start>,<end> <file>
git log -L <start>,<end>:<file>  # Show history of line range
```

### 10. Recover Lost Work
If you accidentally deleted a commit:
```bash
git reflog  # Find the commit hash
git checkout <commit-hash>  # Or create a branch from it
```

### 11. Speed Up Git Operations
```bash
git config --global core.preloadindex true
git config --global core.fscache true
git config --global gc.auto 256
```

### 12. Use Git Attributes
Create a `.gitattributes` file to handle line endings and diff drivers:
```
* text=auto
*.js text eol=lf
*.png binary
```

### 13. Better Conflict Resolution
```bash
git config --global merge.conflictstyle diff3
```
This shows the common ancestor in conflicts, making resolution easier.

### 14. Partial Clone for Large Repositories
```bash
git clone --filter=blob:none <url>  # Clone without file contents
git clone --depth=1 <url>  # Shallow clone
```

### 15. Search Commit History Efficiently
```bash
git log --all --full-history -- <file>  # Find all commits touching a file
git log -S "function_name" --source --all  # Find when text was added/removed
```

## Common Workflows

### Feature Branch Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Update with main branch
git fetch origin
git rebase origin/main

# Push feature branch
git push -u origin feature/new-feature

# After PR is merged, cleanup
git checkout main
git pull
git branch -d feature/new-feature
```

### Hotfix Workflow
```bash
# Create hotfix from production
git checkout -b hotfix/critical-bug main

# Fix and commit
git add .
git commit -m "fix: resolve critical bug"

# Merge to main
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix v1.0.1"

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-bug

# Cleanup
git branch -d hotfix/critical-bug
```

### Release Workflow
```bash
# Create release branch
git checkout -b release/v1.0.0 develop

# Bump version and commit
# Update CHANGELOG.md
git commit -am "chore: prepare v1.0.0 release"

# Merge to main
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.0.0

# Cleanup
git branch -d release/v1.0.0
```

## Emergency Commands

### Undo Last Push (Before Others Pull)
```bash
git reset --hard HEAD~1
git push --force-with-lease
```

### Recover Deleted Branch
```bash
git reflog
git checkout -b <branch-name> <commit-hash>
```

### Remove Sensitive Data
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch <file>" \
  --prune-empty --tag-name-filter cat -- --all
```
Or use `git-filter-repo` (recommended modern alternative).

### Fix Wrong Branch
```bash
# If you committed to wrong branch
git reset HEAD~1 --soft
git stash
git checkout correct-branch
git stash pop
git add .
git commit -m "Your message"
```

## Best Practices

1. **Commit often, push less**: Make frequent local commits but batch your pushes
2. **Write descriptive commit messages**: Future you will thank present you
3. **Review before committing**: Use `git diff --staged` before committing
4. **Pull before push**: Always pull latest changes before pushing
5. **Use branches**: Never commit directly to main/master
6. **Keep main/master deployable**: Production branch should always work
7. **Delete merged branches**: Clean up branches after merging
8. **Use tags for releases**: Mark important milestones with annotated tags
9. **Protect sensitive data**: Never commit secrets, API keys, or passwords
10. **Learn to rebase**: Keep history clean with interactive rebasing

## Troubleshooting

### Fix Detached HEAD
```bash
git checkout <branch-name>  # Return to a branch
# Or create a branch from current position
git checkout -b <new-branch-name>
```

### Merge Conflicts
```bash
# See conflicted files
git status

# Resolve conflicts in files, then:
git add <resolved-files>
git commit

# Or abort merge
git merge --abort
```

### Undo Merge
```bash
# If not pushed yet
git reset --merge ORIG_HEAD

# If already pushed
git revert -m 1 <merge-commit-hash>
```

### Large File Issues
```bash
# Remove large file from history
git filter-branch --tree-filter 'rm -f <large-file>' HEAD

# Or use BFG Repo-Cleaner (faster)
bfg --delete-files <large-file>
```

This cheat sheet covers essential Git commands and workflows for daily development work. Adjust commands and workflows to match your team's specific practices and needs.

