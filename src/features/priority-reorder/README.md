# priority-reorder

선수 명단의 자동 배치 고려 순서를 드래그 앤 드롭으로 조정하는 feature입니다.

## 구조

```txt
priority-reorder/
  actions/
    priorityActions.ts
  ui/
    PriorityBoard.tsx
    PriorityBoardSummary.tsx
    SortablePlayerRow.tsx
```

## 파일 역할

- `actions/priorityActions.ts`: current team의 active 선수 목록을 검증하고 순서를 저장하는 Server Action입니다.
- `ui/PriorityBoard.tsx`: 선수 ID 순서만 로컬 state로 관리하고 선수 정보는 최신 props에서 가져옵니다. 저장 전 드래그 순서는 유지하며 삭제된 선수는 제외하고 새 선수는 목록 끝에 추가합니다. 저장 action 연결도 담당합니다.
- `ui/PriorityBoardSummary.tsx`: 등록 선수 수, 저장 상태, 저장 버튼을 렌더링합니다.
- `ui/SortablePlayerRow.tsx`: 드래그 가능한 선수 카드와 카드 내부 액션을 렌더링합니다.

## 변경 시 확인 문서

- `docs/component-conventions.md`: FSD 경계와 컴포넌트 분리 기준
- `docs/project-design.md`: 선수 관리 화면의 UX 방향
- `docs/decisions/0003-player-management-structure-and-ux.md`: 선수 관리 구조와 UX 개선 목표
