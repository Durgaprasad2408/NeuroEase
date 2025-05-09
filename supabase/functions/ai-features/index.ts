import { config } from 'https://deno.land/std@0.224.0/dotenv/mod.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import OpenAI from 'npm:openai@4.28.0'

// Load environment variables
const env = await config()

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Fallback quotes for when OpenAI API is unavailable
const fallbackQuotes = [
  "The only way to do great work is to love what you do.",
  "Every moment is a fresh beginning.",
  "Believe you can and you're halfway there.",
  "Your present circumstances don't determine where you can go.",
  "Peace begins with a smile.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Be the change you wish to see in the world.",
  "Life is 10% what happens to you and 90% how you react to it.",
]

// Fallback meditation guidance templates
const getFallbackMeditation = (mood: string) => {
  return `Take a moment to acknowledge your ${mood} feelings. Find a comfortable position and follow these steps:

1. Take 3 deep breaths, inhaling for 4 counts and exhaling for 6 counts
2. Notice any tension in your body and consciously release it
3. Focus on the present moment, accepting your emotions without judgment
4. Remember that all feelings are temporary and valid

Continue this practice for a few minutes, being gentle with yourself.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    const { type, mood } = await req.json()

    if (type === 'quote') {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a mindfulness coach. Generate an inspiring and uplifting quote that promotes mental well-being. Keep it concise (max 20 words) and impactful.',
            },
          ],
          max_tokens: 60,
        })

        return new Response(
          JSON.stringify({ quote: completion.choices[0].message.content }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (_) {
        const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
        return new Response(
          JSON.stringify({ quote: randomQuote }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    if (type === 'meditation') {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a mindfulness coach. Generate a short, guided meditation and stress management advice for someone feeling ${mood}. Include breathing exercises and practical tips. Keep it under 150 words.`,
            },
          ],
          max_tokens: 200,
        })

        return new Response(
          JSON.stringify({ guidance: completion.choices[0].message.content }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (_) {
        return new Response(
          JSON.stringify({ guidance: getFallbackMeditation(mood) }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
