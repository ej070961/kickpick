# KickPick 프로젝트 설계 문서

## 1. 제품 개요

KickPick은 아마추어 축구팀의 경기 전 선발과 쿼터별 포지션 배치를 자동화하는 웹 서비스다. 선수 정보, 주/부 포지션, 우선순위, 경기 조건을 입력하면 쿼터별 포메이션 초안을 생성하고, 사용자는 축구장 위에서 배치를 검토하고 수정할 수 있다.

## 2. 핵심 목표

- 경기 전 30분 이내에 쿼터별 포지션 배치를 완료한다.
- 선수별 출전 쿼터 수를 최대한 균등하게 배분한다.
- 주 포지션, 부 포지션, 우선순위를 반영해 포메이션 적합도를 높인다.
- 생성된 배치표를 축구장 이미지 위에서 직관적으로 확인한다.
- 경기 중 부상, 이탈, 전략 변경에 대응할 수 있도록 수동 편집을 지원한다.
- PNG 이미지 내보내기로 카카오톡 등 외부 채널 공유를 쉽게 한다.

## 3. 기술 스택

- Framework: Next.js App Router
- UI: React, TypeScript, Tailwind CSS
- Backend/Auth/DB: Supabase
- Form/action validation: Server Actions, `useActionState`, `zod`
- Drag and drop: `@dnd-kit`
- Icons: `lucide-react`
- PNG export: `html-to-image`

## 4. 디자인 방향

밝은 스포츠 운영 도구 톤을 따른다. 시각적 장식보다 정보 확인, 반복 작업, 현장 모바일 사용성을 우선한다.

### 4.1 컬러 토큰

현재 색상은 `src/app/globals.css` CSS variable과 Tailwind `@theme inline`으로 관리한다.

- Background: `#f5f7fb`
- Foreground: `#20242e`
- Card: `#ffffff`
- Primary: `#00c8ad`
- Primary Foreground: `#ffffff`
- Mint Surface: `#d9faf4`
- Muted Text: `#8a94a6`
- Border: `#e7ebf2`
- Warning: `#f7c948`
- Mismatch: `#ff6b6b`
- Surface: `#f0f3f8`
- Surface Strong: `#e9edf5`

### 4.2 UI 원칙

- 현재 앱 쉘은 상단 `TopBar`와 중앙 작업영역을 기본으로 한다.
- 카드는 반복 아이템, 폼 섹션, 모달에만 사용하고 페이지 전체를 중첩 카드로 감싸지 않는다.
- 주요 버튼과 슬롯은 최소 44x44px 터치 타겟을 보장한다.
- 색상만으로 상태를 구분하지 않고 텍스트 또는 아이콘을 병행한다.
- 폼과 작업 화면은 모바일에서 단일 컬럼과 sticky action을 우선한다.

## 5. 반응형 및 모바일 레이아웃

KickPick은 경기 전 현장에서 모바일로 수정하는 시나리오가 중요하다. 데스크톱에서는 작업 밀도를 높이고, 모바일에서는 한 화면에 하나의 주요 작업만 노출한다.

Tailwind 기본 브레이크포인트를 사용한다.

```txt
mobile: 0px ~ 639px
sm: 640px+
md: 768px+
lg: 1024px+
xl: 1280px+
```

공통 규칙:

- 모든 주요 버튼과 슬롯은 최소 44x44px 터치 타겟을 보장한다.
- 하단 주요 액션은 필요 시 sticky footer로 제공한다.
- 입력 폼은 모바일에서 한 줄에 하나의 필드를 기본으로 한다.
- 긴 목록은 검색, 필터, 접힘 섹션으로 분리한다.
- hover 의존 UI는 모바일에서 클릭/탭 UI로 대체한다.
- iOS Safari 주소창을 고려해 `100dvh` 기반 높이를 사용한다.

화면별 기준:

- 로그인: 중앙 카드형 레이아웃, 모바일 너비는 `100% - 32px` 수준으로 제한한다.
- 대시보드: 빠른 액션과 요약 카드를 세로 스택으로 배치한다.
- 선수 관리: 테이블 대신 선수 카드 리스트를 기본으로 한다.
- 우선순위 관리: 드래그 핸들을 명확히 노출하고, 저장 버튼은 하단 또는 우측 작업 영역에 둔다.
- 경기 생성: 현재 2단계 wizard를 사용한다. 1단계는 경기/선수 설정과 경기 전용 용병 추가, 2단계는 쿼터 보정 대상 선택이다.
- 포메이션 편집기: 쿼터 탭, 축구장, 후보 목록, 포메이션 변경/재배정, 저장/내보내기 액션을 한 흐름으로 제공한다.

## 6. 에셋 전략

현재 사용 중인 정적 에셋:

```txt
public/
  images/
    football-field.jpg
    logo.png
    uniform.svg
src/
  app/
    favicon.ico
```

