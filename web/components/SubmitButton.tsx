"use client"
import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  label,
  pendingLabel = 'Saving...',
  variant = 'primary',
  type = 'submit',
}: {
  children?: React.ReactNode
  label?: string
  pendingLabel?: string
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  type?: 'submit' | 'button'
}) {
  const { pending } = useFormStatus()

  const classesByVariant: Record<string, string> = {
    primary: 'bg-stone-900 hover:bg-stone-800 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  const cls = classesByVariant[variant] || classesByVariant.primary

  return (
    <button
      type={type}
      className={`${cls} px-4 py-2 rounded disabled:opacity-60 disabled:cursor-not-allowed text-sm`}
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? (pendingLabel || 'Saving...') : (children || label)}
    </button>
  )
}
