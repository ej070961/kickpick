# match-create

새 경기를 생성하고 자동 포메이션 초안을 저장하는 feature입니다. `/matches/new` 화면의 2단계 wizard에서 경기 조건, 등록 선수 참가 여부, 경기 전용 용병, 쿼터 보정 대상을 입력받아 `matches`, `match_players`, `match_guest_players`, `quarter_formations`, `formation_slots`를 생성합니다.

## 폴더 구조

```txt
match-create/
  actions/
    matchCreateActions.ts
  lib/
    generateQuarterFormations.ts
    playerFormat.ts
  model/
    quotaSelection.ts
    types.ts
  ui/
    GuestPlayerModal.tsx
    MatchCreateForm.tsx
    MatchInfoFields.tsx
    PlayerPositionBadges.tsx
    PlayerSelectionModal.tsx
    ReducedQuotaSelector.tsx
    StepIndicator.tsx
```

## 파일 역할

- `actions/matchCreateActions.ts`: 경기 생성 Server Action. 입력 검증, 팀/선수 권한 확인, 용병 snapshot 저장, 자동 포메이션 생성 결과 저장을 담당한다.
- `lib/generateQuarterFormations.ts`: 쿼터별 선수 후보군, slot fit score, quota 차감을 계산해 자동 배치 결과를 만든다.
- `lib/playerFormat.ts`: 경기 생성 UI에서 선수 이름과 포지션 표시 문자열을 만든다.
- `model/quotaSelection.ts`: GK 고정 여부와 슬롯 수에 따라 쿼터 보정 대상 선택 수와 기본 선택값을 계산한다.
- `model/types.ts`: 등록 선수와 용병을 같은 참가자 모델로 다루기 위한 타입과 `player:{uuid}` / `guest:{uuid}` key helper를 제공한다.
- `ui/MatchCreateForm.tsx`: 2단계 wizard의 상태와 Server Action 제출을 연결하는 클라이언트 컨테이너다.
- `ui/MatchInfoFields.tsx`: 경기명, 날짜, 쿼터 수, 포메이션, GK 고정 입력을 렌더링한다.
- `ui/PlayerSelectionModal.tsx`: 등록 선수 참가/미참가 선택 모달과 참가자 요약을 렌더링한다.
- `ui/GuestPlayerModal.tsx`: 해당 경기에서만 사용하는 용병을 추가, 수정, 삭제한다. 용병 입력은 이름, 주 포지션, 부 포지션만 받으며 등번호는 저장하지 않고 우선순위는 참가자 최하위로 자동 배정한다.
- `ui/ReducedQuotaSelector.tsx`: 자동 계산된 필요 인원 수에 맞춰 적은/많은 쿼터 배정 대상자를 선택한다.
- `ui/PlayerPositionBadges.tsx`: 등록 선수의 주/부 포지션 badge를 렌더링한다.
- `ui/StepIndicator.tsx`: 경기 생성 단계 표시를 담당한다.

## 작업 기준

- 자동 배치와 quota 계산은 UI에서 직접 처리하지 않고 `lib` 또는 `model`의 순수 함수로 유지한다.
- 용병은 `/players` 명단에 저장하지 않는다. 생성 전 클라이언트 상태에서는 `GuestPlayerDraft`, 생성 후 DB에서는 `match_guest_players` snapshot으로 다룬다.
- 참가자 식별자는 feature 내부에서 `player:{uuid}` 또는 `guest:{uuid}` key로 통일하고, DB 저장 시 `player_id` / `guest_player_id`로 분리한다.
- 용병 입력 항목, 경기 생성 저장 필드, 자동 배치 입력이 바뀌면 `docs/project-design.md`, `docs/database-schema.md`, `docs/match-guest-players.sql`을 함께 확인한다.
- `MatchCreateForm`이 커질 경우 독립 섹션은 `ui/` 컴포넌트로 분리하고, 공유 계산은 `model/`로 이동한다.
