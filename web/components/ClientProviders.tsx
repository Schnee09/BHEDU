"use client"
import React, { Suspense } from 'react'
import { ToastProvider } from './ToastProvider'
import ToastBoot from './ToastBoot'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Suspense fallback={null}>
        <ToastBoot />
      </Suspense>
      {children}
    </ToastProvider>
  )
}
