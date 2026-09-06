# match-create

새 경기를 생성하고 쿼터별 라인업을 저장하는 feature입니다. `/matches/new` 화면의 3단계 wizard에서 경기 정보, 참가 명단, 출전 조정을 입력받아 `matches`, `match_players`, `match_guest_players`, `quarter_formations`, `formation_slots`를 생성합니다.

## 폴더 구조

```txt
match-create/
  actions/
    matchCreateActions.ts
  lib/
    generateQuarterFormations.ts
    playerFormat.ts
  model/
    matchDraft.ts
    matchDraftReducer.ts
    matchDraftSelectors.ts
    matchDraftStorage.ts
    quotaSelection.ts
    types.ts
    useMatchDraft.ts
  ui/
    MatchCreateForm.tsx
    MatchCreateFooter.tsx
    MatchCreateHiddenFields.tsx
    MatchCreateStepGuard.tsx
    MatchCreateStepNav.tsx
    MatchCreateStepPanel.tsx
    PlayerPositionBadges.tsx
    adjustment/
      AdjustmentPlayerCard.tsx
      AdjustmentStep.tsx
      AdjustmentSummary.tsx
    match-info/
      FieldShell.tsx
      FormationField.tsx
      GkFixedField.tsx
      MatchDateField.tsx
      MatchInfoStep.tsx
      MatchNameField.tsx
      QuarterCountField.tsx
    participants/
      GuestFormDialog.tsx
      GuestPanel.tsx
      ParticipantsStep.tsx
      RosterPlayerPicker.tsx
```

## 파일 역할

- `actions/matchCreateActions.ts`: 경기 생성 Server Action. 입력 검증, 팀/선수 권한 확인, 게스트 snapshot 저장, 자동 포메이션 생성 결과 저장을 담당한다. `matches` 생성 이후 하위 row 저장에 실패하면 생성된 match를 삭제해 부분 생성 데이터를 정리한다.
- `lib/generateQuarterFormations.ts`: 쿼터별 선수 후보군, slot fit score, quota 차감을 계산해 자동 배치 결과를 만든다. 반복 계산을 줄이기 위해 선수-슬롯 fit score table을 먼저 만들고, 슬롯별 후보 선택은 선형 탐색으로 처리한다.
- `lib/playerFormat.ts`: 경기 생성 UI에서 선수 이름과 포지션 표시 문자열을 만든다.
- `model/matchDraft.ts`: 저장 전 경기 초안인 `MatchDraft`, 경기 조건인 `MatchInfo`, 단계 key, draft action 타입을 정의한다. 등록 선수 선택은 `selectedRegisteredPlayerIds`, 출전 조정 대상은 `playtimeAdjustmentPlayerIds`로 표현한다.
- `model/matchDraftReducer.ts`: 사용자의 직접 입력 action을 draft 상태에 반영한다. 외부 데이터에서 계산되는 기본값은 action payload로 받아 reducer를 예측 가능하게 유지한다.
- `model/matchDraftSelectors.ts`: draft, 선수 목록, 포메이션 목록을 조합해 참가자, 단계 접근 가능 여부, 출전 조정 후보, 서버 제출용 reduced player id를 계산한다.
- `model/matchDraftStorage.ts`: 새로고침 시 draft를 복구하기 위해 `sessionStorage` 저장/로드와 현재 선수/포메이션 기준 정리를 담당한다.
- `model/quotaSelection.ts`: 골키퍼 전 쿼터 고정 여부와 슬롯 수에 따라 쿼터 보정 대상 선택 수와 기본 선택값을 계산한다.
- `model/types.ts`: 등록 선수와 게스트를 같은 참가자 모델로 다루기 위한 타입과 `player:{uuid}` / `guest:{uuid}` key helper를 제공한다.
- `model/useMatchDraft.ts`: `useReducer`, selector, `sessionStorage` 저장을 묶어 경기 생성 화면의 상태 흐름을 제공한다.
- `ui/MatchCreateForm.tsx`: Server Action 연결과 단계별 UI 조립만 담당하는 클라이언트 컨테이너다.
- `ui/MatchCreateStepNav.tsx`: 클릭 가능한 3단계 버튼 UI를 렌더링한다.
- `ui/MatchCreateStepGuard.tsx`: 아직 준비되지 않은 단계에 들어왔을 때 막힌 이유와 돌아갈 단계를 안내한다.
- `ui/MatchCreateFooter.tsx`: 단계별 이전, 다음, 제출 버튼을 렌더링한다.
- `ui/MatchCreateHiddenFields.tsx`: `MatchDraft`를 기존 Server Action hidden input payload로 변환한다.
- `ui/MatchCreateStepPanel.tsx`: 경기 생성 단계의 제목, 설명, 본문 여백, 최소 높이를 맞추는 feature 전용 섹션 프레임이다.
- `ui/match-info/MatchInfoStep.tsx`: 경기명, 날짜, 쿼터 수, 포메이션, 골키퍼 전 쿼터 고정 입력을 조합한다.
- `ui/match-info/*Field.tsx`: 경기 정보 단계의 필드 단위 컴포넌트다. 현재 feature 바깥에서 재사용하지 않으므로 props 타입은 파일 내부 `Props`로 둔다.
- `ui/participants/ParticipantsStep.tsx`: 등록 선수와 게스트를 합쳐 이번 경기 참가 명단을 구성하는 단계다.
- `ui/participants/RosterPlayerPicker.tsx`: 등록 선수 검색, 단일 기준 정렬, 현재 목록 전체 선택, 개별 참가 토글을 제공한다.
- `ui/participants/GuestPanel.tsx`: 추가된 게스트 목록과 추가/수정/삭제 액션을 2단계 본문에서 제공한다.
- `ui/participants/GuestFormDialog.tsx`: 게스트 한 명의 이름, 주 포지션, 부 포지션 입력만 담당한다.
- `ui/adjustment/AdjustmentStep.tsx`: 더 뛰거나 덜 뛸 선수를 선택하는 출전 조정 단계를 렌더링한다.
- `ui/adjustment/AdjustmentSummary.tsx`: 출전 조정에 영향을 주는 포메이션, 쿼터, 나눠 뛸 선수, 골키퍼 설정을 요약한다.
- `ui/adjustment/AdjustmentPlayerCard.tsx`: 출전 조정 후보 한 명의 선택 전후 쿼터 수를 보여준다.
- `ui/PlayerPositionBadges.tsx`: 등록 선수의 주 포지션을 강조하고 부 포지션을 함께 badge로 렌더링한다.

