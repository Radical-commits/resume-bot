import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Experience } from './components/Experience'
import { Skills } from './components/Skills'
import { Education } from './components/Education'
import { Footer } from './components/Footer'
import { ChatContainer } from './components/Chat/ChatContainer'
import { PageSkeleton } from './components/PageSkeleton'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { useTheme } from './hooks/useTheme'
import { analytics } from './services/analytics'
import { sessionService } from './services/session'

function AppInner() {
  const { data, isLoading, error } = useAppData()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInitialView, setChatInitialView] = useState<'chat' | 'jobFit'>('chat')

  useTheme(data?.theme ?? null, data?.config.branding)

  useEffect(() => {
    if (sessionService.isNewVisitor()) {
      sessionService.getOrCreateSessionId()
      analytics.sessionStart()
    } else {
      sessionService.getOrCreateSessionId()
    }
  }, [])

  useEffect(() => {
    if (!data) return

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
  }, [data])

  useEffect(() => {
    if (!data) return

    const { resume, config } = data
    const fullTitle = `${resume.personalInfo.name} - ${resume.personalInfo.title}`
    document.title = fullTitle

    const updateMetaTag = (selector: string, content: string) => {
      const element = document.querySelector(selector)
      if (element) element.setAttribute('content', content)
    }

    const siteUrl = config.site.domain || 'https://example.com'
    const ogImageUrl = `${siteUrl}${config.site.ogImage}`

    updateMetaTag('meta[name="title"]', fullTitle)
    updateMetaTag('meta[name="description"]', resume.summary)
    updateMetaTag('meta[property="og:url"]', siteUrl)
    updateMetaTag('meta[property="og:title"]', fullTitle)
    updateMetaTag('meta[property="og:description"]', resume.summary)
    updateMetaTag('meta[property="og:image"]', ogImageUrl)
    updateMetaTag('meta[property="twitter:url"]', siteUrl)
    updateMetaTag('meta[property="twitter:title"]', fullTitle)
    updateMetaTag('meta[property="twitter:description"]', resume.summary)
    updateMetaTag('meta[property="twitter:image"]', ogImageUrl)
  }, [data])

  if (isLoading) return <PageSkeleton />

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--color-error)' }}>Failed to load: {error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  const openChat = () => { setChatInitialView('chat'); setIsChatOpen(true) }
  const openJobFit = () => { setChatInitialView('jobFit'); setIsChatOpen(true) }

  return (
    <div className={`app${isChatOpen ? ' chat-open' : ''}`}>
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
        onClose={() => setIsChatOpen(prev => !prev)}
        initialView={chatInitialView}
      />
    </div>
  )
}

function App() {
  return (
    <AppDataProvider>
      <AppInner />
    </AppDataProvider>
  )
}

export default App
