"use client"

import { useChat } from "@ai-sdk/react"
import { useRef, useEffect, useState } from "react"
import { Send, AlertCircle, RefreshCw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">(
    typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline",
  )
  const [apiEndpoint, setApiEndpoint] = useState("/api/chat")

  // Use the chat hook with the selected API endpoint
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload } = useChat({
    api: apiEndpoint,
  })

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus("online")
    const handleOffline = () => setNetworkStatus("offline")

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-background">
      <Card className="flex-1 flex flex-col h-full rounded-none border-0 shadow-none">
        <CardHeader className="border-b flex flex-row items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <CardTitle>AI Chat</CardTitle>
            {networkStatus === "offline" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You are offline. Check your internet connection.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={apiEndpoint} onValueChange={setApiEndpoint}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/api/chat">Default API</SelectItem>
                <SelectItem value="/api/chat-v2">V2 API</SelectItem>
                <SelectItem value="/api/chat-simple">Simple API</SelectItem>
              </SelectContent>
            </Select>
            <ModeToggle />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          {networkStatus === "offline" && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Offline</AlertTitle>
              <AlertDescription>You are currently offline. Please check your internet connection.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>{error.message || "Failed to get a response from the AI model."}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={reload}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open("/test", "_blank")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Debug
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Start a conversation by sending a message below.</p>
                <p className="text-sm mt-2">Using: {apiEndpoint}</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex space-x-2">
                    <div
                      className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        <CardFooter className="border-t p-4 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-grow"
              disabled={isLoading || networkStatus === "offline"}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim() || networkStatus === "offline"}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
