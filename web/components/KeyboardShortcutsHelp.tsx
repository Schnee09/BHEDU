"use client";

import { X } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function KeyboardShortcutsHelp() {
    const { showHelp, setShowHelp, shortcuts } = useKeyboardShortcuts();

    if (!showHelp) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => setShowHelp(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Phím tắt
                        </h2>
                        <button
                            onClick={() => setShowHelp(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Shortcuts List */}
                    <div className="p-4 space-y-3">
                        {/* Global */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Tìm kiếm
                            </h3>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-700 dark:text-gray-300">Mở tìm kiếm</span>
                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-600 dark:text-gray-300">
                                    Ctrl + K
                                </kbd>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Điều hướng (Alt + phím)
                            </h3>
                            <div className="space-y-2">
                                {shortcuts
                                    .filter((s) => s.alt)
                                    .map((shortcut) => (
                                        <div
                                            key={shortcut.key}
                                            className="flex items-center justify-between py-2"
                                        >
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {shortcut.description}
                                            </span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-600 dark:text-gray-300">
                                                Alt + {shortcut.key.toUpperCase()}
                                            </kbd>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Other */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Khác
                            </h3>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-700 dark:text-gray-300">Hiện phím tắt</span>
                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-600 dark:text-gray-300">
                                    /
                                </kbd>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-700 dark:text-gray-300">Đóng</span>
                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-600 dark:text-gray-300">
                                    Esc
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">/</kbd> bất kỳ lúc nào để hiện bảng này
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
