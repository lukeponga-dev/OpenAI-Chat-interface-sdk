import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: groq("llama-3.1-8b-instant"),
    messages,
  })

  return result.toAIStreamResponse()
}
