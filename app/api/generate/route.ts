import { NextRequest, NextResponse } from 'next/server'
import { generatePlaylist } from '@/app/actions'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, userId, options } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await generatePlaylist(
      prompt,
      userId,
      {
        playlistLength: options?.playlistLength || 30,
        explorationMode: options?.explorationMode ?? 0.3,
        hop2Enabled: options?.hop2Enabled ?? true,
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Generate API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate playlist' },
      { status: 500 }
    )
  }
}
