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
      .replace(/`(.*?)`/g, '<code class="bg-green-500/20 text-green-300 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, "<br>")
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-green-500/10 border border-green-500/30 p-3 rounded-lg mt-2 mb-2 overflow-x-auto"><code class="text-green-300">$1</code></pre>',
      )
  }

  const quickActions = [
    { label: "👋 Say Hello", message: "Hello! How can you help me today?" },
    { label: "🔬 Explain Something", message: "Can you explain quantum computing in simple terms?" },
    { label: "✨ Be Creative", message: "Write a creative story about space exploration" },
    { label: "💻 Code Help", message: "Help me solve a coding problem" },
  ]

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* API Key Missing Banner */}
      {!apiKey && (
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-3 flex items-center justify-between border-b border-red-400/30">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
            <span className="font-medium">⚠️ API key not configured. Please set up your API key in settings.</span>
          </div>
          <button
            onClick={() => {
              setIsSettingsOpen(true)
              setIsApiConfigExpanded(true)
            }}
            className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-all hover-glow"
          >
            Configure Now
          </button>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="glass-dark border-b border-green-500/30 flex items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center animate-glow">
            <svg className="h-6 w-6 text-black font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">AI CHAT TERMINAL</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${apiKey ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></div>
              <span className="text-xs text-green-400 font-mono">{apiKey ? "● CONNECTED" : "● DISCONNECTED"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Message Counter */}
          {messages.length > 0 && (
            <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 font-mono">
              {messages.length} MSG{messages.length !== 1 ? "S" : ""}
            </div>
          )}
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-all hover-glow neon-border"
          >
            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="flex-1 overflow-y-auto relative cyber-grid"
        style={{
          background: "radial-gradient(circle at center, rgba(34, 197, 94, 0.05) 0%, transparent 70%)",
        }}
      >
        <div className="relative z-10 p-4 space-y-4 min-h-full">
          {messages.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-glow">
                <svg className="h-10 w-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  ></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold gradient-text mb-3">WELCOME TO AI TERMINAL</h2>
              <p className="text-green-300 mb-6 font-mono">Your advanced AI conversation interface</p>
              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <span className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 font-mono">
                  🤖 NEURAL NETWORK
                </span>
                <span className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 font-mono">
                  ⚡ QUANTUM SPEED
                </span>
                <span className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 font-mono">
                  🔒 ENCRYPTED
                </span>
              </div>
              <p className="text-xs text-green-500 mt-6 font-mono animate-pulse">
                &gt; CONFIGURE API KEY TO INITIALIZE SYSTEM
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-lg relative ${
                    message.role === "user" ? "bg-message-user rounded-br-md" : "bg-message-assistant rounded-bl-md"
                  }`}
                >
                  <div
                    className={`${message.role === "user" ? "text-white" : "text-white"} font-medium`}
                    dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                  />
                  <div
                    className={`text-xs mt-3 opacity-70 font-mono ${
                      message.role === "user" ? "text-right text-green-200" : "text-left text-green-400"
                    }`}
                  >
                    {message.role === "user" ? "USER" : "AI"} •{" "}
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-message-assistant rounded-2xl rounded-bl-md p-4 max-w-[85%] shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-green-400 font-mono">AI PROCESSING...</span>
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
          className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 text-black rounded-full shadow-lg hover:scale-110 transition-all z-40 animate-glow hover-glow"
        >
          <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </button>
      )}

      {/* Enhanced Error Display */}
      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-300 font-mono">SYSTEM ERROR</h4>
              <p className="text-sm text-red-400 mt-1 font-mono">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 text-sm transition-all font-mono"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Input Area */}
      <div className="glass-dark border-t border-green-500/30 p-4 flex-shrink-0">
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
              placeholder={apiKey ? "> Enter command..." : "> Configure API key in settings..."}
              className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none text-base max-h-32 min-h-[48px] bg-black/50 border-2 border-green-500/30 focus:border-green-400 text-white placeholder-green-500/50 font-mono backdrop-blur-sm"
              rows={1}
              disabled={!apiKey || isLoading}
            />
            {input.length > 0 && (
              <div className="absolute bottom-1 right-3 text-xs text-green-500 font-mono">{input.length}/1000</div>
            )}
          </div>
          <button
            type="submit"
            disabled={!apiKey || isLoading || !input.trim()}
            className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 text-black rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all animate-glow hover-glow"
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
                className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-sm whitespace-nowrap hover:bg-green-500/30 transition-all font-mono hover-glow"
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={() => setIsSettingsOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 dark-card border-t border-green-500/30 z-50">
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold gradient-text font-mono">SYSTEM SETTINGS</h2>
                  <p className="text-sm text-green-400 font-mono">Configure AI terminal parameters</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-green-500/10 rounded-xl transition-all border border-green-500/30 hover-glow"
                >
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* API Configuration Section */}
                <div className="border border-green-500/30 rounded-xl overflow-hidden bg-black/30 backdrop-blur-sm">
                  {/* Collapsible Header */}
                  <div
                    onClick={() => {
                      setIsApiConfigExpanded(!isApiConfigExpanded)
                      localStorage.setItem("apiConfigExpanded", (!isApiConfigExpanded).toString())
                    }}
                    className="flex items-center justify-between p-4 bg-green-500/10 cursor-pointer hover:bg-green-500/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          ></path>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white font-mono">API CONFIGURATION</h3>
                        <p className="text-sm text-green-400 font-mono">Neural network connection settings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${apiKey ? "bg-green-400" : "bg-red-400"}`}></div>
                      <svg
                        className={`h-5 w-5 text-green-400 transition-transform ${isApiConfigExpanded ? "rotate-180" : ""}`}
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
                    <div className="p-4 space-y-4 border-t border-green-500/30 animate-slide-down">
                      <div>
                        <label className="block text-sm font-bold mb-2 text-green-400 font-mono">API PROVIDER</label>
                        <select
                          value={selectedAPI}
                          onChange={(e) => setSelectedAPI(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-base bg-black/50 border-2 border-green-500/30 focus:border-green-400 focus:outline-none text-white font-mono"
                        >
                          <option value="groq">🚀 GROQ (FAST & FREE)</option>
                          <option value="openai">🤖 OPENAI (GPT MODELS)</option>
                          <option value="custom">⚙️ CUSTOM API</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-green-400 font-mono">API KEY</label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter neural network access key..."
                          className="w-full px-4 py-3 rounded-xl text-base bg-black/50 border-2 border-green-500/30 focus:border-green-400 focus:outline-none text-white font-mono placeholder-green-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-green-400 font-mono">
                          API URL (OPTIONAL)
                        </label>
                        <input
                          type="url"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          placeholder="https://api.groq.com/openai/v1/chat/completions"
                          className="w-full px-4 py-3 rounded-xl text-base bg-black/50 border-2 border-green-500/30 focus:border-green-400 focus:outline-none text-white font-mono placeholder-green-500/50"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={testConnection}
                          className="flex-1 px-4 py-3 border-2 border-green-500/30 rounded-xl hover:bg-green-500/10 transition-all font-bold font-mono text-green-400 hover-glow"
                        >
                          🔗 TEST CONNECTION
                        </button>
                        <button
                          onClick={saveSettings}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 text-black rounded-xl hover:from-green-500 hover:to-green-700 transition-all font-bold font-mono hover-glow"
                        >
                          💾 SAVE CONFIG
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Actions Section */}
                <div className="space-y-3">
                  <h3 className="font-bold text-white font-mono">TERMINAL ACTIONS</h3>
                  <button
                    onClick={clearChat}
                    className="w-full px-4 py-3 border-2 border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-all font-bold font-mono hover-glow"
                  >
                    🗑️ CLEAR TERMINAL
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
