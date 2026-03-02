'use client'

import { useState, useEffect } from 'react'
import { Search, Sparkles, Play, Pause, Heart, ThumbsDown, Save, MoreHorizontal, Volume2, SkipBack, SkipForward, ListMusic, Loader2 } from 'lucide-react'
import { usePlayer } from '@/components/PlayerContext'
import { showToast } from '@/components/ui/Toaster'
import { generatePlaylist } from '@/app/actions'
import type { HiFiTrack } from '@/lib/hifiClient'

interface TrackWithScore extends HiFiTrack {
  rarityScore: number
  reason: string
  finalScore: number
}

export default function HomePage() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [progressValue, setProgressValue] = useState(0)
  const [tracks, setTracks] = useState<TrackWithScore[]>([])
  const [playlistName, setPlaylistName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [userId, setUserId] = useState('')
  const [playlistLength, setPlaylistLength] = useState(30)
  const [explorationMode, setExplorationMode] = useState(0.3)
  const [hop2Enabled, setHop2Enabled] = useState(true)

  const { currentTrack, isPlaying, toggle, play, playQueue, next, previous, progress: playerProgress, duration, volume, setVolume, quality, setQuality } = usePlayer()

  useEffect(() => {
    const stored = localStorage.getItem('rareplaylist_userId')
    if (stored) {
      setUserId(stored)
    } else {
      const newId = 'user_' + Math.random().toString(36).slice(2, 15)
      localStorage.setItem('rareplaylist_userId', newId)
      setUserId(newId)
    }
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a description', 'error')
      return
    }

    setIsGenerating(true)
    setProgress('Analyzing your request...')
    setProgressValue(0)
    setTracks([])

    try {
      const result = await generatePlaylist(
        prompt,
        userId,
        {
          playlistLength,
          explorationMode,
          hop2Enabled,
          onProgress: (step, value) => {
            setProgress(step)
            setProgressValue(value)
          }
        }
      )

      setTracks(result.tracks)
      setPlaylistName(generatePlaylistName(prompt))
      showToast(`Found ${result.tracks.length} rare tracks!`, 'success')
    } catch (error) {
      console.error('Generation failed:', error)
      showToast('Failed to generate playlist. Please try again.', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePlaylistName = (prompt: string): string => {
    const words = prompt.split(' ').slice(0, 4).join(' ')
    return `Rare ${words} Mix`
  }

  const handlePlay = (track: TrackWithScore, index: number) => {
    playQueue(tracks as HiFiTrack[], index)
  }

  const handleSave = async () => {
    if (!playlistName.trim()) {
      showToast('Please enter a playlist name', 'error')
      return
    }

    try {
      const { savePlaylist } = await import('@/app/actions')
      await savePlaylist(userId, playlistName, prompt, tracks.map((t, i) => ({
        trackId: t.id,
        trackName: t.title,
        artistName: t.artist || 'Unknown Artist',
        position: i,
        reason: t.reason,
      })))
      
      showToast('Playlist saved!', 'success')
      setShowSaveModal(false)
    } catch (error) {
      showToast('Failed to save playlist', 'error')
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-40 pointer-events-none" />
      
      <main className="pt-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Rare<span className="text-primary">Playlist</span>AI
          </h1>
          <p className="text-text-secondary">Discover rare and unique tracks with AI</p>
        </div>

        <div className="bg-surface rounded-2xl p-4 mb-6 border border-border">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Describe your perfect playlist... (e.g., rare Italian 70s jazz-funk, nocturnal mood)"
                className="w-full bg-surface-active rounded-xl pl-12 pr-4 py-4 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary hover:bg-primary-hover text-black font-semibold px-6 py-4 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span className="hidden sm:inline">Generate</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-sm">Length:</span>
              <select
                value={playlistLength}
                onChange={(e) => setPlaylistLength(Number(e.target.value))}
                className="bg-surface-active text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value={20}>20 tracks</option>
                <option value={30}>30 tracks</option>
                <option value={50}>50 tracks</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-sm">Rarity:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={explorationMode}
                onChange={(e) => setExplorationMode(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-text-muted text-xs">
                {explorationMode < 0.3 ? 'Very Rare' : explorationMode < 0.6 ? 'Balanced' : 'Discover'}
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hop2Enabled}
                onChange={(e) => setHop2Enabled(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-text-secondary text-sm">Deep Discovery (slower)</span>
            </label>
          </div>

          {isGenerating && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-text-secondary text-sm">{progress}</span>
              </div>
              <div className="h-1 bg-surface-active rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressValue * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {tracks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Your Rare Playlist</h2>
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 bg-surface hover:bg-surface-hover text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>

            <div className="space-y-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`group flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer ${
                    currentTrack?.id === track.id ? 'bg-surface-active' : ''
                  }`}
                  onClick={() => handlePlay(track, index)}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-active flex items-center justify-center overflow-hidden flex-shrink-0">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ListMusic className="w-5 h-5 text-text-muted" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-xs w-5">{index + 1}</span>
                      <span className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-primary' : 'text-white'}`}>
                        {track.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary truncate">
                      <span className="truncate">{track.artist || 'Unknown'}</span>
                      <span className="text-text-muted">•</span>
                      <span className="text-xs text-primary">{track.reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-active text-xs">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-primary">{Math.round(track.rarityScore * 100)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); showToast('Added to liked!', 'success') }}
                      className="p-2 hover:bg-surface-active rounded-lg"
                    >
                      <Heart className="w-4 h-4 text-text-secondary hover:text-secondary" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); showToast('Disliked!', 'info') }}
                      className="p-2 hover:bg-surface-active rounded-lg"
                    >
                      <ThumbsDown className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tracks.length === 0 && !isGenerating && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">Enter a description and generate your rare playlist</p>
            <div className="mt-8 text-left max-w-lg mx-auto">
              <p className="text-text-muted text-sm mb-2">Try these examples:</p>
              <div className="space-y-2">
                {[
                  'rare OST italiane anni 70 jazz-funk mood notturno',
                  'underground japanese city pop 80s',
                  'obscure african funk 70s deep cuts',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="block w-full text-left px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover text-text-secondary text-sm transition-colors"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-active flex items-center justify-center overflow-hidden flex-shrink-0">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ListMusic className="w-6 h-6 text-text-muted" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{currentTrack.title}</div>
                <div className="text-text-secondary text-sm truncate">{currentTrack.artist}</div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={previous} className="p-2 hover:bg-surface-hover rounded-lg">
                  <SkipBack className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={toggle}
                  className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-hover transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-black" />
                  ) : (
                    <Play className="w-5 h-5 text-black ml-0.5" />
                  )}
                </button>
                <button onClick={next} className="p-2 hover:bg-surface-hover rounded-lg">
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 w-48">
                <Volume2 className="w-4 h-4 text-text-secondary" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1"
                />
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as 'max' | 'high' | 'medium' | 'low')}
                  className="bg-surface-active text-white text-xs rounded px-2 py-1"
                >
                  <option value="max">MAX</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MID</option>
                  <option value="low">LOW</option>
                </select>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-text-muted w-10">{formatTime(playerProgress)}</span>
              <div className="flex-1 h-1 bg-surface-active rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: duration ? `${(playerProgress / duration) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-text-muted w-10">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="text-xl font-semibold text-white mb-4">Save Playlist</h3>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full bg-surface-active rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-hover text-white hover:bg-surface-active transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-black font-semibold hover:bg-primary-hover transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
