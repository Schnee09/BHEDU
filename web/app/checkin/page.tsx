/**
 * QR Code Check-in Page
 * Student-facing page to check in using QR code
 */

'use client'

import { useState } from 'react'

export default function QRCheckinPage() {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    studentName?: string
  } | null>(null)

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      alert('Please enter your QR code')
      return
    }

    setChecking(true)
    setResult(null)

    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.trim(),
          location: window.location.hostname,
          deviceInfo: navigator.userAgent
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          studentName: data.student?.name
        })
        setCode('') // Clear code after success
      } else {
        setResult({
          success: false,
          message: data.error || 'Check-in failed'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Check-in failed'
      })
    } finally {
      setChecking(false)
    }
  }

  const handleReset = () => {
    setCode('')
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
            <svg
              className="w-16 h-16 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Attendance Check-in
          </h1>
          <p className="text-gray-600">
            Enter your QR code to mark your attendance
          </p>
        </div>

        {/* Check-in Form */}
        {!result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleCheckin}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste or type your QR code here"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
                  disabled={checking}
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  💡 Get your QR code from your teacher or the school portal
                </p>
              </div>

              <button
                type="submit"
                disabled={checking || !code.trim()}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition transform hover:scale-105 active:scale-95"
              >
                {checking ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Checking in...
                  </span>
                ) : (
                  '✓ Check In'
                )}
              </button>
            </form>

            {/* Instructions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                How to use:
              </h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Get your unique QR code from your teacher</li>
                <li>Paste or type the code in the field above</li>
                <li>Click &quot;Check In&quot; to mark your attendance</li>
                <li>You&apos;ll see a confirmation message</li>
              </ol>
            </div>
          </div>
        )}

        {/* Success Message */}
        {result && result.success && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <svg
                className="w-16 h-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Check-in Successful!
            </h2>
            {result.studentName && (
              <p className="text-lg text-gray-700 mb-4">
                Welcome, <span className="font-semibold">{result.studentName}</span>!
              </p>
            )}
            <p className="text-gray-600 mb-6">
              {result.message}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReset}
                className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Check In Another Student
              </button>
              <a
                href="/dashboard"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Go to Dashboard →
              </a>
            </div>
          </div>
        )}

        {/* Error Message */}
        {result && !result.success && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
              <svg
                className="w-16 h-16 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Check-in Failed
            </h2>
            <p className="text-gray-700 mb-6">
              {result.message}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Common Issues:
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>QR code has expired (valid for 24 hours)</li>
                <li>QR code has already been used</li>
                <li>QR code is not valid for today</li>
                <li>Invalid or incorrect code entered</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReset}
                className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Try Again
              </button>
              <a
                href="/dashboard"
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Need help? Contact your teacher or school administrator</p>
        </div>
      </div>
    </div>
  )
}
