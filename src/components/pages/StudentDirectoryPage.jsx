import { useMemo } from 'react'
import { GRADES, filterRowsByCenter, filterStudentsByGrade, sortByNumericField } from '../../utils/analytics'
import { sameText, toNum } from '../../utils/helpers'

const TIER_COLORS = {
  Champion: 'bg-yellow-100 text-yellow-800',
  Climber: 'bg-blue-100 text-blue-800',
  Explorer: 'bg-green-100 text-green-800',
  Beginner: 'bg-slate-100 text-slate-700',
}

function GradePills({ selectedGrade, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {['All Grades', ...GRADES].map((grade) => {
        const isActive = sameText(selectedGrade, grade)
        return (
          <button
            key={grade}
            type="button"
            onClick={() => onChange(grade)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive ? 'border-purple-600 bg-purple-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-700'
            }`}
          >
            {grade}
          </button>
        )
      })}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function ProgressBar({ current, total }) {
  const width = total ? Math.min(100, (current / total) * 100) : 0

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span>Video Progress</span>
        <span>{current} / {total}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-purple-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function SkillBars({ student }) {
  const skills = [
    ['U1', student.u1_mastery_pct],
    ['U2', student.u2_mastery_pct],
    ['U3', student.u3_mastery_pct],
    ['U4', student.u4_mastery_pct],
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {skills.map(([label, value]) => {
        const percent = toNum(value)
        return (
          <div key={label} className="flex flex-col items-center gap-2" title={`${label}: ${percent.toFixed(1)}%`}>
            <div className="flex h-20 w-full items-end justify-center rounded-xl bg-slate-50 p-2">
              <div className="w-3 rounded-full bg-purple-600" style={{ height: `${Math.max(8, percent)}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function StudentDirectoryPage({
  data,
  selectedCenter,
  selectedGrade,
  setSelectedGrade,
  search,
  setSearch,
  sortBy,
  setSortBy,
}) {
  const centerLookup = Object.fromEntries(data.centers.map((center) => [String(center.center_id), center.center_name]))

  const filteredStudents = useMemo(() => {
    const byCenter = filterRowsByCenter(data.students, selectedCenter, centerLookup)
    const byGrade = filterStudentsByGrade(byCenter, selectedGrade)
    const bySearch = byGrade.filter((student) => (student.student_name ?? '').toLowerCase().includes(search.trim().toLowerCase()))

    const sorted = sortBy === 'watchTime'
      ? sortByNumericField(bySearch, 'hours_watched')
      : sortBy === 'progress'
        ? sortByNumericField(bySearch, 'video_progress')
        : sortByNumericField(bySearch, 'win_rate_pct')

    return sorted
  }, [data.students, centerLookup, selectedCenter, selectedGrade, search, sortBy])

  return (
    <div className="space-y-6">
      <GradePills selectedGrade={selectedGrade} onChange={setSelectedGrade} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student name"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400"
          />
        </div>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400"
        >
          <option value="winRate">Win Rate</option>
          <option value="watchTime">Watch Time</option>
          <option value="progress">Progress</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredStudents.map((student) => (
          <article key={student.student_id} className="relative rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="absolute right-4 top-4">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_COLORS[student.tier] ?? TIER_COLORS.Beginner}`}>{student.tier}</span>
            </div>
            <h3 className="pr-16 text-lg font-semibold text-slate-900">{student.student_name}</h3>
            <p className="mt-1 text-sm text-slate-500">{student.grade_label} · {student.package_label}</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatBox label="Hours" value={toNum(student.hours_watched).toFixed(1)} />
              <StatBox label="Win Rate" value={`${toNum(student.win_rate_pct).toFixed(1)}%`} />
              <StatBox label="Tries" value={toNum(student.avg_tries).toFixed(1)} />
            </div>

            <div className="mt-4">
              <ProgressBar current={toNum(student.video_progress)} total={toNum(student.video_total)} />
            </div>

            <div className="mt-4">
              <SkillBars student={student} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}