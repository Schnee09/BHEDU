"use client"
import React, { Suspense } from 'react'
import { ToastProvider } from './ToastProvider'
import ToastBoot from './ToastBoot'
import dynamic from 'next/dynamic'
import { I18nProvider } from '@/contexts/I18nContext'

const CommandPalette = dynamic(() => import('./CommandPalette'), {
  ssr: false,
  loading: () => null,
})

const KeyboardShortcutsHelp = dynamic(() => import('./KeyboardShortcutsHelp'), {
  ssr: false,
  loading: () => null,
})

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
        <KeyboardShortcutsHelp />
        {children}
      </ToastProvider>
    </I18nProvider>
  )
}
