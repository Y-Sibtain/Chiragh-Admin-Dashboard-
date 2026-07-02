import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import OverviewPage from './components/pages/OverviewPage'
import ClasswisePage from './components/pages/ClasswisePage'
import StudentDirectoryPage from './components/pages/StudentDirectoryPage'
import NFEMapperPage from './components/pages/NFEMapperPage'
import CenterProgressPage from './components/pages/CenterProgressPage'
import EvalAnalyticsPage from './components/pages/EvalAnalyticsPage'
import { ACCENT_TEXT_CLASSES, PAGE_META } from './utils/analytics'
import { useSheetData } from './hooks/useSheetData'

function App() {
  const { data, loading, error, lastUpdated, refresh } = useSheetData()
  const [activePage, setActivePage] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState(['All Centers'])
  const [classwiseGrade, setClasswiseGrade] = useState('Nursery')
  const [studentGrade, setStudentGrade] = useState('All Grades')
  const [studentSearch, setStudentSearch] = useState('')
  const [studentSort, setStudentSort] = useState('winRate')
  const [nfeGrade, setNfeGrade] = useState('Nursery')
  const [nfeUnit, setNfeUnit] = useState('All')
  const [nfeSearch, setNfeSearch] = useState('')

  const centerOptions = useMemo(() => {
    const unique = new Set()
    data.students.forEach((student) => {
      if (student.center_name) unique.add(student.center_name)
    })
    return Array.from(unique).sort((left, right) => left.localeCompare(right))
  }, [data.students])

  const pageMeta = PAGE_META[activePage] ?? PAGE_META.overview
  const pageAccentClass = ACCENT_TEXT_CLASSES[pageMeta.color] ?? 'text-slate-900'

  let pageContent = null

  if (activePage === 'overview') {
    pageContent = <OverviewPage data={data} selectedCenter={selectedCenter} />
  } else if (activePage === 'classwise') {
    pageContent = <ClasswisePage data={data} selectedCenter={selectedCenter} selectedGrade={classwiseGrade} setSelectedGrade={setClasswiseGrade} />
  } else if (activePage === 'students') {
    pageContent = (
      <StudentDirectoryPage
        data={data}
        selectedCenter={selectedCenter}
        selectedGrade={studentGrade}
        setSelectedGrade={setStudentGrade}
        search={studentSearch}
        setSearch={setStudentSearch}
        sortBy={studentSort}
        setSortBy={setStudentSort}
      />
    )
  } else if (activePage === 'nfe') {
    pageContent = (
      <NFEMapperPage
        data={data}
        selectedCenter={selectedCenter}
        selectedGrade={nfeGrade}
        setSelectedGrade={setNfeGrade}
        unitFilter={nfeUnit}
        setUnitFilter={setNfeUnit}
        search={nfeSearch}
        setSearch={setNfeSearch}
      />
    )
  } else if (activePage === 'centers') {
    pageContent = <CenterProgressPage data={data} />
  } else if (activePage === 'eval') {
    pageContent = <EvalAnalyticsPage data={data} selectedCenter={selectedCenter} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        selectedCenter={selectedCenter}
        setSelectedCenter={setSelectedCenter}
        centerOptions={centerOptions}
        loading={loading}
        lastUpdated={lastUpdated}
        refresh={refresh}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} relative z-0 min-h-screen overflow-y-auto transition-[margin-left] duration-300`}>
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
          <div className="px-8 py-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${pageAccentClass}`}>Chiragh Admin Dashboard</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{pageMeta.title}</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-500">{pageMeta.subtitle}</p>
              </div>
              <div className="relative">
                <details className="relative">
                  <summary className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm cursor-pointer list-none">
                    {Array.isArray(selectedCenter) && selectedCenter.some((c) => c === 'All Centers')
                      ? 'All Centers'
                      : Array.isArray(selectedCenter) && selectedCenter.length
                        ? selectedCenter.join(', ')
                        : 'All Centers'}
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={Array.isArray(selectedCenter) && selectedCenter.some((c) => c === 'All Centers')}
                        onChange={() => setSelectedCenter(['All Centers'])}
                      />
                      <span className="text-sm">All Centers</span>
                    </label>
                    <div className="max-h-56 overflow-auto">
                      {centerOptions.map((center) => (
                        <label key={center} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={Array.isArray(selectedCenter) && selectedCenter.some((c) => c === center)}
                            onChange={() => {
                              setSelectedCenter((prev) => {
                                const prevArray = Array.isArray(prev) ? prev.slice() : []
                                // if All Centers is selected, start fresh
                                const base = prevArray.some((c) => c === 'All Centers') ? [] : prevArray
                                if (base.some((c) => c === center)) {
                                  const next = base.filter((c) => c !== center)
                                  return next.length ? next : ['All Centers']
                                }
                                return [...base, center]
                              })
                            }}
                          />
                          <span className="text-sm">{center}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm font-medium">{error}</p>
                <button
                  type="button"
                  onClick={refresh}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {loading && !lastUpdated ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-slate-500">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
              <p className="text-sm font-medium">Loading dashboard data...</p>
            </div>
          ) : (
            pageContent
          )}
        </div>
      </main>
    </div>
  )
}

export default App
