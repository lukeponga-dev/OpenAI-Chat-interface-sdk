"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Play, CheckCircle, XCircle, Info, AlertTriangle, SkipForward } from "lucide-react"

interface TestResult {
  name: string
  status: string
  details: any
}

interface TestResults {
  timestamp: string
  environment: string
  tests: TestResult[]
}

export default function TestPage() {
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamTest, setStreamTest] = useState<string>("")
  const [isStreamTesting, setIsStreamTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/test")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const results = await response.json()
      setTestResults(results)
    } catch (error) {
      console.error("Failed to run tests:", error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const testStreaming = async () => {
    setIsStreamTesting(true)
    setStreamTest("")
    setError(null)

    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          setStreamTest((prev) => prev + chunk)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setStreamTest(`Error: ${errorMessage}`)
      setError(errorMessage)
    } finally {
      setIsStreamTesting(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    if (status.includes("PASS")) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status.includes("FAIL")) return <XCircle className="h-4 w-4 text-red-500" />
    if (status.includes("WARN")) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    if (status.includes("SKIP")) return <SkipForward className="h-4 w-4 text-gray-500" />
    return <Info className="h-4 w-4 text-blue-500" />
  }

  const getStatusColor = (status: string) => {
    if (status.includes("PASS")) return "text-green-600 bg-green-50 border-green-200"
    if (status.includes("FAIL")) return "text-red-600 bg-red-50 border-red-200"
    if (status.includes("WARN")) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    if (status.includes("SKIP")) return "text-gray-600 bg-gray-50 border-gray-200"
    return "text-blue-600 bg-blue-50 border-blue-200"
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">API Test Dashboard</h1>
        <Button onClick={runTests} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Running Tests..." : "Run Tests"}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Test Results
                <span className="text-sm font-normal px-2 py-1 bg-gray-100 rounded">{testResults.environment}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Last run: {new Date(testResults.timestamp).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.tests.map((test, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        <h3 className="font-semibold">{test.name}</h3>
                      </div>
                      <span className="text-sm font-medium px-2 py-1 rounded border">{test.status}</span>
                    </div>
                    <div className="bg-white/50 p-3 rounded text-sm border">
                      <pre className="whitespace-pre-wrap overflow-x-auto">{JSON.stringify(test.details, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Streaming Test
                <Button onClick={testStreaming} disabled={isStreamTesting} size="sm">
                  <Play className={`mr-2 h-4 w-4 ${isStreamTesting ? "animate-spin" : ""}`} />
                  {isStreamTesting ? "Testing..." : "Test Stream"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded min-h-[100px] border">
                {streamTest ? (
                  <pre className="whitespace-pre-wrap text-sm">{streamTest}</pre>
                ) : (
                  <p className="text-gray-500">Click "Test Stream" to test streaming functionality</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!testResults && !isLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Click "Run Tests" to start testing your API</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
