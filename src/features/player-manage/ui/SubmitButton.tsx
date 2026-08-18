"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/shared/ui";

type SubmitButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
  variant?: ComponentProps<typeof Button>["variant"];
};

/**
 * 서버 액션 제출 상태를 반영하는 공통 submit 버튼입니다.
 */
export function SubmitButton({
  children,
  className,
  disabled = false,
  pendingLabel = "처리 중",
  variant,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={className}
      disabled={disabled || pending}
      variant={variant}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
