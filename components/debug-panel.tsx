"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, X } from "lucide-react"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState<"loading" | "success" | "error" | null>(null)
  const [apiResponse, setApiResponse] = useState<string | null>(null)

  const testGroqConnection = async () => {
    setApiStatus("loading")
    setApiResponse(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello, this is a test message" }],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API error: ${errorData.error || response.statusText}`)
      }

      // For streaming responses, we'll just check if the connection works
      setApiStatus("success")
      setApiResponse("Connection to Groq API successful!")
    } catch (error) {
      setApiStatus("error")
      setApiResponse(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50" onClick={() => setIsOpen(true)}>
        <Code className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="text-sm">Debug Panel</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-4">
          <div>
            <Button
              onClick={testGroqConnection}
              disabled={apiStatus === "loading"}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test Groq API Connection
            </Button>
          </div>

          {apiStatus && (
            <div
              className={`text-xs p-2 rounded ${
                apiStatus === "success"
                  ? "bg-green-100 dark:bg-green-900"
                  : apiStatus === "error"
                    ? "bg-red-100 dark:bg-red-900"
                    : "bg-yellow-100 dark:bg-yellow-900"
              }`}
            >
              <p className="font-medium">{apiStatus.toUpperCase()}</p>
              {apiResponse && <p className="mt-1 whitespace-pre-wrap">{apiResponse}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
