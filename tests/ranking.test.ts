import { describe, it, expect } from 'vitest'
import { 
  calculateRarityScore, 
  rankTracks, 
  createInitialProfile, 
  updateProfileWithFeedback 
} from '../lib/ranking'
import type { HiFiTrack } from '../lib/hifiClient'

describe('Ranking', () => {
  const mockTracks: HiFiTrack[] = [
    { id: '1', title: 'Rare Track', artist: 'Artist A', popularity: 20, bpm: 120 },
    { id: '2', title: 'Popular Track', artist: 'Artist B', popularity: 80, bpm: 130 },
    { id: '3', title: 'Medium Track', artist: 'Artist C', popularity: 45, bpm: 110 },
    { id: '4', title: 'Another Rare', artist: 'Artist D', popularity: 15, bpm: 125 },
    { id: '5', title: 'Duplicate Artist', artist: 'Artist A', popularity: 25, bpm: 118 },
  ]

  describe('calculateRarityScore', () => {
    it('should return higher score for lower popularity', () => {
      const rare = calculateRarityScore(mockTracks[0], mockTracks)
      const popular = calculateRarityScore(mockTracks[1], mockTracks)
      
      expect(rare).toBeGreaterThan(popular)
    })

    it('should apply constraint matching bonus', () => {
      const withConstraint = calculateRarityScore(mockTracks[0], mockTracks, {
        bpmMin: 115,
        bpmMax: 125,
      })
      
      const withoutConstraint = calculateRarityScore(mockTracks[0], mockTracks)
      
      expect(withConstraint).toBeGreaterThan(withoutConstraint)
    })
  })

  describe('rankTracks', () => {
    it('should deduplicate tracks by ID', () => {
      const tracksWithDupes: HiFiTrack[] = [
        ...mockTracks,
        { id: '1', title: 'Rare Track Duplicate', artist: 'Artist A', popularity: 20 },
      ]
      
      const ranked = rankTracks(tracksWithDupes)
      
      const ids = ranked.map(t => t.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('should respect playlist length limit', () => {
      const manyTracks = Array.from({ length: 100 }, (_, i) => ({
        id: `track_${i}`,
        title: `Track ${i}`,
        artist: `Artist ${i % 10}`,
        popularity: Math.floor(Math.random() * 100),
      })) as HiFiTrack[]
      
      const ranked = rankTracks(manyTracks, undefined, undefined, 0.3)
      
      expect(ranked.length).toBeLessThanOrEqual(100)
    })

    it('should include reasons for all tracks', () => {
      const ranked = rankTracks(mockTracks)
      
      expect(ranked.every(t => t.reason.length > 0)).toBe(true)
    })
  })

  describe('User Profile', () => {
    it('should create initial profile', () => {
      const profile = createInitialProfile('user_123')
      
      expect(profile.id).toBe('user_123')
      expect(profile.artistAffinity).toEqual({})
      expect(profile.likedCount).toBe(0)
    })

    it('should update profile with liked track', () => {
      let profile = createInitialProfile('user_123')
      const track = mockTracks[0]
      
      profile = updateProfileWithFeedback(profile, track, true)
      
      expect(profile.likedCount).toBe(1)
      expect(profile.artistAffinity[track.artist!]).toBe(1)
      expect(profile.avgLikedBpm).toBe(track.bpm)
    })

    it('should update profile with disliked track', () => {
      let profile = createInitialProfile('user_123')
      const track = mockTracks[0]
      
      profile = updateProfileWithFeedback(profile, track, false)
      
      expect(profile.dislikedCount).toBe(1)
      expect(profile.artistAffinity[track.artist!]).toBe(-0.5)
    })
  })
})
