import { useEffect } from 'react'
import type { SiteConfig } from '../config/loader'

interface ThemeData {
  colors: {
    primary: string
    primaryHover: string
    accent: string
    background: string
    backgroundSecondary: string
    text: string
    textSecondary: string
    border: string
    success: string
    warning: string
    error: string
  }
  fonts: {
    heading: string
    body: string
    mono: string
  }
  borderRadius: {
    small: string
    medium: string
    large: string
  }
}

export const useTheme = (themeData: Record<string, any> | null, branding?: SiteConfig['branding']) => {
  useEffect(() => {
    if (!themeData) return

    const theme = themeData as ThemeData
    const root = document.documentElement

    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-primary-dark', theme.colors.primaryHover)
    root.style.setProperty('--color-primary-light', theme.colors.accent)
    root.style.setProperty('--color-bg-primary', theme.colors.background)
    root.style.setProperty('--color-bg-secondary', theme.colors.backgroundSecondary)
    root.style.setProperty('--color-text-primary', theme.colors.text)
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--color-text-tertiary', theme.colors.textSecondary)
    root.style.setProperty('--color-border', theme.colors.border)
    root.style.setProperty('--color-success', theme.colors.success)
    root.style.setProperty('--color-warning', theme.colors.warning)
    root.style.setProperty('--color-error', theme.colors.error)
    root.style.setProperty('--font-serif', theme.fonts.heading)
    root.style.setProperty('--font-sans', theme.fonts.body)
    root.style.setProperty('--font-mono', theme.fonts.mono)
    root.style.setProperty('--radius-base', theme.borderRadius.small)
    root.style.setProperty('--radius-md', theme.borderRadius.medium)
    root.style.setProperty('--radius-lg', theme.borderRadius.large)

    if (branding) {
      if (branding.primaryColor) root.style.setProperty('--color-primary', branding.primaryColor)
      if (branding.accentColor) {
        root.style.setProperty('--color-primary-dark', branding.accentColor)
        root.style.setProperty('--color-primary-light', branding.accentColor)
      }
      if (branding.backgroundColor) root.style.setProperty('--color-bg-primary', branding.backgroundColor)
      if (branding.textColor) root.style.setProperty('--color-text-primary', branding.textColor)
      if (branding.fontFamily) root.style.setProperty('--font-sans', branding.fontFamily)
    }
  }, [themeData, branding])
}
