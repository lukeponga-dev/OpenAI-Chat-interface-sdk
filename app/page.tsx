"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModeToggle } from "@/components/mode-toggle"
import { Send, Settings, MessageCircle, Zap, Shield, Bot, User, Copy, RotateCcw, Trash2 } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Settings
  const [apiKey, setApiKey] = useState("")
  const [apiProvider, setApiProvider] = useState("groq")
  const [apiUrl, setApiUrl] = useState("https://api.groq.com/openai/v1/chat/completions")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load settings from localStorage
  useEffect(() => {
    const savedApiKey = "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"
    setApiKey(savedApiKey)
    const savedProvider = localStorage.getItem("apiProvider") || "groq"
    const savedUrl = localStorage.getItem("apiUrl") || "https://api.groq.com/openai/v1/chat/completions"

    setApiKey(savedApiKey)
    setApiProvider(savedProvider)
    setApiUrl(savedUrl)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px"
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !apiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: apiProvider === "groq" ? "distil-whisper-large-v3-en" : "gpt-3.5-turbo",
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = () => {
    // localStorage.setItem("apiKey", apiKey)
    localStorage.setItem("apiProvider", apiProvider)
    localStorage.setItem("apiUrl", apiUrl)
    setShowSettings(false)
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error("Failed to copy message")
    }
  }

  const regenerateResponse = async () => {
    if (messages.length < 2) return

    const lastUserMessage = messages[messages.length - 2]
    if (lastUserMessage.role !== "user") return

    // Remove last AI response
    setMessages((prev) => prev.slice(0, -1))
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: apiProvider === "groq" ? "distil-whisper-large-v3-en" : "gpt-3.5-turbo",
          messages: messages.slice(0, -1).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.choices[0].message.content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, "<br>")
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Chat</h1>
              <p className="text-sm text-muted-foreground">{apiKey ? "Connected" : "Configure API key"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="m-4 p-4 space-y-4">
          <h3 className="font-semibold">Settings</h3>
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium">API Provider</label>
              <Select value={apiProvider} onValueChange={setApiProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>
            <div>
              <label className="text-sm font-medium">API URL</label>
              <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="API endpoint URL" />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveSettings}>Save Settings</Button>
              <Button variant="outline" onClick={clearChat}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome to AI Chat</h2>
              <p className="text-muted-foreground mb-4">Start a conversation with your AI assistant</p>
              <div className="flex gap-2 justify-center">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  Fast responses
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Secure
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                <Card className={`p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
                  <div
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    className="prose prose-sm max-w-none dark:prose-invert"
                  />
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <span className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message.content)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {message.role === "assistant" && (
                        <Button variant="ghost" size="sm" onClick={regenerateResponse} className="h-6 w-6 p-0">
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
            </Card>
          </div>
        )}

        {error && (
          <Card className="p-3 border-destructive bg-destructive/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                ×
              </Button>
            </div>
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={apiKey ? "Type your message..." : "Configure API key first..."}
            className="min-h-[44px] max-h-[120px] resize-none"
            disabled={!apiKey || isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" disabled={!apiKey || isLoading || !input.trim()} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Quick Actions */}
        {apiKey && messages.length === 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {[
              "Hello! How can you help me?",
              "Explain quantum computing",
              "Write a creative story",
              "Help with coding",
            ].map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                onClick={() => setInput(prompt)}
                className="whitespace-nowrap"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
