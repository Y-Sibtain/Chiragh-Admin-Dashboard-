import { useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import KPICard from '../KPICard'
import { getDistinctStudentCount, percentage } from '../../utils/analytics'
import { formatPercent, toNum } from '../../utils/helpers'

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

function sameCenter(centerId, selectedCenterName, centerLookup) {
  return String(centerLookup[String(centerId)] ?? '') === String(selectedCenterName ?? '')
}

export default function CenterProgressPage({ data }) {
  const [sortKey, setSortKey] = useState('avgScore')
  const [sortDirection, setSortDirection] = useState('desc')

  const centerNameMap = Object.fromEntries(data.centers.map((center) => [String(center.center_id), center.center_name]))

  const centerStats = useMemo(() => {
    return data.centers.map((center) => {
      const centerStudents = data.students.filter((student) => sameCenter(student.center_id, center.center_name, centerNameMap))
      const centerSessions = data.videoSessions.filter((session) => String(session.center_id) === String(center.center_id))
      const centerAttempts = data.gameAttempts.filter((attempt) => String(attempt.center_id) === String(center.center_id))

      return {
        center_name: center.center_name,
        studentCount: centerStudents.length,
        avgScore: centerAttempts.length ? centerAttempts.reduce((sum, attempt) => sum + toNum(attempt.score_pct), 0) / centerAttempts.length : 0,
        videoCompletion: percentage(centerSessions.filter((session) => toNum(session.completed) === 1).length, centerSessions.length),
        gameWin: percentage(
          centerAttempts.filter((attempt) => toNum(attempt.attempt_number) === 1 && toNum(attempt.first_try_pass) === 1).length,
          centerAttempts.filter((attempt) => toNum(attempt.attempt_number) === 1).length,
        ),
      }
    })
  }, [data.centers, data.students, data.videoSessions, data.gameAttempts, centerNameMap])

  const totalStudents = data.students.length
  const activeLearners = getDistinctStudentCount(data.students, (student) => toNum(student.is_active) === 1)
  const engagementRate = percentage(activeLearners, totalStudents)
  const allAttempts = data.gameAttempts
  const allSessions = data.videoSessions
  const avgScore = allAttempts.length ? allAttempts.reduce((sum, attempt) => sum + toNum(attempt.score_pct), 0) / allAttempts.length : 0
  const completionRate = percentage(allSessions.filter((session) => toNum(session.completed) === 1).length, allSessions.length)

  const chartData = centerStats.map((center) => ({
    center_name: center.center_name,
    'Avg Score %': center.avgScore,
    'Video Completion %': center.videoCompletion,
    'Game Win %': center.gameWin,
  }))

  const tableData = useMemo(() => {
    const sorted = [...centerStats].sort((left, right) => {
      const factor = sortDirection === 'asc' ? 1 : -1
      return (toNum(left[sortKey]) - toNum(right[sortKey])) * factor
    })
    return sorted
  }, [centerStats, sortKey, sortDirection])

  function handleSort(nextKey) {
    if (nextKey === sortKey) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextKey)
    setSortDirection('desc')
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <KPICard title="Total Students" value={totalStudents.toString()} subtitle="all centers combined" accent="indigo-600" />
        <KPICard title="Active Learners" value={activeLearners.toString()} subtitle={`${formatPercent(engagementRate)} engagement rate`} accent="indigo-600" />
        <KPICard title="Avg Score %" value={formatPercent(avgScore)} subtitle="program-wide assessment average" accent="indigo-600" />
        <KPICard title="Video Completion %" value={formatPercent(completionRate)} subtitle="program-wide completion rate" accent="indigo-600" />
      </div>

      <SectionCard title="Performance by Center">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="center_name" angle={-45} textAnchor="end" height={70} tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 12 }} />
              <Tooltip />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" label="Target 70%" />
              <Bar dataKey="Avg Score %" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Video Completion %" fill="#0f766e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Game Win %" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Center Ranking">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.16em] text-slate-500">
                <th className="px-4 py-3">Center Name</th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => handleSort('studentCount')} className="inline-flex items-center gap-2">
                    Student Count <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => handleSort('avgScore')} className="inline-flex items-center gap-2">
                    Avg Score % <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => handleSort('videoCompletion')} className="inline-flex items-center gap-2">
                    Video Completion % <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => handleSort('gameWin')} className="inline-flex items-center gap-2">
                    Game Win % <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((center) => (
                <tr key={center.center_name} className="border-b border-slate-50 last:border-b-0">
                  <td className="px-4 py-4 font-medium text-slate-900">{center.center_name}</td>
                  <td className="px-4 py-4 text-slate-600">{center.studentCount}</td>
                  <td className="px-4 py-4 text-slate-600">{formatPercent(center.avgScore)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatPercent(center.videoCompletion)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatPercent(center.gameWin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}