# formation-editor

쿼터별 포메이션 슬롯을 화면에서 검토, 교체, 저장하는 feature입니다. 서버에서 생성된 초안을 클라이언트 상태로 편집하고, 변경사항을 `formation_slots`에 저장합니다.

## 폴더 구조

```txt
formation-editor/
  actions/
    formationEditorActions.ts
  lib/
    formationEditorFormat.ts
    formationEditorSlots.ts
  model/
    types.ts
  ui/
    AssignmentSummary.tsx
    BenchPlayersPanel.tsx
    FormationEditorActions.tsx
    FormationEditorClient.tsx
    FormationField.tsx
    QuarterTabs.tsx
    SelectedSlotPanel.tsx
```

## 파일 역할

- `actions/formationEditorActions.ts`: 편집된 슬롯의 `player_id` 또는 `guest_player_id`, `fit_score`, `is_manual` 값을 저장하는 서버 액션.
- `model/types.ts`: 편집기 클라이언트에서 사용하는 선수, 슬롯, 쿼터, 배정 요약 타입.
- `lib/formationEditorFormat.ts`: 파일명 sanitize와 선수 표시명 생성 같은 순수 포맷 함수.
- `lib/formationEditorSlots.ts`: 슬롯 fit score 계산, 슬롯 간 선수 교환, 후보 선수 교체 순수 로직.
- `ui/FormationEditorClient.tsx`: feature의 클라이언트 컨테이너. 쿼터/선택/메시지 상태를 소유하고 하위 UI를 연결한다.
- `ui/AssignmentSummary.tsx`: 전체 쿼터 기준 선수별 출전 쿼터 chip 요약.
- `ui/QuarterTabs.tsx`: 활성 쿼터 전환 탭.
- `ui/FormationField.tsx`: 축구장 이미지 위에 쿼터 라벨과 슬롯 유니폼을 렌더링하는 편집 필드. PNG export 캡처 대상도 포함한다.
- `ui/SelectedSlotPanel.tsx`: 현재 선택된 슬롯과 배정 선수 정보.
- `ui/BenchPlayersPanel.tsx`: 현재 쿼터에 출전하지 않는 후보 선수 목록과 교체 액션.
- `ui/FormationEditorActions.tsx`: 저장, 현재 쿼터 PNG 내보내기, 액션 결과 메시지.

## 작업 기준

- 슬롯 배정 변경 규칙은 `lib/formationEditorSlots.ts`에 둔다. UI 컴포넌트에서 직접 fit score 계산을 반복하지 않는다.
- 새 UI 섹션이 생기면 `ui/`에 역할 단위 컴포넌트로 추가하고, 이 README의 파일 역할 목록도 갱신한다.
- 서버 저장 필드가 바뀌면 `actions/formationEditorActions.ts`, `model/types.ts`, `docs/database-schema.md`를 함께 확인한다.
- 선수 식별자는 편집기 내부에서 `player:{uuid}` 또는 `guest:{uuid}` key로 다루고, 저장 시 DB 컬럼으로 분리한다.
- 내보내기 캡처 영역을 바꾸면 `FormationField.tsx`의 `exportRef` 범위와 `features/formation-export` 동작을 함께 확인한다.