## 작업 기준

- 자동 배치와 quota 계산은 UI에서 직접 처리하지 않고 `lib` 또는 `model`의 순수 함수로 유지한다.
- 게스트는 `/players` 명단에 저장하지 않는다. 생성 전 클라이언트 상태에서는 `GuestPlayerDraft`, 생성 후 DB에서는 `match_guest_players` snapshot으로 다룬다.
- 게스트 우선순위는 클라이언트 제출값을 신뢰하지 않는다. 서버 액션에서 선택된 등록 선수의 최하위 우선순위 다음 값부터 다시 계산한다.
- 골키퍼 전 쿼터 고정을 사용하려면 참가 명단에 `GK` 주 포지션 선수가 포함되어야 한다.
- 경기명을 비워두면 서버 액션에서 경기 날짜 기준 `{날짜} 경기` 이름으로 저장하고, 입력 placeholder도 같은 이름을 보여준다.
- 경기 생성은 여러 Supabase insert 요청으로 구성되어 있다. 생성 시간을 줄이기 위해 `quarter_formations`와 `formation_slots`는 쿼터별 루프가 아니라 배치 insert로 저장한다. `matches` 생성 이후 실패 경로는 `matches` 삭제로 cleanup하며, 하위 테이블 FK는 match 삭제 시 cascade되는 것을 전제로 한다.
- 참가자 식별자는 feature 내부에서 `player:{uuid}` 또는 `guest:{uuid}` key로 통일하고, DB 저장 시 `player_id` / `guest_player_id`로 분리한다.
- 사용자-facing 문구는 `docs/decisions/0005-match-create-wizard-ux-copy.md` 기준을 따른다. 버튼과 안내문에서는 `자동 배치 초안 생성`, `쿼터 보정 대상`보다 `라인업 만들기`, `더 뛸 선수 / 덜 뛸 선수`를 우선한다.
- 게스트 입력 항목, 경기 생성 저장 필드, 자동 배치 입력이 바뀌면 `docs/project-design.md`, `docs/database-schema.md`를 함께 확인한다.
- `MatchCreateForm`이 커질 경우 독립 섹션은 `ui/` 컴포넌트로 분리하고, 공유 계산은 `model/`로 이동한다.
