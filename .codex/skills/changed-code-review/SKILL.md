---
name: changed-code-review
description: Review changed repository code using git diff or changed files. Use when asked to review recent changes, file-changed-based code, refactoring quality, component/module separation, naming clarity, code flow readability, maintainability, scalability, or performance in this project.
---

# Changed Code Review

## Overview

Use this skill to review only the changed code in the current repository. Focus on maintainability, extension cost, module boundaries, naming clarity, readability, and performance before style preferences.

## Workflow

1. Identify changed files with `git status --short` and `git diff --name-only`.
2. Read the relevant diff with `git diff -- <files>`.
3. Read surrounding files when needed to understand contracts, imports, state flow, or FSD boundaries.
4. Check the relevant project docs before judging architecture or component boundaries:
   - `docs/component-conventions.md`
   - `docs/project-design.md`
   - `docs/database-schema.md` when DB/Auth/RLS behavior is involved
   - feature `README.md` files for changed feature slices
5. Review from highest risk to lowest risk. Prioritize correctness, data ownership, auth/RLS safety, extension constraints, and user-visible regressions.

## Review Checklist

### Module Boundaries

- Verify FSD dependency direction: `app -> views -> widgets -> features -> entities -> shared`.
- Keep Server Actions in user-action feature slices.
- Keep domain-free UI in `shared/ui`; do not move domain-specific UI there.
- Keep entity APIs focused on a single domain. Cross-domain orchestration belongs in `features`, `widgets`, or `views`.
- For large UI files, check whether extracted components reduce real responsibility rather than adding indirection.

### Naming And Flow

- Prefer names that explain domain intent directly, such as `getCurrentTeamId`, `ensureDefaultTeamForUser`, or `OAuthLoginButton`.
- Flag names that encode implementation detail, future guesses, or ambiguous abbreviations.
- Check whether a reader can follow the main path top-to-bottom without jumping through unnecessary wrappers.
- Avoid single-use constants, helpers, or component splits unless they clarify a boundary or enable real reuse.
- Check component files follow `import -> Props/types -> primary exported component -> local constants/helpers`, so the public reading path appears before implementation details.
- Prefer object maps or config arrays for provider, status, and variant branches when JSX would otherwise rely on repeated ternaries.
- Check that each component file has one primary React component. Suggest splitting local helper components when they have their own props contract, UI responsibility, or state-dependent rendering.
- Prefer `Props` for component props types that are local to one file. Reserve `ComponentNameProps` for exported or reused props contracts.
- Check exported component JSDoc for useful policy, boundary, or product-flow context. Flag comments that merely restate the JSX or function name.

### Auth And Data Ownership

- Server Actions must authenticate/authorize through cookies/session-derived Supabase clients, not client-supplied user ids.
- Team-scoped data should resolve through current team APIs rather than repeating owner lookup logic.
- Trial/anonymous users should still follow the `auth.users -> teams.owner_user_id` ownership chain.
- Call out any code that bypasses RLS assumptions or creates a second data ownership model.

### UX And Component Quality

- Check that user-facing copy is friendly, direct, and consistent with the actual enabled features.
- Keep primary CTA order aligned with product decisions.
- Avoid text overflow and cramped controls on mobile.
- Ensure loading/disabled states exist where duplicate submission would be harmful.

### Performance

- Flag repeated Supabase queries inside loops when batch reads/writes are possible.
- Avoid unnecessary client state duplication of server data.
- Watch for expensive derived values recalculated on every render when memoization or pure helpers would be clearer.
- Do not recommend memoization for cheap work unless it also improves correctness or readability.

## Output Format

Lead with findings, ordered by severity.

Use this structure:

```txt
Findings
- [Severity] file:line - Issue, why it matters, and suggested fix.

Open Questions
- Any assumption that affects the review.

Summary
- Brief note on what looks sound and what was reviewed.

Verification
- Commands run or not run.
```

If no issues are found, say that clearly and mention remaining risk or unverified behavior.
