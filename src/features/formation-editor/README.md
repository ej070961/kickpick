# formation-editor

경기별 쿼터 배치를 확인하고 수정·저장하는 feature입니다. 서버에서 화면 초기 데이터를 읽고, 브라우저의 경기별 store에서 편집 초안을 관리합니다. 포메이션 변경 시 전체 재배정 또는 쿼터별 출전 선수 유지 재배정을 실행합니다.

## 구조와 책임

```txt
formation-editor/
  actions/
    loadFormationTemplateOptions.ts
    loadMatchPlayerCandidates.ts
    manageGuests.ts
    manageParticipants.ts
    regenerateFormation.ts
    saveFormation.ts
  api/
    dbRows.ts
    mappers.ts
    mutations.ts
    participantMutations.ts
    queries.ts
  lib/
    assignmentSummary.ts
    editorFormatting.ts
    quarterDraft.ts
    regenerateSlots.ts
    slotAssignments.ts
  model/
    store/
      EditorStoreProvider.tsx
      createEditorStore.ts
      index.ts
      types.ts
      useEditorStore.ts
    schemas.ts
    types.ts
    useFormationChange.ts
    useFormationImages.ts
    useMatchParticipants.ts
    useSaveFormation.ts
  ui/
    AssignmentSummary.tsx
    BenchPlayersPanel.tsx
    EditorActions.tsx
    EditableFormationField.tsx
    EditorMain.tsx
    EditorSidebar.tsx
    ExportFields.tsx
    FormationChangeDialog.tsx
    FormationEditor.tsx
    FormationToolbar.tsx
    FormationEditorContent.tsx
    FormationSlotButton.tsx
    match-participants/
      AvailablePlayerPicker.tsx
      GuestPlayerForm.tsx
      MatchParticipantsDialog.tsx
      ParticipantsList.tsx
    MatchSettingsMenu.tsx
    PlayerDisplayName.tsx
    quarter-formations/
      QuarterFormationCard.tsx
      QuarterFormationDragArea.tsx
      QuarterFormationList.tsx
      QuarterFormationsPanel.tsx
      QuarterSelector.tsx
```

- `actions/`: 저장, 참가자 관리, 게스트 관리, 재배정 등 사용자 행동별 Next.js Server Action. 입력 검증과 결과 메시지, 흐름 조정을 맡는다. 템플릿 옵션과 참가 후보 조회도 각 다이얼로그를 열 때 실행한다.
- `api/queries.ts`: 편집기 feature가 사용하는 개별 경기·참가자·쿼터 데이터 조회. 화면 초기 데이터 전체 조립은 `views/formation-editor`에서 한다.
- `api/mutations.ts`, `api/participantMutations.ts`: 슬롯 저장/교체와 참가자 변경에 필요한 DB 쓰기.
- `api/dbRows.ts`: Supabase 응답 row 타입. API 계층 안에서만 사용한다.
- `api/mappers.ts`: DB row ↔ 편집기 모델 및 DB 저장 row 변환.
- `model/types.ts`, `model/schemas.ts`: 편집기 데이터 모델과 Server Action 입력 검증 schema.
- `model/store/types.ts`: 편집 store의 ID 기준 선수 사전, 쿼터 초안, 선택 상태, 액션, 초기 데이터 타입.
- `model/store/createEditorStore.ts`: 경기별 편집 초안과 배치 상호작용 로직을 포함한 Zustand store 생성.
- `model/store/EditorStoreProvider.tsx`: 경기마다 독립 store를 만들고 하위 편집기 영역에 제공.
- `model/store/useEditorStore.ts`: selector 기반 store 구독 hook.
- `model/store/index.ts`: store의 feature 내부 사용 API.
- `model/use*.ts`: 저장, 이미지 내보내기, 포메이션 변경, 참가자 변경의 클라이언트 pending과 action 호출.
- `lib/`: 편집기 전용 순수 계산. 슬롯 교체·복사, 쿼터 draft 변환, 재배정 모드 적용, 요약과 포맷을 관리한다.
- `ui/`: 편집 화면과 각 시각 영역. `FormationEditor`는 경기별 Provider 경계를 만들고, `FormationEditorContent`가 작업 hook과 화면 영역을 연결한다. `EditableFormationField`와 `BenchPlayersPanel`은 각자 소비하는 편집 store 상태를 직접 구독한다.
- `ui/FormationSlotButton.tsx`: 경기장 위 슬롯의 위치, 유니폼, 등번호, 선수 이름과 선택 상태를 표시한다. 편집 영역과 이미지 내보내기 영역이 함께 사용한다.
- `ui/match-participants/`: 참가자 명단, 등록 선수 검색·추가, 게스트 입력·수정의 화면 책임을 분리한다.
- `ui/quarter-formations/`: 쿼터 선택 버튼, 정렬 가능한 쿼터 목록, 복사·붙여넣기 카드를 구성한다. `QuarterFormationList`는 복사 초안, store 변경, 작업 피드백을 관리하고, `QuarterFormationDragArea`는 DnD context와 드래그 후 배치 교환을 관리한다. `QuarterFormationsPanel`은 선택기와 목록을 배치한다.
- `views/formation-editor/getEditorInitialData.ts`: 초기 편집에 필요한 경기, 참가자, 쿼터 데이터를 조합한다. 템플릿과 추가 가능 선수는 해당 다이얼로그를 열 때 조회한다. 경기명과 쿼터 수는 서버 페이지 헤더에서만 사용한다.
- `entities/formation/api/formationTemplateQueries.ts`: 팀 포메이션 템플릿의 공통 조회와 모델 변환.
- `features/formation-generate`: 경기 생성과 편집 재배정이 공유하는 쿼터 자동 배치 알고리즘.

## 데이터·상태 기준

- 초기 화면 데이터는 서버에서 조회하고 직렬화 가능한 편집기 모델만 Client Component로 전달한다.
- 포메이션 템플릿 옵션과 경기 참가 후보는 초기 편집에 필요하지 않으므로 각각 포메이션 변경·참가자 관리 작업을 열 때 Server Action으로 조회한다. 후보 선수 조회는 서버에서 현재 팀과 경기 참가자를 기준으로 필터링한다.
- 편집 중인 선수는 `playersById` Record로, 슬롯은 선수 ID만 참조하고 쿼터별 배치는 경기별 Zustand store에서 관리한다. 저장 전까지 DB에 반영하지 않는다.
- 슬롯 편집 저장은 `save_formation_slots` RPC로 전체 배정을 원자적으로 반영한다.
- 참가자는 원본 `id`와 `type: "general" | "guest"`로 표현한다. 슬롯은 `playerId`만 저장하고 선수 유형은 `playersById`에서 찾으며, DB 저장 시 API mapper가 `type`에 따라 선수 ID와 게스트 ID 컬럼으로 나눈다.
- DB row 타입은 `ui`, `model`, 순수 재배정 로직에 전달하지 않는다. API query가 도메인 입력 모델로 변환해 반환한다.
- 이미지 복사와 ZIP 다운로드는 미저장 편집 상태를 캡처하며 경기 데이터를 저장하지 않는다.

## 변경 시 확인할 문서

- `docs/project-design.md`: 편집기 UX와 배치 동작
- `docs/component-conventions.md`: FSD 소유처, 상태와 UI 책임
- `docs/database-schema.md`: 슬롯 컬럼, RPC, 소유권/RLS
- `features/match-create/README.md`, `features/formation-generate`: 공유 자동 배치 동작
