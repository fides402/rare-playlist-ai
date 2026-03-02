import { type HiFiTrack, hiFiClient } from './hifiClient'
import { type MusicalConstraints } from './planner'

interface DiscoveryConfig {
  maxSeeds: number
  maxRecsPerSeed: number
  maxHop2Seeds: number
  maxTotalRequests: number
  enableHop2: boolean
}

const DEFAULT_CONFIG: DiscoveryConfig = {
  maxSeeds: 8,
  maxRecsPerSeed: 25,
  maxHop2Seeds: 3,
  maxTotalRequests: 40,
  enableHop2: true,
}

interface DiscoveryResult {
  tracks: HiFiTrack[]
  seedsUsed: string[]
  totalRequests: number
  hop1Count: number
  hop2Count: number
}

export async function graphDiscovery(
  searchResults: HiFiTrack[],
  config: DiscoveryConfig = DEFAULT_CONFIG,
  onProgress?: (step: string, progress: number) => void
): Promise<DiscoveryResult> {
  const allTracks: HiFiTrack[] = [...searchResults]
  const seedsUsed: string[] = []
  let totalRequests = 0
  let hop1Count = 0
  let hop2Count = 0

  onProgress?.('selecting_seeds', 0)

  const seeds = selectSeeds(searchResults, config.maxSeeds)
  seedsUsed.push(...seeds.map(s => s.id))

  onProgress?.('hop1_recommendations', 0.1)

  const hop1Tracks: HiFiTrack[] = []
  const requestsPerSeed = Math.ceil(config.maxRecsPerSeed)

  for (let i = 0; i < seeds.length; i++) {
    if (totalRequests >= config.maxTotalRequests) break

    const seed = seeds[i]
    try {
      const recs = await hiFiClient.getRecommendations(seed.id, requestsPerSeed)
      const recTracks = recs.data?.items?.map((item: any) => item.track) || []
      hop1Tracks.push(...recTracks)
      totalRequests++
      hop1Count++

      const progress = 0.1 + (0.5 * (i + 1) / seeds.length)
      onProgress?.('hop1_recommendations', progress)
    } catch (error) {
      console.error(`Failed to get recommendations for seed ${seed.id}:`, error)
    }

    await rateLimitDelay(50)
  }

  allTracks.push(...hop1Tracks)

  if (config.enableHop2 && totalRequests < config.maxTotalRequests) {
    onProgress?.('hop2_recommendations', 0.6)

    const hop2Seeds = selectSeeds(hop1Tracks, config.maxHop2Seeds)
    
    for (let i = 0; i < hop2Seeds.length; i++) {
      if (totalRequests >= config.maxTotalRequests) break

      const seed = hop2Seeds[i]
      if (seedsUsed.includes(seed.id)) continue

      try {
        const recs = await hiFiClient.getRecommendations(seed.id, Math.floor(requestsPerSeed / 2))
        const recTracks = recs.data?.items?.map((item: any) => item.track) || []
        allTracks.push(...recTracks)
        totalRequests++
        hop2Count++

        const progress = 0.6 + (0.3 * (i + 1) / hop2Seeds.length)
        onProgress?.('hop2_recommendations', progress)
      } catch (error) {
        console.error(`Failed to get hop2 recommendations for seed ${seed.id}:`, error)
      }

      await rateLimitDelay(50)
    }
  }

  onProgress?.('finalizing', 0.95)

  const uniqueTracks = deduplicateById(allTracks)

  onProgress?.('complete', 1)

  return {
    tracks: uniqueTracks,
    seedsUsed,
    totalRequests,
    hop1Count,
    hop2Count,
  }
}

function selectSeeds(tracks: HiFiTrack[], count: number): HiFiTrack[] {
  const scored = tracks.map(track => ({
    track,
    score: (track.popularity ?? 50) < 40 ? 1.5 : 1,
  }))

  const selected: HiFiTrack[] = []
  const seenArtists = new Set<string>()

  const shuffled = [...scored].sort(() => Math.random() - 0.5)

  for (const { track } of shuffled) {
    if (selected.length >= count) break

    const artist = track.artist || 'unknown'
    
    if (!seenArtists.has(artist)) {
      selected.push(track)
      seenArtists.add(artist)
    } else if (selected.length < count * 0.5) {
      selected.push(track)
    }
  }

  while (selected.length < count && shuffled.length > 0) {
    const remaining = shuffled.filter(s => !selected.includes(s.track))
    if (remaining.length === 0) break
    const next = remaining[Math.floor(Math.random() * remaining.length)]
    selected.push(next.track)
  }

  return selected
}

function deduplicateById(tracks: HiFiTrack[]): HiFiTrack[] {
  const seen = new Set<string>()
  return tracks.filter(track => {
    if (seen.has(track.id)) return false
    seen.add(track.id)
    return true
  })
}

function rateLimitDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function enrichTracksWithInfo(
  tracks: HiFiTrack[],
  sampleSize = 20,
  onProgress?: (progress: number) => void
): Promise<HiFiTrack[]> {
  const toEnrich = tracks.slice(0, sampleSize)
  const notEnriched = tracks.slice(sampleSize)

  onProgress?.(0)

  const enriched: HiFiTrack[] = []

  for (let i = 0; i < toEnrich.length; i++) {
    const track = toEnrich[i]
    
    try {
      const info = await hiFiClient.getTrackInfo(track.id)
      enriched.push({
        ...track,
        bpm: info.data.bpm ?? track.bpm,
        key: info.data.key ?? track.key,
        popularity: info.data.popularity ?? track.popularity,
        coverUrl: info.data.coverUrl ?? track.coverUrl,
      })
    } catch {
      enriched.push(track)
    }

    onProgress?.((i + 1) / toEnrich.length)

    if (i < toEnrich.length - 1) {
      await rateLimitDelay(30)
    }
  }

  return [...enriched, ...notEnriched]
}
