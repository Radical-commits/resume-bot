import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { motion } from 'framer-motion'

export const Header = () => {
  const { t } = useTranslation()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const navItems = [
    { key: 'about', id: 'about' },
    { key: 'experience', id: 'experience' },
    { key: 'skills', id: 'skills' },
    { key: 'education', id: 'education' },
    { key: 'contact', id: 'contact' },
  ]

  return (
    <motion.header
      className="header"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container">
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => scrollToSection(item.id)}
              className="nav-link"
            >
              {t(`nav.${item.key}`)}
            </button>
          ))}
        </nav>
        <LanguageSwitcher />
      </div>
    </motion.header>
  )
}
