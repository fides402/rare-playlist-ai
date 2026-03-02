'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Sparkles, Play, Pause, Heart, Save, Volume2, ListMusic, Loader2, Download, Trash2, SkipBack, SkipForward } from 'lucide-react'
import { hiFiClient } from '@/lib/hifiClient'
import { planFromPrompt, extractConstraintsFromPlan } from '@/lib/planner'
import { rankTracks } from '@/lib/ranking'
import { graphDiscovery, enrichTracksWithInfo } from '@/lib/graphDiscovery'
import type { HiFiTrack } from '@/lib/hifiClient'

interface TrackWithScore extends HiFiTrack {
  rarityScore: number
  reason: string
  finalScore: number
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
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
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
  }, [])

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
      const plan = await planFromPrompt(prompt)
      const constraints = extractConstraintsFromPlan(plan)

      let allTracks: HiFiTrack[] = []
      
      for (const query of plan.searchQueries.slice(0, 3)) {
        try {
          const results = await hiFiClient.search(query, 50)
          allTracks.push(...results.tracks)
        } catch (e) {}
      }

      if (allTracks.length === 0) {
        throw new Error('No tracks found')
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
    if (typeof window === 'undefined') return
    
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('rareplaylist_playlists', JSON.stringify(updated))
    }
    showToast('Saved!', 'success')
    setShowSaveModal(false)
  }

  const handleLike = (track: TrackWithScore) => {
    if (typeof window === 'undefined') return
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('rareplaylist_playlists', JSON.stringify(updated))
    }
    showToast('Deleted', 'info')
  }

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', paddingBottom: currentTrack ? '180px' : '40px' }}>
      {typeof window !== 'undefined' && <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />}
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
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
            <ListMusic size={16} />
            My Playlists ({savedPlaylists.length})
          </button>
        </div>

        {!showPlaylists ? (
          <>
            <div style={{ background: '#0a0a0a', borderRadius: '16px', padding: '16px', border: '1px solid #222', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#606060' }} size={20} />
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
                  {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
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
                    <Save size={16} style={{ display: 'inline', marginRight: '6px' }} />
                    Save
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
                        {currentTrack?.id === track.id && isPlaying ? <Pause size={18} color="#00ff88" /> : <Play size={18} color="#00ff88" />}
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
                        <Heart size={16} color="#a0a0a0" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tracks.length === 0 && !isGenerating && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Sparkles size={48} color="#606060" style={{ margin: '0 auto 16px' }} />
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
                <ListMusic size={48} color="#606060" style={{ margin: '0 auto 16px' }} />
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
                          <Download size={18} color="#a0a0a0" />
                        </button>
                        <button onClick={() => handleDelete(playlist.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
                          <Trash2 size={18} color="#a0a0a0" />
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
              <ListMusic size={24} color="#606060" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.title}</div>
              <div style={{ color: '#a0a0a0', fontSize: '14px' }}>{currentTrack.artist}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => audioRef.current && (audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10))}>
                <SkipBack size={20} color="#fff" />
              </button>
              <button
                onClick={() => isPlaying ? audioRef.current?.pause() : audioRef.current?.play()}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#00ff88', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {isPlaying ? <Pause size={20} color="#000" /> : <Play size={20} color="#000" style={{ marginLeft: '2px' }} />}
              </button>
              <button onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}>
                <SkipForward size={20} color="#fff" />
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

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
