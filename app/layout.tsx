import type { Metadata } from 'next'
import './globals.css'

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
      <body style={{ background: '#000', color: '#fff', minHeight: '100vh', margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
