"use client"
import { useFormStatus } from 'react-dom'

export default function ConfirmSubmitButton({
  children,
  label,
  confirmMessage = 'Are you sure you want to delete?',
  className = '',
}: {
  children?: React.ReactNode
  label?: string
  confirmMessage?: string
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-60 ${className}`}
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      {pending ? 'Deleting...' : (children || label || 'Delete')}
    </button>
  )
}
