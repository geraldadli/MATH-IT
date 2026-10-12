import { useEffect, useId, useRef, useState } from 'react'
import type { EvidenceChart as Chart, Language } from './types'

// One series per chart, so one validated mark hue; text stays in text tokens.
// Inks are theme tokens (index.css), applied through style because SVG attributes don't resolve var().
const ink = {
  grid: 'var(--chart-grid)', gridMajor: 'var(--chart-grid-major)', baseline: 'var(--chart-baseline)', text: 'var(--chart-text)',
  mark: 'var(--chart-mark)', icon: 'var(--chart-icon)', surface: 'var(--chart-surface)', key: 'var(--chart-key)',
}
// Pie slices take the validated categorical order; slices 2 and 4 (orange, yellow) never touch.
const sliceColors = [1, 2, 3, 4].map((slot) => `var(--chart-slice-${slot})`)

type ChartOf<Kind extends Chart['kind']> = Extract<Chart, { kind: Kind }>

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(560)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

function AxisChart({ chart, language, width }: { chart: ChartOf<'bar' | 'line'>; language: Language; width: number }) {
  const left = 40, right = 16
  const band = (width - left - right) / chart.values.length
  // Narrow screens stack two-word labels ("Day 1") rather than let neighbours collide.
  const stackLabels = chart.categories.some((category) => category[language].includes(' ') && category[language].length * 7.5 > band - 6)
  const height = 290, top = 30, bottom = stackLabels ? 48 : 34
  const plotHeight = height - top - bottom
  const x = (index: number) => left + band * (index + 0.5)
  const y = (value: number) => top + plotHeight * (1 - value / chart.max)
  // Unlabeled half-step lines let children read values between the numbered ones.
  const gridStep = chart.labelStep / 2
  const ticks = Array.from({ length: chart.max / gridStep + 1 }, (_, index) => index * gridStep)
  const barWidth = Math.min(24, band * 0.6)
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <text x={4} y={14} style={{ fill: ink.text }} fontSize={12}>{chart.axis[language]}</text>
    {ticks.map((tick) => {
      const major = tick % chart.labelStep === 0
      return <g key={tick}>
        <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} style={{ stroke: tick === 0 ? ink.baseline : major ? ink.gridMajor : ink.grid }} strokeWidth={1} />
        {major && <text x={left - 8} y={y(tick) + 4} textAnchor="end" fontSize={12} style={{ fill: ink.text, fontVariantNumeric: 'tabular-nums' }}>{tick}</text>}
      </g>
    })}
    {chart.kind === 'bar' && chart.values.map((value, index) => {
      const x0 = x(index) - barWidth / 2, x1 = x0 + barWidth, end = y(value), base = y(0)
      return <path key={index} style={{ fill: ink.mark }}
        d={`M${x0} ${base}V${end + 4}Q${x0} ${end} ${x0 + 4} ${end}H${x1 - 4}Q${x1} ${end} ${x1} ${end + 4}V${base}Z`} />
    })}
    {chart.kind === 'line' && <>
      <polyline points={chart.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')}
        fill="none" style={{ stroke: ink.mark }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {chart.values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r={5} style={{ fill: ink.mark, stroke: ink.surface }} strokeWidth={2} />)}
    </>}
    {chart.categories.map((category, index) => <text key={index} x={x(index)} y={height - (stackLabels ? 26 : 12)} textAnchor="middle" style={{ fill: ink.text }} fontSize={13}>
      {stackLabels
        ? category[language].split(' ').map((word, line) => <tspan key={line} x={x(index)} dy={line ? 15 : 0}>{word}</tspan>)
        : category[language]}
    </text>)}
  </svg>
}

// Icons are centred on x = 14 so clipping at 14 leaves exactly half.
function PictureIcon({ icon, x, y, clip }: { icon: ChartOf<'pictograph'>['icon']; x: number; y: number; clip?: string }) {
  return <g transform={`translate(${x} ${y})`} clipPath={clip ? `url(#${clip})` : undefined}>
    {icon === 'person'
      ? <g style={{ fill: ink.icon }}><circle cx={14} cy={8} r={6} /><path d="M3 27a11 11 0 0 1 22 0Z" /></g>
      : <g><path d="M5 3h16a2 2 0 0 1 2 2v21H7a2 2 0 0 1-2-2Z" style={{ fill: ink.mark }} /><path d="M8 22h15" style={{ stroke: ink.surface }} strokeWidth={2} /></g>}
  </g>
}

