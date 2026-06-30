import { ACCENT_BG_CLASSES, ACCENT_TEXT_CLASSES } from '../utils/analytics'

export default function KPICard({ title, value, subtitle, accent = 'blue-600', badge }) {
  const textClass = ACCENT_TEXT_CLASSES[accent] ?? 'text-slate-900'
  const bgClass = ACCENT_BG_CLASSES[accent] ?? 'bg-slate-50'

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 flex items-end gap-3">
            <div className={`text-3xl font-semibold tracking-tight ${textClass}`}>{value}</div>
            {badge ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{badge}</span> : null}
          </div>
        </div>
        <div className={`h-10 w-10 rounded-full ${bgClass}`} />
      </div>
      <p className="mt-4 text-sm text-slate-500">{subtitle}</p>
    </div>
  )
}