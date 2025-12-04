"use client"
import React, { Suspense } from 'react'
import { ToastProvider } from './ToastProvider'
import ToastBoot from './ToastBoot'
import { ReactQueryProvider } from '@/providers/ReactQueryProvider'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <ToastProvider>
        <Suspense fallback={null}>
          <ToastBoot />
        </Suspense>
        {children}
      </ToastProvider>
    </ReactQueryProvider>
  )
}
