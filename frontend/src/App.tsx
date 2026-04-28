import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Experience } from './components/Experience'
import { Skills } from './components/Skills'
import { Education } from './components/Education'
import { Footer } from './components/Footer'
import { ChatContainer } from './components/Chat/ChatContainer'
import { getSiteConfig, getResumeData } from './config/loader'
import { useTheme } from './hooks/useTheme'
import { analytics } from './services/analytics'
import { sessionService } from './services/session'

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInitialView, setChatInitialView] = useState<'chat' | 'jobFit'>('chat')

  // Load and apply theme from configuration
  useTheme()

  useEffect(() => {
    if (sessionService.isNewVisitor()) {
      sessionService.getOrCreateSessionId()
      analytics.sessionStart()
    } else {
      sessionService.getOrCreateSessionId()
    }
  }, [])

  useEffect(() => {
    const observed = new Set<string>()
    const sectionIds = ['about', 'experience', 'skills', 'education']

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id
          if (entry.isIntersecting && !observed.has(id)) {
            observed.add(id)
            analytics.sectionView(id)
          }
        })
      },
      { threshold: 0.3 }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Update document title and meta tags based on configuration
  useEffect(() => {
    const config = getSiteConfig()
    const resume = getResumeData()

    // Update document title
    const fullTitle = `${resume.personalInfo.name} - ${resume.personalInfo.title}`
    document.title = fullTitle

    // Update meta tags
    const updateMetaTag = (selector: string, content: string) => {
      const element = document.querySelector(selector)
      if (element) {
        element.setAttribute('content', content)
      }
    }

    const description = resume.summary
    const siteUrl = config.site.domain || 'https://example.com'
    const ogImageUrl = `${siteUrl}${config.site.ogImage}`

    // Primary meta tags
    updateMetaTag('meta[name="title"]', fullTitle)
    updateMetaTag('meta[name="description"]', description)

    // Open Graph tags
    updateMetaTag('meta[property="og:url"]', siteUrl)
    updateMetaTag('meta[property="og:title"]', fullTitle)
    updateMetaTag('meta[property="og:description"]', description)
    updateMetaTag('meta[property="og:image"]', ogImageUrl)

    // Twitter tags
    updateMetaTag('meta[property="twitter:url"]', siteUrl)
    updateMetaTag('meta[property="twitter:title"]', fullTitle)
    updateMetaTag('meta[property="twitter:description"]', description)
    updateMetaTag('meta[property="twitter:image"]', ogImageUrl)
  }, [])

  const openChat = () => {
    setChatInitialView('chat')
    setIsChatOpen(true)
  }

  const openJobFit = () => {
    setChatInitialView('jobFit')
    setIsChatOpen(true)
  }

  return (
    <div className="app">
      <Header />
      <main>
        <Hero onOpenChat={openChat} onOpenJobFit={openJobFit} />
        <About />
        <Experience />
        <Skills />
        <Education />
        <Footer />
      </main>
      <ChatContainer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(!isChatOpen)}
        initialView={chatInitialView}
      />
    </div>
  )
}

export default App
