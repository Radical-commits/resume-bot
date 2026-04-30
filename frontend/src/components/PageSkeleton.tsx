import type { CSSProperties } from 'react'

const Bone = ({ width, height, style }: { width?: number | string, height?: number | string, style?: CSSProperties }) => (
  <div className="skeleton-bone" style={{ width, height, ...style }} />
)

export const PageSkeleton = () => (
  <div className="app">
    <div className="header">
      <div className="header-container">
        <nav className="nav">
          {[80, 100, 60, 70, 80].map((w, i) => <Bone key={i} width={w} height={16} />)}
        </nav>
        <Bone width={80} height={16} />
      </div>
    </div>

    <main>
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <Bone width={120} height={20} style={{ marginBottom: 24 }} />
            <Bone width={320} height={48} style={{ marginBottom: 16 }} />
            <Bone width={220} height={28} style={{ marginBottom: 12 }} />
            <Bone width={280} height={20} style={{ marginBottom: 40 }} />
            <div style={{ display: 'flex', gap: 16 }}>
              <Bone width={160} height={48} style={{ borderRadius: 'var(--radius-full)' }} />
              <Bone width={160} height={48} style={{ borderRadius: 'var(--radius-full)' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-container">
          <Bone width={140} height={36} style={{ marginBottom: 24 }} />
          <Bone height={100} style={{ marginBottom: 12 }} />
          {[100, 90, 95, 80].map((w, i) => <Bone key={i} width={`${w}%`} height={18} style={{ marginBottom: 8 }} />)}
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-container">
          <Bone width={180} height={36} style={{ marginBottom: 24 }} />
          {[0, 1, 2].map(i => (
            <div key={i} className="card" style={{ marginBottom: 16, padding: 24 }}>
              <Bone width={200} height={22} style={{ marginBottom: 8 }} />
              <Bone width={140} height={16} style={{ marginBottom: 8 }} />
              <Bone width={100} height={14} />
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-container">
          <Bone width={100} height={36} style={{ marginBottom: 24 }} />
          <div className="skills-grid">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <Bone width={120} height={20} style={{ marginBottom: 16 }} />
                {[0, 1, 2, 3].map(j => <Bone key={j} width={`${70 + j * 5}%`} height={14} style={{ marginBottom: 8 }} />)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-container">
          <Bone width={150} height={36} style={{ marginBottom: 24 }} />
          <div className="education-grid">
            {[0, 1, 2].map(i => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <Bone width={100} height={20} style={{ marginBottom: 16 }} />
                {[0, 1, 2].map(j => <Bone key={j} width={`${80 - j * 10}%`} height={16} style={{ marginBottom: 8 }} />)}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  </div>
)
