import { Request, Response } from 'express'
import { loadConfig, loadResumeDataByLang, loadTranslations, loadTheme } from '../config/loader.js'

export const getBootstrap = async (req: Request, res: Response) => {
  try {
    const lang = typeof req.query.lang === 'string' ? req.query.lang : 'en'
    const config = loadConfig()
    const resume = loadResumeDataByLang(lang)
    const translations = loadTranslations(lang)
    const theme = loadTheme(config.theme)

    res.json({ config, resume, translations, theme })
  } catch (error) {
    console.error('Bootstrap error:', error)
    res.status(500).json({ error: 'Failed to load application data' })
  }
}