- `football-field.jpg`: 포메이션 편집기 배경.
- `uniform.svg`: 슬롯 위 선수 표시 말판.
- `logo.png`: `TopBar`와 브랜드 노출.
- `src/app/favicon.ico`: Next App Router favicon.

`public/images/favicon.png`는 현재 코드에서 직접 참조되지 않는다.

## 7. 현재 FSD 구조

```txt
src/
  app/
    (auth)/
      login/page.tsx
    (main)/
      layout.tsx
      page.tsx
      formations/page.tsx
      matches/page.tsx
      matches/new/page.tsx
      matches/[matchId]/page.tsx
      players/page.tsx
      players/priority/page.tsx
    auth/
      callback/route.ts
      confirm/route.ts
      error/page.tsx
    layout.tsx
    globals.css
    favicon.ico

  views/
    dashboard/
    formation-editor/
    formation-templates/
    login/
    matches/
    match-new/
    players/

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
    team/

  shared/
    api/supabase/
    lib/
    ui/
```

포메이션 편집 흐름은 `features/formation-editor/README.md`의 구조를 따른다. 슬롯 변경 규칙은 `lib`, 편집기 상태는 `FormationEditorClient`, 화면 섹션은 `ui` 하위 컴포넌트가 담당한다.

## 8. 라우팅 설계

```txt
/
/login
/formations
/players
/players/priority
/matches
/matches/new
/matches/[matchId]
/auth/callback
/auth/confirm
/auth/error
```

화면별 역할:

- `/`: 대시보드, 빠른 액션, 요약.
- `/login`: 팀 단위 계정 로그인/가입.
- `/formations`: GK 포함 11개 슬롯 포메이션 템플릿 관리.
- `/players`: 선수 목록, 생성, 수정, 삭제.
- `/players/priority`: 선수 우선순위 드래그 정렬.
- `/matches`: 경기 목록과 히스토리.
- `/matches/new`: 경기 생성 플로우.
- `/matches/[matchId]`: 쿼터별 포메이션 편집기. 경기 포메이션 템플릿 변경 시 전체 재배정 또는 기존 쿼터별 출전 선수 유지 재배정을 선택할 수 있다.

## 9. Supabase 데이터 모델

상세 스키마는 `docs/database-schema.md`를 기준으로 한다. 구현 관점에서 중요한 테이블은 다음과 같다.

- `teams`: Supabase Auth user가 소유하는 팀 workspace.
- `players`: 선수 명단, 등번호, 포지션, 우선순위, soft delete.
- `formation_templates`: 팀별 포메이션 템플릿.
- `formation_template_slots`: 템플릿의 11개 슬롯과 좌표.
- `matches`: 경기 조건과 생성 상태.
- `match_players`: 경기 참가 선수, 목표 쿼터, 보정 여부.
- `match_guest_players`: 해당 경기에서만 사용하는 임시 용병 선수.
- `quarter_formations`: 경기별 쿼터.
- `formation_slots`: 쿼터별 슬롯 배정.

## 10. 포지션 체계

선수 입력용 포지션과 포메이션 슬롯용 포지션을 분리한다.

선수 포지션:

```txt
GK
LB, LWB, CB, RB, RWB
CDM, CM, CAM, LM, RM
LW, CF, RW
```

포메이션 슬롯 포지션:

```txt
GK
LB, LWB, LCB, CB, RCB, RB, RWB, RC
LDM, CDM, RDM
LCM, CM, RCM
CAM, LM, RM
LW, LF, CF, RF, RW
```

슬롯 전용 포지션은 `SLOT_POSITION_TO_PLAYER_POSITION`으로 선수 포지션에 매핑한다. 예: `LCB -> CB`, `RC -> RB`, `LF -> CF`.

## 11. 포메이션 템플릿

포메이션 템플릿은 사용자가 `/formations`에서 직접 생성해야 한다. 기본 템플릿은 자동 생성하지 않는다.

- 템플릿은 항상 GK 포함 11개 슬롯이다.
- 생성 폼에서는 필드 슬롯 10개를 선택하고, GK는 자동 포함한다.
- 좌표는 `DEFAULT_SLOT_COORDS`를 기준으로 저장한다.
- 등록된 템플릿이 없으면 `/matches/new`는 경기 생성 폼 대신 템플릿 생성 안내와 `/formations` CTA를 보여준다.
- 새 경기 생성의 포메이션 select에는 active 사용자 템플릿만 노출한다.

## 12. 자동 배치 알고리즘

입력:

- 참가 선수 목록
- 해당 경기 전용 용병 목록
- 선수별 주 포지션
- 선수별 부 포지션 목록
- 선수별 우선순위
- 쿼터 수
- 포메이션 템플릿
- GK 고정 여부
- 적은 쿼터 배분 대상 선수 목록

