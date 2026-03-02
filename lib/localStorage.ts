import { type HiFiTrack } from './hifiClient'

export interface PlaylistData {
  id: string
  name: string
  prompt: string
  description?: string
  createdAt: string
  tracks: Array<{
    trackId: string
    trackName: string
    artistName: string
    position: number
    reason?: string
  }>
}

export interface TrackFeedbackData {
  trackId: string
  trackName: string
  artistName: string
  liked: boolean
  createdAt: string
}

const PLAYLISTS_KEY = 'rareplaylist_playlists'
const FEEDBACK_KEY = 'rareplaylist_feedback'

export function getPlaylists(userId: string): PlaylistData[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(PLAYLISTS_KEY)
  if (!stored) return []
  const playlists: PlaylistData[] = JSON.parse(stored)
  return playlists.filter(p => p.id.startsWith(userId))
}

export function savePlaylist(
  userId: string,
  name: string,
  prompt: string,
  tracks: Array<{ trackId: string; trackName: string; artistName: string; position: number; reason?: string }>
): PlaylistData {
  const playlist: PlaylistData = {
    id: `${userId}_${Date.now()}`,
    name,
    prompt,
    createdAt: new Date().toISOString(),
    tracks,
  }
  
  const playlists = getPlaylists(userId)
  playlists.unshift(playlist)
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists))
  
  return playlist
}

export function getUserFeedback(userId: string): TrackFeedbackData[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(FEEDBACK_KEY)
  if (!stored) return []
  return JSON.parse(stored)
}

export function addTrackFeedback(
  userId: string,
  trackId: string,
  trackName: string,
  artistName: string,
  liked: boolean
): void {
  const feedback = getUserFeedback(userId)
  const existing = feedback.findIndex(f => f.trackId === trackId)
  
  const newFeedback: TrackFeedbackData = {
    trackId,
    trackName,
    artistName,
    liked,
    createdAt: new Date().toISOString(),
  }
  
  if (existing >= 0) {
    feedback[existing] = newFeedback
  } else {
    feedback.push(newFeedback)
  }
  
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback))
}

export function exportPlaylistAsJson(playlist: PlaylistData) {
  return {
    name: playlist.name,
    description: playlist.description,
    prompt: playlist.prompt,
    createdAt: playlist.createdAt,
    tracks: playlist.tracks.map(t => ({
      id: t.trackId,
      name: t.trackName,
      artist: t.artistName,
      reason: t.reason,
    })),
  }
}

export function deletePlaylist(userId: string, playlistId: string): void {
  const playlists = getPlaylists(userId)
  const filtered = playlists.filter(p => p.id !== playlistId)
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(filtered))
}
