import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
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
  collapsed,
  setCollapsed,
}) {
  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className={`flex items-start justify-between border-b border-slate-800 py-6 ${collapsed ? 'px-3' : 'px-6'}`}>
        <div className={collapsed ? 'sr-only' : ''}>
          <div className="text-2xl font-black tracking-[0.24em] text-white">CHIRAGH</div>
          <div className="mt-1 text-sm text-slate-400">Education Hub</div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className={`flex-1 space-y-1 py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id
          const Icon = item.icon

          return (
            <div key={item.id} className="group relative">
              <button
                type="button"
                onClick={() => setActivePage(item.id)}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center rounded-xl py-3 text-left text-sm font-medium transition ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className={`h-4 w-4 ${isActive ? (ACCENT_TEXT_CLASSES[item.color] ?? '') : ''}`} />
                {!collapsed ? item.label : null}
              </button>

              {collapsed ? (
                <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-white/10 group-hover:block">
                  {item.label}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className={`space-y-4 border-t border-slate-800 py-5 ${collapsed ? 'px-2' : 'px-4'}`}>
        <button
          type="button"
          onClick={refresh}
          title={collapsed ? 'Refresh Data' : undefined}
          className={`flex w-full items-center justify-center rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white ${collapsed ? 'px-2' : 'gap-2 px-4'}`}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {!collapsed ? 'Refresh Data' : null}
        </button>

        {!collapsed ? <p className="text-xs text-slate-400">Last updated: {lastUpdated ? new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit' }).format(lastUpdated) : 'Not updated yet'}</p> : null}
      </div>
    </aside>
  )
}