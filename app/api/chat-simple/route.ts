export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Import dynamically to avoid issues
    const { groq } = await import("@ai-sdk/groq")
    const { streamText, StreamingTextResponse } = await import("ai")

    const result = await streamText({
      model: groq("llama-3.1-8b-instant"),
      messages,
    })

    return new StreamingTextResponse(result.textStream)
  } catch (error) {
    console.error("Simple API error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
