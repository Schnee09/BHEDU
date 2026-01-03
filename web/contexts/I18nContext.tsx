"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Locale = "vi" | "en";

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = { [key: string]: TranslationValue };

// Import translations with type assertions
const viTranslations = require("@/locales/vi.json") as Translations;
const enTranslations = require("@/locales/en.json") as Translations;

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Locale, Translations> = {
    vi: viTranslations,
    en: enTranslations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("vi");

    // Load saved locale from localStorage
    useEffect(() => {
        const savedLocale = localStorage.getItem("locale") as Locale | null;
        if (savedLocale && (savedLocale === "vi" || savedLocale === "en")) {
            setLocaleState(savedLocale);
        }
    }, []);

    // Save locale to localStorage when changed
    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("locale", newLocale);
        // Update HTML lang attribute
        document.documentElement.lang = newLocale;
    }, []);

    // Translation function with nested key support (e.g., "nav.dashboard")
    const t = useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            const keys = key.split(".");
            let value: TranslationValue | undefined = translations[locale];

            for (const k of keys) {
                if (typeof value === "object" && value !== null) {
                    value = value[k];
                } else {
                    value = undefined;
                    break;
                }
            }

            // Fallback to English if translation not found
            if (value === undefined) {
                value = translations.en;
                for (const k of keys) {
                    if (typeof value === "object" && value !== null) {
                        value = value[k];
                    } else {
                        value = undefined;
                        break;
                    }
                }
            }

            // Return key if no translation found
            if (typeof value !== "string") {
                return key;
            }

            // Replace parameters like {{name}}
            if (params) {
                let result = value;
                for (const [paramKey, paramValue] of Object.entries(params)) {
                    result = result.replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue));
                }
                return result;
            }

            return value;
        },
        [locale]
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}

export function useTranslation() {
    const { t } = useI18n();
    return { t };
}
