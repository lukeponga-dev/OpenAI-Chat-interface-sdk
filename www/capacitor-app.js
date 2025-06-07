// Import Capacitor plugins
import { Capacitor } from "@capacitor/core"
import { StatusBar } from "@capacitor/status-bar"
import { Keyboard } from "@capacitor/keyboard"
import { Haptics, ImpactStyle } from "@capacitor/haptics"
import { Network } from "@capacitor/network"
import { Share } from "@capacitor/share"

export class CapacitorApp {
  constructor() {
    this.messages = []
    this.isLoading = false
    this.apiKey = localStorage.getItem("apiKey") || ""
    this.apiUrl = localStorage.getItem("apiUrl") || "https://api.groq.com/openai/v1/chat/completions"
    this.selectedAPI = localStorage.getItem("selectedAPI") || "groq"
    this.isSettingsOpen = false
    this.autoScroll = true
    this.lastScrollTop = 0
    this.reactions = JSON.parse(localStorage.getItem("messageReactions")) || {}
    this.availableReactions = ["👍", "👎", "❤️", "😂", "😢", "😮", "🔥", "👏", "🎉", "🤔", "💯", "⚡"]
    this.currentReactionPicker = null

    this.initializeCapacitor()
    this.initializeElements()
    this.setupEventListeners()
    this.loadSettings()
    this.initializeTheme()
    this.setupNetworkMonitoring()
    this.setupKeyboardHandling()
    this.setupScrollHandling()
    this.setupTextareaAutoResize()
    this.checkApiKeyStatus() // Add this line to check API key on startup
  }

  // Add this method to check API key status
  checkApiKeyStatus() {
    const apiKeyBanner = document.getElementById("api-key-banner")
    if (!this.apiKey) {
      apiKeyBanner.classList.remove("hidden")
    } else {
      apiKeyBanner.classList.add("hidden")
    }
  }

  initializeElements() {
    this.messagesContainer = document.getElementById("messages")
    this.chatContainer = document.getElementById("chat-container")
    this.messageInput = document.getElementById("message-input")
    this.sendButton = document.getElementById("send-button")
    this.sendIcon = document.getElementById("send-icon")
    this.loadingIcon = document.getElementById("loading-indicator")
    this.errorContainer = document.getElementById("error-container")
    this.errorMessage = document.getElementById("error-message")
    this.retryButton = document.getElementById("retry-button")
    this.apiKeyInput = document.getElementById("api-key")
    this.apiUrlInput = document.getElementById("api-url")
    this.apiSelector = document.getElementById("api-selector")
    this.themeToggle = document.getElementById("theme-toggle")
    this.sunIcon = document.getElementById("sun-icon")
    this.moonIcon = document.getElementById("moon-icon")
    this.settingsPanel = document.getElementById("settings-panel")
    this.settingsOverlay = document.getElementById("settings-overlay")
    this.settingsToggle = document.getElementById("settings-toggle")
    this.settingsClose = document.getElementById("settings-close")
    this.networkStatus = document.getElementById("network-status")
    this.connectionStatus = document.getElementById("connection-status")
    this.shareButton = document.getElementById("share-chat")
    this.exportButton = document.getElementById("export-chat")
    this.scrollToBottomBtn = document.getElementById("scroll-to-bottom")
    this.messageCounter = document.getElementById("message-counter")
    this.charCounter = document.getElementById("char-counter")
    this.quickActions = document.getElementById("quick-actions")
    this.toggleKeyVisibility = document.getElementById("toggle-key-visibility")
    this.eyeIcon = document.getElementById("eye-icon")
    this.eyeOffIcon = document.getElementById("eye-off-icon")
    this.reactionOverlay = document.getElementById("reaction-overlay")
    this.apiKeyBanner = document.getElementById("api-key-banner")
    this.openSettingsBtn = document.getElementById("open-settings-btn")
  }

  setupEventListeners() {
    // Chat form
    document.getElementById("chat-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.sendMessage()
    })

    // Settings
    document.getElementById("save-settings").addEventListener("click", () => {
      this.saveSettings()
    })

