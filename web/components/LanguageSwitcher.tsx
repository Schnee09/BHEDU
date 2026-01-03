"use client";

import { useI18n } from "@/contexts/I18nContext";
import { Globe, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const languages = [
    { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", name: "English", flag: "🇺🇸" },
] as const;

export default function LanguageSwitcher() {
    const { locale, setLocale } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLanguage = languages.find((l) => l.code === locale) || languages[0];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer
          bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200
          dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600 dark:hover:bg-stone-700"
                aria-label="Change language"
                title="Change language"
            >
                <span className="text-lg">{currentLanguage.flag}</span>
                <span className="hidden sm:inline text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
                <Globe className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLocale(lang.code);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${locale === lang.code ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
                                }`}
                        >
                            <span className="text-xl">{lang.flag}</span>
                            <span className="flex-1 font-medium text-gray-900 dark:text-white">{lang.name}</span>
                            {locale === lang.code && (
                                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
