"use client";
import { useEffect, useRef, type RefObject } from "react";

// Shared dialog behaviour (PRD 9, Accessibility): trap focus, close on Escape,
// lock page scroll and return focus to the opener. A stack makes sure only the
// topmost dialog reacts when a confirm opens on top of a slide-over.
const stack: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

export function useModal(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return;
    const token = Symbol("modal");
    stack.push(token);
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const el = ref.current;
    const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el)?.focus();

    function onKey(e: KeyboardEvent) {
      if (stack[stack.length - 1] !== token || !el) return;
      if (e.key === "Escape") {
        e.preventDefault();
        dismissRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(token), 1);
      if (stack.length === 0) document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open, ref]);
}
