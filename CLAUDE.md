# CLAUDE.md — claude-ticket-gen

Operating brief for the agent that maintains **claude-ticket-gen**. This is a **published, live npm
package**, not a greenfield build — treat it as an operating manual: understand what's here, keep the
published CLI working, and don't break a release. This file is the local source of truth; read it before
non-trivial changes.

## What it is
An AI-powered CLI that parses a roadmap/planning document with **Claude** and creates structured **GitHub
issues** from it (priorities, types, labels, duplicate detection, dry-run preview). TypeScript, shipped to
npm, driven through the `gh` CLI for the GitHub side.

- **npm package:** `claude-gh-ticket-gen` · **the command it installs:** `claude-ticket-gen`. ⚠️ **Two
  different names** — you install/update `claude-gh-ticket-gen`, you run `claude-ticket-gen`. Unifying them
  is tracked in **#26**; until then, keep both names correct in docs and don't "fix" one to match the other.
- **Current version:** v2.0.0 (see `CHANGELOG.md`). Public repo, MIT.
- **Live at:** https://www.npmjs.com/package/claude-gh-ticket-gen

## You operate under the estate's floors
This repo lives in Brett's estate (`~/github-repos`), so two higher-level files auto-load and **govern
everything here** — don't restate or override them:
- `/etc/claude-code/CLAUDE.md` — the machine-wide **managed policy** (safety, review, governance floors).
- `~/github-repos/CLAUDE.md` — the **Estate Steward manual**; its *Issue & PR conventions* apply to you
  directly (assignee `brett-buskirk`, labels, and linked in Linear).

Non-negotiables in short: **branch → PR → stop and let Brett merge** (never self-merge, never commit to
`main`); signed commits ending `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`; **never commit
secrets** (an Anthropic API key lives in local config / repo secrets, never in the tree); `brett-buskirk`
is the active `gh` account.

## Tech stack (don't change without a reason)
- **TypeScript**, ESM (`"type": "module"`), compiled with `tsc` → `dist/` (gitignored; built fresh in CI
  and on publish).
- **Node `engines: >=22.12.0`** — a hard floor as of v2.0.0 (commander 15 can fail at *runtime* on older
  Node, not just warn). CI, publish, and the smoke test all run on **Node 24**.
- **Deps:** `@anthropic-ai/sdk` (the Claude calls), `commander` (CLI), `inquirer` (the `init` wizard),
  `ora` (spinners), `chalk` (color), `cli-table3` (tables). Dev: `tsx` (run from source), `typescript`.
- Binary: `bin/claude-ticket-gen.js` → `dist/cli/index.js`.

## Commands
```bash
npm install
npm run build        # tsc → dist/
npm run dev -- generate --dry-run   # run from source via tsx (no build step)
npm start            # node dist/cli/index.js
npm link             # expose the `claude-ticket-gen` binary globally for testing
```
There is **no automated test suite yet** — `npm test` is a placeholder that exits 1 (a Vitest suite is
roadmap item, see `ROADMAP.md` / #39). Until it lands, the local gate is: **`npm run build` (must be
type-clean) + a `--dry-run` exercise** against a sample roadmap (e.g. `test/fixtures/smoke-roadmap.md`)
before opening a PR.

## Code layout
- `src/cli/index.ts` — the commander entry point: wires the `config`, `generate`, `init`, and `models`
  subcommands (plus a root `--models` convenience flag), lazy-importing each command module.
- `src/cli/commands/` — `config.ts`, `generate.ts`, `init.ts`, `models.ts` (one file per subcommand).
- `src/cli/ui.ts` — shared CLI presentation helpers.
- `src/core/` — the engine:
  - `parser.ts` — **the Claude call.** `parseDocument` / `parseDocumentContent` build the prompt, call
    `client.messages.create`, then extract + validate a JSON task array (with an incomplete-response
    salvage path). `parseWithRetry` adds exponential backoff, not retrying on 4xx.
  - `github.ts` — creates issues and manages labels via the `gh` CLI.
  - `models.ts` — lists models **live** via the SDK's `client.models.list()` (auto-paginated).
  - `duplicate-detector.ts` — Jaccard-similarity duplicate check against existing issues.
  - `config-manager.ts` — loads/merges config from `~/.config/claude-ticket-gen/config.json`.
  - `types.ts` — canonical types + `DEFAULT_MODEL`. Keep authoritative.
