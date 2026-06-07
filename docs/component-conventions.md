# KickPick 컴포넌트 설계 패턴 및 컨벤션

이 문서는 KickPick의 유지보수성을 위해 컴포넌트 책임, FSD 계층 경계, 네이밍, 상태 관리, 스타일링 규칙을 정의한다. 구현 시 `docs/project-design.md`를 제품 설계 기준으로 함께 확인한다.

## 1. 기본 원칙

- 컴포넌트는 한 가지 책임을 가진다.
- 비즈니스 규칙은 UI 컴포넌트 안에 숨기지 않는다.
- FSD 계층 의존 방향을 지킨다.
- 재사용 가능한 도메인 없는 UI는 `shared/ui`에 둔다.
- 도메인 의미가 있는 모델, 타입, 상수는 `entities`에 둔다.
- 사용자 액션 단위의 로직은 `features`에 둔다.
- 여러 feature와 entity를 조합한 큰 화면 블록은 `widgets`에 둔다.
- Next.js route 파일은 얇게 유지하고, 화면 조립은 `views` 계층에 위임한다.

## 2. FSD 의존 규칙

허용 의존 방향:

```txt
app -> views -> widgets -> features -> entities -> shared
```

규칙:

- 하위 계층은 상위 계층을 import하지 않는다.
- `shared`는 특정 도메인을 알면 안 된다.
- entity끼리 직접 결합하지 않는다. 여러 도메인을 조합해야 하면 `features`, `widgets`, `views`에서 처리한다.
- 서버 액션은 사용자 행동 단위 feature에 둔다.
- 화면별 데이터 로드는 현재 구현처럼 `views`에서 수행하는 것을 기본으로 한다.

## 3. 현재 폴더 구조

```txt
src/
  app/
    (auth)/
    (main)/
    auth/
  views/
  widgets/
    top-bar/
  features/
    auth/
    formation-editor/
    formation-export/
    formation-generate/
    formation-template-manage/
    match-create/
    match-delete/
    player-manage/
    priority-reorder/
  entities/
    formation/
    match/
    player/
    position/
  shared/
    api/supabase/
    lib/
    ui/
```

각 slice는 필요할 때만 아래 폴더를 둔다.

```txt
slice-name/
  index.ts
  ui/
  actions/
  model/
  lib/
  api/
  config/
```

용도:

- `ui`: React 컴포넌트
- `actions`: Next Server Actions
- `model`: 상태, hook, schema, 타입 변환
- `lib`: 순수 함수, 계산 로직
- `api`: 외부 API 또는 query/mutation wrapper
- `config`: 해당 slice 전용 상수
- `index.ts`: 외부 공개 API

필요 없는 폴더는 만들지 않는다.

## 4. Public API 규칙

권장:

```ts
import { PageHeader } from "@/shared/ui";
import type { Player } from "@/entities/player";
```

가능하면 slice 외부에서는 `index.ts`를 통해 import한다. 다만 현재 코드에는 feature 내부 UI/action 파일을 직접 import하는 패턴도 있다. 새 코드에서는 다음 기준을 적용한다.

- `shared/ui`, `entities/*`, `widgets/*`는 barrel export를 우선한다.
- feature의 단일 컴포넌트/action을 route나 view에서 직접 쓰는 경우 내부 경로 import를 허용한다.
- 같은 slice 내부 파일끼리는 상대 경로 import를 허용한다.
- 테스트 파일은 검증 목적상 내부 모듈을 직접 import할 수 있다.

## 5. 컴포넌트 네이밍

- React 컴포넌트: `PascalCase`
- hook: `useCamelCase`
- 이벤트 핸들러 prop: `onVerbNoun`
- boolean prop/state: `is`, `has`, `can`, `should` prefix 사용
- 파일명은 주요 export 이름과 맞춘다.

예시:

```txt
PlayerForm.tsx
FormationEditorClient.tsx
useFormationEditor.ts
calculateFitScore.ts
```

## 6. 컴포넌트 책임 분리

### 6.1 shared/ui

도메인 의미가 없는 순수 UI만 둔다.

예:

- `PageHeader`
- `Button`
- `Input`
- `Select`
- `Modal`
- `Badge`
- `EmptyState`

