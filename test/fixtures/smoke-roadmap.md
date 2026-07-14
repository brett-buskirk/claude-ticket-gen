# Smoke Test Roadmap

A tiny fixture used only by the weekly smoke-test workflow to exercise the live
parse path (Anthropic API → configured model → JSON parsing). Not a real roadmap;
keep it small so the scheduled run stays cheap.

## Phase 1

- [ ] Add a health check endpoint (P1)
- [ ] Fix the request timeout on slow uploads (P2, bug)
- [ ] Document the configuration options (P3)
