import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = await streamText({
      model: groq("llama-3.1-8b-instant"),
      messages,
    })

    // Try different response methods based on AI SDK version
    if (typeof result.toDataStreamResponse === "function") {
      return result.toDataStreamResponse()
    } else if (typeof result.toAIStreamResponse === "function") {
      return result.toAIStreamResponse()
    } else if (typeof result.pipeDataStreamResponse === "function") {
      return result.pipeDataStreamResponse(new Response())
    } else {
      // Fallback for older versions
      return new Response(result.textStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      })
    }
  } catch (error) {
    console.error("API route error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
