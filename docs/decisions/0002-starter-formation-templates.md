# ADR 0002: 신규 팀 기본 포메이션 템플릿과 템플릿 관리 개선

## 상태

Accepted

## 날짜

2026-08-08

## 배경

KickPick의 경기 생성은 저장된 포메이션 템플릿을 기준으로 동작한다. 사용자가 템플릿을 하나도 만들지 않은 상태에서는 경기 생성 화면에서 먼저 템플릿 생성 화면으로 이동해야 한다.

이 흐름은 신규 사용자가 바로 경기를 만들어보려는 상황에서 진입 장벽이 된다. 특히 KickPick의 핵심 가치는 선수 명단과 경기 조건을 입력해 쿼터별 배치를 빠르게 만드는 것인데, 첫 경기 생성 전에 포메이션 템플릿을 직접 구성해야 하면 제품의 첫 경험이 무거워진다.

따라서 신규 팀이 만들어질 때 자주 쓰는 기본 포메이션 템플릿을 함께 제공한다. 또한 기본 템플릿을 포함한 모든 템플릿을 사용자가 이후 수정할 수 있게 하여 팀 운영 방식에 맞게 조정할 수 있도록 한다.

## 결정

신규 팀 생성 직후 기본 포메이션 템플릿 3개를 DB에 실제 데이터로 생성한다. 생성 이후에는 기본 템플릿도 일반 템플릿과 동일하게 조회, 수정, 삭제할 수 있다.

기본 템플릿:

```txt
4-2-3-1
GK, LB, LCB, RCB, RB, LDM, RDM, CAM, LW, RW, CF

4-3-3
GK, LB, LCB, RCB, RB, CDM, LCM, RCM, LW, RW, CF

4-4-2
GK, LB, LCB, RCB, RB, LM, LCM, RCM, RM, LF, RF
```

생성 정책:

1. `ensureDefaultTeamForUser()`가 새 팀을 생성한 경우에만 기본 템플릿을 생성한다.
2. 이미 기존 팀이 있는 사용자는 기본 템플릿을 추가로 생성하지 않는다.
3. 사용자가 이후 템플릿을 수정하거나 삭제한 상태는 그대로 유지한다.
4. 사용자가 모든 템플릿을 삭제해도 앱이 자동으로 다시 생성하지 않는다.

수정 정책:

1. 템플릿 이름과 10개 포지션을 수정할 수 있다.
2. 저장 데이터에는 `GK` 슬롯을 항상 포함한다.
3. 수정 저장 시 템플릿 row는 유지하고, 하위 슬롯 row는 새 선택값 기준으로 교체한다.
4. 이미 생성된 경기의 슬롯과 포메이션명은 snapshot 데이터로 유지한다.
5. 템플릿 수정은 이후 새 경기 생성과 경기 상세의 포메이션 변경/재배정에만 반영한다.

## 왜 DB에 저장하는가

기본 템플릿을 화면 또는 경기 생성 로직의 fallback 데이터로만 제공할 수도 있다. 그러나 현재 앱의 주요 흐름은 모두 `formation_templates`와 `formation_template_slots` 테이블을 기준으로 동작한다.

DB에 저장하지 않는 경우 다음 문제가 생긴다.

- 경기 생성 화면과 템플릿 관리 화면에서 서로 다른 데이터 출처를 합쳐야 한다.
- 기본 템플릿으로 경기 생성 후 저장되는 포메이션명과 슬롯 출처가 불명확해진다.
- 포메이션 변경, 삭제, 수정 같은 흐름에서 기본 템플릿만 예외 처리해야 한다.
- 나중에 사용자가 기본 템플릿을 수정하거나 삭제하는 정책을 추가하기 어렵다.

따라서 기본 템플릿도 사용자 템플릿과 동일한 테이블에 저장한다. 생성 이후에는 일반 템플릿과 같은 데이터로 취급한다.

## 템플릿 수정 저장 전략

템플릿 수정은 `formation_templates`의 `id`를 유지한 채 저장한다. 경기 생성 화면과 포메이션 변경 화면은 template id를 참조하므로, 수정할 때 template row를 삭제하고 새로 만들면 기존 선택 상태나 URL, 이후 기능 확장에 불리하다.

저장 순서:

```txt
updateFormationTemplate(templateId, input)
  -> replace_formation_template RPC 호출
  -> RPC 내부에서 current user 소유 active template인지 확인
  -> RPC 내부에서 formation_templates.name 업데이트
  -> RPC 내부에서 기존 formation_template_slots 삭제
  -> RPC 내부에서 새 슬롯 11개 insert
  -> /formations, /matches/new, /matches/[matchId] 관련 경로 revalidate
```

이 저장은 원자적으로 처리해야 한다. Supabase JS에서 `update -> delete -> insert`를 순서대로 호출하면 중간 실패 시 템플릿 이름만 바뀌거나 슬롯이 비는 상태가 생길 수 있다. 따라서 DB function RPC인 `replace_formation_template`로 복수 테이블 변경을 묶는다.

RPC:

