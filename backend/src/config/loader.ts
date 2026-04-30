/**
 * Configuration Loader for Backend
 * Loads site configuration and provides helper functions
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Type definitions
export interface SiteConfig {
  site: {
    domain: string
    language: string
  }
  theme: string
  features: {
    enableChat: boolean
    enableJobFit: boolean
    enableMultilingual: boolean
    enableResumePDF: boolean
  }
  ai: {
    provider: string
    model: string
    temperature: number
    maxTokens: number
  }
  deployment: {
    platform: string
    autoScale: boolean
    region: string
  }
}

let cachedConfig: SiteConfig | null = null

/**
 * Load configuration from config.json
 */
export function loadConfig(): SiteConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const configPath = path.join(__dirname, '../../../config.json')
  const configData = fs.readFileSync(configPath, 'utf-8')
  cachedConfig = JSON.parse(configData)
  return cachedConfig!
}

/**
 * Get AI provider configuration
 */
export function getAIConfig() {
  const config = loadConfig()
  return {
    provider: config.ai.provider || process.env.AI_PROVIDER || 'groq',
    model: config.ai.model || process.env.AI_MODEL || 'llama-3.3-70b-versatile',
    temperature: config.ai.temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: config.ai.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '1024')
  }
}

/**
 * Get site information for AI prompts
 */
export function getSiteInfo() {
  const resume = loadResumeData()
  const config = loadConfig()
  return {
    candidateName: resume.personalInfo.name,
    candidateTitle: resume.personalInfo.title,
    language: config.site.language
  }
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  const config = loadConfig()
  return (config.features as any)[feature] || false
}

/**
 * Get resume data path
 */
export function getResumeDataPath(): string {
  return path.join(__dirname, '../../../data/resume.json')
}

/**
 * Load resume data
 */
export function loadResumeData(): any {
  const resumePath = getResumeDataPath()
  const resumeData = fs.readFileSync(resumePath, 'utf-8')
  return JSON.parse(resumeData)
}

/**
 * Load resume data for a specific language, falling back to English
 */
export function loadResumeDataByLang(lang: string): any {
  if (!lang || lang === 'en') {
    return loadResumeData()
  }
  const langPath = path.join(__dirname, `../../../data/resume.${lang}.json`)
  if (fs.existsSync(langPath)) {
    return JSON.parse(fs.readFileSync(langPath, 'utf-8'))
  }
  console.warn(`No resume found for language '${lang}', falling back to English`)
  return loadResumeData()
}

/**
 * Load translations for a specific language from translations.json
 */
export function loadTranslations(lang: string): any {
  const translationsPath = path.join(__dirname, '../../../data/translations.json')
  const all = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'))
  return all[lang] ?? all['en']
}

/**
 * Load a theme file by name
 */
export function loadTheme(name: string): any {
  const themePath = path.join(__dirname, `../../../themes/${name}.json`)
  if (!fs.existsSync(themePath)) {
    throw new Error(`Theme '${name}' not found at ${themePath}`)
  }
  return JSON.parse(fs.readFileSync(themePath, 'utf-8'))
}
