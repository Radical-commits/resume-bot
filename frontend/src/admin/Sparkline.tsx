import { useState, useEffect, useRef } from 'react'

export interface SparkPoint {
  label: string
  value: number
  tip?: Record<string, string | number>
}

interface SparklineProps {
  points: SparkPoint[]
  color?: string
  gradId?: string
  showGrid?: boolean
}

const fmt = (n: number) => n.toLocaleString('en-US')

export function Sparkline({
  points,
  color = '#d4d4d4',
  gradId = 'sparkfill',
  showGrid = true,
}: SparklineProps) {
  const [hover, setHover] = useState<{ x: number; y: number; point: SparkPoint } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  const height = 140
  const padX = 4
  const padY = 14

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.floor(e.contentRect.width))
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  if (points.length === 0) {
    return (
      <div className="spark-wrap" ref={wrapRef}>
        <svg className="spark-svg" width={width} height={height}>
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#525252"
                fontFamily="var(--font-mono)" fontSize="11">no data yet</text>
        </svg>
        <div className="spark-axis" />
      </div>
    )
  }

  const max = Math.max(...points.map((p) => p.value), 1)
  const stepX = (width - padX * 2) / Math.max(points.length - 1, 1)
  const coords = points.map((p, i) => ({
    x: padX + i * stepX,
    y: padY + (1 - p.value / max) * (height - padY * 2),
    point: p,
  }))

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ')
  const areaPath =
    linePath +
    ` L${coords[coords.length - 1].x.toFixed(1)},${height - padY} L${coords[0].x.toFixed(1)},${height - padY} Z`

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let nearest = coords[0]
    let nd = Infinity
    for (const c of coords) {
      const d = Math.abs(c.x - x)
      if (d < nd) { nd = d; nearest = c }
    }
    setHover(nearest)
  }

  return (
    <div className="spark-wrap" ref={wrapRef}>
      <svg
        className="spark-svg"
        width={width}
        height={height}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {showGrid && [0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX} x2={width - padX}
            y1={padY + t * (height - padY * 2)}
            y2={padY + t * (height - padY * 2)}
            stroke="#1f1f1f" strokeDasharray="2 4"
          />
        ))}

        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.25"
              strokeLinejoin="round" strokeLinecap="round" />

        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={padY} y2={height - padY}
                  stroke="#404040" strokeDasharray="2 3" />
            <circle cx={hover.x} cy={hover.y} r="3.5" fill="#0f0f0f"
                    stroke={color} strokeWidth="1.5" />
          </g>
        )}
      </svg>

      <div className="spark-axis">
        {points.map((p, i) => {
          const show =
            points.length <= 10
              ? true
              : i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0
          return (
            <span key={i} className="spark-tick" style={{ visibility: show ? 'visible' : 'hidden' }}>
              {p.label}
            </span>
          )
        })}
      </div>

      {hover && (
        <div
          className="spark-tip"
          style={{ left: Math.min(Math.max(hover.x, 70), width - 70) }}
        >
          <div className="spark-tip-date">{hover.point.label}</div>
          {hover.point.tip
            ? Object.entries(hover.point.tip).map(([k, v]) => (
                <div className="spark-tip-row" key={k}>
                  <span>{k}</span>
                  <b>{typeof v === 'number' ? fmt(v) : v}</b>
                </div>
              ))
            : (
              <div className="spark-tip-row">
                <span>value</span>
                <b>{fmt(hover.point.value)}</b>
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}
