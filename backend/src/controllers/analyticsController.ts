import { Request, Response } from 'express'
import { logAnalyticsEvent } from '../logging/analyticsLogger.js'
import type { AnalyticsEventType } from '../logging/analyticsTypes.js'

const VALID_EVENT_TYPES: Set<AnalyticsEventType> = new Set([
  'session_start',
  'section_view',
  'chat_open',
  'message_sent',
  'job_fit_used',
  'language_switched',
  'feature_button_click',
])

const SESSION_ID_RE = /^session_\d+_[a-z0-9]+$/

export const handleAnalyticsEvent = (req: Request, res: Response): void => {
  try {
    const { sessionId, eventType, section, language, extra } = req.body

    if (
      typeof sessionId !== 'string' ||
      sessionId.length > 64 ||
      !SESSION_ID_RE.test(sessionId)
    ) {
      res.status(204).end()
      return
    }

    if (!VALID_EVENT_TYPES.has(eventType as AnalyticsEventType)) {
      res.status(204).end()
      return
    }

    let safeExtra: Record<string, unknown> | undefined
    if (extra !== undefined) {
      if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) {
        res.status(204).end()
        return
      }
      for (const val of Object.values(extra as Record<string, unknown>)) {
        if (JSON.stringify(val).length > 128) {
          res.status(204).end()
          return
        }
      }
      safeExtra = extra as Record<string, unknown>
    }

    logAnalyticsEvent({
      ts: Date.now(),
      sessionId,
      eventType: eventType as AnalyticsEventType,
      section: typeof section === 'string' ? section : undefined,
      language: typeof language === 'string' ? language : undefined,
      extra: safeExtra,
    })
  } catch {
    // intentionally swallowed — analytics must never affect UX
  }

  res.status(204).end()
}
