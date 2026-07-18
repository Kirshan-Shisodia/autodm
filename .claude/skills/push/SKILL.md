---
name: push
description: Stage, commit, and push the current changes. Use when the user says "push", "push the code", "commit and push", or asks to ship the current working tree to the remote.
---

# Push

Stage the working tree, make one commit, and push to the remote.

## Steps

1. **Survey the changes** — run these in parallel:
   - `git status`
   - `git diff` (unstaged) and `git diff --staged`
   - `git log --oneline -10` to match the repo's commit message style

2. **Guard against secrets.** Before staging, check the change list for `.env*`,
   key files, tokens, or credentials. If any appear, stop and tell the user
   rather than staging them. Confirm they are covered by `.gitignore`.

3. **Stage.** `git add` the relevant files by path. Do not use `git add -A`
   unless the user asked for everything — untracked build output and local
   config should not slip in.

4. **Commit.** One commit, message written from the actual diff: a short summary
   line saying *why* the change exists, not a file list. End the message with:

   ```
   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

   Use a HEREDOC so the message formats correctly:

   ```bash
   git commit -m "$(cat <<'EOF'
   <summary line>

   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   EOF
   )"
   ```

5. **Push.**
   - If on `main`, ask the user before pushing — offer to branch instead.
   - First push of a new branch: `git push -u origin <branch>`.
   - Otherwise: `git push`.
   - Never use `--force`. If the push is rejected, report why and stop; don't
     rebase or overwrite without asking.

6. **Report** the commit SHA, the branch, and the remote it landed on. If a
   pre-commit hook modified files, amend and say so.

## Don't

- Don't create more than one commit unless the changes are clearly unrelated.
- Don't update git config, skip hooks (`--no-verify`), or amend someone else's commit.
- Don't open a PR unless asked — that's a separate request.
