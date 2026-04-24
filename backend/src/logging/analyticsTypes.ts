export type AnalyticsEventType =
  | 'session_start'
  | 'section_view'
  | 'chat_open'
  | 'message_sent'
  | 'job_fit_used'
  | 'language_switched'
  | 'feature_button_click'

export interface AnalyticsEvent {
  ts: number
  sessionId: string
  eventType: AnalyticsEventType
  section?: string
  language?: string
  extra?: Record<string, unknown>
}
