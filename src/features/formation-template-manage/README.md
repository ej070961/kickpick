# formation-template-manage

포메이션 템플릿 목록에서 생성, 수정, 삭제를 수행하는 feature slice입니다. 템플릿은 팀에 속한 경기 생성용 슬롯 구성으로, `formation_templates`와 `formation_template_slots`에 저장됩니다.

## 구조

```txt
formation-template-manage/
  actions/
    formationTemplateActions.ts
  lib/
    formationTemplateQueries.ts
  ui/
    DeleteFormationTemplateButton.tsx
    TemplateList.tsx
    TemplateCard.tsx
    AddDialog.tsx
    EditDialog.tsx
    TemplateForm.tsx
    EmptyState.tsx
    Skeleton.tsx
```

## 파일 역할

- `actions/formationTemplateActions.ts`: 템플릿 생성, 수정, soft delete Server Action을 제공한다.
- `lib/formationTemplateQueries.ts`: current team의 active 템플릿을 조회하고 UI 모델로 변환한다.
- `ui/TemplateForm.tsx`: 생성과 수정에서 공유하는 이름/슬롯 입력 폼이다.
- `ui/AddDialog.tsx`: 모바일에서 새 템플릿 등록 폼을 모달로 연다.
- `ui/EditDialog.tsx`: 기존 템플릿을 수정하는 모달이다.
- `ui/TemplateList.tsx`: 템플릿 목록과 빈 상태를 전환한다.
- `ui/TemplateCard.tsx`: 템플릿 요약과 수정/삭제 액션을 보여준다.
- `ui/EmptyState.tsx`: 템플릿이 없을 때 보여주는 빈 상태다.
- `ui/Skeleton.tsx`: 포메이션 관리 route loading UI다.

## 변경 시 확인할 문서

- `docs/project-design.md`: 템플릿 관리 UX와 경기 생성 흐름
- `docs/database-schema.md`: 템플릿/슬롯 테이블과 RLS 기대사항
- `docs/decisions/0002-starter-formation-templates.md`: 신규 팀 기본 템플릿과 수정 저장 정책

## 구현 경계

- 템플릿 생성과 수정은 포지션 10개를 입력받고 저장 시 `GK` 슬롯을 함께 구성한다.
- 템플릿 수정은 기존 `formation_templates.id`를 유지하고 `replace_formation_template` RPC로 하위 슬롯 row를 원자적으로 교체한다.
- 이미 생성된 경기의 포메이션 슬롯은 snapshot이므로 템플릿 수정의 영향을 받지 않는다.
- 기본 템플릿은 `entities/formation`의 starter template 설정에서 생성되며, 생성 이후에는 일반 템플릿과 동일하게 다룬다.
