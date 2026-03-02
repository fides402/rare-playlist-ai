'use server'

import { hiFiClient } from '@/lib/hifiClient'
import { planFromPrompt, extractConstraintsFromPlan } from '@/lib/planner'
import { rankTracks, createInitialProfile, updateProfileWithFeedback, type UserProfile } from '@/lib/ranking'
import { graphDiscovery, enrichTracksWithInfo } from '@/lib/graphDiscovery'
import { createPlaylist, getUserPlaylists, addTrackFeedback, getUserFeedback, exportPlaylistAsJson } from '@/lib/db'
import type { HiFiTrack } from '@/lib/hifiClient'

interface GenerateOptions {
  playlistLength: number
  explorationMode: number
  hop2Enabled: boolean
}

interface GenerateResult {
  tracks: Array<{
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
    rarityScore: number
    reason: string
    finalScore: number
  }>
  seedsUsed: string[]
  totalRequests: number
}

export async function generatePlaylist(
  prompt: string,
  userId: string,
  options: GenerateOptions
): Promise<GenerateResult> {
  const { playlistLength, explorationMode, hop2Enabled } = options

  try {
    const plan = await planFromPrompt(prompt)
    const constraints = extractConstraintsFromPlan(plan)

    let allTracks: HiFiTrack[] = []
    
    for (const query of plan.searchQueries.slice(0, 3)) {
      try {
        const results = await hiFiClient.search(query, 50)
        allTracks.push(...results.tracks)
      } catch (error) {
        console.error(`Search failed for "${query}":`, error)
      }
    }

    if (allTracks.length === 0) {
      throw new Error('No tracks found. The Hi-Fi API might be unavailable.')
    }

    const discoveryResult = await graphDiscovery(
      allTracks,
      {
        maxSeeds: 8,
        maxRecsPerSeed: 25,
        maxHop2Seeds: hop2Enabled ? 3 : 0,
        maxTotalRequests: 40,
        enableHop2: hop2Enabled,
      }
    )

    let enrichedTracks = discoveryResult.tracks
    
    if (discoveryResult.tracks.length > 10) {
      try {
        enrichedTracks = await enrichTracksWithInfo(discoveryResult.tracks, 15)
      } catch (error) {
        console.error('Enrichment failed:', error)
      }
    }

    let userProfile: UserProfile | undefined
    
    try {
      const feedback = await getUserFeedback(userId)
      if (feedback.length > 0) {
        userProfile = createInitialProfile(userId)
        for (const f of feedback) {
          updateProfileWithFeedback(userProfile, {
            id: f.trackId,
            title: f.trackName,
            artist: f.artistName,
          }, f.liked)
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }

    const rankedTracks = rankTracks(
      enrichedTracks,
      constraints,
      userProfile,
      explorationMode
    )

    const finalTracks = rankedTracks
      .slice(0, playlistLength)
      .map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        popularity: track.popularity,
        coverUrl: track.coverUrl,
        previewUrl: track.previewUrl,
        bpm: track.bpm,
        key: track.key,
        rarityScore: track.rarityScore,
        reason: track.reason,
        finalScore: track.finalScore,
      }))

    return {
      tracks: finalTracks,
      seedsUsed: discoveryResult.seedsUsed,
      totalRequests: discoveryResult.totalRequests,
    }
  } catch (error) {
    console.error('generatePlaylist error:', error)
    throw error
  }
}

export async function savePlaylist(
  userId: string,
  name: string,
  prompt: string,
  tracks: Array<{
    trackId: string
    trackName: string
    artistName: string
    position: number
    reason?: string
  }>
) {
  const playlist = await createPlaylist(userId, name, prompt, undefined, tracks)
  return playlist
}

export async function getPlaylists(userId: string) {
  return await getUserPlaylists(userId)
}

export async function saveTrackFeedback(
  userId: string,
  trackId: string,
  trackName: string,
  artistName: string,
  liked: boolean
) {
  return await addTrackFeedback(userId, trackId, trackName, artistName, liked)
}

export async function exportPlaylist(playlistId: string, userId: string) {
  return await exportPlaylistAsJson(playlistId, userId)
}
