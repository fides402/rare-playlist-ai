import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function getOrCreateUser(userId: string) {
  let user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    user = await prisma.user.create({
      data: { id: userId }
    })
  }
  
  return user
}

export async function createPlaylist(
  userId: string,
  name: string,
  prompt: string,
  description?: string,
  tracks?: Array<{ trackId: string; trackName: string; artistName: string; position: number; reason?: string }>
) {
  const user = await getOrCreateUser(userId)
  
  const playlist = await prisma.playlist.create({
    data: {
      name,
      prompt,
      description,
      userId: user.id,
      tracks: tracks ? {
        create: tracks
      } : undefined
    },
    include: {
      tracks: true
    }
  })
  
  return playlist
}

export async function getUserPlaylists(userId: string) {
  const user = await getOrCreateUser(userId)
  
  return prisma.playlist.findMany({
    where: { userId: user.id },
    include: {
      tracks: {
        orderBy: { position: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getPlaylistById(playlistId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  
  return prisma.playlist.findFirst({
    where: {
      id: playlistId,
      userId: user.id
    },
    include: {
      tracks: {
        orderBy: { position: 'asc' }
      }
    }
  })
}

export async function deletePlaylist(playlistId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  
  return prisma.playlist.deleteMany({
    where: {
      id: playlistId,
      userId: user.id
    }
  })
}

export async function addTrackFeedback(
  userId: string,
  trackId: string,
  trackName: string,
  artistName: string,
  liked: boolean
) {
  const user = await getOrCreateUser(userId)
  
  return prisma.trackFeedback.upsert({
    where: {
      userId_trackId: {
        userId: user.id,
        trackId
      }
    },
    update: {
      liked,
      createdAt: new Date()
    },
    create: {
      userId: user.id,
      trackId,
      trackName,
      artistName,
      liked
    }
  })
}

export async function getUserFeedback(userId: string) {
  const user = await getOrCreateUser(userId)
  
  return prisma.trackFeedback.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getUserLikedTracks(userId: string) {
  const user = await getOrCreateUser(userId)
  
  return prisma.trackFeedback.findMany({
    where: {
      userId: user.id,
      liked: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function exportPlaylistAsJson(playlistId: string, userId: string) {
  const playlist = await getPlaylistById(playlistId, userId)
  
  if (!playlist) return null
  
  return {
    name: playlist.name,
    description: playlist.description,
    prompt: playlist.prompt,
    createdAt: playlist.createdAt.toISOString(),
    tracks: playlist.tracks.map(t => ({
      id: t.trackId,
      name: t.trackName,
      artist: t.artistName,
      reason: t.reason
    }))
  }
}