```txt
replace_formation_template(
  p_template_id uuid,
  p_name text,
  p_slots jsonb
)
```

RPC 내부 책임:

- `p_template_id`가 `auth.uid()` 소유 팀의 active template인지 검증한다.
- `p_name`이 비어 있지 않은지 검증한다.
- `p_slots`가 정확히 11개인지 검증한다.
- 첫 슬롯 또는 포함 슬롯에 `GK`가 있는지 검증한다.
- `sort_order`, `slot_name`, `x`, `y`를 검증한다.
- 하나의 transaction 안에서 template update, old slots delete, new slots insert를 처리한다.

## DB 구조와 제약 보강

현재 테이블 분리는 유지한다.

```txt
formation_templates
  -> formation_template_slots
```

이 구조는 템플릿 메타데이터와 슬롯 구성을 분리하므로 유지보수와 확장에 적합하다. 다만 문서에만 있는 invariant를 DB 제약으로 보강해야 한다.

권장 제약:

```txt
formation_template_slots.formation_template_id
  references formation_templates(id)
  on delete cascade

unique (formation_template_id, sort_order)
unique (formation_template_id, slot_name)
check (sort_order >= 0)
check (x >= 0 and x <= 100)
check (y >= 0 and y <= 100)
```

팀별 템플릿 이름 중복 정책도 정한다. UX 혼선을 줄이기 위해 active template 기준 이름 중복을 막는 것을 권장한다.

```txt
unique (team_id, name) where is_deleted = false
```

단, 이 정책은 같은 이름의 템플릿을 여러 개 만들 수 없게 한다. 사용자가 전술 변형을 나누고 싶으면 `4-3-3 공격형`, `4-3-3 수비형`처럼 이름으로 구분하게 한다.

11개 슬롯 개수와 `GK` 포함 여부는 일반 check constraint만으로 표현하기 어렵다. 이 invariant는 다음 중 하나로 보장한다.

1. 서버 액션과 zod 검증으로 보장한다.
2. DB trigger 또는 RPC로 보장한다.

수정 기능까지 포함하면 중간 실패와 데이터 불일치를 줄이기 위해 2번, 특히 RPC 방식이 더 안정적이다.

이번 작업에서 컬럼 추가는 하지 않는다.

추가하지 않는 컬럼:

- `is_default`
- `source`
- `seeded_at`
- `system_preset_key`

이유는 기본 템플릿도 생성 이후 일반 템플릿처럼 수정/삭제되며, 앱이 삭제된 기본 템플릿을 복원하거나 시스템 프리셋 업데이트를 추적하지 않기 때문이다.

## 왜 매번 보장하지 않는가

처음에는 팀의 active 템플릿이 하나도 없으면 기본 템플릿을 다시 생성하는 방식도 고려했다. 이 방식은 기존 사용자나 데이터 누락 상황을 복구하기 쉽지만, 사용자가 일부러 모든 템플릿을 삭제한 상태를 존중하지 못한다.

이번 요구사항의 핵심은 "회원가입 시 기본 템플릿을 세팅한다"는 것이다. 따라서 기본 템플릿 생성은 팀 최초 생성 시점으로 제한한다.

이 정책을 선택하면 다음 의미가 명확해진다.

- 신규 사용자는 첫 경기 생성 전에 템플릿을 직접 만들 필요가 없다.
- 사용자가 템플릿을 관리한 이후에는 앱이 임의로 데이터를 되살리지 않는다.
- 별도의 `default_templates_seeded_at` 같은 컬럼 없이 현재 스키마로 구현할 수 있다.

## 함수 네이밍

기본 템플릿 생성 함수는 `createStarterFormationTemplates(teamId)`로 둔다.

`ensureDefaultFormationTemplates` 같은 이름은 "없으면 보장한다"는 의미가 강하다. 하지만 이번 정책은 기존 팀이나 삭제된 상태를 복구하지 않고, 새 팀 생성 직후 한 번만 데이터를 넣는다.

따라서 함수 이름에는 다음 의미가 드러나야 한다.

- `create`: 실제 insert 동작
- `Starter`: 신규 팀의 시작 데이터
- `FormationTemplates`: 생성 대상 도메인

권장 위치:

```txt
src/entities/formation/config/starterTemplates.ts
src/entities/formation/api/createStarterFormationTemplates.ts
```

`starterTemplates.ts`에는 템플릿 이름과 슬롯 목록만 둔다. 슬롯 좌표는 기존 `DEFAULT_SLOT_COORDS`를 사용한다.

## 팀 생성 흐름

기본 흐름:

```txt
auth callback / trial sign-in
  -> ensureDefaultTeamForUser(ownerUserId, teamName, { onCreatedTeam })
  -> ownerUserId의 첫 번째 팀 조회
  -> 기존 팀이 있으면 team.id 반환
  -> 기존 팀이 없으면 teams 생성
  -> onCreatedTeam(createdTeam.id)
  -> createStarterFormationTemplates(createdTeam.id)
  -> createdTeam.id 반환
```