금지:

- 선수, 경기, 포메이션 같은 도메인 타입 직접 참조
- Supabase 호출
- 라우팅/권한 로직

### 6.2 entities

도메인 단위 타입, 설정, 순수 표현을 둔다.

현재 주요 entity:

- `entities/player`: 선수 타입
- `entities/match`: 경기 타입
- `entities/formation`: 포메이션 템플릿/슬롯 타입과 기본 좌표
- `entities/position`: 선수 포지션과 슬롯 포지션 타입/매핑

규칙:

- entity는 단일 도메인 표현에 집중한다.
- mutation은 `features`에서 처리한다.
- cross-domain 조합은 entity에 넣지 않는다.

### 6.3 features

사용자가 수행하는 행동 단위로 만든다.

현재 주요 feature:

- `auth`
- `player-manage`
- `priority-reorder`
- `formation-template-manage`
- `match-create`
- `match-delete`
- `formation-generate`
- `formation-editor`
- `formation-export`

규칙:

- form submit, drag save, export click 같은 이벤트 처리의 주체가 된다.
- 서버 액션과 optimistic/local state 처리는 feature 내부에서 처리한다.
- 복잡한 계산은 `lib` 순수 함수로 분리한다.

### 6.4 widgets

여러 feature/entity를 조합해 앱의 큰 영역을 구성한다.

현재 widget:

- `top-bar`

규칙:

- widget은 화면 배치와 조합에 집중한다.
- 데이터 fetching은 view에 두는 것을 기본으로 한다.
- 동일 데이터를 여러 feature에 넘길 때는 widget 또는 view에서 props를 정리한다.

### 6.5 views

Next.js App Router에서 FSD의 화면 조립 계층은 `src/views`로 둔다.

규칙:

- `src/app/**/page.tsx`는 해당 view 컴포넌트를 import해 렌더링한다.
- views는 초기 데이터 로드, 권한 분기, 화면 단위 조립을 담당한다.
- 세부 UI와 비즈니스 액션은 하위 계층에 위임한다.

## 7. 상태 관리

우선순위:

1. URL params: 검색, 필터, 탭, 정렬처럼 공유 가능한 상태
2. Server state: Supabase 데이터
3. Server Action state: `useActionState` 결과와 field error
4. Local state: 모달, 현재 단계, 선택 슬롯, 편집 중인 임시 데이터

규칙:

- Supabase에서 온 데이터는 server state로 보고, local state에 불필요하게 복제하지 않는다.
- 포메이션 편집 중인 임시 배치는 feature 내부 state로 관리하고 저장 시 DB에 반영한다.
- 자동 배치 알고리즘은 입력과 출력이 명확한 순수 함수로 유지한다.

## 8. Form 컨벤션

- 서버 저장 전 검증은 `zod` schema로 수행한다.
- 현재 폼은 Next Server Actions와 `useActionState`를 기본 패턴으로 사용한다.
- 클라이언트 단계 전환이나 선택 UI에는 local state를 사용한다.
- 서버 에러는 field error 또는 상단 alert로 연결한다.
- `react-hook-form`은 복잡한 client-only form이 필요할 때 선택적으로 사용한다.

예시:

```txt
features/match-create/ui/MatchCreateForm.tsx
features/match-create/actions/matchCreateActions.ts
features/player-manage/ui/PlayerForm.tsx
features/player-manage/actions/playerActions.ts
```

## 9. Supabase API 컨벤션

- Supabase client 생성은 `shared/api/supabase`에 둔다.
- 서버 컴포넌트와 서버 액션은 `shared/api/supabase/server.ts`의 client를 사용한다.
- 브라우저 client가 필요한 경우 `shared/api/supabase/client.ts`를 사용한다.
- query/mutation 함수는 도메인 또는 feature 가까이에 둔다.
- UI 컴포넌트에서 Supabase client를 직접 호출하지 않는다.
- DB row 타입과 UI 타입 변환 경계를 명확히 둔다.
- soft delete는 `is_deleted` 업데이트로 처리한다.

예시:

```ts
getFormationTemplates()
createFormationTemplate(formData)
saveFormationSlots(matchId, slots)
updatePlayerPriority(input)
```

