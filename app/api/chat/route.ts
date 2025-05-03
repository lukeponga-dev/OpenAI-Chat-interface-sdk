import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"
import { NextResponse } from "next/server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Extract the messages from the body of the request
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request: messages array is required" }, { status: 400 })
    }

    // Check if GROQ_API_KEY is available
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set")
      return NextResponse.json({ error: "API configuration error: Missing API key" }, { status: 500 })
    }

    // Call the language model with error handling
    try {
      const result = streamText({
        model: groq("llama-3.1-8b-instant"), // Using Groq's Llama 3.1 model
        messages,
      })

      return result.toDataStreamResponse()
    } catch (modelError) {
      console.error("Model inference error:", modelError)
      return NextResponse.json({ error: "Failed to generate response from AI model" }, { status: 500 })
    }
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
