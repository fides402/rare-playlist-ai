import { z } from 'zod'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

export const MusicalConstraintsSchema = z.object({
  bpmMin: z.number().optional(),
  bpmMax: z.number().optional(),
  mood: z.array(z.string()).optional(),
  genre: z.array(z.string()).optional(),
  decade: z.string().optional(),
  country: z.string().optional(),
  instruments: z.array(z.string()).optional(),
})

export const PlanSchema = z.object({
  searchQueries: z.array(z.string()).min(2).max(5),
  seedTrackIds: z.array(z.string()).max(8),
  constraints: MusicalConstraintsSchema.optional(),
  reasoning: z.string(),
})

export type MusicalConstraints = z.infer<typeof MusicalConstraintsSchema>
export type Plan = z.infer<typeof PlanSchema>

interface ParsedConstraints {
  bpmMin?: number
  bpmMax?: number
  mood?: string[]
  genre?: string[]
  decade?: string
  country?: string
  instruments?: string[]
}

function extractConstraintsFromPrompt(prompt: string): ParsedConstraints {
  const constraints: ParsedConstraints = {}
  const lowerPrompt = prompt.toLowerCase()

  const bpmRangeMatch = lowerPrompt.match(/(\d{2,3})\s*-\s*(\d{2,3})\s*bpm/)
  if (bpmRangeMatch) {
    constraints.bpmMin = parseInt(bpmRangeMatch[1])
    constraints.bpmMax = parseInt(bpmRangeMatch[2])
  } else {
    const bpmMatch = lowerPrompt.match(/(\d{2,3})\s*bpm/)
    if (bpmMatch) {
      const bpm = parseInt(bpmMatch[1])
      constraints.bpmMin = bpm - 10
      constraints.bpmMax = bpm + 10
    }
  }

  const moods = ['dark', 'moody', 'melancholic', 'upbeat', 'energetic', 'chill', 'relaxed', 'nostalgic', 'dreamy', 'aggressive', 'notturno', 'notturna']
  const foundMoods = moods.filter(m => lowerPrompt.includes(m))
  if (foundMoods.length > 0) constraints.mood = foundMoods

  const genres = ['jazz', 'funk', 'soul', 'rock', 'electronic', 'ambient', 'classical', 'folk', 'blues', 'hip-hop', 'rap', 'pop', 'disco', 'bossanova', 'fusion', 'experimental']
  const foundGenres = genres.filter(g => lowerPrompt.includes(g))
  if (foundGenres.length > 0) constraints.genre = foundGenres

  const decades = ['50s', '60s', '70s', '80s', '90s', '2000s', '2010s', '2020s']
  const foundDecades = decades.filter(d => lowerPrompt.includes(d.replace('s', '')) || lowerPrompt.includes(d))
  if (foundDecades.length > 0) {
    const decade = foundDecades[0].replace('s', '')
    constraints.decade = decade.length === 2 ? `19${decade}` : decade
  }

  const countries = ['italian', 'italiana', 'american', 'americana', 'british', 'japanese', 'french', 'german', 'brazilian', 'spanish']
  const foundCountries = countries.filter(c => lowerPrompt.includes(c))
  if (foundCountries.length > 0) {
    const countryMap: Record<string, string> = {
      'italian': 'Italy', 'italiana': 'Italy',
      'american': 'USA', 'americana': 'USA',
      'british': 'UK',
      'japanese': 'Japan',
      'french': 'France',
      'german': 'Germany',
      'brazilian': 'Brazil',
      'spanish': 'Spain'
    }
    constraints.country = countryMap[foundCountries[0]]
  }

  const instruments = ['piano', 'guitar', 'synth', 'drums', 'bass', 'violin', 'saxophone', 'organ', 'strings', 'horn']
  const foundInstruments = instruments.filter(i => lowerPrompt.includes(i))
  if (foundInstruments.length > 0) constraints.instruments = foundInstruments

  return constraints
}

function generateSearchQueries(prompt: string, constraints: ParsedConstraints): string[] {
  const queries: string[] = []
  const lowerPrompt = prompt.toLowerCase()

  const baseTerms = lowerPrompt.replace(/\b(rare|rari|raro)\b/gi, '').trim()
  if (baseTerms) queries.push(baseTerms)

  if (constraints.genre?.length) {
    queries.push(constraints.genre.join(' '))
  }

  if (constraints.country && constraints.decade) {
    queries.push(`${constraints.country} ${constraints.decade} music`)
  } else if (constraints.decade) {
    queries.push(`${constraints.decade} music`)
  } else if (constraints.country) {
    queries.push(`${constraints.country} music`)
  }

  if (constraints.mood?.length) {
    queries.push(`${constraints.mood[0]} ${constraints.genre?.[0] || 'music'}`)
  }

  if (constraints.instruments?.length) {
    queries.push(`${constraints.instruments[0]} ${constraints.genre?.[0] || 'music'}`)
  }

  queries.push('underground obscure')

  return Array.from(new Set(queries)).slice(0, 5)
}

export async function planFromPrompt(prompt: string): Promise<Plan> {
  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty')
  }

  const constraints = extractConstraintsFromPrompt(prompt)
  const searchQueries = generateSearchQueries(prompt, constraints)

  const systemPrompt = `You are a music curation AI assistant. Given a user's playlist request, analyze it and create a plan for finding rare, unique tracks that match their description.

The user wants: "${prompt}"

Your task is to output a JSON object with:
{
  "searchQueries": ["2-5 search queries to find relevant tracks"],
  "seedTrackIds": ["leave empty array - we will find these from search results"],
  "constraints": {
    "bpmMin": number or null,
    "bpmMax": number or null,  
    "mood": ["array of mood keywords"],
    "genre": ["array of genre keywords"],
    "decade": "e.g., '1970s' or null",
    "country": "e.g., 'Italy' or null",
    "instruments": ["array of instruments"]
  },
  "reasoning": "2-3 sentences explaining your approach"
}

Focus on finding RARE and UNDERREPRESENTED tracks, not mainstream popular ones. Consider:
- Less popular artists
- Deep cuts from albums
- Underground/indie tracks
- International music
- Obscure releases
- B-sides and rarities`

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the playlist plan.' }
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(responseText)

    const validated = PlanSchema.parse({
      searchQueries: parsed.searchQueries || searchQueries,
      seedTrackIds: [],
      constraints: {
        bpmMin: constraints.bpmMin,
        bpmMax: constraints.bpmMax,
        mood: constraints.mood,
        genre: constraints.genre,
        decade: constraints.decade,
        country: constraints.country,
        instruments: constraints.instruments,
      },
      reasoning: parsed.reasoning || 'Plan generated based on prompt analysis.'
    })

    return validated
  } catch (error) {
    console.error('LLM planning failed, using fallback:', error)
    
    return {
      searchQueries,
      seedTrackIds: [],
      constraints: constraints.bpmMin || constraints.bpmMax || constraints.genre?.length || constraints.mood?.length
        ? {
            bpmMin: constraints.bpmMin,
            bpmMax: constraints.bpmMax,
            mood: constraints.mood,
            genre: constraints.genre,
            decade: constraints.decade,
            country: constraints.country,
            instruments: constraints.instruments,
          }
        : undefined,
      reasoning: 'Fallback plan using rule-based extraction.'
    }
  }
}

export function extractConstraintsFromPlan(plan: Plan): MusicalConstraints {
  return plan.constraints || {}
}