- `src/templates/` — `parsing-prompt.ts` (the instruction prompt sent to Claude) and `issue-template.ts`
  (the issue body). Prompt changes are behavior changes — exercise `--dry-run` after touching either.
- `src/utils/` — `document-filter.ts` (phase/priority/optional filtering), `logger.ts`, `validators.ts`.

## The Claude integration (this is a Claude API tool — get model handling right)
- The SDK is `@anthropic-ai/sdk`: `client.messages.create()` in `parser.ts`, `client.models.list()` in
  `models.ts`. **When you edit any code that calls Claude, follow the `claude-api` skill** for correct SDK
  usage and current model IDs — don't hand-write API shapes from memory.
- **Model precedence:** `generate --model <id>` > the `model` config key > **`DEFAULT_MODEL`** (currently
  `claude-haiku-4-5`, a cheap default fit for parsing). Preserve that precedence chain if you touch it.
- **Never ship a hardcoded model list.** `models` queries the live API on purpose — a stale in-code list is
  exactly what once let a *retired* model linger and 404 the tool. If you bump `DEFAULT_MODEL`, point it at
  a current, inexpensive model and verify it against `claude-ticket-gen models`.

## Workflows & CI (`.github/workflows/`)
- **`ci.yml`** — on PRs + pushes to `main`: `npm ci` → `tsc --noEmit` → `npm run build` (Node 24). The test
  step is commented out until the Vitest suite exists — **keep the build type-clean; that's the gate today.**
- **`publish.yml`** — triggers on a **`v*` tag**. Publishes to npm via **OIDC trusted publishing** (no
  `NPM_TOKEN`; provenance is automatic). It upgrades npm in-workflow because trusted publishing needs
  npm ≥ 11.5.1.
- **`scheduled-smoke.yml`** — weekly (Mondays 13:17 UTC) live smoke test against the **real** Anthropic API
  (`models` + a `--dry-run generate` on a fixture). Uses the `ANTHROPIC_API_KEY` repo secret. **A red run
  is the early-warning that prod rotted** (a retired model, an SDK/API change) — investigate promptly.
- **`agentgate.yml`** — the PR guardrail. `.agentgate.yml` sets `scope` to *warning* (solo-dev repo);
  **`secrets` and `dangerous_patterns` stay hard errors.**

## Cutting a release (deliberate, Brett-owned)
Publishing is **tag-triggered**, so a release is a distinct, intentional act — not a side effect of merging:
1. On a branch: bump `version` in `package.json` and move `CHANGELOG.md`'s `[Unreleased]` to the new
   version (call out any breaking change, as v2.0.0 did for the Node floor). Open a PR → **Brett merges.**
2. After merge, a **signed `vX.Y.Z` tag** on `main` is what publishes (drives `publish.yml`) — plus a
   GitHub Release. Treat pushing that tag as a release action Brett authorizes; don't tag speculatively.
Follow SemVer: a runtime-baseline or dependency-major bump that can break consumers is a **major** (that's
why the Node-floor change was 2.0.0).

## Gotchas
- **Two names** — `claude-gh-ticket-gen` (npm) vs `claude-ticket-gen` (command). Don't collapse them until
  #26 does it deliberately.
- **`dist/` is gitignored** — never commit build output; CI and publish rebuild it. `.npmignore` controls
  what actually ships in the package.
- **Shell-injection is a known open risk (`github.ts`, ROADMAP P1).** Model-derived strings (issue titles,
  labels, search queries) are interpolated into `execSync` command strings. When you work near this, move
  toward `execFileSync` with argument arrays (or the GitHub API) rather than adding more string
  interpolation — and note that AgentGate's `dangerous_patterns` rule may flag `execSync`-style additions.
- **Doc drift to reconcile:** `README.md`'s Prerequisites still say Node ">= 18.0.0" while `engines` (and
  the v2.0.0 breaking change) require **>= 22.12** — align the README when you next touch it.
- **The API key is read from config, not the environment,** by the generate path — mirror that if you add
  code that needs it (the smoke workflow configures it via `config set` for exactly this reason).

## Where to look
- `README.md` — full user-facing command/flag/config reference and the document-format spec.
- `ROADMAP.md` — the concrete next steps (testing/CI, features, robustness/security), each a real gap in
  the current code. Doubles as sample input for the tool itself.
- `CHANGELOG.md` — release history (Keep a Changelog + SemVer).
- `CONTRIBUTING.md` — the short branch/PR/AgentGate rules.
