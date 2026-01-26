# Claude Issue Generator for OffGrid Ops

This workflow automatically creates GitHub issues from your existing CLAUDE.md roadmap—no changes needed to your documentation structure.

## Your Format (Auto-Detected)

The workflow understands your current CLAUDE.md patterns:

```markdown
### 📋 Phase 6: Sync Engine (PENDING)

**Goals:** Robust bidirectional sync with conflict handling

- [ ] Design sync protocol (version vectors, timestamps)     → Creates issue
- [ ] `[P1]` Build /api/sync/push endpoint                   → Creates issue with priority-high label
- [x] Set up Express server                                   → Skipped (completed)
- [ ] Implement leaflet-offline for tile caching - OPTIONAL   → Skipped unless include_optional=true
```

**Recognized Patterns:**
| Pattern | Example | Result |
|---------|---------|--------|
| `### Phase X:` | `### Phase 6: Sync Engine` | Groups issues by phase |
| `(PENDING)` / `(COMPLETED)` | `(PENDING)` | Only processes PENDING phases |
| `**Labels:**` | `**Labels:** \`phase-6\`, \`sync\`` | Applies these labels |
| `- [ ]` | `- [ ] Build sync queue` | Creates issue |
| `- [x]` | `- [x] Set up server` | Skipped |
| `[P0-3]` | `[P1]` | Sets priority label |
| `[BUG]` | `[BUG] Fix ID mismatch` | Adds `bug` label |
| `[TECH-DEBT]` | `[TECH-DEBT] Refactor` | Adds `tech-debt` label |
| `- OPTIONAL` | `... - OPTIONAL` | Adds `optional` label, filtered by default |

## Quick Start

### 1. Add the Workflow

```bash
mkdir -p .github/workflows
cp claude-issue-generator-offgrid.yml .github/workflows/claude-issue-generator.yml
```

### 2. Add Your API Key

Go to **Settings → Secrets → Actions** and add:
- Name: `ANTHROPIC_API_KEY`
- Value: Your Anthropic API key

### 3. Run a Dry Run First!

1. Go to **Actions** tab
2. Select **Claude Issue Generator**
3. Click **Run workflow**
4. Keep `dry_run: true` (default)
5. Review the output before creating real issues

## Usage Examples

### From the Actions Tab

**Preview all Phase 6 issues:**
```
dry_run: true
phase: Phase 6
include_optional: false
min_priority: 3
```

**Create only high-priority Phase 6 issues:**
```
dry_run: false
phase: Phase 6
include_optional: false
min_priority: 1  # Only P0 and P1
```

**Generate issues for all pending phases:**
```
dry_run: false
phase: all
include_optional: false
min_priority: 3
```

### From Issue Comments

```
@claude generate issues                      # All pending phases (dry run)
@claude generate issues for Phase 6          # Just Phase 6
@claude generate issues for Phase 6 --dry-run # Preview Phase 6
@claude generate issues preview              # Dry run mode
```

## What Gets Created

Based on your current CLAUDE.md, here's what Phase 6 would generate:

| Title | Labels | Priority |
|-------|--------|----------|
| [Phase 6] Design sync protocol with version vectors | phase-6, enhancement | P2 |
| [Phase 6] Build /api/sync/push endpoint | phase-6, enhancement | P2 |
| [Phase 6] Build /api/sync/pull endpoint | phase-6, enhancement | P2 |
| [Phase 6] Implement sync queue in Dexie | phase-6, enhancement | P2 |
| [Phase 6] Build SyncStatus component | phase-6, enhancement | P2 |
| [Phase 6] Implement background sync via service worker | phase-6, enhancement | P2 |
| [Phase 6] Build conflict detection and resolution UI | phase-6, enhancement | P2 |
| [Phase 6] Handle image sync | phase-6, enhancement | P2 |
| [Phase 6] Implement account-level sync | phase-6, enhancement | P2 |
| [Phase 6] Add retry logic with exponential backoff | phase-6, enhancement | P2 |