function Pictograph({ chart, language, width }: { chart: ChartOf<'pictograph'>; language: Language; width: number }) {
  const clip = useId().replace(/:/g, '')
  const per = chart.iconValue
  const rowHeight = 40, labelWidth = Math.min(110, width * 0.3), icon = 34
  const height = chart.values.length * rowHeight + 46
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <defs><clipPath id={clip}><rect width={14} height={28} /></clipPath></defs>
    {chart.values.map((value, row) => {
      const rowTop = row * rowHeight + 4
      const whole = Math.floor(value / per)
      return <g key={row}>
        <text x={0} y={rowTop + 20} style={{ fill: ink.text }} fontSize={14}>{chart.categories[row][language]}</text>
        {Array.from({ length: whole }, (_, index) => <PictureIcon key={index} icon={chart.icon} x={labelWidth + index * icon} y={rowTop} />)}
        {value % per > 0 && <PictureIcon icon={chart.icon} x={labelWidth + whole * icon} y={rowTop} clip={clip} />}
        <line x1={0} x2={width} y1={rowTop + rowHeight - 4} y2={rowTop + rowHeight - 4} style={{ stroke: ink.grid }} />
      </g>
    })}
    <g transform={`translate(0 ${height - 34})`}>
      <rect width={width} height={34} rx={8} style={{ fill: ink.key }} />
      <PictureIcon icon={chart.icon} x={10} y={3} />
      <text x={46} y={22} style={{ fill: ink.text }} fontSize={14}>= {per} {chart.axis[language]}</text>
    </g>
  </svg>
}

function PieChart({ chart, language, width }: { chart: ChartOf<'pie'>; language: Language; width: number }) {
  const total = chart.values.reduce((sum, value) => sum + value, 0)
  // Leave room either side for the slice names.
  const radius = Math.max(50, Math.min(95, (width - 200) / 2))
  const height = radius * 2 + 50
  const cx = width / 2, cy = height / 2
  // Turns run clockwise from twelve o'clock.
  const point = (turn: number, distance: number) =>
    [cx + distance * Math.sin(turn * 2 * Math.PI), cy - distance * Math.cos(turn * 2 * Math.PI)] as const
  const slices = chart.values.map((value, index) => {
    const start = chart.values.slice(0, index).reduce((sum, earlier) => sum + earlier, 0) / total
    return { index, start, end: start + value / total }
  })
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    {slices.map(({ index, start, end }) => {
      const [x1, y1] = point(start, radius), [x2, y2] = point(end, radius)
      return <path key={index} style={{ fill: sliceColors[index], stroke: ink.surface }} strokeWidth={2} strokeLinejoin="round"
        d={`M${cx} ${cy}L${x1} ${y1}A${radius} ${radius} 0 ${end - start > 0.5 ? 1 : 0} 1 ${x2} ${y2}Z`} />
    })}
    {/* Eighth guides let children count equal parts inside the bigger slices. */}
    {Array.from({ length: 8 }, (_, eighth) => {
      const [x, y] = point(eighth / 8, radius - 1)
      return <line key={eighth} x1={cx} y1={cy} x2={x} y2={y} style={{ stroke: ink.surface }} strokeOpacity={0.75} strokeWidth={1} />
    })}
    {slices.map(({ index, start, end }) => {
      const middle = (start + end) / 2
      const [fromX, fromY] = point(middle, radius + 3), [toX, toY] = point(middle, radius + 13), [textX, textY] = point(middle, radius + 18)
      const anchor = textX > cx + 1 ? 'start' : textX < cx - 1 ? 'end' : 'middle'
      return <g key={index}>
        <line x1={fromX} y1={fromY} x2={toX} y2={toY} style={{ stroke: ink.baseline }} strokeWidth={1} />
        <text x={textX} y={textY} textAnchor={anchor} dominantBaseline="middle" style={{ fill: ink.text }} fontSize={13}>{chart.categories[index][language]}</text>
      </g>
    })}
  </svg>
}

export default function EvidenceChart({ chart, language }: { chart: Chart; language: Language }) {
  const [ref, width] = useWidth()
  return <figure className="evidence-chart">
    <figcaption>{chart.title[language]}</figcaption>
    <div ref={ref} className="evidence-chart-plot">
      {chart.kind === 'pictograph' ? <Pictograph chart={chart} language={language} width={width} />
        : chart.kind === 'pie' ? <PieChart chart={chart} language={language} width={width} />
          : <AxisChart chart={chart} language={language} width={width} />}
    </div>
    <table className="sr-only">
      <caption>{chart.title[language]}</caption>
      <thead><tr><td /><th scope="col">{chart.axis[language]}</th></tr></thead>
      <tbody>{chart.categories.map((category, index) => <tr key={index}>
        <th scope="row">{category[language]}</th><td>{chart.values[index]}</td>
      </tr>)}</tbody>
    </table>
  </figure>
}
