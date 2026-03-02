import { z } from 'zod'
import { type HiFiTrack } from './hifiClient'
import { type MusicalConstraints } from './planner'

export const UserProfileSchema = z.object({
  id: z.string(),
  artistAffinity: z.record(z.number()),
  preferredBpmMin: z.number().optional(),
  preferredBpmMax: z.number().optional(),
  avgLikedBpm: z.number().optional(),
  rarityPreference: z.number().optional(),
  likedCount: z.number(),
  dislikedCount: z.number(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

interface TrackWithScore extends HiFiTrack {
  rarityScore: number
  reason: string
  diversityBonus: number
  personalizationBoost: number
  finalScore: number
}

const RARITY_WEIGHTS = {
  popularity: 0.4,
  artistDiversity: 0.2,
  genreDiversity: 0.15,
  decadeDiversity: 0.1,
  constraintMatch: 0.15,
}

export function calculateRarityScore(
  track: HiFiTrack,
  allTracks: HiFiTrack[],
  constraints?: MusicalConstraints
): number {
  const popularity = track.popularity ?? 50
  const popularityScore = Math.max(0, (100 - popularity) / 100)

  const artistCounts = new Map<string, number>()
  allTracks.forEach(t => {
    const artist = t.artist || 'unknown'
    artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1)
  })
  const artistPenalty = (artistCounts.get(track.artist || 'unknown') || 1) > 1 
    ? 0.5 
    : 0

  const diversityBonus = allTracks.length > 10 ? 0.1 : 0

  let constraintMatch = 0
  if (constraints) {
    if (constraints.bpmMin && constraints.bpmMax && track.bpm) {
      if (track.bpm >= constraints.bpmMin && track.bpm <= constraints.bpmMax) {
        constraintMatch += 0.5
      }
    }
    if (constraints.mood?.length) {
      constraintMatch += 0.25
    }
  }

  const score = 
    (popularityScore * RARITY_WEIGHTS.popularity) +
    (artistPenalty * RARITY_WEIGHTS.artistDiversity) +
    (diversityBonus * RARITY_WEIGHTS.genreDiversity) +
    (constraintMatch * RARITY_WEIGHTS.constraintMatch)

  return Math.min(1, Math.max(0, score))
}

export function calculatePersonalizationBoost(
  track: HiFiTrack,
  profile: UserProfile
): number {
  let boost = 0

  if (profile.artistAffinity[track.artist || '']) {
    boost += profile.artistAffinity[track.artist || ''] * 0.3
  }

  if (profile.avgLikedBpm && track.bpm) {
    const bpmDiff = Math.abs(track.bpm - profile.avgLikedBpm)
    if (bpmDiff < 20) {
      boost += 0.1
    } else if (bpmDiff < 40) {
      boost += 0.05
    }
  }

  if (profile.rarityPreference !== undefined && track.popularity) {
    const rarity = (100 - track.popularity) / 100
    if ((profile.rarityPreference > 0.5 && rarity > 0.5) ||
        (profile.rarityPreference < 0.5 && rarity < 0.5)) {
      boost += 0.1
    }
  }

  return Math.min(0.3, boost)
}

export function rankTracks(
  tracks: HiFiTrack[],
  constraints?: MusicalConstraints,
  profile?: UserProfile,
  explorationRatio = 0.3
): TrackWithScore[] {
  const uniqueTracks = deduplicateTracks(tracks)
  
  const scored = uniqueTracks.map(track => {
    const rarityScore = calculateRarityScore(track, uniqueTracks, constraints)
    const personalizationBoost = profile 
      ? calculatePersonalizationBoost(track, profile)
      : 0
    
    const diversityBonus = calculateDiversityBonus(track, uniqueTracks)
    
    const finalScore = 
      (rarityScore * (1 - explorationRatio)) +
      (diversityBonus * 0.2) +
      (personalizationBoost * (profile ? 1 : 0))

    let reason = getTrackReason(track, rarityScore, constraints)

    return {
      ...track,
      rarityScore,
      reason,
      diversityBonus,
      personalizationBoost,
      finalScore,
    }
  })

  scored.sort((a, b) => b.finalScore - a.finalScore)

  return scored
}

function deduplicateTracks(tracks: HiFiTrack[]): HiFiTrack[] {
  const seen = new Set<string>()
  return tracks.filter(track => {
    if (seen.has(track.id)) return false
    seen.add(track.id)
    return true
  })
}

function calculateDiversityBonus(track: HiFiTrack, allTracks: HiFiTrack[]): number {
  const artists = new Set(allTracks.map(t => t.artist || 'unknown'))
  const totalArtists = artists.size
  
  if (totalArtists <= 1) return 0

  const artistCount = Array.from(artists).filter(a => a === track.artist).length
  const rarity = 1 - (artistCount / totalArtists)
  
  return rarity * 0.5
}

function getTrackReason(track: HiFiTrack, rarityScore: number, constraints?: MusicalConstraints): string {
  const reasons: string[] = []

  if (track.popularity !== undefined && track.popularity < 30) {
    reasons.push('rare gem')
  } else if (track.popularity !== undefined && track.popularity < 50) {
    reasons.push('underground')
  }

  if (constraints?.decade) {
    reasons.push(`${constraints.decade} vibes`)
  }

  if (constraints?.genre?.length) {
    reasons.push(`${constraints.genre[0]} selection`)
  }

  if (constraints?.country) {
    reasons.push(`${constraints.country} authentic`)
  }

  if (reasons.length === 0) {
    if (rarityScore > 0.7) reasons.push('curated pick')
    else if (rarityScore > 0.4) reasons.push('worth exploring')
    else reasons.push('recommended')
  }

  return reasons.join(' • ')
}

export function createInitialProfile(userId: string): UserProfile {
  return {
    id: userId,
    artistAffinity: {},
    preferredBpmMin: undefined,
    preferredBpmMax: undefined,
    avgLikedBpm: undefined,
    rarityPreference: undefined,
    likedCount: 0,
    dislikedCount: 0,
  }
}

export function updateProfileWithFeedback(
  profile: UserProfile,
  track: HiFiTrack,
  liked: boolean
): UserProfile {
  const updated = { ...profile }
  
  const artist = track.artist || 'unknown'
  updated.artistAffinity = {
    ...updated.artistAffinity,
    [artist]: (updated.artistAffinity[artist] || 0) + (liked ? 1 : -0.5),
  }

  if (liked) {
    updated.likedCount = (updated.likedCount || 0) + 1
    
    if (track.bpm) {
      const currentAvg = updated.avgLikedBpm || track.bpm
      updated.avgLikedBpm = (currentAvg * (updated.likedCount - 1) + track.bpm) / updated.likedCount
    }

    if (track.popularity !== undefined) {
      const currentPref = updated.rarityPreference ?? 0.5
      updated.rarityPreference = (currentPref * (updated.likedCount - 1) + (100 - track.popularity) / 100) / updated.likedCount
    }
  } else {
    updated.dislikedCount = (updated.dislikedCount || 0) + 1
  }

  return updated
}
