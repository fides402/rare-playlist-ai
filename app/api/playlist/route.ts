import { NextRequest, NextResponse } from 'next/server'
import { savePlaylist } from '@/app/actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, prompt, tracks } = body

    if (!userId || !name || !prompt || !tracks) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const playlist = await savePlaylist(userId, name, prompt, tracks)

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Save playlist API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to save playlist' },
      { status: 500 }
    )
  }
}
