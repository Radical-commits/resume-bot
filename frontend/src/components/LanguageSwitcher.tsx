import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useAppData, useSiteConfig } from '../context/AppDataContext'
import { analytics } from '../services/analytics'

const languageNames: Record<string, string> = {
  en: 'EN', ru: 'RU', es: 'ES', fr: 'FR', de: 'DE',
  pt: 'PT', zh: '中文', ja: '日本語', ko: '한국어'
}

const languageLabels: Record<string, string> = {
  en: 'Switch to English', ru: 'Switch to Russian', es: 'Switch to Spanish',
  fr: 'Switch to French', de: 'Switch to German', pt: 'Switch to Portuguese',
  zh: 'Switch to Chinese', ja: 'Switch to Japanese', ko: 'Switch to Korean'
}

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  const { switchLanguage } = useAppData()
  const config = useSiteConfig()

  const supported = config.languages?.supported ?? []

  if (!config.features.enableMultilingual) return null
  if (supported.length <= 1) return null

  const handleSwitch = async (lang: string) => {
    if (i18n.language === lang) return
    analytics.languageSwitched(lang)
    await switchLanguage(lang)
  }

  return (
    <div className="language-switcher">
      <Globe size={18} />
      {supported.map((lang, index) => (
        <Fragment key={lang}>
          {index > 0 && <span className="language-separator">|</span>}
          <button
            className={`language-option ${i18n.language === lang ? 'language-option-active' : ''}`}
            onClick={() => handleSwitch(lang)}
            aria-label={languageLabels[lang] || `Switch to ${lang}`}
            aria-current={i18n.language === lang ? 'true' : 'false'}
          >
            {languageNames[lang] || lang.toUpperCase()}
          </button>
        </Fragment>
      ))}
    </div>
  )
}
