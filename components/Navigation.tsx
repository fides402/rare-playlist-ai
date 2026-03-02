'use client'

import Link from 'next/link'
import { Home, Library, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Discover', icon: Home },
    { href: '/playlists', label: 'Playlists', icon: Library },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-lg border-b border-border z-50">
      <div className="max-w-4xl mx-auto h-full px-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">
          Rare<span className="text-primary">Playlist</span>AI
        </Link>

        <div className="flex items-center gap-1">
          {links.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-surface-hover text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
