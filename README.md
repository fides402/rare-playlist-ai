# RarePlaylistAI

AI-powered music discovery app that generates playlists of rare and unique tracks using the Hi-Fi streaming API (monochrome.tf).

## Features

- **LLM-powered Planner**: Transforms natural language prompts into targeted searches
- **Rarity Ranking**: Composite scoring based on popularity, diversity, and constraint matching
- **Graph-based Discovery**: Multi-hop recommendation expansion
- **Personalization**: Like/dislike feedback loop to refine recommendations
- **Dark UI**: Tidal-inspired interface optimized for mobile and desktop
- **Background Playback**: Audio continues when screen is off or tab is hidden
- **Quality Selection**: MAX/HIGH/MED/LOW with automatic fallback

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: SQLite with Prisma ORM
- **AI**: Groq LLM for prompt planning
- **Audio**: HTML5 Audio with background playback support

## Setup

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# (Optional) Seed demo data
npm run db:seed
```

### Environment Variables

Create a `.env` file:

```env
# Hi-Fi API (monochrome.tf)
HIFI_API_BASE_URL=https://api.monochrome.tf
HIFI_API_KEY=your_api_key_here

# Groq LLM (free tier - get from https://console.groq.com)
GROQ_API_KEY=gsk_YourGroqKeyHere

# Database
DATABASE_URL="file:./dev.db"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Open http://localhost:3000

### Build

```bash
npm run build
npm start
```

## Usage

1. Enter a description (e.g., "rare Italian 70s jazz-funk mood notturno")
2. Adjust settings: playlist length, rarity slider, deep discovery
3. Click Generate
4. Listen, like/dislike tracks, save playlists

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with PlayerProvider
│   ├── page.tsx            # Main discovery page
│   ├── actions.ts          # Server actions
│   ├── globals.css         # Global styles
│   ├── api/
│   │   ├── generate/       # Playlist generation API
│   │   └── playlist/       # Playlist CRUD API
│   └── playlists/          # Saved playlists page
├── components/
│   ├── PlayerContext.tsx   # Audio player state
│   ├── Navigation.tsx      # Top navigation
│   ├── Disclaimer.tsx      # Legal disclaimer
│   └── ui/Toaster.tsx      # Toast notifications
├── lib/
│   ├── hifiClient.ts       # Hi-Fi API client with caching
│   ├── planner.ts          # LLM prompt planner
│   ├── ranking.ts          # Rarity scoring & personalization
│   ├── graphDiscovery.ts   # Multi-hop recommendation
│   └── db.ts               # Prisma database utilities
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Demo data
├── public/
└── .env.example            # Environment template
```

## API Endpoints

### POST /api/generate

Generate a rare playlist.

```json
{
  "prompt": "rare jazz-funk 70s",
  "userId": "user_abc123",
  "options": {
    "playlistLength": 30,
    "explorationMode": 0.3,
    "hop2Enabled": true
  }
}
```

### POST /api/playlist

Save a playlist.

```json
{
  "userId": "user_abc123",
  "name": "My Rare Mix",
  "prompt": "rare jazz-funk 70s",
  "tracks": [
    { "trackId": "123", "trackName": "Track 1", "artistName": "Artist", "position": 0 }
  ]
}
```

## Example Prompts

- "rare OST italiane anni 70 jazz-funk mood notturno"
- "underground japanese city pop 80s"
- "obscure african funk 70s deep cuts"
- "rare brazilian boogie 80s"
- "underground detroit techno early 90s"

## Known Limitations

- Audio streaming depends on API availability
- Quality fallback when MAX is unavailable
- Rate limiting handled with retry logic
- Results cached for 24 hours

## Future Enhancements

- Multi-user authentication
- Social sharing
- Discogs integration for additional metadata
- Multiple API endpoint fallbacks
- Collaborative playlists

## License

MIT
