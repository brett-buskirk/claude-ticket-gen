# Roadmap

`claude-ticket-gen` is a published, working CLI (npm: `claude-gh-ticket-gen`, currently
v1.0.5). It parses roadmap/planning documents with Claude AI and creates structured
GitHub issues. The core workflow is stable; the items below are concrete next steps to
harden and extend it.

## Testing & quality
- [ ] Add a real test suite (the `test` script is currently a placeholder) covering the parser, document filter, and duplicate detector.
- [ ] Wire tests and `tsc --noEmit` type-checking into a CI job that runs on every PR.
- [ ] Add fixture roadmaps exercising each supported format (checkbox, numbered, bullet, plain text).

## Features
- [ ] Support updating/closing existing issues from document changes, not just creating new ones.
- [ ] Allow custom issue templates and label schemes beyond the built-in priority/type set.
- [ ] Add a `--assignee` / `--milestone` passthrough for created issues.

## Robustness
- [ ] Improve large-document handling (chunking) so very long roadmaps never truncate the model response.
- [ ] Surface clearer, actionable errors for missing/invalid Anthropic API keys and `gh` auth state.

## Maintenance
- [ ] Keep `@anthropic-ai/sdk` and the default Claude model current as new versions ship.

Have an idea or hit a limitation? Open an issue:
https://github.com/brett-buskirk/claude-ticket-gen/issues
