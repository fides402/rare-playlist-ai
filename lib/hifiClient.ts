import { z } from 'zod'

export const HiFiTrackSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.any(),
  artists: z.array(z.any()).optional(),
  album: z.any(),
  duration: z.number().optional(),
  popularity: z.number().optional(),
  bpm: z.number().optional(),
  key: z.string().optional(),
  explicit: z.boolean().optional(),
  cover: z.string().optional(),
})

export const HiFiSearchResultSchema = z.object({
  data: z.object({
    items: z.array(HiFiTrackSchema),
    totalNumberOfItems: z.number().optional(),
  })
})

export const HiFiRecommendationsSchema = z.object({
  data: z.object({
    items: z.array(z.object({
      track: HiFiTrackSchema,
    })),
  })
})

export const HiFiTrackInfoSchema = z.object({
  data: HiFiTrackSchema,
})

export type HiFiTrack = {
  id: string
  title: string
  artist?: string
  artists?: Array<{ name: string }>
  album?: string
  duration?: number
  popularity?: number
  bpm?: number
  key?: string
  explicit?: boolean
  coverUrl?: string
  previewUrl?: string
}

export type HiFiSearchResult = { data: { items: HiFiTrack[]; totalNumberOfItems?: number } }
export type HiFiRecommendations = { data: { items: Array<{ track: HiFiTrack }> } }
export type HiFiTrackInfo = { data: HiFiTrack }

const BASE_URL = 'https://api.monochrome.tf'

class HiFiAPIClient {
  private baseUrl: string
  private cache: Map<string, { data: unknown; expires: number }> = new Map()
  private cacheTTL = 24 * 60 * 60 * 1000

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BASE_URL
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data as T
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, expires: Date.now() + this.cacheTTL })
  }

  private normalizeTrack(item: any): HiFiTrack {
    let artistName = 'Unknown'
    if (item.artist?.name) {
      artistName = item.artist.name
    } else if (item.artists && item.artists.length > 0) {
      artistName = item.artists.map((a: any) => a.name).join(', ')
    }

    let coverUrl = ''
    if (item.album?.cover) {
      coverUrl = `https://resources.tidal.com/images/${item.album.cover.replace(/-/g, '/')}/320x320.jpg`
    }

    return {
      id: String(item.id),
      title: item.title || 'Unknown',
      artist: artistName,
      album: item.album?.title,
      duration: item.duration,
      popularity: item.popularity,
      bpm: item.bpm,
      key: item.key,
      explicit: item.explicit,
      coverUrl,
    }
  }

  async search(query: string, limit = 50): Promise<HiFiSearchResult> {
    const cacheKey = `search:${query}:${limit}`
    const cached = this.getCached<HiFiSearchResult>(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.baseUrl}/search/?s=${encodeURIComponent(query)}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const json = await response.json()
      
      if (json?.data?.items) {
        const result: HiFiSearchResult = {
          data: {
            items: json.data.items.slice(0, limit).map((item: any) => this.normalizeTrack(item)),
            totalNumberOfItems: json.data.totalNumberOfItems || json.data.items.length,
          }
        }
        this.setCache(cacheKey, result)
        return result
      }

      return { data: { items: [], totalNumberOfItems: 0 } }
    } catch (error) {
      console.error('Search error:', error)
      return { data: { items: [], totalNumberOfItems: 0 } }
    }
  }

  async getRecommendations(trackId: string, limit = 25): Promise<HiFiRecommendations> {
    const cacheKey = `recs:${trackId}:${limit}`
    const cached = this.getCached<HiFiRecommendations>(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.baseUrl}/recommendations/?id=${trackId}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const json = await response.json()
      
      if (json?.data?.items) {
        const result: HiFiRecommendations = {
          data: {
            items: json.data.items.map((item: any) => ({
              track: this.normalizeTrack(item.track),
            })),
          }
        }
        this.setCache(cacheKey, result)
        return result
      }

      return { data: { items: [] } }
    } catch (error) {
      console.error('Recommendations error:', error)
      return { data: { items: [] } }
    }
  }

  async getTrackInfo(trackId: string): Promise<HiFiTrackInfo> {
    const cacheKey = `info:${trackId}`
    const cached = this.getCached<HiFiTrackInfo>(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(`${this.baseUrl}/info/?id=${trackId}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const json = await response.json()
      
      if (json?.data) {
        const result: HiFiTrackInfo = {
          data: this.normalizeTrack(json.data),
        }
        this.setCache(cacheKey, result)
        return result
      }

      throw new Error('No track data')
    } catch (error) {
      console.error('Track info error:', error)
      throw error
    }
  }

  async getBatchTrackInfo(trackIds: string[]): Promise<HiFiTrack[]> {
    const results: HiFiTrack[] = []
    
    for (const id of trackIds.slice(0, 10)) {
      try {
        const info = await this.getTrackInfo(id)
        results.push(info.data)
      } catch {
        // Skip failed requests
      }
    }

    return results
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const hiFiClient = new HiFiAPIClient()

export default HiFiAPIClient
