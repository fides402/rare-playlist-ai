'use client'

import { useState, useEffect } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastCallback: ((toast: Omit<Toast, 'id'>) => void) | null = null

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (toastCallback) {
    toastCallback({ message, type })
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastCallback = (toast) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { ...toast, id }])
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }

    return () => {
      toastCallback = null
    }
  }, [])

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg animate-slide-up ${
            toast.type === 'success' ? 'bg-primary text-black' :
            toast.type === 'error' ? 'bg-secondary text-white' :
            'bg-surface border border-border text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
