import { z } from 'zod'

export const HiFiTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string().optional(),
  album: z.string().optional(),
  duration: z.number().optional(),
  popularity: z.number().optional(),
  previewUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  bpm: z.number().optional(),
  key: z.string().optional(),
  explicit: z.boolean().optional(),
  isPlayable: z.boolean().optional(),
})

export const HiFiSearchResultSchema = z.object({
  tracks: z.array(HiFiTrackSchema),
  total: z.number().optional(),
})

export const HiFiRecommendationsSchema = z.object({
  tracks: z.array(HiFiTrackSchema),
})

export const HiFiTrackInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string().optional(),
  album: z.string().optional(),
  duration: z.number().optional(),
  popularity: z.number().optional(),
  previewUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  bpm: z.number().optional(),
  key: z.string().optional(),
  explicit: z.boolean().optional(),
  isPlayable: z.boolean().optional(),
  artistId: z.string().optional(),
  albumId: z.string().optional(),
})

export type HiFiTrack = z.infer<typeof HiFiTrackSchema>
export type HiFiSearchResult = z.infer<typeof HiFiSearchResultSchema>
export type HiFiRecommendations = z.infer<typeof HiFiRecommendationsSchema>
export type HiFiTrackInfo = z.infer<typeof HiFiTrackInfoSchema>

const BASE_URL = process.env.HIFI_API_BASE_URL || 'https://api.monochrome.tf'

interface FetchOptions extends RequestInit {
  timeout?: number
}

class HiFiAPIClient {
  private baseUrl: string
  private apiKey?: string
  private cache: Map<string, { data: unknown; expires: number }> = new Map()
  private cacheTTL = 24 * 60 * 60 * 1000 // 24 hours

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || BASE_URL
    this.apiKey = apiKey
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    options: FetchOptions = {},
    retries = 2
  ): Promise<T> {
    const { timeout = 10000, ...fetchOptions } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const url = `${this.baseUrl}${endpoint}`
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        ...fetchOptions.headers,
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json() as T
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (retries > 0 && error instanceof Error && error.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return this.fetchWithRetry(endpoint, options, retries - 1)
      }
      
      throw error
    }
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

  async search(query: string, limit = 50): Promise<HiFiSearchResult> {
    const cacheKey = `search:${query}:${limit}`
    const cached = this.getCached<HiFiSearchResult>(cacheKey)
    if (cached) return cached

    const result = await this.fetchWithRetry<HiFiSearchResult>(
      `/search/?q=${encodeURIComponent(query)}&limit=${limit}`
    )

    this.setCache(cacheKey, result)
    return result
  }

  async searchByArtist(artist: string, limit = 50): Promise<HiFiSearchResult> {
    return this.search(`artist:${artist}`, limit)
  }

  async searchByGenre(genre: string, limit = 50): Promise<HiFiSearchResult> {
    return this.search(`genre:${genre}`, limit)
  }

  async getRecommendations(trackId: string, limit = 25): Promise<HiFiRecommendations> {
    const cacheKey = `recommendations:${trackId}:${limit}`
    const cached = this.getCached<HiFiRecommendations>(cacheKey)
    if (cached) return cached

    const result = await this.fetchWithRetry<HiFiRecommendations>(
      `/recommendations/?id=${encodeURIComponent(trackId)}&limit=${limit}`
    )

    this.setCache(cacheKey, result)
    return result
  }

  async getTrackInfo(trackId: string): Promise<HiFiTrackInfo> {
    const cacheKey = `info:${trackId}`
    const cached = this.getCached<HiFiTrackInfo>(cacheKey)
    if (cached) return cached

    const result = await this.fetchWithRetry<HiFiTrackInfo>(
      `/info/?id=${encodeURIComponent(trackId)}`
    )

    this.setCache(cacheKey, result)
    return result
  }

  async getBatchTrackInfo(trackIds: string[]): Promise<HiFiTrackInfo[]> {
    const results: HiFiTrackInfo[] = []
    const batchSize = 10

    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize)
      const promises = batch.map(id => this.getTrackInfo(id).catch(() => null))
      const batchResults = await Promise.all(promises)
      results.push(...batchResults.filter((r): r is HiFiTrackInfo => r !== null))
      
      if (i + batchSize < trackIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
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
