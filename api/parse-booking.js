import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are a travel booking parser. Extract structured data from booking confirmation text.
Return ONLY valid JSON — no markdown, no explanation.

Schema (all fields optional except type):
{
  "type": "destination" | "hotel" | "transport",
  "city": string,
  "country": string,
  "arrival": "YYYY-MM-DD",
  "departure": "YYYY-MM-DD",
  "hotelName": string,
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "airline": string,
  "flightNumber": string,
  "departureTime": "HH:MM",
  "arrivalTime": "HH:MM",
  "confirmationNumber": string,
  "bookingUrl": string,
  "address": string
}

Rules:
- type=destination for city visits/flights TO a destination
- type=hotel for hotel/accommodation bookings
- type=transport for flights, trains, buses between cities
- Extract dates in local time, format as YYYY-MM-DD
- If the text contains multiple bookings, return the most prominent one`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body || {}
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return res.status(400).json({ error: 'No booking text provided' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Booking import is not configured' })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: 'user', content: text.slice(0, 4000) }],
    })

    const raw = message.content[0]?.text?.trim()
    const parsed = JSON.parse(raw)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('[parse-booking]', err)
    return res.status(422).json({ error: 'Could not parse booking — try copy-pasting more of the confirmation' })
  }
}
