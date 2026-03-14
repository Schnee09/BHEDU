"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type AccentColor = 'amber' | 'blue' | 'emerald' | 'rose' | 'slate' | 'indigo';
export type UIDensity = 'cozy' | 'compact';
export type ThemeMode = 'light' | 'dark' | 'system';

interface CustomizationContextType {
  accentColor: AccentColor;
  density: UIDensity;
  glassOpacity: number;
  blurStrength: number;
  texture: boolean;
  theme: ThemeMode;
  setAccentColor: (color: AccentColor) => void;
  setDensity: (density: UIDensity) => void;
  setGlassOpacity: (opacity: number) => void;
  setBlurStrength: (strength: number) => void;
  setTexture: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export function CustomizationProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColor] = useState<AccentColor>('amber');
  const [density, setDensity] = useState<UIDensity>('cozy');
  const [glassOpacity, setGlassOpacity] = useState(70);
  const [blurStrength, setBlurStrength] = useState(32);
  const [texture, setTexture] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('system');

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('bh-edu-customization');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
        if (parsed.density) setDensity(parsed.density);
        if (parsed.glassOpacity) setGlassOpacity(parsed.glassOpacity);
        if (parsed.blurStrength) setBlurStrength(parsed.blurStrength);
        if (parsed.texture !== undefined) setTexture(parsed.texture);
        if (parsed.theme) setTheme(parsed.theme);
      } catch (e) {
        console.error('Failed to parse customization settings');
      }
    }
  }, []);

  // Save to LocalStorage & Apply CSS Variables
  useEffect(() => {
    const settings = { accentColor, density, glassOpacity, blurStrength, texture, theme };
    localStorage.setItem('bh-edu-customization', JSON.stringify(settings));

    // Apply CSS Variables to :root for global consumption
    const root = document.documentElement;

    // Theme Management - Unified Source of Truth
    const applyTheme = (currentTheme: ThemeMode) => {
      let isDark = false;
      if (currentTheme === 'dark') {
        isDark = true;
      } else if (currentTheme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark'); // Legacy compatibility
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light'); // Legacy compatibility
      }
    };

    applyTheme(theme);

    // Listen for system theme changes if set to 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    // Accent Colors Mapping
    const colorMap: Record<AccentColor, string> = {
      amber: '#F5A623',
      blue: '#2563EB',
      emerald: '#10B981',
      rose: '#F43F5E',
      slate: '#64748B',
      indigo: '#6366F1'
    };

    const colorHoverMap: Record<AccentColor, string> = {
      amber: '#D97706',
      blue: '#1D4ED8',
      emerald: '#059669',
      rose: '#E11D48',
      slate: '#475569',
      indigo: '#4F46E5'
    };

    root.style.setProperty('--color-primary', colorMap[accentColor]);
    root.style.setProperty('--color-primary-hover', colorHoverMap[accentColor]);
    root.style.setProperty('--glass-blur', `${blurStrength}px`);
    root.style.setProperty('--glass-opacity', `${glassOpacity / 100}`);
    root.style.setProperty('--glass-texture', texture ? '1' : '0');

    // Content density - can be used to adjust global spacing/paddings
    if (density === 'compact') {
      root.classList.add('ui-compact');
      root.style.setProperty('--ui-spacing-multiplier', '0.75');
    } else {
      root.classList.remove('ui-compact');
      root.style.setProperty('--ui-spacing-multiplier', '1');
    }

    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [accentColor, density, glassOpacity, blurStrength, texture, theme]);

  return (
    <CustomizationContext.Provider value={{
      accentColor, density, glassOpacity, blurStrength, texture, theme,
      setAccentColor, setDensity, setGlassOpacity, setBlurStrength, setTexture, setTheme
    }}>
      {children}
    </CustomizationContext.Provider>
  );
}

export const useCustomization = () => {
  const context = useContext(CustomizationContext);
  if (context === undefined) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
};
