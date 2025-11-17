"use client"
import { Toaster, toast } from 'react-hot-toast'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}

// Export toast functions directly
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  dismiss: (id?: string) => toast.dismiss(id),
}

// For backward compatibility with existing useToast hook
export function useToast() {
  return {
    show: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      if (type === 'success') toast.success(message)
      else if (type === 'error') toast.error(message)
      else toast(message)
    }
  }
}
