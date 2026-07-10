# Roadmap

`claude-ticket-gen` is a published, working CLI (npm: `claude-gh-ticket-gen`, currently
**v1.1.0**). It parses roadmap/planning documents with Claude AI and creates structured
GitHub issues. The core workflow is stable, and the model is now configurable (`--model`,
a `model` config key, and a `models` command that lists what's available live).

The items below are concrete next steps to harden and extend it. Each is a real gap in the
current code, grouped by theme with a rough priority. This file also doubles as sample
input for the tool itself.

## Testing & CI

- [ ] Add a unit test suite with Vitest covering the pure logic (P1). The `test` script is still a placeholder.
  - Parser response handling: JSON extraction, the incomplete-response salvage path, and task validation defaults.
  - Duplicate detector: the Jaccard similarity scoring and stop-word tokenizer.
  - Config manager: the default-merge and `--model` > config > default precedence.
  - Models: the pagination loop over `GET /v1/models`.
- [ ] Add a CI workflow that runs on every pull request (P1): type-check with `tsc --noEmit`, build, and the test suite. Only AgentGate and the publish workflow run today.
- [ ] Add ESLint and Prettier with a `lint` script, and wire linting into CI (P2). No linter or formatter is configured.
- [ ] Add fixture roadmaps covering each supported format — checkbox, numbered, bullet, and plain prose — and assert the parser extracts them (P2).

## Features

- [ ] Fix: apply the extracted milestone to created issues, not just the issue body (P1). Milestone metadata is currently rendered into the body text but never set as the real GitHub milestone, so it silently drops.
- [ ] Add `--assignee` and `--milestone` passthrough flags to `generate`, with matching config defaults (P1).
- [ ] Add a sync mode that updates or closes existing issues when the roadmap changes, instead of only creating new ones and skipping duplicates (P2).
- [ ] Support custom issue-body templates and label schemes beyond the built-in priority/type set (P2). The issue template is currently hardcoded.
- [ ] Add a `--json` plan-export option that writes the parsed tasks to a file for review or diffing before any issues are created (P2).
- [ ] Let the `init` wizard pick the default model from the live models list (P3). The wizard doesn't touch the `model` setting added in 1.1.0.
- [ ] Validate `--model` against the live models list and warn on an unknown id, instead of failing later with a raw 404 (P3).

## Robustness & security

- [ ] Harden GitHub command construction against injection (P1). Issue titles, labels, and search queries derived from model output are interpolated into shell strings passed to `execSync`; switch to argument arrays via `execFileSync`, or move to the GitHub API.
- [ ] Fetch repository labels once per run instead of re-listing them for every issue (P2). `createIssue` calls `gh label list` on each issue, which is redundant work and extra API calls on large roadmaps.
- [ ] Handle GitHub rate limits and large batches gracefully, with backoff and a resumable run (P2).
- [ ] Automatically chunk very long roadmaps so the model response never truncates, removing the need to reach for `--filter-phase` by hand (P2).
- [ ] Surface clearer, actionable errors for a missing or invalid Anthropic API key and for `gh` auth state (P3).

## Maintenance

- [ ] Upgrade `@anthropic-ai/sdk` from the pinned 0.30 to a current release, and drop the low-level `client.get` shim in `models.ts` in favor of the SDK's native models resource (P2).
- [ ] Revisit the Node engine floor — currently `>=18`, which is end-of-life — and bump `@types/node` now that CI publishes on Node 24 (P3).
- [ ] Resolve the repo / npm / binary naming split (tracked in [#26](https://github.com/brett-buskirk/claude-ticket-gen/issues/26)) (P3).

---

Have an idea or hit a limitation? Open an issue:
https://github.com/brett-buskirk/claude-ticket-gen/issues
