---
name: git-writeup
description: Draft commit messages, commit split proposals, and pull request descriptions from changed files or git diff. Use when the user asks to organize commits, write commit messages, prepare PR content, summarize changes for review, or decide commit units before committing.
---

# Git Writeup

## Overview

Use this skill to turn changed files into clear commit units and PR descriptions. The goal is for future readers to understand what changed, why the change exists, and how the flow or structure moved.

Never create a commit before the user approves the commit unit and message.

## Review Inputs

Before drafting, inspect:

1. `git status --short`
2. `git diff --name-only`
3. `git diff -- <relevant files>`
4. Recent commits with `git log --oneline --max-count=8` when rewriting or continuing a branch

Read surrounding files only when needed to understand the feature flow or module boundary.

## Commit Message Format

Use this format:

```txt
<type>(<feature-domain>): <commit message>
```

Examples:

```txt
fix(auth): 로그인 진입점에 Google 옵션 반영
refactor(auth): OAuth provider 설정 기반으로 로그인 버튼 렌더링
docs(auth): 인증 전략과 체험 모드 정책 정리
chore(review): 변경 파일 코드 리뷰 스킬 추가
```

### Type

Use the conventional type that best matches the change:

- `feat`: user-visible feature
- `fix`: bug fix or behavior correction
- `refactor`: code restructuring without intended behavior change
- `docs`: documentation-only change
- `test`: test addition or update
- `chore`: repository tooling, skills, configs, or maintenance
- `style`: formatting-only change
- `perf`: performance improvement

### Feature Domain

Use a short domain that identifies the product or code area:

- `auth`
- `team`
- `match`
- `formation`
- `player`
- `export`
- `docs`
- `review`
- `ui`

Prefer domain names that already appear in routes, features, entities, or docs.

### Subject

Write the subject in Korean unless the user asks otherwise.

Rules:

- Keep it specific enough to understand from `git log`.
- Describe the effect of the change, not only the file touched.
- Avoid vague subjects such as `수정`, `리팩터링`, `작업 반영`.
- Do not end with a period.

## Commit Body

Add a body when the subject alone cannot explain the decision or risk.

Use a body for:

- Multiple related changes in one commit
- Auth, DB, RLS, routing, or data ownership changes
- Intentional tradeoffs or deferred work
- Migration or external setup requirements

Body style:

```txt
<type>(<feature-domain>): <commit message>

- 변경 흐름 또는 사용자 영향
- 구조 변경 이유
- 설정/운영 참고 사항
```

## Commit Unit Rules

Suggest separate commits when changes can be reviewed or reverted independently.

Split commits when:

- Documentation decision and implementation can stand alone.
- Refactoring and behavior change are mixed.
- Auth, DB, and UI changes each carry separate risk.
- Skill/tooling changes are unrelated to product code.

Keep changes together when:

- A code change and its doc update explain the same decision.
- A component extraction and import update are one refactoring.
- Naming changes must be applied across types, actions, and UI to stay compiling.

Before committing, present:

```txt
커밋 예정 파일:
- ...

커밋 메시지 제안:
- ...

본문 필요 여부:
- ...

검증:
- ...
```

Commit only after explicit user approval.

## PR Description Format

Write PR descriptions in Korean with exactly these three sections.

Use emoji at the start of each section title:

```md
## 📝 작업 요약

- ...

## 🔧 작업 내용

- ...

## 💡 참고 사항

- ...
```

Use bullet points by default.

### 작업 요약

Explain the product or flow-level outcome.

Good:

- 로그인 화면에서 Kakao, Google, 체험 모드 진입점을 한 흐름으로 확인할 수 있게 정리했습니다.
- 체험 사용자도 기존 팀 workspace 구조를 따라 데이터를 만들 수 있도록 인증 흐름을 맞췄습니다.

Avoid implementation-only phrasing:

- `OAuthLoginButton.tsx` 추가
- 로그인 옵션 배열 수정

### 작업 내용

Explain what changed in enough detail for reviewers to understand the structure.

Prefer:

- 어떤 화면 흐름이 바뀌었는지
- 어떤 책임이 분리되었는지
- 어떤 정책이 문서화되었는지
- 어떤 확장 가능성이 생겼는지

Implementation terms are allowed only when they clarify structure. Do not make this section a file-by-file changelog.

### 💡 참고 사항

Include reviewer and operation notes:

- External setup needed
- Deferred work
- Known limitations
- Verification commands
- Whether commit history rewrite or migration is required

If there are no special notes, write:

```md
- 별도 참고 사항은 없습니다.
```

## Output Behavior

When asked only to draft messages or a PR description, do not edit files.

When asked to commit:

1. Draft the commit unit and message first.
2. Ask for approval.
3. Commit only after approval.

When asked to rewrite existing commit messages, warn that history rewrite can affect shared branches and ask for explicit approval before running any rewrite command.
