import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Briefcase } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { JobFitAssessment } from './JobFitAssessment'
import { useSiteConfig } from '../../context/AppDataContext'
import { chatAPI } from '../../services/api'
import { sessionService } from '../../services/session'
import { analytics } from '../../services/analytics'
import type { ChatMessage as ChatMessageType } from '../../types/chat'

interface ChatContainerProps {
  isOpen: boolean
  onClose: () => void
  initialView?: 'chat' | 'jobFit'
}

const MIN_WIDTH = 300
const MAX_WIDTH = 800
const MIN_HEIGHT = 400

const FONT_SIZES = ['sm', 'md', 'lg'] as const
type FontSize = (typeof FONT_SIZES)[number]
const FONT_SIZE_VALUES: Record<FontSize, string> = {
  sm: '0.75rem',
  md: '0.875rem',
  lg: '1rem',
}

function loadSavedSize() {
  try {
    const saved = localStorage.getItem('chat-panel-size')
    if (saved) return JSON.parse(saved) as { width: number; height: number }
  } catch {}
  return { width: 400, height: 600 }
}

function loadSavedFontSize(): FontSize {
  try {
    const saved = localStorage.getItem('chat-font-size')
    if (saved && FONT_SIZES.includes(saved as FontSize)) return saved as FontSize
  } catch {}
  return 'md'
}

export const ChatContainer = ({ isOpen, onClose, initialView = 'chat' }: ChatContainerProps) => {
  const { t, i18n } = useTranslation()
  const config = useSiteConfig()
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showJobFit, setShowJobFit] = useState(initialView === 'jobFit')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [size, setSize] = useState(loadSavedSize)
  const [isResizing, setIsResizing] = useState(false)
  const [fontSize, setFontSize] = useState<FontSize>(loadSavedFontSize)

  const changeFontSize = (dir: 'inc' | 'dec') => {
    setFontSize((prev) => {
      const idx = FONT_SIZES.indexOf(prev)
      const next = FONT_SIZES[dir === 'inc' ? idx + 1 : idx - 1]
      if (!next) return prev
      try { localStorage.setItem('chat-font-size', next) } catch {}
      return next
    })
  }
  const dragRef = useRef<{
    edge: 'top' | 'left' | 'corner'
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  const handleResizeStart = (edge: 'top' | 'left' | 'corner') => (e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    }
    setIsResizing(true)

    const maxHeight = Math.max(MIN_HEIGHT, Math.floor(window.innerHeight * 0.9))

    const onMouseMove = (ev: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const dx = drag.startX - ev.clientX
      const dy = drag.startY - ev.clientY
      setSize((prev) => {
        const newWidth =
          drag.edge === 'top'
            ? prev.width
            : Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, drag.startWidth + dx))
        const newHeight =
          drag.edge === 'left'
            ? prev.height
            : Math.min(maxHeight, Math.max(MIN_HEIGHT, drag.startHeight + dy))
        return { width: newWidth, height: newHeight }
      })
    }

    const onMouseUp = () => {
      dragRef.current = null
      setIsResizing(false)
      setSize((current) => {
        try {
          localStorage.setItem('chat-panel-size', JSON.stringify(current))
        } catch {}
        return current
      })
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Reset to initial view when dialog opens
  useEffect(() => {
    if (isOpen) {
      setShowJobFit(initialView === 'jobFit')
      analytics.chatOpen()
    }
  }, [isOpen, initialView])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessageType = {
        id: 'welcome',
        role: 'assistant',
        content: t('chat.welcome'),
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, t])

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    analytics.messageSent()
    setIsLoading(true)
    setError(null)

    try {
      const sessionId = sessionService.getOrCreateSessionId()
      const response = await chatAPI.sendMessage({
        message: content,
        sessionId,
        language: i18n.language,
      })

      const assistantMessage: ChatMessageType = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('chat.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="chat-fab"
            onClick={() => onClose()}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={t('chat.open')}
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={isResizing ? { duration: 0 } : { duration: 0.2 }}
            style={{ width: size.width, height: size.height, '--chat-font-size': FONT_SIZE_VALUES[fontSize] } as React.CSSProperties}
          >
            <div className="resize-handle-top" onMouseDown={handleResizeStart('top')} />
            <div className="resize-handle-left" onMouseDown={handleResizeStart('left')} />
            <div className="resize-handle-corner" onMouseDown={handleResizeStart('corner')} />
            <div className="chat-header">
              <div className="chat-header-content">
                <h3 className="chat-title">{t('chat.title')}</h3>
              </div>
              <div className="chat-header-actions">
                <button
                  className="chat-font-button"
                  onClick={() => changeFontSize('dec')}
                  disabled={fontSize === 'sm'}
                  aria-label="Decrease font size"
                  title="Decrease font size"
                >
                  A-
                </button>
                <button
                  className="chat-font-button"
                  onClick={() => changeFontSize('inc')}
                  disabled={fontSize === 'lg'}
                  aria-label="Increase font size"
                  title="Increase font size"
                >
                  A+
                </button>
                {config.features.enableJobFit && (
                  <button
                    className="chat-icon-button"
                    onClick={() => {
                      if (!showJobFit) analytics.featureButtonClick('job_fit_tab')
                      setShowJobFit(!showJobFit)
                    }}
                    aria-label={t('chat.jobFit.title')}
                    title={t('chat.jobFit.title')}
                  >
                    <Briefcase size={20} />
                  </button>
                )}
                <button
                  className="chat-icon-button"
                  onClick={onClose}
                  aria-label={t('chat.close')}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {showJobFit ? (
                <JobFitAssessment key="job-fit" onBack={() => setShowJobFit(false)} />
              ) : (
                <motion.div
                  key="chat"
                  className="chat-content-wrapper"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="chat-messages">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {isLoading && (
                      <div className="chat-message chat-message-assistant">
                        <TypingIndicator />
                      </div>
                    )}
                    {error && (
                      <div className="chat-error">
                        <p>{error}</p>
                        <button onClick={handleRetry} className="btn btn-sm">
                          {t('chat.errorRetry')}
                        </button>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="chat-input-wrapper">
                    <ChatInput onSend={handleSendMessage} disabled={isLoading} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
