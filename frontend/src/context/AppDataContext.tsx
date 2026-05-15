import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import i18n from '../i18n/config'
import { appAPI } from '../services/api'
import type { Resume } from '../types/resume'
import type { SiteConfig } from '../config/loader'

export interface BootstrapData {
  config: SiteConfig
  resume: Resume
  translations: Record<string, any>
  theme: Record<string, any>
}

interface AppDataContextValue {
  data: BootstrapData | null
  isLoading: boolean
  error: string | null
  switchLanguage: (lang: string) => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BootstrapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBootstrap = useCallback(async (lang: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result: BootstrapData = await appAPI.bootstrap(lang)
      i18n.addResourceBundle(lang, 'translation', result.translations, true, true)
      await i18n.changeLanguage(lang)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialLang = localStorage.getItem('preferred_language') || 'en'
    loadBootstrap(initialLang)
  }, [loadBootstrap])

  const switchLanguage = useCallback(async (lang: string) => {
    localStorage.setItem('preferred_language', lang)
    await loadBootstrap(lang)
  }, [loadBootstrap])

  return (
    <AppDataContext.Provider value={{ data, isLoading, error, switchLanguage }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}

export function useResumeData(): Resume {
  const { data } = useAppData()
  if (!data) throw new Error('useResumeData called before bootstrap data is available')
  return data.resume
}

export function useSiteConfig(): SiteConfig {
  const { data } = useAppData()
  if (!data) throw new Error('useSiteConfig called before bootstrap data is available')
  return data.config
}
