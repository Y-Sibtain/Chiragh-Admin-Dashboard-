import {
  BarChart3,
  BookOpen,
  Building2,
  LayoutDashboard,
  Map,
  RefreshCw,
  Users,
} from 'lucide-react'
import { ACCENT_TEXT_CLASSES } from '../utils/analytics'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'blue-600' },
  { id: 'classwise', label: 'Classwise', icon: BookOpen, color: 'green-600' },
  { id: 'students', label: 'Students', icon: Users, color: 'purple-600' },
  { id: 'nfe', label: 'NFE Mapper', icon: Map, color: 'teal-600' },
  { id: 'centers', label: 'Centers', icon: Building2, color: 'indigo-600' },
  { id: 'eval', label: 'Analytics', icon: BarChart3, color: 'orange-600' },
]

export default function Sidebar({
  activePage,
  setActivePage,
  selectedCenter,
  setSelectedCenter,
  centerOptions,
  loading,
  lastUpdated,
  refresh,
}) {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="text-2xl font-black tracking-[0.24em] text-white">CHIRAGH</div>
        <div className="mt-1 text-sm text-slate-400">Education Hub</div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                isActive ? 'bg-white/10 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? (ACCENT_TEXT_CLASSES[item.color] ?? '') : ''}`} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="space-y-4 border-t border-slate-800 px-4 py-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Filter Center
          </label>
          <select
            value={selectedCenter}
            onChange={(event) => setSelectedCenter(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-slate-500"
          >
            <option value="All Centers">All Centers</option>
            {centerOptions.map((center) => (
              <option key={center} value={center}>
                {center}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={refresh}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>

        <p className="text-xs text-slate-400">Last updated: {lastUpdated ? new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit' }).format(lastUpdated) : 'Not updated yet'}</p>
      </div>
    </aside>
  )
}