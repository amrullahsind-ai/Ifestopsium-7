export default function ProgressRing({
  percent,
  size = 64,
  stroke = 7,
  label,
}: {
  percent: number
  size?: number
  stroke?: number
  label?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, percent))
  const offset = circ - (clamped / 100) * circ
  const color = clamped >= 80 ? '#10b981' : clamped >= 40 ? '#0ea5e9' : clamped > 0 ? '#f59e0b' : '#cbd5e1'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-extrabold text-slate-700">{Math.round(clamped)}%</span>
        {label && <span className="text-[9px] font-medium text-slate-400">{label}</span>}
      </div>
    </div>
  )
}
