import type { Metadata } from 'next'
import './globals.css'
import { PlayerProvider } from '@/components/PlayerContext'
import { Toaster } from '@/components/ui/Toaster'

export const metadata: Metadata = {
  title: 'RarePlaylistAI',
  description: 'AI-powered music discovery for rare and unique tracks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        <PlayerProvider>
          {children}
          <Toaster />
        </PlayerProvider>
      </body>
    </html>
  )
}
