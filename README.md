# handoff

A Claude Code mod that adds `/handoff`. It writes a handoff note so a fresh Claude session can pick up the work.

It gathers the git branch, the last 10 commits, `git status --short` and the open PR (via `gh`, if any), then asks the model to write the note from those facts plus the current conversation. The note has a `# Handoff: <topic>, <date>` title and Done / Next / Gotchas sections.

The note is saved to `<git root>/.claude/handoffs/<YYYY-MM-DD>-<branch>.md`. The command prints the path and the line to start the next session with: `read <path>`.

## Install

```
/plugin install handoff --marketplace AliakbarNateghi/cc-handoff
```

Answer `y` to add the marketplace, then pick a scope.

## Options

- `dir`: the folder for notes, relative to the git root. Default: `.claude/handoffs`.
