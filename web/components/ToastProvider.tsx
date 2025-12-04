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
            background: '#FFFFFF',
            color: '#1C1917',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #E7E5E4',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '16px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#F0FDF4',
              color: '#166534',
              border: '1px solid #86EFAC',
            },
            iconTheme: {
              primary: '#16A34A',
              secondary: '#FFFFFF',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FCA5A5',
            },
            iconTheme: {
              primary: '#DC2626',
              secondary: '#FFFFFF',
            },
          },
          loading: {
            style: {
              background: '#FFFBEB',
              color: '#92400E',
              border: '1px solid #FCD34D',
            },
            iconTheme: {
              primary: '#F59E0B',
              secondary: '#FFFFFF',
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
