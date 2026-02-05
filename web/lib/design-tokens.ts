/**
 * GENERATED CODE - DO NOT MODIFY BY HAND
 * Synchronized with .shared/design_tokens.json
 */

export const DESIGN_TOKENS = {
  "brand": {
    "name": "BH-EDU",
    "version": "2.0"
  },
  "colors": {
    "primary": {
      "50": "#FFFBEB",
      "100": "#FEF3C7",
      "200": "#FDE68A",
      "300": "#FCD34D",
      "400": "#FBBF24",
      "500": "#F5A623",
      "600": "#D97706",
      "700": "#B45309",
      "800": "#92400E",
      "900": "#78350F",
      "950": "#451A03",
      "main": "#F5A623"
    },
    "accent": {
      "50": "#FAF5F0",
      "100": "#F5EBE0",
      "500": "#8B5A2B",
      "600": "#5D3E2A",
      "main": "#8B5A2B"
    },
    "semantic": {
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6"
    },
    "neutral": {
      "slate": {
        "50": "#F8FAFC",
        "100": "#F1F5F9",
        "200": "#E2E8F0",
        "300": "#CBD5E1",
        "400": "#94A3B8",
        "500": "#64748B",
        "600": "#475569",
        "700": "#334155",
        "800": "#1E293B",
        "900": "#0F172A",
        "950": "#020617"
      },
      "brown": {
        "900": "#1A1410",
        "950": "#14110E"
      }
    },
    "light": {
      "background": "#F8FAFC",
      "surface": "#FFFFFF",
      "text": "#0F172A",
      "textSecondary": "#475569",
      "textMuted": "#94A3B8",
      "border": "#CBD5E1"
    },
    "dark": {
      "background": "#1A1410",
      "surface": "#241E18",
      "text": "#FDF8F3",
      "textSecondary": "#D4C4B0",
      "textMuted": "#786858",
      "border": "#4D4238"
    }
  },
  "typography": {
    "fontPrimary": "'Be Vietnam Pro', sans-serif",
    "fontHeading": "'Be Vietnam Pro', sans-serif",
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem"
    }
  },
  "borderRadius": {
    "sm": "0.5rem",
    "md": "0.75rem",
    "lg": "1rem",
    "xl": "1.5rem",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  }
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
