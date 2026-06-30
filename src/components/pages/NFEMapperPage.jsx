import { useMemo } from 'react'
import { GRADES, UNIT_TABS, averageByKey, filterRowsByCenter, filterStudentsByGrade, getDistinctStudentCount, getTopPackageId } from '../../utils/analytics'
import { formatPercent, sameText } from '../../utils/helpers'

function GradePills({ selectedGrade, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {GRADES.map((grade) => {
        const isActive = sameText(selectedGrade, grade)
        return (
          <button
            key={grade}
            type="button"
            onClick={() => onChange(grade)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive ? 'border-teal-600 bg-teal-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700'
            }`}
          >
            {grade}
          </button>
        )
      })}
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-teal-600">{value}</div>
      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </div>
  )
}

export default function NFEMapperPage({
  data,
  selectedCenter,
  selectedGrade,
  setSelectedGrade,
  unitFilter,
  setUnitFilter,
  search,
  setSearch,
}) {
  const centerLookup = Object.fromEntries(data.centers.map((center) => [String(center.center_id), center.center_name]))
  const studentsInCenter = filterRowsByCenter(data.students, selectedCenter, centerLookup)
  const attemptsInCenter = filterRowsByCenter(data.gameAttempts, selectedCenter, centerLookup)
  const gradeStudents = useMemo(() => filterStudentsByGrade(studentsInCenter, selectedGrade), [studentsInCenter, selectedGrade])
  const packageId = getTopPackageId(gradeStudents)
  const filteredSlos = data.sloMap.filter((row) => sameText(row.package_id, packageId))

  const averages = averageByKey(
    attemptsInCenter.filter((attempt) => sameText(attempt.grade_label, selectedGrade)),
    'slo_code',
    'score_pct',
  )
  const averageMap = new Map(averages.map((item) => [item.key, item.average]))
  const attemptMap = new Map()

  attemptsInCenter.forEach((attempt) => {
    if (!sameText(attempt.grade_label, selectedGrade)) return
    if (!attempt.slo_code) return
    if (!attemptMap.has(attempt.slo_code)) attemptMap.set(attempt.slo_code, [])
    attemptMap.get(attempt.slo_code).push(attempt)
  })

  const totalSlos = new Set(filteredSlos.map((row) => row.slo_code)).size
  const passingSlos = filteredSlos.filter((row) => (averageMap.get(row.slo_code) ?? 0) >= 70).length
  const failingSlos = filteredSlos.filter((row) => {
    const attempts = attemptMap.get(row.slo_code) ?? []
    return attempts.length > 0 && (averageMap.get(row.slo_code) ?? 0) < 70
  }).length
  const avgMastery = filteredSlos.length
    ? filteredSlos.reduce((sum, row) => sum + (averageMap.get(row.slo_code) ?? 0), 0) / filteredSlos.length
    : 0
  const normalizedSearch = search.trim().toLowerCase()
  const rows = filteredSlos
    .filter((row) => sameText(unitFilter, 'All') || sameText(row.unit_name, unitFilter))
    .filter((row) => {
      if (!normalizedSearch) return true
      return `${row.slo_code} ${row.slo_description}`.toLowerCase().includes(normalizedSearch)
    })
    .map((row) => {
      const attempts = attemptMap.get(row.slo_code) ?? []
      const coverage = getDistinctStudentCount(attempts) / Math.max(1, gradeStudents.length)
      const mastery = averageMap.get(row.slo_code) ?? 0

      return {
        ...row,
        mastery,
        coverage: coverage * 100,
      }
    })

  return (
    <div className="space-y-6">
      <GradePills selectedGrade={selectedGrade} onChange={setSelectedGrade} />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard title="Total SLOs" value={totalSlos.toString()} subtitle="grade package standards" />
        <MetricCard title="Avg Mastery %" value={formatPercent(avgMastery)} subtitle="average across SLOs" />
        <MetricCard title="SLOs Passing" value={passingSlos.toString()} subtitle="avg score at or above 70%" />
        <MetricCard title="SLOs Failing" value={failingSlos.toString()} subtitle="attempted but below target" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {UNIT_TABS.map((unit) => {
            const isActive = sameText(unitFilter, unit)
            return (
              <button
                key={unit}
                type="button"
                onClick={() => setUnitFilter(unit)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700'
                }`}
              >
                {unit}
              </button>
            )
          })}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by SLO code or description"
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-400"
        />
      </div>

      <SectionCard title="NFBE Standards Table">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.16em] text-slate-500">
                <th className="px-4 py-3">NFBE SLO Code & Description</th>
                <th className="px-4 py-3">Standard / Unit</th>
                <th className="px-4 py-3">Aligned Video + Verification Game</th>
                <th className="px-4 py-3">Coverage %</th>
                <th className="px-4 py-3">Mastery %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isPass = row.mastery >= 70
                return (
                  <tr key={row.slo_id} className="border-b border-slate-50 align-top last:border-b-0">
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{row.slo_code}</div>
                        <div className="text-slate-700">{row.slo_description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{row.unit_name}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-2 text-slate-600">
                        <div className="flex items-start gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />{row.aligned_video_title}</div>
                        <div className="flex items-start gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-green-500" />{row.verification_game_title}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{row.coverage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-teal-600" style={{ width: `${Math.min(100, row.coverage)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{row.mastery.toFixed(1)}%</span>
                          <span className={`rounded-full px-2 py-1 font-semibold ${isPass ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{isPass ? 'PASS' : 'FAIL'}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${isPass ? 'bg-green-600' : 'bg-red-500'}`} style={{ width: `${Math.min(100, row.mastery)}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}