**From Known Issues section:**
| Title | Labels | Priority |
|-------|--------|----------|
| [Bug] SQLite migrations need rollback support | bug | P2 |
| [Tech Debt] Refactor gear repository to use Result type | tech-debt | P2 |
| [Tech Debt] Add error boundaries to widget tree | tech-debt | P2 |

## Issue Body Format

Each created issue includes:

```markdown
## Description
Build /api/sync/push endpoint for uploading local changes to the server.

## Context
- **Phase:** Phase 6: Sync Engine
- **Priority:** P2 (Medium)
- **Target:** Not specified

## Acceptance Criteria
- [ ] Endpoint accepts batched changes from client
- [ ] Validates data integrity before persisting
- [ ] Returns sync status and any conflicts
- [ ] Tests pass
- [ ] API documentation updated

## Related
- Part of: Phase 6 - Sync Engine
- Depends on: Sync protocol design

---
*Auto-generated from CLAUDE.md roadmap*
```

## Customization

### Add Phase Labels

The workflow creates labels automatically, but you can pre-create them with custom colors:

```bash
gh label create "phase-6" --description "Phase 6: Sync Engine" --color "1D76DB"
gh label create "phase-7" --description "Phase 7: Polish & PWA" --color "5319E7"
```

### Modify Priority Colors

Default priority label colors:
- `priority-critical` (P0): Red `#B60205`
- `priority-high` (P1): Orange `#D93F0B`
- `priority-medium` (P2): Yellow `#FBCA04`
- `priority-low` (P3): Green `#0E8A16`

### Filter by Section

To process only specific sections (like "Known Issues"), modify the workflow prompt or add a section filter input.

## Tips for Your CLAUDE.md

Your current format is great! A few optional enhancements:

### Add Priority Tags for Better Triage

```markdown
### 📋 Phase 6: Sync Engine (PENDING)

- [ ] `[P0]` Design sync protocol (version vectors, timestamps)
- [ ] `[P1]` Build /api/sync/push endpoint
- [ ] `[P1]` Build /api/sync/pull endpoint
- [ ] `[P2]` Implement sync queue in Dexie
- [ ] `[P2]` Build SyncStatus component
- [ ] `[P3]` Background sync via service worker - OPTIONAL
```

### Add Explicit Labels Line

```markdown
### 📋 Phase 6: Sync Engine (PENDING)

**Goals:** Robust bidirectional sync with conflict handling
**Labels:** `phase-6`, `sync`, `offline-first`
**Target:** Q1 2026
```

### Use Sub-items for Complex Tasks

```markdown
- [ ] `[P1]` Implement conflict detection and resolution UI
  - [ ] Detect conflicts on sync pull
  - [ ] Display conflict diff view
  - [ ] Allow user to choose resolution strategy
  - [ ] Implement "theirs", "mine", "merge" options
```

These become a single issue with a checklist in the body.

## Troubleshooting

### "No issues created"
- Check that the phase status is `(PENDING)` not `(COMPLETED)`
- Verify items use `- [ ]` not `- [x]`
- Run with `include_optional: true` if your items are marked optional

### "Duplicate issues created"
- The workflow searches by keywords—very similar titles may not match
- Consider adding unique identifiers to tasks

### "Labels not applied"
- Ensure the `**Labels:**` line uses backticks: `` `label-name` ``
- The workflow will create missing labels automatically

### "Workflow times out"
- Large CLAUDE.md files may take longer to process
- Increase `timeout_minutes` or filter by phase

## Cost Estimate

Each run makes API calls to Anthropic:
- Dry run (preview): ~$0.05-0.10
- Full Phase 6 generation: ~$0.10-0.20
- All phases: ~$0.30-0.50

Use dry run mode to preview before committing!

---

## Related Workflows

Once issue generation is working, consider these additions:

| Workflow | Purpose |
|----------|---------|
| `claude-pr-review.yml` | Auto-review PRs for code quality |
| `claude-issue-impl.yml` | `@claude implement this` to turn issues into PRs |
| `claude-sync-roadmap.yml` | Update CLAUDE.md when issues are closed |

These would complete the loop: CLAUDE.md → Issues → PRs → CLAUDE.md updates.
