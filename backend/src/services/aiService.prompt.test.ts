import { vi, describe, it, expect } from 'vitest'

// Mock OpenAI client so the AIService constructor doesn't require a real key
vi.mock('openai', () => ({ default: class OpenAIMock {} }))

// Mock config loader to avoid file-system reads in unit tests
vi.mock('../config/loader.js', () => ({
  getAIConfig: () => ({ provider: 'groq', model: 'test', temperature: 0.7, maxTokens: 1024 }),
  getSiteInfo: () => ({ candidateName: 'Sarah Chen', candidateTitle: 'Senior PM', language: 'en' }),
}))

import { AIService } from './aiService.js'

const DUMMY_RESUME = 'Test resume context.'
const { general, jobAssessment } = AIService.getSystemPrompts(DUMMY_RESUME)

describe('System prompt guardrails — text content', () => {
  describe('general prompt', () => {
    it('narrows the assistant identity to the resume exclusively', () => {
      expect(general).toMatch(/exclusively|strictly limited|no other (role|purpose|capability)/i)
    })

    it('explicitly instructs the model to refuse off-topic requests', () => {
      expect(general).toMatch(/\brefuse\b|\bdecline\b|\bmust refuse\b|\bmust decline\b/i)
    })

    it('lists code-writing as a prohibited task', () => {
      expect(general.toLowerCase()).toContain('code')
    })

    it('lists math as a prohibited task', () => {
      expect(general.toLowerCase()).toContain('math')
    })

    it('lists general knowledge questions as prohibited', () => {
      expect(general.toLowerCase()).toMatch(/general knowledge|trivia/)
    })

    it('provides a specific redirect message for refusals', () => {
      expect(general).toMatch(/professional background/i)
    })

    it('prohibits partial engagement before redirecting', () => {
      expect(general).toMatch(/do not engage|not engage|without engaging/i)
    })
  })

  describe('jobAssessment prompt', () => {
    it('narrows the assistant identity to the resume exclusively', () => {
      expect(jobAssessment).toMatch(/exclusively|strictly limited|no other (role|purpose|capability)/i)
    })

    it('explicitly instructs the model to refuse off-topic requests', () => {
      expect(jobAssessment).toMatch(/\brefuse\b|\bdecline\b|\bmust refuse\b|\bmust decline\b/i)
    })
  })
})
