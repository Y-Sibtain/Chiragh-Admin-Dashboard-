import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { GRADES, averageByKey, filterRowsByCenter, filterStudentsByGrade, getBuckets, getMostCommonValue, getTopPackageId } from '../../utils/analytics'
import { formatPercent, sameText, toNum } from '../../utils/helpers'

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
              isActive ? 'border-green-600 bg-green-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-green-200 hover:text-green-700'
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

export default function ClasswisePage({ data, selectedCenter, selectedGrade, setSelectedGrade }) {
  const centerLookup = Object.fromEntries(data.centers.map((center) => [String(center.center_id), center.center_name]))
  const studentsInCenter = filterRowsByCenter(data.students, selectedCenter, centerLookup)
  const attemptsInCenter = filterRowsByCenter(data.gameAttempts, selectedCenter, centerLookup)
  const gradeStudents = useMemo(
    () => filterStudentsByGrade(studentsInCenter, selectedGrade),
    [studentsInCenter, selectedGrade],
  )

  const packageId = getTopPackageId(gradeStudents)
  const packageSloRows = data.sloMap.filter((row) => sameText(row.package_id, packageId))
  const studentGradeId = getMostCommonValue(gradeStudents, 'grade_id')

  const studentAttempts = attemptsInCenter.filter((attempt) => sameText(attempt.grade_id, studentGradeId) || sameText(attempt.grade_label, selectedGrade))
  const avgScore = studentAttempts.length ? studentAttempts.reduce((sum, attempt) => sum + toNum(attempt.score_pct), 0) / studentAttempts.length : 0

  const sloAverages = averageByKey(studentAttempts, 'slo_code', 'score_pct')
  const sloAverageMap = new Map(sloAverages.map((item) => [item.key, item.average]))
  const totalBenchmarks = new Set(packageSloRows.map((row) => row.slo_code)).size
  const passingBenchmarks = packageSloRows.filter((row) => (sloAverageMap.get(row.slo_code) ?? 0) >= 70).length

  const buckets = getBuckets(gradeStudents)
  const groupedUnits = ['Listening & Speaking', 'Reading', 'Writing', 'Formal Language']
    .map((unitName) => ({
      unitName,
      items: packageSloRows
        .filter((row) => sameText(row.unit_name, unitName))
        .map((row) => ({
          ...row,
          average: sloAverageMap.get(row.slo_code) ?? 0,
        })),
    }))
    .filter((group) => group.items.length)

  return (
    <div className="space-y-6">
      <GradePills selectedGrade={selectedGrade} onChange={setSelectedGrade} />

      <div className="rounded-2xl bg-slate-900 px-6 py-5 text-white shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-300">{selectedCenter}</p>
            <h2 className="mt-1 text-xl font-semibold">{selectedGrade} performance snapshot</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Students</p>
              <div className="mt-1 text-2xl font-semibold">{gradeStudents.length}</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg Score</p>
              <div className="mt-1 text-2xl font-semibold">{formatPercent(avgScore)}</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Benchmarks</p>
              <div className="mt-1 text-2xl font-semibold">{passingBenchmarks} / {totalBenchmarks}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Progress Distribution">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} layout="vertical" margin={{ left: 20, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis type="category" dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} width={110} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar dataKey="percent" fill="#16a34a" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {buckets.map((bucket) => (
              <div key={bucket.label} className="rounded-xl bg-slate-50 px-4 py-3 text-center">
                <div className="text-sm font-semibold text-slate-900">{bucket.count}</div>
                <div className="text-xs text-slate-500">students</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="NFBE Benchmark Mastery">
          <div className="space-y-6">
            {groupedUnits.map((group) => (
              <div key={group.unitName}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{group.unitName}</h3>
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const isPass = item.average >= 70
                    return (
                      <div key={item.slo_code} className="rounded-xl border border-slate-100 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">{item.slo_code}</div>
                            <p className="text-sm text-slate-700">{item.slo_description}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isPass ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {isPass ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${isPass ? 'bg-green-600' : 'bg-red-500'}`} style={{ width: `${Math.min(100, item.average)}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Average mastery {formatPercent(item.average)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}