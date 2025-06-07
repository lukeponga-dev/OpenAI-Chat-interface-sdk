"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ModeToggle } from "@/components/mode-toggle"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [apiUrl, setApiUrl] = useState("https://api.groq.com/openai/v1/chat/completions")
  const [selectedAPI, setSelectedAPI] = useState("groq")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isApiConfigExpanded, setIsApiConfigExpanded] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({})
  const [showScrollButton, setShowScrollButton] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  const availableReactions = ["👍", "👎", "❤️", "😂", "😢", "😮", "🔥", "👏", "🎉", "🤔", "💯", "⚡"]

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("apiKey") || ""
    const savedApiUrl = localStorage.getItem("apiUrl") || "https://api.groq.com/openai/v1/chat/completions"
    const savedSelectedAPI = localStorage.getItem("selectedAPI") || "groq"
    const savedReactions = JSON.parse(localStorage.getItem("messageReactions") || "{}")
    const savedApiConfigExpanded = localStorage.getItem("apiConfigExpanded") === "true"

    setApiKey(savedApiKey)
    setApiUrl(savedApiUrl)
    setSelectedAPI(savedSelectedAPI)
    setReactions(savedReactions)
    setIsApiConfigExpanded(savedApiConfigExpanded)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, autoScroll])

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setAutoScroll(isNearBottom)
        setShowScrollButton(!isNearBottom)
      }
    }

    const container = chatContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = "auto"
      messageInputRef.current.style.height = Math.min(messageInputRef.current.scrollHeight, 128) + "px"
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !apiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
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
          model: selectedAPI === "groq" ? "llama-3.1-8b-instant" : "gpt-3.5-turbo",
          messages: [...messages, userMessage].map((msg) => ({ role: msg.role, content: msg.content })),
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices[0].message.content,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = () => {
    localStorage.setItem("apiKey", apiKey)
    localStorage.setItem("apiUrl", apiUrl)
    localStorage.setItem("selectedAPI", selectedAPI)
    setIsSettingsOpen(false)
  }

  const testConnection = async () => {
    if (!apiKey) {
      setError("Please enter an API key first")
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedAPI === "groq" ? "llama-3.1-8b-instant" : "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Hello! This is a test message." }],
          max_tokens: 50,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      alert("Connection test successful!")
    } catch (err) {
      setError(`Connection test failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setReactions({})
    localStorage.removeItem("messageReactions")
  }

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, "<br>")
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-black/10 dark:bg-white/10 p-3 rounded-lg mt-2 mb-2 overflow-x-auto"><code>$1</code></pre>',
      )
  }

  const quickActions = [
    { label: "👋 Say Hello", message: "Hello! How can you help me today?" },
    { label: "🔬 Explain Something", message: "Can you explain quantum computing in simple terms?" },
    { label: "✨ Be Creative", message: "Write a creative story about space exploration" },
    { label: "💻 Code Help", message: "Help me solve a coding problem" },
  ]

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* API Key Missing Banner */}
      {!apiKey && (
        <div className="bg-amber-500/90 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
            <span>API key not configured. Please set up your API key in settings.</span>
          </div>
          <button
            onClick={() => {
              setIsSettingsOpen(true)
              setIsApiConfigExpanded(true)
            }}
            className="bg-white text-amber-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-white/90"
          >
            Configure
          </button>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="glass border-b border-border/50 flex items-center justify-between p-4 flex-shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold">AI Chat</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${apiKey ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></div>
              <span className="text-xs text-muted-foreground">{apiKey ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Message Counter */}
          {messages.length > 0 && (
            <div className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </div>
          )}
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 border border-border rounded-lg hover:bg-accent transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
            </svg>
          </button>
          {/* Theme Toggle */}
          <ModeToggle />
        </div>
      </div>

      {/* Enhanced Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto relative"
        style={{
          background: `radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.05) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      >
        <div className="relative z-10 p-4 space-y-4 min-h-full">
          {messages.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  ></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Welcome to AI Chat!</h2>
              <p className="text-muted-foreground mb-4">Your intelligent conversation partner</p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span className="px-3 py-1 bg-muted rounded-full">💬 Natural conversations</span>
                <span className="px-3 py-1 bg-muted rounded-full">🚀 Fast responses</span>
                <span className="px-3 py-1 bg-muted rounded-full">🔒 Secure</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Configure your API key in settings to get started</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-muted-foreground rounded-bl-md"
                  }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
                  <div className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-md p-4 max-w-[85%] shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to Bottom FAB */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-all z-40"
        >
          <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </button>
      )}

      {/* Enhanced Error Display */}
      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <svg
                className="h-4 w-4 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Something went wrong</h4>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 text-sm transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Input Area */}
      <div className="glass border-t border-border/50 p-4 flex-shrink-0 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={messageInputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
              placeholder={apiKey ? "Type your message..." : "Configure API key in settings..."}
              className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none text-base max-h-32 min-h-[48px] bg-background border-2 border-border focus:border-primary"
              rows={1}
              disabled={!apiKey || isLoading}
            />
            {input.length > 0 && (
              <div className="absolute bottom-1 right-3 text-xs text-muted-foreground">{input.length}/1000</div>
            )}
          </div>
          <button
            type="submit"
            disabled={!apiKey || isLoading || !input.trim()}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
          >
            {isLoading ? (
              <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
              </svg>
            )}
          </button>
        </form>

        {/* Quick Actions */}
        {apiKey && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInput(action.message)}
                className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm whitespace-nowrap hover:bg-accent transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Settings Panel */}
      {isSettingsOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsSettingsOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 glass border-t border-border/50 z-50 backdrop-blur-md">
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure your AI chat experience</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-accent rounded-xl transition-all"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* API Configuration Section */}
                <div className="border border-border rounded-xl overflow-hidden">
                  {/* Collapsible Header */}
                  <div
                    onClick={() => {
                      setIsApiConfigExpanded(!isApiConfigExpanded)
                      localStorage.setItem("apiConfigExpanded", (!isApiConfigExpanded).toString())
                    }}
                    className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          ></path>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">API Configuration</h3>
                        <p className="text-sm text-muted-foreground">Configure your AI provider settings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${apiKey ? "bg-green-500" : "bg-gray-400"}`}></div>
                      <svg
                        className={`h-5 w-5 text-muted-foreground transition-transform ${isApiConfigExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {isApiConfigExpanded && (
                    <div className="p-4 space-y-4 border-t border-border/50 animate-slide-down">
                      <div>
                        <label className="block text-sm font-medium mb-2">API Provider</label>
                        <select
                          value={selectedAPI}
                          onChange={(e) => setSelectedAPI(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-base bg-background border-2 border-border focus:border-primary focus:outline-none"
                        >
                          <option value="groq">🚀 Groq (Fast & Free)</option>
                          <option value="openai">🤖 OpenAI (GPT Models)</option>
                          <option value="custom">⚙️ Custom API</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">API Key</label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter your API key..."
                          className="w-full px-4 py-3 rounded-xl text-base bg-background border-2 border-border focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">API URL (optional)</label>
                        <input
                          type="url"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          placeholder="https://api.groq.com/openai/v1/chat/completions"
                          className="w-full px-4 py-3 rounded-xl text-base bg-background border-2 border-border focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={testConnection}
                          className="flex-1 px-4 py-3 border-2 border-border rounded-xl hover:bg-accent transition-all font-medium"
                        >
                          🔗 Test Connection
                        </button>
                        <button
                          onClick={saveSettings}
                          className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium"
                        >
                          💾 Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Actions Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Chat Actions</h3>
                  <button
                    onClick={clearChat}
                    className="w-full px-4 py-3 border-2 border-destructive text-destructive rounded-xl hover:bg-destructive/10 transition-all font-medium"
                  >
                    🗑️ Clear Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
