"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options;
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    { key: "k", ctrl: true, description: "Tìm kiếm", action: () => {} }, // Handled by CommandPalette
    { key: "/", description: "Hiện phím tắt", action: () => setShowHelp(true) },
    { key: "Escape", description: "Đóng", action: () => setShowHelp(false) },
    { key: "h", alt: true, description: "Trang chủ", action: () => router.push("/dashboard") },
    { key: "s", alt: true, description: "Học sinh", action: () => router.push("/dashboard/students") },
    { key: "c", alt: true, description: "Lớp học", action: () => router.push("/dashboard/classes") },
    { key: "g", alt: true, description: "Điểm số", action: () => router.push("/dashboard/grades") },
    { key: "a", alt: true, description: "Điểm danh", action: () => router.push("/dashboard/attendance") },
    { key: "r", alt: true, description: "Báo cáo", action: () => router.push("/dashboard/reports") },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger if typing in input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape in inputs
        if (e.key !== "Escape") return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          // Skip Ctrl+K as it's handled by CommandPalette
          if (shortcut.key === "k" && shortcut.ctrl) continue;

          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    showHelp,
    setShowHelp,
    shortcuts: shortcuts.filter((s) => !(s.key === "k" && s.ctrl)), // Exclude Ctrl+K from display
  };
}
