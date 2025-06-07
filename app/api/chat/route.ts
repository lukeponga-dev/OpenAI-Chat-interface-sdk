import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"

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
      console.error("GROQ_API_KEY is not set")
      return new Response(JSON.stringify({ error: "API configuration error: Missing API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const result = await streamText({
      model: groq("llama-3.1-8b-instant"),
      messages,
    })

    // Try different response methods based on what's available
    if (typeof result.toDataStreamResponse === "function") {
      return result.toDataStreamResponse()
    } else if (typeof result.toAIStreamResponse === "function") {
      return result.toAIStreamResponse()
    } else if (typeof result.pipeDataStreamResponse === "function") {
      return result.pipeDataStreamResponse(new Response())
    } else if (result.textStream) {
      // Fallback for older versions - create manual streaming response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.textStream) {
              controller.enqueue(encoder.encode(chunk))
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } else {
      // Last resort - return available methods for debugging
      const availableMethods = Object.getOwnPropertyNames(result).filter((prop) => typeof result[prop] === "function")
      return new Response(
        JSON.stringify({
          error: "No compatible streaming method found",
          availableMethods,
          resultType: typeof result,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("API route error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
