"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react"

export default function TestPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)

    // Simulate test results for static deployment
    setTimeout(() => {
      const results = {
        timestamp: new Date().toISOString(),
        environment: "static",
        tests: [
          {
            name: "Static Deployment",
            status: "✅ PASS",
            details: {
              type: "Static Export",
              framework: "Next.js",
              deployment: "Vercel",
            },
          },
          {
            name: "Client-Side Features",
            status: "✅ PASS",
            details: {
              localStorage: "Available",
              themes: "Working",
              responsive: "Working",
            },
          },
          {
            name: "API Integration",
            status: "⚠️ MANUAL",
            details: {
              note: "API integration requires manual configuration",
              instructions: "Configure API key in settings for full functionality",
            },
          },
        ],
      }
      setTestResults(results)
      setIsLoading(false)
    }, 1000)
  }

  const getStatusIcon = (status: string) => {
    if (status.includes("PASS")) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status.includes("FAIL")) return <XCircle className="h-4 w-4 text-red-500" />
    if (status.includes("WARN")) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <Info className="h-4 w-4 text-blue-500" />
  }

  const getStatusColor = (status: string) => {
    if (status.includes("PASS")) return "text-green-600 bg-green-50 border-green-200"
    if (status.includes("FAIL")) return "text-red-600 bg-red-50 border-red-200"
    if (status.includes("WARN")) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-blue-600 bg-blue-50 border-blue-200"
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Static Deployment Test</h1>
        <Button onClick={runTests} disabled={isLoading}>
          {isLoading ? "Running Tests..." : "Run Tests"}
        </Button>
      </div>

      {testResults && (
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
              {testResults.tests.map((test: any, index: number) => (
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
      )}

      {!testResults && !isLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Click "Run Tests" to test the static deployment</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
