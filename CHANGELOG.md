# Changelog

All notable changes to claude-ticket-gen are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/brett-buskirk/claude-ticket-gen/compare/v1.0.5...HEAD
[1.0.5]: https://github.com/brett-buskirk/claude-ticket-gen/releases/tag/v1.0.5
