import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(() => {
  // loadEnv reads .env (and .env.local etc.) at config-evaluation time,
  // so the real GROQ_API_KEY is available before we build the env object.
  const env = loadEnv('test', process.cwd(), '')

  return {
    test: {
      environment: 'node',
      env: {
        // Use the real key if present; fall back to a dummy so the AIService
        // constructor doesn't throw during unit tests that mock OpenAI.
        AI_API_KEY: env.AI_API_KEY || env.GROQ_API_KEY || 'test-dummy-key',
        GROQ_API_KEY: env.GROQ_API_KEY || '',
      },
    },
  }
})
