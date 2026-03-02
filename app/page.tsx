'use client'

import { useState, useEffect, useRef } from 'react'

interface HiFiTrack {
  id: string
  title: string
  artist?: string
  album?: string
  duration?: number
  popularity?: number
  coverUrl?: string
  previewUrl?: string
  bpm?: number
  key?: string
}

interface TrackWithScore extends HiFiTrack {
  rarityScore: number
  reason: string
  finalScore: number
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  )
}

function ListMusicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  )
}

function SkipBackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

function SkipForwardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

function LoaderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}

export default function HomePage() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [tracks, setTracks] = useState<TrackWithScore[]>([])
  const [playlistName, setPlaylistName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [userId, setUserId] = useState('')
  const [playlistLength, setPlaylistLength] = useState(30)
  const [explorationMode, setExplorationMode] = useState(0.3)
  const [hop2Enabled, setHop2Enabled] = useState(true)
  const [savedPlaylists, setSavedPlaylists] = useState<any[]>([])
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([])
  const [currentTrack, setCurrentTrack] = useState<HiFiTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    const stored = localStorage.getItem('rareplaylist_userId')
    if (stored) {
      setUserId(stored)
    } else {
      const newId = 'user_' + Math.random().toString(36).slice(2, 15)
      localStorage.setItem('rareplaylist_userId', newId)
      setUserId(newId)
    }
    
    try {
      const saved = localStorage.getItem('rareplaylist_playlists')
      if (saved) setSavedPlaylists(JSON.parse(saved))
    } catch {}
  }, [isClient])

  const showToast = (message: string, type: string = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  const generatePlaylist = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a description', 'error')
      return
    }

    setIsGenerating(true)
    setTracks([])

    try {
      const { hiFiClient } = await import('@/lib/hifiClient')
      const { planFromPrompt, extractConstraintsFromPlan } = await import('@/lib/planner')
      const { rankTracks } = await import('@/lib/ranking')
      const { graphDiscovery, enrichTracksWithInfo } = await import('@/lib/graphDiscovery')

      const plan = await planFromPrompt(prompt)
      console.log('Plan:', plan)
      
      const constraints = extractConstraintsFromPlan(plan)

      let allTracks: HiFiTrack[] = []
      
      for (const query of plan.searchQueries.slice(0, 3)) {
        try {
          console.log('Searching for:', query)
          const results = await hiFiClient.search(query, 50)
          const trackList = results.data?.items || []
          console.log('Results for', query, ':', trackList.length)
          allTracks.push(...trackList)
        } catch (e: any) {
          console.error('Search error for', query, ':', e.message)
        }
      }

      console.log('Total tracks found:', allTracks.length)

      if (allTracks.length === 0) {
        showToast('No tracks found. Check console for details.', 'error')
        return
      }

      const discoveryResult = await graphDiscovery(allTracks, {
        maxSeeds: 8,
        maxRecsPerSeed: 25,
        maxHop2Seeds: hop2Enabled ? 3 : 0,
        maxTotalRequests: 40,
        enableHop2: hop2Enabled,
      })

      let enrichedTracks = discoveryResult.tracks
      if (discoveryResult.tracks.length > 10) {
        try {
          enrichedTracks = await enrichTracksWithInfo(discoveryResult.tracks, 15)
        } catch {}
      }

      const rankedTracks = rankTracks(enrichedTracks, constraints, undefined, explorationMode)

      const finalTracks = rankedTracks.slice(0, playlistLength).map(track => ({
        ...track,
        rarityScore: track.rarityScore,
        reason: track.reason,
        finalScore: track.finalScore,
      }))

      setTracks(finalTracks as TrackWithScore[])
      setPlaylistName(`Rare ${prompt.split(' ').slice(0, 3).join(' ')} Mix`)
      showToast(`Found ${finalTracks.length} rare tracks!`, 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to generate', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const playTrack = (track: TrackWithScore) => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }
    
    if (currentTrack?.id === track.id && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      const src = track.previewUrl || `https://api.monochrome.tf/stream/${track.id}`
      audioRef.current.src = src
      audioRef.current.play().then(() => {
        setCurrentTrack(track)
        setIsPlaying(true)
      }).catch(() => {
        showToast('Cannot play this track', 'error')
      })
    }
  }

  const handleSave = () => {
    if (!playlistName.trim()) {
      showToast('Enter a name', 'error')
      return
    }

    const playlist = {
      id: `${userId}_${Date.now()}`,
      name: playlistName,
      prompt,
      createdAt: new Date().toISOString(),
      tracks: tracks.map((t, i) => ({
        trackId: t.id,
        trackName: t.title,
        artistName: t.artist || 'Unknown',
        position: i,
        reason: t.reason,
      }))
    }
    
    const updated = [playlist, ...savedPlaylists]
    setSavedPlaylists(updated)
    localStorage.setItem('rareplaylist_playlists', JSON.stringify(updated))
    showToast('Saved!', 'success')
    setShowSaveModal(false)
  }

  const handleLike = (track: TrackWithScore) => {
    let feedback: any[] = []
    try {
      feedback = JSON.parse(localStorage.getItem('rareplaylist_feedback') || '[]')
    } catch {}
    const existing = feedback.findIndex(f => f.trackId === track.id)
    if (existing >= 0) {
      feedback[existing] = { ...feedback[existing], liked: true }
    } else {
      feedback.push({ trackId: track.id, trackName: track.title, artistName: track.artist, liked: true })
    }
    localStorage.setItem('rareplaylist_feedback', JSON.stringify(feedback))
    showToast('Liked!', 'success')
  }

  const handleExport = (playlist: any) => {
    const blob = new Blob([JSON.stringify(playlist, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${playlist.name}.json`
    a.click()
  }

  const handleDelete = (id: string) => {
    const updated = savedPlaylists.filter(p => p.id !== id)
    setSavedPlaylists(updated)
    localStorage.setItem('rareplaylist_playlists', JSON.stringify(updated))
    showToast('Deleted', 'info')
  }

  if (!isClient) {
    return (
      <div style={{ background: '#000', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <LoaderIcon />
          <p style={{ marginTop: '16px', color: '#a0a0a0' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', paddingBottom: currentTrack ? '100px' : '40px' }}>
      {isClient && <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />}
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
              Rare<span style={{ color: '#00ff88' }}>Playlist</span>AI
            </h1>
            <p style={{ color: '#a0a0a0', margin: '4px 0 0' }}>Discover rare and unique tracks with AI</p>
          </div>
          <button 
            onClick={() => setShowPlaylists(!showPlaylists)}
            style={{ background: '#0a0a0a', color: '#fff', border: '1px solid #222', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ListMusicIcon />
            My Playlists ({savedPlaylists.length})
          </button>
        </div>

        {!showPlaylists ? (
          <>
            <div style={{ background: '#0a0a0a', borderRadius: '16px', padding: '16px', border: '1px solid #222', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#606060' }}>
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generatePlaylist()}
                    placeholder="Describe your playlist... (e.g., rare Italian 70s jazz-funk)"
                    style={{ width: '100%', background: '#1a1a1a', border: 'none', borderRadius: '12px', padding: '16px 16px 16px 48px', color: '#fff', fontSize: '16px', outline: 'none' }}
                  />
                </div>
                <button
                  onClick={generatePlaylist}
                  disabled={isGenerating}
                  style={{ background: '#00ff88', color: '#000', border: 'none', borderRadius: '12px', padding: '16px 24px', fontWeight: 'bold', cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isGenerating ? <LoaderIcon /> : <SparklesIcon />}
                  Generate
                </button>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #222', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#a0a0a0', fontSize: '14px' }}>Length:</span>
                  <select
                    value={playlistLength}
                    onChange={(e) => setPlaylistLength(Number(e.target.value))}
                    style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px' }}
                  >
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#a0a0a0', fontSize: '14px' }}>Rarity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={explorationMode}
                    onChange={(e) => setExplorationMode(Number(e.target.value))}
                    style={{ width: '80px' }}
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hop2Enabled} onChange={(e) => setHop2Enabled(e.target.checked)} />
                  <span style={{ color: '#a0a0a0', fontSize: '14px' }}>Deep Discovery</span>
                </label>
              </div>
            </div>

            {tracks.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Your Rare Playlist</h2>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    style={{ background: '#0a0a0a', color: '#fff', border: '1px solid #222', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <SaveIcon />
                    <span style={{ marginLeft: '6px' }}>Save</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        background: currentTrack?.id === track.id ? '#1a1a1a' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {currentTrack?.id === track.id && isPlaying ? <PauseIcon /> : <PlayIcon />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '500', color: currentTrack?.id === track.id ? '#00ff88' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {track.title}
                        </div>
                        <div style={{ fontSize: '14px', color: '#a0a0a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {track.artist} • <span style={{ color: '#00ff88', fontSize: '12px' }}>{track.reason}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(track) }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
                      >
                        <HeartIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tracks.length === 0 && !isGenerating && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ color: '#606060', margin: '0 auto 16px' }}>
                  <SparklesIcon />
                </div>
                <p style={{ color: '#a0a0a0' }}>Enter a description and generate your rare playlist</p>
              </div>
            )}
          </>
        ) : (
          <div>
            <button
              onClick={() => setShowPlaylists(false)}
              style={{ background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', marginBottom: '20px' }}
            >
              ← Back
            </button>
            
            {savedPlaylists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ color: '#606060', margin: '0 auto 16px' }}>
                  <ListMusicIcon />
                </div>
                <p style={{ color: '#a0a0a0' }}>No playlists yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {savedPlaylists.map(playlist => (
                  <div key={playlist.id} style={{ background: '#0a0a0a', borderRadius: '16px', padding: '16px', border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{playlist.name}</h3>
                        <p style={{ color: '#a0a0a0', fontSize: '14px', margin: '4px 0' }}>"{playlist.prompt}"</p>
                        <p style={{ color: '#606060', fontSize: '12px' }}>{playlist.tracks.length} tracks</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleExport(playlist)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
                          <DownloadIcon />
                        </button>
                        <button onClick={() => handleDelete(playlist.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {currentTrack && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0a0a0a', borderTop: '1px solid #222', padding: '12px 20px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ListMusicIcon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.title}</div>
              <div style={{ color: '#a0a0a0', fontSize: '14px' }}>{currentTrack.artist}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => audioRef.current && (audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10))}>
                <SkipBackIcon />
              </button>
              <button
                onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#00ff88', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}>
                <SkipForwardIcon />
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '100px', right: '20px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ 
            background: t.type === 'error' ? '#ff3366' : t.type === 'success' ? '#00ff88' : '#1a1a1a', 
            color: t.type === 'success' ? '#000' : '#fff',
            padding: '12px 16px', 
            borderRadius: '8px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            {t.message}
          </div>
        ))}
      </div>

      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: '#0a0a0a', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Save Playlist</h3>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Playlist name"
              style={{ width: '100%', background: '#1a1a1a', border: 'none', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '16px', marginBottom: '16px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSaveModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#00ff88', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
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
