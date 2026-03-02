'use client'

import { PlayerProvider } from '@/components/PlayerContext'
import { Toaster } from '@/components/ui/Toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      {children}
      <Toaster />
    </PlayerProvider>
  )
}
