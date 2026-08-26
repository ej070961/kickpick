# player-manage

등록 선수 명단을 생성, 수정, 삭제하는 feature입니다. 우선순위 정렬은 `features/priority-reorder`가 담당하지만, 선수 카드에서 편집/삭제 액션을 함께 노출하므로 두 feature가 `/players` 화면에서 조합됩니다.

## 구조

```txt
player-manage/
  actions/
    playerActions.ts
  model/
    usePlayerFormState.ts
  ui/
    CreatePlayerModal.tsx
    DeletePlayerButton.tsx
    EditPlayerModal.tsx
    PlayerBasicFields.tsx
    PlayerFormDialog.tsx
    PlayerForm.tsx
    PlayerPositionFields.tsx
    PlayersSkeleton.tsx
    SubmitButton.tsx
```

## 파일 역할

- `actions/playerActions.ts`: current team 기준 선수 생성, 수정, soft delete Server Actions입니다.
- `model/usePlayerFormState.ts`: 선수 폼 입력 상태와 주/부 포지션 연동 규칙을 관리합니다.
- `ui/PlayerForm.tsx`: 선수 생성/수정 공통 폼입니다. 폼 state와 Server Action 연결을 담당합니다.
- `ui/PlayerBasicFields.tsx`: 선수 이름과 등번호 입력 필드를 렌더링합니다.
- `ui/PlayerPositionFields.tsx`: 주 포지션 select와 부 포지션 다중 선택 리스트를 렌더링합니다.
- `ui/PlayerFormDialog.tsx`: 선수 생성/수정 폼을 공통 dialog 안에서 렌더링하고, 닫힐 때 폼 상태를 unmount로 초기화합니다.
- `ui/CreatePlayerModal.tsx`: 선수 추가 dialog 트리거입니다.
- `ui/EditPlayerModal.tsx`: 선수 편집 dialog 트리거입니다.
- `ui/DeletePlayerButton.tsx`: 공통 확인 dialog를 사용해 soft delete submit을 처리합니다.
- `ui/PlayersSkeleton.tsx`: `/players` route loading UI입니다.
- `ui/SubmitButton.tsx`: feature 내부 Server Action pending 버튼입니다.

## 변경 시 확인 문서

- `docs/project-design.md`: 선수 관리 UX와 포지션 표시 정책
- `docs/component-conventions.md`: FSD 경계와 feature 책임
- `docs/database-schema.md`: `players` 테이블, current team ownership, RLS 기대사항
- `docs/decisions/0003-player-management-structure-and-ux.md`: 선수 관리 개선 목표와 성공 기준
