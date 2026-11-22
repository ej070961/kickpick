import { useEffect, type RefObject } from "react";

/** 요소 바깥을 누르면 전달한 콜백을 실행합니다. */
export const useOutsideClick = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutsideClick: () => void,
  isEnabled = true,
) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !ref.current?.contains(event.target)
      ) {
        onOutsideClick();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isEnabled, onOutsideClick, ref]);
};
