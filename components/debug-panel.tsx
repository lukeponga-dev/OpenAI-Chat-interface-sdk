"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, X } from "lucide-react"

interface ApiStatus {
  status: "loading" | "success" | "error" | null
  response: string | null
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ status: null, response: null })

  const testConnection = async () => {
    setApiStatus({ status: "loading", response: null })

    try {
      // Simulate connection test for static version
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setApiStatus({
        status: "success",
        response: "Static version - API testing not available",
      })
    } catch (error) {
      setApiStatus({
        status: "error",
        response: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
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
          <Button
            onClick={testConnection}
            disabled={apiStatus.status === "loading"}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Test Connection
          </Button>

          {apiStatus.status && (
            <div
              className={`text-xs p-2 rounded ${
                apiStatus.status === "success"
                  ? "bg-green-100 dark:bg-green-900"
                  : apiStatus.status === "error"
                    ? "bg-red-100 dark:bg-red-900"
                    : "bg-yellow-100 dark:bg-yellow-900"
              }`}
            >
              <p className="font-medium">{apiStatus.status.toUpperCase()}</p>
              {apiStatus.response && <p className="mt-1 whitespace-pre-wrap">{apiStatus.response}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
