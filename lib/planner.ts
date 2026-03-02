import { z } from 'zod'

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

  const moods = ['dark', 'moody', 'melancholic', 'upbeat', 'energetic', 'chill', 'relaxed', 'nostalgic', 'dreamy', 'aggressive', 'notturno', 'notturna', 'nocturnal', 'night']
  const foundMoods = moods.filter(m => lowerPrompt.includes(m))
  if (foundMoods.length > 0) constraints.mood = foundMoods

  const genres = ['jazz', 'funk', 'soul', 'rock', 'electronic', 'ambient', 'classical', 'folk', 'blues', 'hip-hop', 'rap', 'pop', 'disco', 'bossanova', 'fusion', 'experimental', 'soundtrack', 'ost', 'city pop', 'afrobeat', 'boogie', 'techno', 'house']
  const foundGenres = genres.filter(g => lowerPrompt.includes(g))
  if (foundGenres.length > 0) constraints.genre = foundGenres

  const decades = ['50s', '60s', '70s', '80s', '90s', '2000s', '2010s', '2020s']
  const foundDecades = decades.filter(d => lowerPrompt.includes(d.replace('s', '')) || lowerPrompt.includes(d))
  if (foundDecades.length > 0) {
    const decade = foundDecades[0].replace('s', '')
    constraints.decade = decade.length === 2 ? `19${decade}` : decade
  }

  const countries: Record<string, string> = {
    'italian': 'Italy', 'italiana': 'Italy', 'italiano': 'Italy',
    'american': 'USA', 'americana': 'USA', 'americano': 'USA',
    'british': 'UK', 'britannico': 'UK',
    'japanese': 'Japan', 'giapanese': 'Japan', 'japan': 'Japan',
    'french': 'France', 'francese': 'France',
    'german': 'Germany', 'tedesco': 'Germany',
    'brazilian': 'Brazil', 'brasil': 'Brazil',
    'spanish': 'Spain', 'spagnolo': 'Spain',
    'african': 'Africa', 'africano': 'Africa',
    'detroit': 'USA',
  }
  for (const [key, value] of Object.entries(countries)) {
    if (lowerPrompt.includes(key)) {
      constraints.country = value
      break
    }
  }

  const instruments = ['piano', 'guitar', 'synth', 'drums', 'bass', 'violin', 'saxophone', 'organ', 'strings', 'horn', 'electric']
  const foundInstruments = instruments.filter(i => lowerPrompt.includes(i))
  if (foundInstruments.length > 0) constraints.instruments = foundInstruments

  return constraints
}

function generateSearchQueries(prompt: string, constraints: ParsedConstraints): string[] {
  const queries: string[] = []
  const lowerPrompt = prompt.toLowerCase()

  const baseTerms = lowerPrompt
    .replace(/\b(rare|rari|raro|underground|obscure|deep)\b/gi, '')
    .replace(/\b(ost|soundtrack)\b/gi, 'soundtrack')
    .trim()
  
  if (baseTerms) queries.push(baseTerms)

  if (constraints.genre?.length) {
    queries.push(constraints.genre.join(' '))
  }

  if (constraints.country && constraints.decade) {
    queries.push(`${constraints.country} ${constraints.decade}`)
  } else if (constraints.decade) {
    queries.push(`${constraints.decade}`)
  } else if (constraints.country) {
    queries.push(`${constraints.country} music`)
  }

  if (constraints.mood?.length) {
    queries.push(`${constraints.mood[0]} ${constraints.genre?.[0] || 'music'}`)
  }

  if (constraints.instruments?.length) {
    queries.push(`${constraints.instruments[0]} ${constraints.genre?.[0] || 'music'}`)
  }

  queries.push('underground rare')

  return Array.from(new Set(queries)).slice(0, 5)
}

export async function planFromPrompt(prompt: string): Promise<Plan> {
  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty')
  }

  const constraints = extractConstraintsFromPrompt(prompt)
  const searchQueries = generateSearchQueries(prompt, constraints)

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
    reasoning: 'Plan generated based on prompt analysis with rule-based extraction.'
  }
}

export function extractConstraintsFromPlan(plan: Plan): MusicalConstraints {
  return plan.constraints || {}
}
