'use client'

import { useState } from 'react'

export function ErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return fallback || (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-4">Please refresh the page</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#00ff88] text-black px-6 py-2 rounded-lg font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div onError={() => setHasError(true)}>
      {children}
    </div>
  )
}
