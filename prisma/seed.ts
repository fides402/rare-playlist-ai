import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const user = await prisma.user.upsert({
    where: { id: 'demo_user' },
    update: {},
    create: {
      id: 'demo_user',
    },
  })

  await prisma.playlist.create({
    data: {
      name: 'Rare Italian 70s Jazz-Funk',
      prompt: 'rare OST italiane anni 70 jazz-funk mood notturno',
      description: 'A journey through obscure Italian soundtracks',
      userId: user.id,
      tracks: {
        create: [
          { trackId: 'demo_1', trackName: 'Alessandro Alessandroni', artistName: 'Il Ballo Di Seta', position: 0, reason: 'rare gem' },
          { trackId: 'demo_2', trackName: 'Ruggero Cini', artistName: 'Storie Di Vita', position: 1, reason: 'underground' },
          { trackId: 'demo_3', trackName: 'Piero Umiliani', artistName: 'Mah Nà Mah Nà', position: 2, reason: 'curated pick' },
        ]
      }
    }
  })

  await prisma.playlist.create({
    data: {
      name: 'Underground City Pop',
      prompt: 'underground japanese city pop 80s',
      description: 'Obscure Japanese city pop treasures',
      userId: user.id,
      tracks: {
        create: [
          { trackId: 'demo_4', trackName: 'Miki Matsubara', artistName: 'Sayonara', position: 0, reason: 'rare gem' },
          { trackId: 'demo_5', trackName: 'Tatsuro Yamashita', artistName: 'Sparkle', position: 1, reason: 'curated pick' },
        ]
      }
    }
  })

  await prisma.trackFeedback.upsert({
    where: { userId_trackId: { userId: user.id, trackId: 'demo_1' } },
    update: {},
    create: { userId: user.id, trackId: 'demo_1', trackName: 'Alessandro Alessandroni', artistName: 'Il Ballo Di Seta', liked: true },
  })

  await prisma.trackFeedback.upsert({
    where: { userId_trackId: { userId: user.id, trackId: 'demo_4' } },
    update: {},
    create: { userId: user.id, trackId: 'demo_4', trackName: 'Miki Matsubara', artistName: 'Sayonara', liked: true },
  })

  console.log('Database seeded!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
