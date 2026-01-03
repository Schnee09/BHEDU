"use client"
import React, { Suspense } from 'react'
import { ToastProvider } from './ToastProvider'
import ToastBoot from './ToastBoot'
import CommandPalette from './CommandPalette'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'
import { I18nProvider } from '@/contexts/I18nContext'

/**
 * Client-side providers wrapper
 * Simplified - using native useFetch hook instead of React Query
 */
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>
        <Suspense fallback={null}>
          <ToastBoot />
        </Suspense>
        <CommandPalette />
        <KeyboardShortcutsHelp />
        {children}
      </ToastProvider>
    </I18nProvider>
  )
}