OAuth 로그인과 체험 로그인은 모두 `ensureDefaultTeamForUser()`에 `createStarterFormationTemplates` 콜백을 넘기므로 동일한 기본 템플릿 정책을 적용받는다. `entities/team`은 팀 생성만 담당하고, starter template 생성 정책은 auth 진입점에서 조합한다.

## UX 방향

템플릿 관리 화면은 기본 템플릿이 이미 들어온 상태를 전제로 더 가볍게 보여준다.

- 화면 제목은 기능명보다 사용 목적이 드러나게 조정한다.
- 템플릿이 없을 때는 Empty UI를 보여준다.
- 데이터 조회 중에는 스켈레톤 UI를 보여준다.
- 템플릿 등록/수정 UI는 같은 입력 패턴을 공유하되, 생성과 수정의 주요 액션만 다르게 표현한다.

권장 문구 예시:

```txt
타이틀: 포메이션
설명: 자주 쓰는 배치를 저장해두면 경기 만들기가 빨라져요.

등록 섹션 타이틀: ⚽ 새 포메이션
등록 섹션 설명: 포메이션 이름과 포지션을 선택하세요.

수정 모달 타이틀: 포메이션 수정
수정 모달 설명: 수정한 내용은 다음 경기부터 적용됩니다.
```

템플릿 목록 카드에는 수정과 삭제 액션을 함께 둔다. 수정은 모달 또는 인라인 패널로 제공할 수 있으며, 모바일 사용성을 고려하면 모달이 더 단순하다.

권장 컴포넌트 구조:

```txt
features/formation-template-manage/
  actions/
    formationTemplateActions.ts
  ui/
    TemplateForm.tsx
    EditDialog.tsx
    TemplateCard.tsx
    EmptyState.tsx
    Skeleton.tsx
```

생성/수정 폼은 공통 UI를 재사용하되 서버 액션은 분리한다.

```txt
createFormationTemplate()
updateFormationTemplate()
deleteFormationTemplate()
```

`updateFormationTemplate`는 생성과 같은 입력 검증을 사용한다.

## 백엔드 구현 시 알아야 할 점

Supabase와 Postgres 기준으로 이번 기능에서 주의할 점은 다음과 같다.

- RLS가 켜진 테이블은 서버 액션에서 호출해도 사용자 세션 기준 정책을 통과해야 한다.
- `formation_template_slots`는 직접 `team_id`가 없으므로 부모 `formation_templates.team_id`를 통해 소유권을 검증해야 한다.
- soft delete를 쓰는 `formation_templates`는 조회, 수정, 삭제 모두 `is_deleted = false` 조건을 걸어야 한다.
- template 수정 중 슬롯 삭제와 재삽입은 가능하면 transaction으로 묶어야 한다.
- Supabase JS 클라이언트의 여러 `.from()` 호출은 자동으로 하나의 transaction이 되지 않는다.
- Postgres function은 함수 내부 SQL이 하나의 transaction으로 실행되므로, 복수 테이블 변경을 안정적으로 묶을 때 유리하다.
- RLS를 우회하는 `security definer` 함수는 신중하게 써야 한다. 사용한다면 함수 내부에서 `auth.uid()`와 팀 소유권을 반드시 직접 검증해야 한다.
- RLS를 그대로 적용하는 RPC로 구현할 수 있다면 그 편이 더 단순하고 안전하다.

## 구현 범위

이번 결정에 따른 구현 범위:

- 신규 팀 생성 직후 기본 포메이션 템플릿 3개 생성
- 기본 템플릿 상수 추가
- 템플릿 화면 Empty UI 추가
- 템플릿 화면 loading/skeleton UI 추가
- 템플릿 등록 UI 문구 및 입력 흐름 개선
- 템플릿 수정 UI와 수정 Server Action 추가
- 템플릿 관련 DB 제약 보강안 문서화
- 관련 제품 문서와 DB 문서 갱신

이번 범위에 포함하지 않는 작업:

- 기존 팀에 기본 템플릿을 강제로 backfill
- 사용자가 삭제한 기본 템플릿 자동 복구
- 기본 템플릿 여부를 구분하는 DB 컬럼 추가
- 템플릿별 system/user origin 구분
- 기본 템플릿과 사용자 생성 템플릿의 수정 권한 차등화
- 팀 여러 개 생성 또는 팀 전환 정책 변경

## 결과

신규 사용자는 회원가입 또는 체험 로그인 직후 바로 경기 생성을 시작할 수 있다. 기본 템플릿은 일반 템플릿과 같은 DB 데이터로 저장되므로 기존 경기 생성, 포메이션 변경, 템플릿 관리 흐름을 크게 바꾸지 않고 UX 진입 장벽을 낮출 수 있다.

템플릿 수정 기능을 함께 제공하면 사용자는 기본 템플릿을 삭제하고 다시 만드는 대신 자신의 팀 운영 방식에 맞게 바로 조정할 수 있다. DB 제약과 저장 전략을 보강하면 템플릿 슬롯 불일치나 중간 실패 상태를 줄이고, 이후 템플릿 관리 기능을 확장하기 쉬워진다.
