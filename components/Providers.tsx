'use client'

import { PlayerProvider } from '@/components/PlayerContext'
import { Toaster } from '@/components/ui/Toaster'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <PlayerProvider>
        {children}
        <Toaster />
      </PlayerProvider>
    </ErrorBoundary>
  )
}
