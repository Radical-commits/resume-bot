export interface SiteConfig {
  site: {
    domain: string
    language: string
    ogImage: string
    favicon: string
  }
  theme: string
  features: {
    enableChat: boolean
    enableJobFit: boolean
    enableMultilingual: boolean
  }
  branding: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
    fontFamily: string
  }
  languages: {
    default: string
    supported: string[]
  }
  ai: {
    provider: string
    model: string
    temperature: number
    maxTokens: number
  }
}

export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001'
}
