import { NextResponse } from "next/server"

export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    tests: [] as any[],
  }

  // Test 1: Check environment variables
  try {
    testResults.tests.push({
      name: "Environment Variables",
      status: process.env.GROQ_API_KEY ? "✅ PASS" : "❌ FAIL",
      details: {
        groqApiKey: process.env.GROQ_API_KEY ? "Set" : "Not set",
        nodeEnv: process.env.NODE_ENV || "Not set",
        hasRedisUrl: process.env.KV_URL ? "Set" : "Not set",
      },
    })
  } catch (error) {
    testResults.tests.push({
      name: "Environment Variables",
      status: "❌ FAIL",
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    })
  }

  // Test 2: Check AI SDK imports
  try {
    const { groq } = await import("@ai-sdk/groq")
    const { generateText } = await import("ai")

    testResults.tests.push({
      name: "AI SDK Imports",
      status: "✅ PASS",
      details: {
        groqImport: "Success",
        generateTextImport: "Success",
      },
    })
  } catch (error) {
    testResults.tests.push({
      name: "AI SDK Imports",
      status: "❌ FAIL",
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    })

    // Return early if imports fail
    return NextResponse.json(testResults, { status: 200 })
  }

  // Test 3: Test Groq API connection (only if imports work)
  if (process.env.GROQ_API_KEY) {
    try {
      const { groq } = await import("@ai-sdk/groq")
      const { generateText } = await import("ai")

      const startTime = Date.now()
      const result = await generateText({
        model: groq("llama-3.1-8b-instant"),
        prompt: "Say 'Hello, API test successful!' and nothing else.",
        maxTokens: 20,
      })
      const endTime = Date.now()

      testResults.tests.push({
        name: "Groq API Connection",
        status: "✅ PASS",
        details: {
          response: result.text,
          responseTime: `${endTime - startTime}ms`,
          usage: result.usage || "Not available",
        },
      })
    } catch (error) {
      testResults.tests.push({
        name: "Groq API Connection",
        status: "❌ FAIL",
        details: {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
        },
      })
    }
  } else {
    testResults.tests.push({
      name: "Groq API Connection",
      status: "⏭️ SKIP",
      details: {
        reason: "GROQ_API_KEY not set",
      },
    })
  }

  // Test 4: Test streaming capability
  try {
    const { groq } = await import("@ai-sdk/groq")
    const { streamText } = await import("ai")

    const result = await streamText({
      model: groq("llama-3.1-8b-instant"),
      prompt: "Count from 1 to 3",
      maxTokens: 20,
    })

    // Check available methods
    const availableMethods = Object.getOwnPropertyNames(result).filter((prop) => typeof result[prop] === "function")
    const hasToAIStreamResponse = typeof result.toAIStreamResponse === "function"
    const hasToDataStreamResponse = typeof result.toDataStreamResponse === "function"

    testResults.tests.push({
      name: "Streaming Capability",
      status: hasToAIStreamResponse || hasToDataStreamResponse ? "✅ PASS" : "❌ FAIL",
      details: {
        toAIStreamResponse: hasToAIStreamResponse,
        toDataStreamResponse: hasToDataStreamResponse,
        availableMethods: availableMethods,
        resultType: typeof result,
      },
    })
  } catch (error) {
    testResults.tests.push({
      name: "Streaming Capability",
      status: "❌ FAIL",
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    })
  }

  // Test 5: Basic system info
  try {
    testResults.tests.push({
      name: "System Info",
      status: "ℹ️ INFO",
      details: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: `${Math.floor(process.uptime())}s`,
      },
    })
  } catch (error) {
    testResults.tests.push({
      name: "System Info",
      status: "⚠️ WARN",
      details: {
        error: "Could not get system info",
      },
    })
  }

  return NextResponse.json(testResults, { status: 200 })
}

export async function POST() {
  try {
    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error: "GROQ_API_KEY not configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    const testMessage = {
      role: "user" as const,
      content: "This is a test message. Please respond with 'Test successful!' and nothing else.",
    }

    const { groq } = await import("@ai-sdk/groq")
    const { streamText } = await import("ai")

    const result = await streamText({
      model: groq("llama-3.1-8b-instant"),
      messages: [testMessage],
      maxTokens: 50,
    })

    // Try different streaming methods
    if (typeof result.toAIStreamResponse === "function") {
      return result.toAIStreamResponse()
    } else if (typeof result.toDataStreamResponse === "function") {
      return result.toDataStreamResponse()
    } else {
      // Fallback response
      return NextResponse.json(
        {
          error: "No valid streaming response method found",
          availableMethods: Object.getOwnPropertyNames(result).filter((prop) => typeof result[prop] === "function"),
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
