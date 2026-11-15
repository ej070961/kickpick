"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import {
  LayoutGrid,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { Button } from "@/shared/ui";

type Props = {
  hasTemplates: boolean;
  isDisabled: boolean;
  onOpenRegeneration: () => void;
  onOpenRosterManagement: () => void;
};

/**
 * 경기 명단과 포메이션 관리 액션을 경기 설정 메뉴로 제공합니다.
 */
export function MatchSettingsMenu({
  hasTemplates,
  isDisabled,
  onOpenRegeneration,
  onOpenRosterManagement,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    getEnabledItems(menuRef.current)[0]?.focus();

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [isOpen]);

  const runAction = (action: () => void) => {
    triggerRef.current?.focus();
    setIsOpen(false);
    action();
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const menuItems = getEnabledItems(event.currentTarget);
    if (menuItems.length === 0) return;

    const activeIndex = menuItems.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = (activeIndex + 1) % menuItems.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (activeIndex - 1 + menuItems.length) % menuItems.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = menuItems.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    menuItems[nextIndex]?.focus();
  };

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (!isOpen || event.key !== "Escape") return;
        event.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }}
      ref={rootRef}
    >
      <Button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="경기 설정 메뉴 열기"
        className="w-full sm:w-auto"
        disabled={isDisabled}
        leftIcon={<SlidersHorizontal size={16} aria-hidden="true" />}
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        variant="secondary"
      >
        경기 설정
      </Button>

      {isOpen && (
        <div
          aria-label="경기 설정"
          className="border-border bg-card absolute right-0 z-20 mt-2 grid min-w-56 gap-1 rounded-xl border p-2 shadow-lg"
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
          <MenuItem
            disabled={isDisabled}
            icon={<UsersRound size={17} aria-hidden="true" />}
            label="참가 선수 관리"
            onClick={() => runAction(onOpenRosterManagement)}
          />
          <MenuItem
            disabled={isDisabled || !hasTemplates}
            icon={<LayoutGrid size={17} aria-hidden="true" />}
            label="포메이션 변경"
            onClick={() => runAction(onOpenRegeneration)}
          />
        </div>
      )}
    </div>
  );
}

const getEnabledItems = (menu: HTMLDivElement | null) =>
  Array.from(
    menu?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]:not(:disabled)',
    ) ?? [],
  );

type MenuItemProps = {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

function MenuItem({ disabled = false, icon, label, onClick }: MenuItemProps) {
  return (
    <button
      className="text-foreground hover:bg-surface focus-visible:ring-primary inline-flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      role="menuitem"
      tabIndex={-1}
      type="button"
    >
      <span className="text-muted">{icon}</span>
      {label}
    </button>
  );
}
