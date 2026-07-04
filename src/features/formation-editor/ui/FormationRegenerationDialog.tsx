import type {
  FormationEditorTemplate,
  FormationRegenerationMode,
} from "@/features/formation-editor/model/types";
import { Button, SelectField } from "@/shared/ui";

type FormationRegenerationDialogProps = {
  currentFormationLabel: string;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  isOpen: boolean;
  mode: FormationRegenerationMode;
  onClose: () => void;
  onModeChange: (mode: FormationRegenerationMode) => void;
  onSubmit: () => void;
  onTemplateChange: (templateId: string) => void;
  selectedTemplateId: string;
  templates: FormationEditorTemplate[];
};

/**
 * 경기 포메이션 템플릿을 바꾸고 쿼터별 슬롯을 재배정하는 확인 모달입니다.
 */
export function FormationRegenerationDialog({
  currentFormationLabel,
  hasUnsavedChanges,
  isPending,
  isOpen,
  mode,
  onClose,
  onModeChange,
  onSubmit,
  onTemplateChange,
  selectedTemplateId,
  templates,
}: FormationRegenerationDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 py-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formation-regeneration-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="formation-regeneration-title"
              className="text-lg font-bold text-foreground"
            >
              포메이션 변경
            </h2>
            <p className="mt-1 text-sm text-muted">
              새 포메이션 타입을 선택하고 쿼터별 배치를 재생성합니다.
            </p>
          </div>
          <Button onClick={onClose} disabled={isPending} size="sm" variant="ghost">
            닫기
          </Button>
        </div>

        {hasUnsavedChanges ? (
          <div className="mt-4 rounded-lg border border-warning bg-warning/15 px-3 py-2 text-sm text-foreground">
            저장되지 않은 편집이 있습니다. 포메이션을 변경하면 현재 화면의
            미저장 수정은 재배정 결과로 대체됩니다.
          </div>
        ) : null}

        <div className="mt-4 grid gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-muted">
              현재 포메이션
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {currentFormationLabel}
            </p>
          </div>

          <SelectField
            label="새 포메이션"
            value={selectedTemplateId}
            onChange={(event) => onTemplateChange(event.target.value)}
            disabled={isPending}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </SelectField>

          <fieldset>
            <legend className="text-sm font-semibold text-foreground">
              재배정 방식
            </legend>
            <div className="mt-2 space-y-2">
              {REGENERATION_MODES.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 text-sm ${
                    mode === item.value
                      ? "border-primary bg-mint-surface"
                      : "border-border bg-background"
                  }`}
                >
                  <input
                    type="radio"
                    name="regenerationMode"
                    className="mt-1"
                    checked={mode === item.value}
                    onChange={() => onModeChange(item.value)}
                    disabled={isPending}
                  />
                  <span>
                    <span className="block font-bold text-foreground">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-muted">
                      {item.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose} disabled={isPending} variant="secondary">
            취소
          </Button>
          <Button onClick={onSubmit} disabled={isPending || templates.length === 0}>
            {isPending ? "재배정 중..." : "포메이션 변경 및 재배정"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const REGENERATION_MODES: Array<{
  description: string;
  label: string;
  value: FormationRegenerationMode;
}> = [
  {
    description:
      "모든 쿼터를 새 포메이션 기준으로 다시 생성합니다. 기존 수동 수정은 초기화됩니다.",
    label: "전체 재배정",
    value: "full",
  },
  {
    description:
      "각 쿼터에 뛰던 선수는 최대한 유지하고, 포지션만 새 포메이션에 맞춰 다시 배치합니다.",
    label: "출전 선수 유지",
    value: "preserve_players",
  },
];
