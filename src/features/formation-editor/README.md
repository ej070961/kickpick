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
    formationEditorStore.tsx
    useFormationExport.ts
    useFormationRegeneration.ts
  ui/
    AssignmentSummary.tsx
    BenchPlayersPanel.tsx
    FormationEditorActions.tsx
    FormationEditorClient.tsx
    FormationExportFields.tsx
    FormationEditorMainArea.tsx
    FormationEditorSidePanel.tsx
    FormationField.tsx
    FormationRegenerationDialog.tsx
    FormationToolbar.tsx
    MatchSettingsMenu.tsx
    PlayerDisplayName.tsx
    QuarterSelect.tsx
    QuarterSwapDialog.tsx
    QuarterTabs.tsx
    RosterManagementDialog.tsx
    SelectedSlotPanel.tsx
```

## 파일 역할

- `actions/formationEditorActions.ts`: 편집된 슬롯 저장 RPC를 호출하고, 포메이션 변경 시 슬롯을 재생성하며, 경기 명단 추가/제거와 게스트 추가/수정을 처리하는 서버 액션.
- `api/formationEditorQueries.ts`: 편집기 초기 렌더링, 포메이션 재배정, 명단 수정 후 화면 갱신에 필요한 경기, 참가자, 쿼터 정보를 조회하고 `match` 의미 데이터와 editor 타입으로 정규화한다.
- `api/formationEditorMutations.ts`: 포메이션 슬롯의 원자적 저장과 경기 포메이션명 갱신을 담당한다.
- `api/formationEditorRows.ts`: 편집기 feature의 data source adapter 내부에서 사용하는 Supabase row 타입을 정의한다. UI와 model hook은 이 타입을 import하지 않는다.
- `model/types.ts`: 편집기 입력·표시 타입과 entity 모델에서 파생한 편집기 타입.
- `model/formationEditorStore.tsx`: 경기별 클라이언트 편집 store와 Provider. 공유 배치, 선택, 참가자 스냅샷을 관리한다.
- `model/useEditorRoster.ts`: 경기 참가 명단 추가, 제거, 게스트 저장에 따른 선수 목록과 쿼터 상태 갱신을 관리한다.
- `model/useEditorSave.ts`: 편집된 슬롯 배정을 저장하는 서버 액션 흐름을 관리한다.
- `model/useFormationExport.ts`: 현재 쿼터 이미지 복사, 복사 미지원 시 PNG 저장, 전체 쿼터 ZIP 다운로드를 관리한다.
- `model/useFormationRegeneration.ts`: 포메이션 변경 모달 상태와 재배정 서버 액션 호출을 관리한다.
- `lib/formationEditorFormat.ts`: 파일명 sanitize와 선수 표시명 생성 같은 순수 포맷 함수.
- `lib/formationEditorMappers.ts`: 편집기 player key, DB row, insert row, 클라이언트 쿼터 상태 간 변환을 담당한다.
- `lib/formationEditorSummary.ts`: 후보 선수 정렬과 전체 쿼터 배정 요약 계산 함수.
- `lib/formationEditorSlots.ts`: 슬롯 fit score 계산, 슬롯·쿼터 간 선수 교환, 후보 선수 교체 순수 로직.
- `lib/regenerateFormationSlots.ts`: 포메이션 변경 시 전체 재배정 또는 쿼터별 기존 출전 선수 유지 재배정을 선택해 실행하는 순수 로직.
- `ui/FormationEditorClient.tsx`: 경기별 store Provider와 여러 화면 영역에서 함께 쓰는 작업 hook을 조립한다.
- `ui/FormationExportFields.tsx`: store의 현재 선수·쿼터로 전체 쿼터 내보내기용 캡처 영역을 렌더링한다.
- `ui/FormationEditorMainArea.tsx`: store에서 현재 쿼터와 선택 상태를 구독하고 쿼터 탭, 필드, 쿼터 교환 진입점을 구성한다.
- `ui/FormationEditorSidePanel.tsx`: store에서 선택·후보 데이터를 구독하고 선택 요약, 후보, 액션 영역을 조립한다.
- `ui/AssignmentSummary.tsx`: store의 선수·쿼터를 구독해 출전 요약을 계산하고 접힘 상태를 로컬로 관리한다.
- `ui/QuarterTabs.tsx`: 활성 쿼터 전환 탭.
- `ui/FormationField.tsx`: 축구장 이미지 위에 쿼터 라벨과 슬롯 유니폼을 렌더링하는 편집 필드. PNG export 캡처 대상도 포함한다.
- `ui/FormationRegenerationDialog.tsx`: 경기 포메이션 템플릿과 재배정 방식을 선택하고 영향 범위를 안내하는 모달.
- `ui/FormationToolbar.tsx`: 현재 경기 포메이션, 저장 전 변경 배지, 경기 설정 메뉴를 표시한다.
- `ui/MatchSettingsMenu.tsx`: 참가 선수 관리와 포메이션 변경 메뉴 및 액션 진입점을 제공한다.
- `ui/QuarterSwapDialog.tsx`: 두 쿼터를 선택해 `onConfirm`으로 전달한다. 부모가 제공한 오류 문구는 현재 선택을 제출한 경우에 표시하고, 선택이 바뀌면 숨긴다. 교환 실행, 오류 문구 결정, 성공 시 닫기는 `FormationEditorClient`가 담당한다.
- `ui/QuarterSelect.tsx`: 쿼터 번호 목록을 표시하고 반대쪽에서 선택한 쿼터를 비활성화한다.
- `ui/PlayerDisplayName.tsx`: 선수 이름과 게스트 표기 문구를 일관되게 렌더링한다.
- `ui/SelectedSlotPanel.tsx`: 현재 선택된 슬롯과 배정 선수 정보.
- `ui/BenchPlayersPanel.tsx`: 현재 쿼터에 출전하지 않는 후보 선수 목록과 교체 액션. 후보 선수를 먼저 선택한 뒤 유니폼을 눌러도 교체할 수 있다.
- `ui/RosterManagementDialog.tsx`: 모달에서 경기 참가 명단, 등록 선수 추가, 게스트 추가/수정, 참가자 제거 액션을 제공한다.
- `ui/FormationEditorActions.tsx`: 저장, 이미지 복사, 전체 쿼터 다운로드 액션을 제공한다. 저장과 이미지 복사 결과는 토스트로, 명단·재배정 등 나머지 결과는 액션 영역 메시지로 보여준다.

## 작업 기준

- 슬롯 배정 변경 규칙은 `lib/formationEditorSlots.ts`에 둔다. UI 컴포넌트에서 직접 fit score 계산을 반복하지 않는다.
- 쿼터 배치 교환은 슬롯 id와 쿼터 소속을 유지하면서 같은 포지션 슬롯의 선수 배정을 교환한다. 확인하면 로컬 편집 상태를 바꾸고, 기존 저장 버튼을 누를 때 DB에 반영한다.
- 편집기 저장은 `save_formation_slots` RPC를 통해 전체 슬롯을 한 트랜잭션으로 반영한다.
- 새 UI 섹션이 생기면 `ui/`에 역할 단위 컴포넌트로 추가하고, 이 README의 파일 역할 목록도 갱신한다.
- 반복되는 버튼, 패널, 배지, 입력 스타일은 `shared/ui`를 우선 사용한다.
- 서버 저장 필드가 바뀌면 `actions/formationEditorActions.ts`, `model/types.ts`, `docs/database-schema.md`를 함께 확인한다.
- 선수 식별자는 편집기 내부에서 `player:{uuid}` 또는 `guest:{uuid}` key로 다루고, 저장 시 DB 컬럼으로 분리한다.
- 명단에서 참가자를 제거하면 서버와 클라이언트 모두 해당 선수의 배정 슬롯을 미배정으로 갱신한다.
- 명단 변경 후 클라이언트는 현재 편집 초안에 참가자 제거 또는 게스트 적합도 변경만 반영한다. 게스트 적합도는 저장된 배치가 아니라 편집 초안의 배정 포지션을 기준으로 계산한다.
- 전체 재배정은 `features/match-create/lib/generateQuarterFormations.ts`를 재사용해 경기 생성과 같은 배치 규칙을 따른다.
- 출전 선수 유지 재배정은 기존 쿼터별 배정 선수 집합을 보존하는 로직이므로 `lib/regenerateFormationSlots.ts`에서 관리한다.
- 내보내기 캡처 영역을 바꾸면 `FormationField.tsx`의 `exportRef` 범위와 `features/formation-export` 동작을 함께 확인한다.
- 이미지 복사와 전체 쿼터 다운로드는 저장 여부와 관계없이 현재 편집 상태를 내보낸다. 전체 이미지는 쿼터 순서대로 ZIP에 담는다.
- Store는 경기별 Provider 인스턴스로 생성한다. 편집 초안에 영향을 주는 액션만 store에 두고, 다이얼로그·폼 상태와 서버 작업 pending은 해당 UI 또는 작업 hook에 둔다.
- 작업 hook은 소비 컴포넌트 하나에만 속하고 상태도 그 안에서 닫히면 해당 컴포넌트 가까이에 둔다. 여러 영역에서 pending이나 액션을 공유하거나 다른 영역의 ref가 필요하면 화면 조립 컴포넌트가 연결을 맡고, 하위 컴포넌트에는 실제 사용하는 값과 콜백만 전달한다.
