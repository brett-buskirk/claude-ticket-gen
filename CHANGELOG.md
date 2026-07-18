# Changelog

All notable changes to claude-ticket-gen are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-07-18

> ### ⚠️ Breaking: the minimum Node version is now 22.12
> Node 18 and 20 have both reached end-of-life, and this release's dependency majors — notably
> `commander` 15 — require Node **≥ 22.12** and can fail at runtime (not merely warn at install) on
> older versions. **Upgrade Node to 22.12 or newer before updating.** No CLI commands or flags
> changed; this release is purely a runtime-baseline and dependency refresh.

### Changed
- **BREAKING: raised the Node `engines` floor from `>=18` to `>=22.12`.** See the note above.
- Upgraded `@anthropic-ai/sdk` from 0.30 to 0.112. The `models` command now uses the SDK's native
  `models.list()` resource (the low-level `client.get('/v1/models')` shim is gone).
- Updated runtime dependency majors: `commander` 12 → 15 and `ora` 8 → 9.
- Updated dev dependencies: `@types/node` 20 → 26 and `tsx` to 4.23.1 (TypeScript held at 5.x).

### Added
- A required `build` (typecheck + `tsc`) CI gate on pull requests, so dependency and code changes
  are verified before merge.

## [1.1.0] - 2026-07-10

### Added
- Configurable Claude model via a new `model` config key, defaulting to `claude-haiku-4-5`.
- `generate --model <id>` flag to override the model for a single run (precedence: flag > config > default).
- `models` command (and a `--models` root-flag alias) that lists the models available to your API key, fetched live from the Anthropic API and marking the current default.

### Fixed
- Parsing no longer fails with a 404 from a hardcoded, since-retired model (`claude-sonnet-4-20250514`); the model is now resolved from config with a current default.

### Changed
- A bare invocation now prints help instead of exiting silently.

## [1.0.5] - 2026-01-27

### Fixed
- Phase filtering now correctly processes filtered sections without dropping tasks after parsing.
- Document pre-filtering reduces token usage and prevents truncation on large roadmaps.

### Added
- Screenshots in the documentation showing CLI output, generated GitHub issues, the config list, and individual issue detail.
- GitHub Actions workflow for automated npm publishing with provenance.
- Document-filtering utility for extracting specific phases from roadmaps.

### Improved
- Updated README with visual examples and screenshots.
- Better error messages for truncated responses.
- Reproducible builds via `package-lock.json`.

### Infrastructure
- CI/CD pipeline with automated npm publishing.
- Package provenance and attestation via GitHub Actions.

[Unreleased]: https://github.com/brett-buskirk/claude-ticket-gen/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/brett-buskirk/claude-ticket-gen/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/brett-buskirk/claude-ticket-gen/compare/v1.0.5...v1.1.0
[1.0.5]: https://github.com/brett-buskirk/claude-ticket-gen/releases/tag/v1.0.5
