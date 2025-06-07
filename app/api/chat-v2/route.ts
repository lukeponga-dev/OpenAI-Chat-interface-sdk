import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"
import { StreamingTextResponse } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!process.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "API configuration error: Missing API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Use streamText and extract the stream directly
    const result = await streamText({
      model: groq("llama-3.1-8b-instant"),
      messages,
    })

    // Create a StreamingTextResponse using the textStream
    return new StreamingTextResponse(result.textStream)
  } catch (error) {
    console.error("API route error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
