# formation-editor

쿼터별 포메이션 슬롯을 화면에서 검토, 교체, 저장하는 feature입니다. 서버에서 생성된 초안을 클라이언트 상태로 편집하고, 변경사항을 `formation_slots`에 저장합니다.
경기 포메이션 템플릿을 변경할 때는 전체 재배정 또는 쿼터별 출전 선수 유지 재배정을 실행합니다.

## 폴더 구조

```txt
formation-editor/
  actions/
    formationEditorActions.ts
  api/
    formationEditorMutations.ts
    formationEditorQueries.ts
    formationEditorRows.ts
  lib/
    formationEditorFormat.ts
    formationEditorMappers.ts
    formationEditorSummary.ts
    formationEditorSlots.ts
    regenerateFormationSlots.ts
  model/
    types.ts
    useEditorRoster.ts
    useEditorSave.ts
    useFormationEditorState.ts
    useFormationExport.ts
    useFormationRegeneration.ts
  ui/
    AssignmentSummary.tsx
    BenchPlayersPanel.tsx
    FormationEditorActions.tsx
    FormationEditorClient.tsx
    FormationEditorMainArea.tsx
    FormationEditorSidePanel.tsx
    FormationField.tsx
    FormationRegenerationDialog.tsx
    FormationToolbar.tsx
    PlayerDisplayName.tsx
    QuarterTabs.tsx
    RosterManagementDialog.tsx
    SelectedSlotPanel.tsx
```

## 파일 역할

- `actions/formationEditorActions.ts`: 편집된 슬롯의 `player_id` 또는 `guest_player_id`, `fit_score`, `is_manual` 값을 저장하고, 포메이션 변경 시 슬롯을 재생성하며, 경기 명단 추가/제거와 게스트 추가/수정을 처리하는 서버 액션.
- `api/formationEditorQueries.ts`: 편집기 초기 렌더링, 포메이션 재배정, 명단 수정 후 화면 갱신에 필요한 경기, 참가자, 쿼터 정보를 조회하고 `match` 의미 데이터와 editor 타입으로 정규화한다.
- `api/formationEditorMutations.ts`: 포메이션 슬롯 교체와 경기 포메이션명 갱신을 담당한다.
- `api/formationEditorRows.ts`: 편집기 feature의 data source adapter 내부에서 사용하는 Supabase row 타입을 정의한다. UI와 model hook은 이 타입을 import하지 않는다.
- `model/types.ts`: 편집기 클라이언트에서 사용하는 match, 선수, 슬롯, 쿼터, 배정 요약, 초기 props 타입.
- `model/useEditorRoster.ts`: 경기 참가 명단 추가, 제거, 게스트 저장에 따른 선수 목록과 쿼터 상태 갱신을 관리한다.
- `model/useEditorSave.ts`: 편집된 슬롯 배정을 저장하는 서버 액션 흐름을 관리한다.
- `model/useFormationEditorState.ts`: 쿼터 선택, 슬롯/후보 선택, 후보 목록, 배정 요약, 저장 전 변경 상태를 관리한다.
- `model/useFormationExport.ts`: 현재 쿼터 포메이션 필드의 PNG 내보내기 ref와 action을 제공한다.
- `model/useFormationRegeneration.ts`: 포메이션 변경 모달 상태와 재배정 서버 액션 호출을 관리한다.
- `lib/formationEditorFormat.ts`: 파일명 sanitize와 선수 표시명 생성 같은 순수 포맷 함수.
- `lib/formationEditorMappers.ts`: 편집기 player key, DB row, insert row, 클라이언트 쿼터 상태 간 변환을 담당한다.
- `lib/formationEditorSummary.ts`: 후보 선수 정렬과 전체 쿼터 배정 요약 계산 함수.
- `lib/formationEditorSlots.ts`: 슬롯 fit score 계산, 슬롯 간 선수 교환, 후보 선수 교체 순수 로직.
- `lib/regenerateFormationSlots.ts`: 포메이션 변경 시 전체 재배정 또는 쿼터별 기존 출전 선수 유지 재배정을 선택해 실행하는 순수 로직.
- `ui/FormationEditorClient.tsx`: feature의 클라이언트 컨테이너. 편집, 명단, 저장, PNG 내보내기, 재배정 hook과 하위 UI 조립을 연결한다.
- `ui/FormationEditorMainArea.tsx`: 쿼터 탭과 축구장 필드를 묶은 주 작업 영역.
- `ui/FormationEditorSidePanel.tsx`: 선택 상태, 후보 선수, 저장/내보내기 액션을 묶은 보조 패널.
- `ui/AssignmentSummary.tsx`: 전체 쿼터 기준 선수별 출전 쿼터 chip 요약.
- `ui/QuarterTabs.tsx`: 활성 쿼터 전환 탭.
- `ui/FormationField.tsx`: 축구장 이미지 위에 쿼터 라벨과 슬롯 유니폼을 렌더링하는 편집 필드. PNG export 캡처 대상도 포함한다.
- `ui/FormationRegenerationDialog.tsx`: 경기 포메이션 템플릿과 재배정 방식을 선택하고 영향 범위를 안내하는 모달.
- `ui/FormationToolbar.tsx`: 현재 경기 포메이션, 저장 전 변경 배지, 포메이션 변경/선수 명단 수정 버튼을 표시한다.
- `ui/PlayerDisplayName.tsx`: 선수 이름과 게스트 표기 문구를 일관되게 렌더링한다.
- `ui/SelectedSlotPanel.tsx`: 현재 선택된 슬롯과 배정 선수 정보.
- `ui/BenchPlayersPanel.tsx`: 현재 쿼터에 출전하지 않는 후보 선수 목록과 교체 액션. 후보 선수를 먼저 선택한 뒤 유니폼을 눌러도 교체할 수 있다.
- `ui/RosterManagementDialog.tsx`: 모달에서 경기 참가 명단, 등록 선수 추가, 게스트 추가/수정, 참가자 제거 액션을 제공한다.
- `ui/FormationEditorActions.tsx`: 저장, 현재 쿼터 PNG 내보내기, 액션 결과 메시지.

## 작업 기준

- 슬롯 배정 변경 규칙은 `lib/formationEditorSlots.ts`에 둔다. UI 컴포넌트에서 직접 fit score 계산을 반복하지 않는다.
- 새 UI 섹션이 생기면 `ui/`에 역할 단위 컴포넌트로 추가하고, 이 README의 파일 역할 목록도 갱신한다.
- 반복되는 버튼, 패널, 배지, 입력 스타일은 `shared/ui`를 우선 사용한다.
- 서버 저장 필드가 바뀌면 `actions/formationEditorActions.ts`, `model/types.ts`, `docs/database-schema.md`를 함께 확인한다.
- 선수 식별자는 편집기 내부에서 `player:{uuid}` 또는 `guest:{uuid}` key로 다루고, 저장 시 DB 컬럼으로 분리한다.
- 명단에서 참가자를 제거하면 서버와 클라이언트 모두 해당 선수의 배정 슬롯을 미배정으로 갱신한다.
- 전체 재배정은 `features/match-create/lib/generateQuarterFormations.ts`를 재사용해 경기 생성과 같은 배치 규칙을 따른다.
- 출전 선수 유지 재배정은 기존 쿼터별 배정 선수 집합을 보존하는 로직이므로 `lib/regenerateFormationSlots.ts`에서 관리한다.
- 내보내기 캡처 영역을 바꾸면 `FormationField.tsx`의 `exportRef` 범위와 `features/formation-export` 동작을 함께 확인한다.
