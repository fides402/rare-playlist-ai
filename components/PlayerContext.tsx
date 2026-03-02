'use client'

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'

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

interface PlayerState {
  currentTrack: HiFiTrack | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  quality: 'max' | 'high' | 'medium' | 'low'
  queue: HiFiTrack[]
  queueIndex: number
  isLoading: boolean
}

interface PlayerContextType extends PlayerState {
  play: (track?: HiFiTrack) => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  next: () => void
  previous: () => void
  playQueue: (tracks: HiFiTrack[], startIndex?: number) => void
  addToQueue: (track: HiFiTrack) => void
  clearQueue: () => void
  setQuality: (quality: 'max' | 'high' | 'medium' | 'low') => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 1,
    quality: 'max',
    queue: [],
    queueIndex: -1,
    isLoading: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      audioRef.current = new Audio()
      audioRef.current.volume = state.volume
      
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setState(prev => ({
            ...prev,
            progress: audioRef.current!.currentTime,
            duration: audioRef.current!.duration || 0,
          }))
        }
      })

      audioRef.current.addEventListener('ended', () => {
        setState(prev => ({ ...prev, isPlaying: false }))
      })

      audioRef.current.addEventListener('play', () => {
        setState(prev => ({ ...prev, isPlaying: true }))
      })

      audioRef.current.addEventListener('pause', () => {
        setState(prev => ({ ...prev, isPlaying: false }))
      })

      audioRef.current.addEventListener('waiting', () => {
        setState(prev => ({ ...prev, isLoading: true }))
      })

      audioRef.current.addEventListener('canplay', () => {
        setState(prev => ({ ...prev, isLoading: false }))
      })
    } catch (e) {
      console.error('Audio init error:', e)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const play = useCallback(async (track?: HiFiTrack) => {
    if (!audioRef.current) return

    if (track) {
      setState(prev => ({
        ...prev,
        currentTrack: track,
        isLoading: true,
        progress: 0,
      }))

      const audioSrc = track.previewUrl || `https://api.monochrome.tf/stream/${track.id}`
      audioRef.current.src = audioSrc
      audioRef.current.load()
      
      try {
        await audioRef.current.play()
      } catch (error) {
        console.error('Playback failed:', error)
      }
    } else if (state.currentTrack) {
      try {
        await audioRef.current.play()
      } catch (error) {
        console.error('Playback failed:', error)
      }
    }
  }, [state.currentTrack])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    if (state.isPlaying) {
      pause()
    } else {
      play()
    }
  }, [state.isPlaying, play, pause])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    setState(prev => ({ ...prev, volume }))
  }, [])

  const next = useCallback(() => {
    if (state.queueIndex < state.queue.length - 1) {
      const nextIndex = state.queueIndex + 1
      setState(prev => ({ ...prev, queueIndex: nextIndex }))
      play(state.queue[nextIndex])
    }
  }, [state.queue, state.queueIndex, play])

  const previous = useCallback(() => {
    if (state.progress > 3) {
      seek(0)
    } else if (state.queueIndex > 0) {
      const prevIndex = state.queueIndex - 1
      setState(prev => ({ ...prev, queueIndex: prevIndex }))
      play(state.queue[prevIndex])
    } else {
      seek(0)
    }
  }, [state.queue, state.queueIndex, state.progress, play, seek])

  const playQueue = useCallback((tracks: HiFiTrack[], startIndex = 0) => {
    setState(prev => ({
      ...prev,
      queue: tracks,
      queueIndex: startIndex,
    }))
    if (tracks[startIndex]) {
      play(tracks[startIndex])
    }
  }, [play])

  const addToQueue = useCallback((track: HiFiTrack) => {
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, track],
    }))
  }, [])

  const clearQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      queue: [],
      queueIndex: -1,
    }))
  }, [])

  const setQuality = useCallback((quality: 'max' | 'high' | 'medium' | 'low') => {
    setState(prev => ({ ...prev, quality }))
  }, [])

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        play,
        pause,
        toggle,
        seek,
        setVolume,
        next,
        previous,
        playQueue,
        addToQueue,
        clearQueue,
        setQuality,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}