fit score:

- 주 포지션 일치: 10
- 부 포지션 일치: 5
- 같은 포지션 그룹: 3
- 그 외: 0

쿼터 배분:

```txt
total_slots = quarter_count * slots_per_quarter
base = floor(total_slots / player_count)
remainder = total_slots % player_count
```

- 기본적으로 모든 선수는 `base`만큼 배정받고, `remainder`만큼의 추가 슬롯은 우선순위와 보정 선택에 따라 배정된다.
- UI는 선택 수가 더 적은 쪽을 선택하게 한다. 필요 시 “많은 쿼터 배정” 선수 선택으로 전환하고, 서버에는 최종 `reducedPlayerIds`만 제출한다.
- GK 고정 ON이면 고정 GK와 GK 슬롯은 쿼터 보정 계산에서 제외한다. 고정 GK는 모든 쿼터의 GK 슬롯에 배정되고, 나머지 선수는 필드 슬롯 기준으로 quota를 계산한다.

배치 흐름:

1. GK 고정 ON이면 GK 주 포지션 선수 중 우선순위가 가장 높은 선수를 고정 GK로 선택한다.
2. 보정 대상 선수 목록과 필드 슬롯 수를 기준으로 `target_quota`를 계산한다.
3. 쿼터별로 남은 quota가 큰 선수부터 후보군을 구성한다.
4. 각 슬롯에 fit score가 가장 높은 선수를 배정한다.
5. 배정 후 해당 선수의 `remaining_quota`를 감소시킨다.

검증 조건:

- 한 쿼터 안에서 동일 선수가 중복 배정되지 않는다.
- 모든 포지션 슬롯이 채워진다.
- 저장된 `target_quota`와 실제 배정 수가 일관되어야 한다.
- 용병은 등록 선수 명단에 저장하지 않고 해당 경기의 참가자, 쿼터 보정, 자동 배치, 편집, PNG 내보내기에만 포함한다.

## 12.1 용병 선수

용병 선수는 `/players`의 팀 선수 명단에 포함되지 않는 경기 전용 임시 선수다.

- `/matches/new` 1단계 참가 선수 섹션에서 `용병 관리` 버튼으로 추가, 수정, 삭제한다.
- 입력값은 이름, 주 포지션, 부 포지션이다.
- 우선순위는 현재 참가자 중 가장 낮은 순위 다음 값으로 자동 배정하며, 화면에서 직접 입력받지 않는다.
- 참가 선수 요약에는 팀 선수, 용병, 총 참가 수를 구분해 보여준다.
- 2단계 쿼터 보정과 `/matches/[matchId]` 포메이션 편집기에서는 일반 참가자와 동일하게 배정/교체되며, 화면에서는 `용병` 배지로 구분한다.

## 13. 포메이션 편집기

현재 편집기는 `features/formation-editor/README.md`의 구조를 기준으로 관리한다.

- 상단: 전체 배정 요약, 쿼터 탭.
- 중앙: 축구장 이미지 + 유니폼 슬롯.
- 우측/하단: 현재 선택, 후보 선수, 저장/PNG 액션.
- 슬롯 클릭: 선택 후 다른 슬롯 또는 후보 선수와 교체.
- 저장: `saveFormationSlots` 서버 액션으로 수동 변경 반영.
- 내보내기: 현재 쿼터 PNG를 생성하며, 이미지 내부에 `{quarterNumber}Q 쿼터` 라벨을 포함한다.

포메이션 변경/재배정:

- 사용자는 등록된 active 포메이션 템플릿 중 하나로 경기 포메이션 타입을 변경할 수 있다.
- 포메이션 변경은 기존 슬롯 구조를 새 템플릿 기준으로 교체하는 영향이 큰 액션이므로 별도 모달에서 실행한다.
- 재배정 방식은 전체 재배정과 출전 선수 유지 재배정을 제공한다.
- 전체 재배정은 경기 생성과 동일한 자동 배치 알고리즘을 다시 실행하고 기존 수동 변경을 초기화한다.
- 출전 선수 유지 재배정은 각 쿼터에 배정되어 있던 선수를 최대한 유지한 뒤 새 슬롯에 fit score 기준으로 다시 배치한다.
- 포메이션 변경 전 미저장 편집이 있으면 해당 변경이 재배정 결과로 대체될 수 있음을 안내한다.

## 14. 이미지 내보내기

- 현재 쿼터 단일 PNG 내보내기를 지원한다.
- 캡처 대상은 `exportRef`가 감싼 축구장 DOM이다.
- `html-to-image`의 `toPng`를 사용하고, `pixelRatio`는 최소 2 이상으로 설정한다.
- 파일명 규칙:

```txt
{sanitizedMatchBaseName}_{quarterNumber}Q.png
```

향후 전체 쿼터 통합 이미지 내보내기를 추가할 수 있다.
