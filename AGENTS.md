# MEYYA Codex Agent Policy

This file documents how future Codex sessions should split work for this repo while keeping cost, safety, and production quality in balance.

## Primary Operator

Use the main frontier model for final responsibility, product judgment, and any change that can affect money, customer data, auth, payment, inventory, production D1 schema, or deployment safety.

Recommended model: `gpt-5.5` with `high` reasoning for complex changes, `xhigh` only for migrations, security-sensitive flows, or ambiguous production incidents.

Primary operator responsibilities:

- Read the existing implementation before changing behavior.
- Keep edits scoped and avoid unrelated refactors.
- Protect user changes in the worktree; never revert unrelated edits.
- Own final integration, lint/build verification, and user-facing summary.
- Decide whether a task is safe to delegate.

## Subagents

Subagents are optional helpers for bounded work. They should receive a concrete task, a disjoint write scope, and a reminder that other agents or the user may also have edits in the repo.

Reusable job descriptions live in `.agents/subagents/`:

- `.agents/subagents/frontend-ui-worker.md`
- `.agents/subagents/docs-roadmap-worker.md`
- `.agents/subagents/api-schema-reviewer.md`
- `.agents/subagents/qa-verifier.md`

### frontend-ui-worker

Recommended model: `gpt-5.4-mini` with `high` reasoning.

Best for:

- Focused React component updates.
- Tailwind styling fixes.
- Tooltip placement, labels, icons, responsive polish.
- Small accessibility improvements.

Avoid using for:

- Checkout payment logic.
- Auth roles.
- Database writes.
- Cross-page state contracts.

### docs-roadmap-worker

Recommended model: `gpt-5.4-mini` with `high` reasoning.

Best for:

- Updating `docs/MEYYA_IMPROVEMENT.md`.
- Maintaining roadmap/status docs.
- Writing checklists after implementation.
- Auditing copy for typo and wording consistency.

Avoid using for:

- Making product decisions without owner review.
- Editing production code and docs in the same pass unless explicitly assigned.

### api-schema-reviewer

Recommended model: `gpt-5.4` with `high` reasoning.

Best for:

- Reviewing API edge cases.
- Checking D1 query shape.
- Inspecting migration impact.
- Looking for missing validation and response errors.

Use the primary operator instead when:

- A migration touches production tables with customer/order/payment data.
- A change can lose stock, money, or PII.
- Cloudflare tokens/secrets are involved.

### qa-verifier

Recommended model: `gpt-5.4-mini` with `high` reasoning.

Best for:

- Running lint/build/test commands.
- Comparing expected behavior against changed files.
- Producing a short verification checklist.

Avoid using for:

- Fixing broad failures without a bounded ownership area.

## Cost Policy

Use cheaper subagents for repetitive UI patches, docs, read-only audits, and independent verification. Keep frontier reasoning for architecture, security, schema, checkout, voucher rules, finance calculations, R2/D1 storage behavior, and final integration.

`gpt-5.4 nano` is not available in the current Codex model override list for this workspace. If it becomes available later, only route low-risk read-only scans or copy audits to it.

## Delegation Rules

- Do not delegate the immediate blocker if the next local step depends on it.
- Give every subagent a narrow objective and explicit file ownership.
- Do not assign overlapping write scopes to parallel subagents.
- Tell subagents they are not alone in the codebase and must not revert others' edits.
- Review subagent changes before finalizing.
- Keep secrets out of prompts, docs, and committed files.
