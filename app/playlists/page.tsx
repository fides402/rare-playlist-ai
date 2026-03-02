'use client'

import { useState, useEffect } from 'react'
import { Play, Download, ListMusic, Clock, Music2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { usePlayer } from '@/components/PlayerContext'
import { showToast } from '@/components/ui/Toaster'
import type { HiFiTrack } from '@/lib/hifiClient'

interface PlaylistData {
  id: string
  name: string
  prompt: string
  description?: string | null
  createdAt: string
  updatedAt: string
  tracks: Array<{
    id: string
    trackId: string
    trackName: string
    artistName: string
    position: number
    reason?: string | null
  }>
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistData[]>([])
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { playQueue } = usePlayer()

  useEffect(() => {
    const stored = localStorage.getItem('rareplaylist_userId')
    if (stored) {
      setUserId(stored)
      loadPlaylists(stored)
    }
  }, [])

  const loadPlaylists = async (uid: string) => {
    try {
      const { getPlaylists } = await import('@/app/actions')
      const data = await getPlaylists(uid)
      const formatted = (data as any[]).map(p => ({
        ...p,
        createdAt: new Date(p.createdAt).toISOString(),
        updatedAt: new Date(p.updatedAt).toISOString(),
      }))
      setPlaylists(formatted as PlaylistData[])
    } catch (error) {
      console.error('Failed to load playlists:', error)
      showToast('Failed to load playlists', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayPlaylist = (playlist: PlaylistData) => {
    const tracks: HiFiTrack[] = playlist.tracks.map(t => ({
      id: t.trackId,
      title: t.trackName,
      artist: t.artistName,
      duration: 0,
    }))
    playQueue(tracks, 0)
    showToast(`Playing ${playlist.name}`, 'success')
  }

  const handleExport = async (playlist: PlaylistData) => {
    try {
      const { exportPlaylist } = await import('@/app/actions')
      const json = await exportPlaylist(playlist.id, userId)
      
      if (json) {
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${playlist.name}.json`
        a.click()
        URL.revokeObjectURL(url)
        showToast('Playlist exported!', 'success')
      }
    } catch (error) {
      showToast('Failed to export playlist', 'error')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading playlists...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-40 pointer-events-none" />
      
      <main className="pt-20 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Playlists</h1>
            <p className="text-text-secondary mt-1">{playlists.length} saved playlists</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 bg-surface hover:bg-surface-hover text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Music2 className="w-4 h-4" />
            New Playlist
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <ListMusic className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No playlists yet</h2>
            <p className="text-text-secondary mb-6">Generate your first rare playlist!</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <Music2 className="w-5 h-5" />
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className="bg-surface rounded-2xl p-4 border border-border hover:border-border/80 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl bg-surface-hover flex items-center justify-center flex-shrink-0">
                    <ListMusic className="w-8 h-8 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{playlist.name}</h3>
                    <p className="text-text-secondary text-sm truncate mb-2">"{playlist.prompt}"</p>
                    
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <Music2 className="w-4 h-4" />
                        {playlist.tracks.length} tracks
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(playlist.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayPlaylist(playlist)}
                      className="p-3 bg-primary hover:bg-primary-hover rounded-full transition-colors"
                    >
                      <Play className="w-5 h-5 text-black" />
                    </button>
                    <button
                      onClick={() => handleExport(playlist)}
                      className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                      title="Export JSON"
                    >
                      <Download className="w-5 h-5 text-text-secondary" />
                    </button>
                  </div>
                </div>

                {playlist.tracks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {playlist.tracks.slice(0, 5).map((track, idx) => (
                        <span
                          key={track.id}
                          className="px-3 py-1 rounded-full bg-surface-hover text-text-secondary text-xs"
                        >
                          {track.trackName} - {track.artistName}
                        </span>
                      ))}
                      {playlist.tracks.length > 5 && (
                        <span className="px-3 py-1 rounded-full bg-surface-hover text-text-muted text-xs">
                          +{playlist.tracks.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
