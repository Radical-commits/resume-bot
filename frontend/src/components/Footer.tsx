import { useTranslation } from 'react-i18next'
import { Mail, Linkedin, Github } from 'lucide-react'
import { useResumeData } from '../context/AppDataContext'

export const Footer = () => {
  const { t } = useTranslation()
  const resumeData = useResumeData()
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    {
      icon: Mail,
      label: t('footer.email'),
      href: `mailto:${resumeData.personalInfo.email}`,
    },
    {
      icon: Linkedin,
      label: t('footer.linkedin'),
      href: resumeData.personalInfo.linkedin,
    },
    {
      icon: Github,
      label: t('footer.github'),
      href: resumeData.personalInfo.github,
    },
  ]

  return (
    <footer id="contact" className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <h3 className="footer-title">{resumeData.personalInfo.name}</h3>
          <p className="footer-subtitle">{resumeData.personalInfo.title}</p>
          <div className="footer-links">
            {socialLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <a
                  key={index}
                  href={link.href}
                  className="footer-link"
                  target={link.icon !== Mail ? '_blank' : undefined}
                  rel={link.icon !== Mail ? 'noopener noreferrer' : undefined}
                  aria-label={link.label}
                >
                  <Icon size={20} />
                </a>
              )
            })}
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {currentYear} {resumeData.personalInfo.name}
          </p>
        </div>
      </div>
    </footer>
  )
}
