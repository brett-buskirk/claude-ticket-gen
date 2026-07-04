# Contributing

- **No direct commits to `main`** — branch → PR (`gh pr create`) → green checks → merge.
- **AgentGate runs on every PR** — `secrets` + `dangerous_patterns` block; `scope` is advisory.
- **Commits are signed & Verified**; never commit secrets (`.env`, keys are gitignored).
- Branch naming: `feat/…`, `fix/…`, `docs/…`, `chore/…`.

## Local development

This is a TypeScript CLI. To build and run it locally:

```bash
npm install
npm run build          # compile with tsc to dist/
npm run dev -- generate --dry-run   # run from source via tsx
npm link               # expose the `claude-ticket-gen` binary globally for testing
```

There is no automated test suite yet; verify changes with `--dry-run` against a sample roadmap before opening a PR.