    document.getElementById("test-connection").addEventListener("click", () => {
      this.testConnection()
    })

    document.getElementById("clear-chat").addEventListener("click", () => {
      this.clearChat()
    })

    this.retryButton.addEventListener("click", () => {
      this.hideError()
      this.sendMessage()
    })

    this.themeToggle.addEventListener("click", () => {
      this.toggleTheme()
    })

    this.apiSelector.addEventListener("change", (e) => {
      this.selectedAPI = e.target.value
      this.updateAPIDefaults()
    })

    // Settings panel
    this.settingsToggle.addEventListener("click", () => {
      this.openSettings()
    })

    this.settingsClose.addEventListener("click", () => {
      this.closeSettings()
    })

    this.settingsOverlay.addEventListener("click", () => {
      this.closeSettings()
    })

    // API Key banner
    this.openSettingsBtn.addEventListener("click", () => {
      this.openSettings()
    })

    // Share and export
    this.shareButton.addEventListener("click", () => {
      this.shareChat()
    })

    this.exportButton.addEventListener("click", () => {
      this.exportChat()
    })

    // Scroll to bottom
    this.scrollToBottomBtn.addEventListener("click", () => {
      this.scrollToBottom(true)
    })

    // Quick actions
    document.querySelectorAll(".quick-action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const message = e.target.dataset.message
        this.messageInput.value = message
        this.messageInput.focus()
        this.updateCharCounter()
      })
    })

    // Key visibility toggle
    this.toggleKeyVisibility.addEventListener("click", () => {
      this.toggleApiKeyVisibility()
    })

    // Reaction overlay
    this.reactionOverlay.addEventListener("click", () => {
      this.hideReactionPicker()
    })

    // Document click to hide reaction picker
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".reaction-picker") && !e.target.closest(".add-reaction-btn")) {
        this.hideReactionPicker()
      }
    })

    // Touch feedback for all buttons
    document.querySelectorAll(".touch-feedback").forEach((button) => {
      button.addEventListener("touchstart", () => {
        this.hapticFeedback()
      })
    })

    // Input character counter
    this.messageInput.addEventListener("input", () => {
      this.updateCharCounter()
    })

    // Enter key handling
    this.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })
  }

  setupScrollHandling() {
    this.chatContainer.addEventListener("scroll", () => {
      const { scrollTop, scrollHeight, clientHeight } = this.chatContainer
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

      // Show/hide scroll to bottom button
      if (isNearBottom) {
        this.scrollToBottomBtn.classList.add("hidden")
        this.autoScroll = true
      } else {
        this.scrollToBottomBtn.classList.remove("hidden")
        this.autoScroll = false
      }

      this.lastScrollTop = scrollTop
    })
  }

  setupTextareaAutoResize() {
    this.messageInput.addEventListener("input", () => {
      this.messageInput.style.height = "auto"
      this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 128) + "px"
    })
  }

  updateCharCounter() {
    const length = this.messageInput.value.length
    this.charCounter.textContent = `${length}/1000`

    if (length > 0) {
      this.charCounter.classList.remove("hidden")
    } else {
      this.charCounter.classList.add("hidden")
    }

    if (length > 900) {
      this.charCounter.classList.add("text-destructive")
    } else {
      this.charCounter.classList.remove("text-destructive")
    }
  }

  toggleApiKeyVisibility() {
    const isPassword = this.apiKeyInput.type === "password"
    this.apiKeyInput.type = isPassword ? "text" : "password"

    if (isPassword) {
      this.eyeIcon.classList.add("hidden")
      this.eyeOffIcon.classList.remove("hidden")
    } else {
      this.eyeIcon.classList.remove("hidden")
      this.eyeOffIcon.classList.add("hidden")
    }
  }

  async setupNetworkMonitoring() {
    if (Capacitor.isNativePlatform()) {
      const status = await Network.getStatus()
      this.updateNetworkStatus(status.connected)

      Network.addListener("networkStatusChange", (status) => {
        this.updateNetworkStatus(status.connected)
      })
    } else {
      window.addEventListener("online", () => this.updateNetworkStatus(true))
      window.addEventListener("offline", () => this.updateNetworkStatus(false))
      this.updateNetworkStatus(navigator.onLine)
    }
  }

  updateNetworkStatus(isOnline) {
    if (isOnline) {
      this.networkStatus.classList.add("hidden")
      this.connectionStatus.className = "w-2 h-2 bg-green-500 rounded-full animate-pulse-slow"
      this.connectionStatus.parentElement.querySelector("span").textContent = "Connected"
    } else {
      this.networkStatus.classList.remove("hidden")
      this.connectionStatus.className = "w-2 h-2 bg-red-500 rounded-full"
      this.connectionStatus.parentElement.querySelector("span").textContent = "Offline"
      this.showError("No internet connection")
    }
  }

  setupKeyboardHandling() {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", (info) => {
        document.getElementById("app").style.height = `calc(100vh - ${info.keyboardHeight}px)`
        setTimeout(() => this.scrollToBottom(true), 100)
      })

      Keyboard.addListener("keyboardWillHide", () => {
        document.getElementById("app").style.height = "100vh"
      })
    }
  }

  async hapticFeedback() {
    if (this.hapticsEnabled && Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light })
      } catch (error) {
        console.log("Haptics not available")
      }
    }
  }

  openSettings() {
    this.isSettingsOpen = true
    this.settingsPanel.classList.remove("translate-y-full")
    this.settingsOverlay.classList.remove("hidden")
    document.body.style.overflow = "hidden"
  }

  closeSettings() {
    this.isSettingsOpen = false
    this.settingsPanel.classList.add("translate-y-full")
    this.settingsOverlay.classList.add("hidden")
    document.body.style.overflow = ""
  }

  async shareChat() {
    if (this.messages.length === 0) {
      this.showError("No messages to share")
      return
    }

    const chatText = this.formatChatForExport()

    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: "AI Chat Conversation",
          text: chatText,
        })
      } catch (error) {
        console.error("Share failed:", error)
      }
    } else {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "AI Chat Conversation",
            text: chatText,
          })
        } catch (error) {
          this.fallbackShare(chatText)
        }
      } else {
        this.fallbackShare(chatText)
      }
    }
  }

  async exportChat() {
    if (this.messages.length === 0) {
      this.showError("No messages to export")
      return
    }

    const chatText = this.formatChatForExport()
    const blob = new Blob([chatText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `ai-chat-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    this.showSuccess("Chat exported successfully!")
  }

  formatChatForExport() {
    const timestamp = new Date().toLocaleString()
    let chatText = `AI Chat Conversation\nExported: ${timestamp}\n${"=".repeat(50)}\n\n`

    this.messages.forEach((msg, index) => {
      const role = msg.role === "user" ? "You" : "AI Assistant"
      const time = new Date().toLocaleTimeString()
      chatText += `[${time}] ${role}:\n${msg.content}\n\n`
    })

    return chatText
  }

  fallbackShare(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.showSuccess("Chat copied to clipboard!")
      })
      .catch(() => {
        this.showError("Unable to share chat")
      })
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark")
      this.sunIcon.classList.add("hidden")
      this.moonIcon.classList.remove("hidden")

      if (Capacitor.isNativePlatform()) {
        StatusBar.setStyle({ style: "dark" })
      }
    }
  }

  async toggleTheme() {
    const isDark = document.documentElement.classList.contains("dark")

    if (isDark) {
      document.documentElement.classList.remove("dark")
      this.sunIcon.classList.remove("hidden")
      this.moonIcon.classList.add("hidden")
      localStorage.setItem("theme", "light")

      if (Capacitor.isNativePlatform()) {
        await StatusBar.setStyle({ style: "default" })
      }
    } else {
      document.documentElement.classList.add("dark")
      this.sunIcon.classList.add("hidden")
      this.moonIcon.classList.remove("hidden")
      localStorage.setItem("theme", "dark")

      if (Capacitor.isNativePlatform()) {
        await StatusBar.setStyle({ style: "dark" })
      }
    }

    await this.hapticFeedback()
  }

  updateAPIDefaults() {
    const defaults = {
      groq: "https://api.groq.com/openai/v1/chat/completions",
      openai: "https://api.openai.com/v1/chat/completions",
      custom: "",
    }

    this.apiUrlInput.value = defaults[this.selectedAPI] || ""
    localStorage.setItem("selectedAPI", this.selectedAPI)
  }

  loadSettings() {
    this.apiKeyInput.value = this.apiKey
    this.apiUrlInput.value = this.apiUrl
    this.apiSelector.value = this.selectedAPI

    if (this.apiKey) {
      this.enableChat()
    }
  }

  async saveSettings() {
    this.apiKey = this.apiKeyInput.value.trim()
    this.apiUrl = this.apiUrlInput.value.trim() || this.getDefaultURL()

    localStorage.setItem("apiKey", this.apiKey)
    localStorage.setItem("apiUrl", this.apiUrl)

    if (this.apiKey) {
      this.enableChat()
      this.showSuccess("Settings saved successfully!")
      this.closeSettings()
      this.checkApiKeyStatus() // Add this line to update the banner
    } else {
      this.disableChat()
      this.showError("Please enter an API key")
    }

    await this.hapticFeedback()
  }

  getDefaultURL() {
    const defaults = {
      groq: "https://api.groq.com/openai/v1/chat/completions",
      openai: "https://api.openai.com/v1/chat/completions",
      custom: "",
    }
    return defaults[this.selectedAPI] || defaults.groq
  }

  enableChat() {
    this.messageInput.disabled = false
    this.sendButton.disabled = false
    this.messageInput.placeholder = "Type your message..."
    this.quickActions.classList.remove("hidden")
  }

  disableChat() {
    this.messageInput.disabled = true
    this.sendButton.disabled = true
    this.messageInput.placeholder = "Configure API key in settings..."
    this.quickActions.classList.add("hidden")
  }

  async testConnection() {
    if (!this.apiKey) {
      this.showError("Please enter an API key first")
      return
    }

    try {
      this.showLoading()
      const response = await this.makeAPICall([
        { role: "user", content: 'Hello! This is a test message. Please respond with "Connection successful!"' },
      ])

      this.hideLoading()
      this.showSuccess("Connection test successful! API key is working.")
      await this.hapticFeedback()
    } catch (error) {
      this.hideLoading()
      this.showError(`Connection test failed: ${error.message}`)
    }
  }

  async sendMessage() {
    const message = this.messageInput.value.trim()
    if (!message || this.isLoading || !this.apiKey || message.length > 1000) return

    this.addMessage("user", message)
    this.messageInput.value = ""
    this.messageInput.style.height = "auto"
    this.updateCharCounter()
    this.showLoading()
    this.hideError()
    await this.hapticFeedback()

    try {
      const response = await this.makeAPICall([...this.messages, { role: "user", content: message }])

      this.hideLoading()
      this.addMessage("assistant", response)
    } catch (error) {
      this.hideLoading()
      this.showError(error.message)
    }
  }

  async makeAPICall(messages) {
    if (!this.apiKey) {
      throw new Error("API key not configured. Please set up your API key in settings.")
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.selectedAPI === "groq" ? "llama-3.1-8b-instant" : "gpt-3.5-turbo",
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`

        // Check for common API key errors
        if (response.status === 401 || response.status === 403) {
          throw new Error("Invalid API key or authentication error. Please check your API key.")
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.")
        } else {
          throw new Error(errorMessage)
        }
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        throw new Error("Network error. Please check your internet connection.")
      }
      throw error
    }
  }

  addMessage(role, content) {
    this.messages.push({ role, content })

    const messageDiv = document.createElement("div")
    messageDiv.className = `flex ${role === "user" ? "justify-end" : "justify-start"} message-enter`

    const messageContent = document.createElement("div")
    messageContent.className = `message-bubble message-${role} max-w-[85%] rounded-2xl p-4 shadow-sm relative ${
      role === "user"
        ? "bg-primary text-primary-foreground rounded-br-md"
        : "bg-muted text-muted-foreground rounded-bl-md"
    }`

    // Create unique message ID
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    messageContent.dataset.messageId = messageId

    // Format message content
    const formattedContent = this.formatMessageContent(content)
    const contentDiv = document.createElement("div")
    contentDiv.innerHTML = formattedContent
    messageContent.appendChild(contentDiv)

    // Add timestamp
    const timestamp = document.createElement("div")
    timestamp.className = `text-xs mt-2 opacity-70 ${role === "user" ? "text-right" : "text-left"}`
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    messageContent.appendChild(timestamp)

    // Add reaction system for AI messages
    if (role === "assistant") {
      this.addReactionSystem(messageContent, messageId)
    }

    // Add message actions for AI messages
    if (role === "assistant") {
      this.addMessageActions(messageContent, content)
    }

    messageDiv.appendChild(messageContent)

    // Remove welcome message if it exists
    const welcomeMessage = this.messagesContainer.querySelector(".text-center")
    if (welcomeMessage) {
      welcomeMessage.remove()
    }

    this.messagesContainer.appendChild(messageDiv)
    this.updateMessageCounter()

    if (this.autoScroll) {
      this.scrollToBottom()
    }
  }

  formatMessageContent(content) {
    // Basic markdown-like formatting
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, "<br>")

    // Format code blocks
    formatted = formatted.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-black/10 dark:bg-white/10 p-3 rounded-lg mt-2 mb-2 overflow-x-auto"><code>$1</code></pre>',
    )

    return formatted
  }

  updateMessageCounter() {
    const count = this.messages.length
    if (count > 0) {
      this.messageCounter.textContent = `${count} message${count !== 1 ? "s" : ""}`
      this.messageCounter.classList.remove("hidden")
    } else {
      this.messageCounter.classList.add("hidden")
    }
  }

  showLoading() {
    this.isLoading = true
    this.loadingIndicator.classList.remove("hidden")
    this.sendIcon.classList.add("hidden")
    this.loadingIcon.classList.remove("hidden")
    this.sendButton.disabled = true

    if (this.autoScroll) {
      this.scrollToBottom()
    }
  }

  hideLoading() {
    this.isLoading = false
    this.loadingIndicator.classList.add("hidden")
    this.sendIcon.classList.remove("hidden")
    this.loadingIcon.classList.add("hidden")
    this.sendButton.disabled = !this.apiKey
  }

  showError(message) {
    this.errorMessage.textContent = message
    this.errorContainer.classList.remove("hidden")
  }

  hideError() {
    this.errorContainer.classList.add("hidden")
  }

  showSuccess(message) {
    const successDiv = document.createElement("div")
    successDiv.className =
      "fixed top-4 left-4 right-4 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg z-50 text-center animate-slide-up"
    successDiv.textContent = message
    document.body.appendChild(successDiv)

    setTimeout(() => {
      successDiv.style.transform = "translateY(-100%)"
      successDiv.style.opacity = "0"
      setTimeout(() => successDiv.remove(), 300)
    }, 3000)
  }

  async clearChat() {
    this.messages = []
    this.reactions = {}
    this.saveReactions()

    this.messagesContainer.innerHTML = `
      <div class="text-center py-12 animate-fade-in">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-bounce-gentle">
          <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-foreground mb-2">Welcome to AI Chat!</h2>
        <p class="text-muted-foreground mb-4">Your intelligent conversation partner</p>
        <div class="flex flex-wrap justify-center gap-2 text-sm">
          <span class="px-3 py-1 bg-muted rounded-full">💬 Natural conversations</span>
          <span class="px-3 py-1 bg-muted rounded-full">🚀 Fast responses</span>
          <span class="px-3 py-1 bg-muted rounded-full">🔒 Secure</span>
        </div>
        <p class="text-xs text-muted-foreground mt-4">Configure your API key in settings to get started</p>
      </div>
    `
    this.updateMessageCounter()
    await this.hapticFeedback()
  }

  scrollToBottom(force = false) {
    if (this.autoScroll || force) {
      setTimeout(() => {
        this.chatContainer.scrollTo({
          top: this.chatContainer.scrollHeight,
          behavior: force ? "auto" : "smooth",
        })
      }, 100)
    }
  }

  addReactionSystem(messageElement, messageId) {
    const reactionContainer = document.createElement("div")
    reactionContainer.className = "reaction-container"

    // Load existing reactions for this message
    const messageReactions = this.reactions[messageId] || {}

    // Display existing reactions
    this.updateReactionDisplay(reactionContainer, messageReactions, messageId)

    // Add reaction button
    const addReactionBtn = document.createElement("button")
    addReactionBtn.className = "add-reaction-btn touch-feedback"
    addReactionBtn.innerHTML = "+"
    addReactionBtn.title = "Add reaction"

    addReactionBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      this.showReactionPicker(addReactionBtn, messageId)
    })

    reactionContainer.appendChild(addReactionBtn)
    messageElement.appendChild(reactionContainer)
  }

  addMessageActions(messageElement, content) {
    const actionsDiv = document.createElement("div")
    actionsDiv.className = "message-actions"

    // Copy message button
    const copyBtn = document.createElement("button")
    copyBtn.className = "message-action-btn touch-feedback"
    copyBtn.innerHTML = "📋"
    copyBtn.title = "Copy message"
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(content)
        this.showSuccess("Message copied!")
        await this.hapticFeedback()
      } catch (error) {
        this.showError("Failed to copy message")
      }
    })

    // Regenerate response button
    const regenBtn = document.createElement("button")
    regenBtn.className = "message-action-btn touch-feedback"
    regenBtn.innerHTML = "🔄"
    regenBtn.title = "Regenerate response"
    regenBtn.addEventListener("click", async () => {
      if (this.messages.length >= 2) {
        // Remove the last AI response and regenerate
        this.messages.pop()
        messageElement.parentElement.remove()
        this.updateMessageCounter()
        await this.regenerateLastResponse()
      }
    })

    actionsDiv.appendChild(copyBtn)
    actionsDiv.appendChild(regenBtn)
    messageElement.appendChild(actionsDiv)
  }

  async regenerateLastResponse() {
    if (this.messages.length === 0 || this.isLoading || !this.apiKey) return

    this.showLoading()
    this.hideError()
    await this.hapticFeedback()

    try {
      const response = await this.makeAPICall(this.messages)
      this.hideLoading()
      this.addMessage("assistant", response)
    } catch (error) {
      this.hideLoading()
      this.showError(error.message)
    }
  }

  showReactionPicker(button, messageId) {
    this.hideReactionPicker()

    const picker = document.createElement("div")
    picker.className = "reaction-picker"

    this.availableReactions.forEach((emoji) => {
      const btn = document.createElement("button")
      btn.className = "reaction-picker-btn touch-feedback"
      btn.textContent = emoji
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.addReaction(messageId, emoji)
        this.hideReactionPicker()
      })
      picker.appendChild(btn)
    })

    // Position the picker
    const buttonRect = button.getBoundingClientRect()
    picker.style.position = "fixed"
    picker.style.bottom = `${window.innerHeight - buttonRect.top + 10}px`
    picker.style.left = `${buttonRect.left}px`

    // Adjust position if picker would go off screen
    document.body.appendChild(picker)
    const pickerRect = picker.getBoundingClientRect()
    if (pickerRect.right > window.innerWidth) {
      picker.style.left = `${window.innerWidth - pickerRect.width - 10}px`
    }
    if (pickerRect.left < 10) {
      picker.style.left = "10px"
    }

    this.currentReactionPicker = picker
    this.reactionOverlay.classList.remove("hidden")

    // Add entrance animation
    picker.style.transform = "scale(0.8) translateY(10px)"
    picker.style.opacity = "0"

    requestAnimationFrame(() => {
      picker.style.transition = "all 0.2s ease"
      picker.style.transform = "scale(1) translateY(0)"
      picker.style.opacity = "1"
    })
  }

  hideReactionPicker() {
    if (this.currentReactionPicker) {
      this.currentReactionPicker.style.transform = "scale(0.8) translateY(10px)"
      this.currentReactionPicker.style.opacity = "0"

      setTimeout(() => {
        if (this.currentReactionPicker) {
          this.currentReactionPicker.remove()
          this.currentReactionPicker = null
        }
      }, 200)
    }
    this.reactionOverlay.classList.add("hidden")
  }

  addReaction(messageId, emoji) {
    if (!this.reactions[messageId]) {
      this.reactions[messageId] = {}
    }

    if (!this.reactions[messageId][emoji]) {
      this.reactions[messageId][emoji] = 0
    }

    this.reactions[messageId][emoji]++
    this.saveReactions()
    this.updateMessageReactions(messageId)

    // Add haptic feedback
    this.hapticFeedback()

    // Show reaction animation
    this.showReactionAnimation(emoji)
  }

  removeReaction(messageId, emoji) {
    if (this.reactions[messageId] && this.reactions[messageId][emoji]) {
      this.reactions[messageId][emoji]--
      if (this.reactions[messageId][emoji] <= 0) {
        delete this.reactions[messageId][emoji]
      }
      if (Object.keys(this.reactions[messageId]).length === 0) {
        delete this.reactions[messageId]
      }
      this.saveReactions()
      this.updateMessageReactions(messageId)
      this.hapticFeedback()
    }
  }

  updateMessageReactions(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
    if (messageElement) {
      const reactionContainer = messageElement.querySelector(".reaction-container")
      if (reactionContainer) {
        const messageReactions = this.reactions[messageId] || {}

        // Clear existing reaction buttons (keep add button)
        const addBtn = reactionContainer.querySelector(".add-reaction-btn")
        reactionContainer.innerHTML = ""

        this.updateReactionDisplay(reactionContainer, messageReactions, messageId)
        reactionContainer.appendChild(addBtn)
      }
    }
  }

  updateReactionDisplay(container, reactions, messageId) {
    Object.entries(reactions).forEach(([emoji, count]) => {
      if (count > 0) {
        const reactionBtn = document.createElement("button")
        reactionBtn.className = "reaction-btn count touch-feedback reaction-animation"
        reactionBtn.innerHTML = `${emoji} ${count > 1 ? count : ""}`
        reactionBtn.title = `Remove ${emoji} reaction`

        reactionBtn.addEventListener("click", (e) => {
          e.stopPropagation()
          this.removeReaction(messageId, emoji)
        })

        container.appendChild(reactionBtn)

        // Remove animation class after animation completes
        setTimeout(() => {
          reactionBtn.classList.remove("reaction-animation")
        }, 300)
      }
    })
  }

  showReactionAnimation(emoji) {
    const animationDiv = document.createElement("div")
    animationDiv.style.position = "fixed"
    animationDiv.style.top = "50%"
    animationDiv.style.left = "50%"
    animationDiv.style.transform = "translate(-50%, -50%)"
    animationDiv.style.fontSize = "48px"
    animationDiv.style.zIndex = "1000"
    animationDiv.style.pointerEvents = "none"
    animationDiv.textContent = emoji
    animationDiv.style.animation = "reactionPop 0.6s ease-out"

    document.body.appendChild(animationDiv)

    setTimeout(() => {
      animationDiv.remove()
    }, 600)
  }

  saveReactions() {
    localStorage.setItem("messageReactions", JSON.stringify(this.reactions))
  }

  // Update the clearChat method to also clear reactions
  async clearChat() {
    this.messages = []
    this.reactions = {}
    this.saveReactions()

    this.messagesContainer.innerHTML = `
      <div class="text-center py-12 animate-fade-in">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-bounce-gentle">
          <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-foreground mb-2">Welcome to AI Chat!</h2>
        <p class="text-muted-foreground mb-4">Your intelligent conversation partner</p>
        <div class="flex flex-wrap justify-center gap-2 text-sm">
          <span class="px-3 py-1 bg-muted rounded-full">💬 Natural conversations</span>
          <span class="px-3 py-1 bg-muted rounded-full">🚀 Fast responses</span>
          <span class="px-3 py-1 bg-muted rounded-full">🔒 Secure</span>
        </div>
        <p class="text-xs text-muted-foreground mt-4">Configure your API key in settings to get started</p>
      </div>
    `
    this.updateMessageCounter()
    await this.hapticFeedback()
  }
}
