import apiClient from './api'
import { sessionService } from './session'

function track(eventType: string, opts: Record<string, unknown> = {}): void {
  const sessionId = sessionService.getOrCreateSessionId()
  apiClient.post('/api/analytics/event', { sessionId, eventType, ...opts })
    .catch(() => {})
}

export const analytics = {
  sessionStart:       ()               => track('session_start'),
  sectionView:        (section: string)  => track('section_view', { extra: { section } }),
  chatOpen:           ()               => track('chat_open'),
  messageSent:        ()               => track('message_sent'),
  jobFitUsed:         ()               => track('job_fit_used'),
  languageSwitched:   (language: string) => track('language_switched', { language }),
  featureButtonClick: (button: string)   => track('feature_button_click', { extra: { button } }),
}