## 10. 스타일링 컨벤션

- Tailwind CSS를 기본으로 사용한다.
- 색상 값은 `src/app/globals.css`의 CSS variable과 Tailwind theme token으로 관리한다.
- 반복되는 class 조합은 필요할 때 `shared/lib/cn.ts`의 `cn()` helper를 사용한다.
- 카드 radius는 기본 8px 내외를 유지하되, 기존 글로벌 radius token과 화면 맥락을 따른다.
- 텍스트가 좁은 영역에서 넘치면 `truncate`, responsive layout, 줄바꿈으로 처리한다.
- 버튼에는 아이콘이 적절하면 `lucide-react` 아이콘을 사용한다.

금지:

- 임의 hex color를 컴포넌트마다 직접 반복
- 페이지 전체를 카드 안에 넣는 중첩 카드 구조
- hover에만 의존하는 필수 액션
- 텍스트가 버튼/카드 밖으로 넘치는 상태 방치

## 11. 모바일 컴포넌트 패턴

- 모달은 모바일에서 넓은 터치 타겟과 스크롤 안정성을 우선한다.
- 목록 액션은 모바일에서 row action menu 또는 bottom action sheet로 전환할 수 있다.
- 하단 주요 액션은 sticky action bar 패턴을 사용한다.
- 포메이션 편집기는 field, quarter tabs, candidate list, action area의 역할을 명확히 나눈다.
- 드래그앤드롭 기능은 가능한 경우 클릭 또는 버튼 기반 대체 조작을 제공한다.

권장 컴포넌트:

```txt
shared/ui/PageHeader
shared/ui/BottomSheet
shared/ui/StickyActionBar
shared/ui/SegmentedTabs
shared/ui/IconButton
```

아직 없는 공통 컴포넌트는 반복 사용성이 확인될 때 `shared/ui`로 올린다.

## 12. 접근성 규칙

- 버튼에는 명확한 accessible name을 제공한다.
- icon-only button은 `aria-label`을 필수로 둔다.
- 색상 상태는 텍스트 또는 아이콘을 함께 제공한다.
- focus ring을 제거하지 않는다.
- keyboard navigation을 기본 컴포넌트에서 보장한다.
- 드래그앤드롭 기능은 가능한 경우 대체 조작을 제공한다.

## 13. 포메이션 편집기 구현 패턴

현재 포메이션 편집기는 `features/formation-editor/ui/FormationEditorClient.tsx`가 한 화면 단위로 관리한다.

규칙:

- 좌표 계산과 알고리즘은 UI에서 분리한다.
- 슬롯 교체와 선수 교체는 예측 가능한 순수 업데이트로 처리한다.
- 저장은 `features/formation-editor/actions/formationEditorActions.ts` 서버 액션으로 처리한다.
- 내보내기는 `features/formation-export/lib/exportElementAsPng.ts`를 통해 DOM 캡처로 처리한다.
- 기능이 더 커지면 `FormationField`, `QuarterTabs`, `CandidateList`, `EditorActions`로 분리한다.

## 14. 테스트 기준

- 자동 배치 알고리즘은 unit test를 우선 작성한다.
- quota 계산, fit score, 중복 배정 방지는 edge case를 포함한다.
- UI 테스트는 핵심 플로우 위주로 작성한다.
- 모바일 레이아웃은 Playwright viewport 테스트로 확인한다.

우선 테스트 대상:

- `calculateTargetQuotas`
- `calculateFitScore`
- `generateQuarterFormations`
- `MatchCreateForm`의 GK 고정 보정 계산
- `saveFormationSlots`

## 15. 문서 갱신 규칙

- 제품 요구사항이나 UX 기준이 바뀌면 `docs/project-design.md`를 먼저 갱신한다.
- DB 스키마, RLS, 테이블 의미가 바뀌면 `docs/database-schema.md`를 갱신한다.
- 컴포넌트 책임, FSD 경계, 네이밍 규칙이 바뀌면 이 문서를 갱신한다.
- 구현이 문서와 달라진 경우 문서 또는 구현 중 하나를 반드시 정리한다.
