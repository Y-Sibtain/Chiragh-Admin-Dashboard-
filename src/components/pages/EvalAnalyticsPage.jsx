import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import KPICard from '../KPICard'
import { filterRowsByCenter } from '../../utils/analytics'
import { formatPercent, sameText, toNum } from '../../utils/helpers'
import { monthSortIndex } from '../../utils/helpers'

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

function deltaBadge(value) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{value >= 0 ? '+' : ''}{value.toFixed(1)}%</span>
}

export default function EvalAnalyticsPage({ data, selectedCenter }) {
  const centerLookup = Object.fromEntries(data.centers.map((center) => [String(center.center_id), center.center_name]))
  const evaluations = filterRowsByCenter(data.evaluations, selectedCenter, centerLookup)

  const preRows = evaluations.filter((row) => sameText(row.eval_type, 'pre'))
  const postRows = evaluations.filter((row) => sameText(row.eval_type, 'post'))

  const preAvg = preRows.length ? preRows.reduce((sum, row) => sum + toNum(row.score_pct), 0) / preRows.length : 0
  const postAvg = postRows.length ? postRows.reduce((sum, row) => sum + toNum(row.score_pct), 0) / postRows.length : 0
  const gain = postAvg - preAvg
  const improvement = preAvg ? ((postAvg - preAvg) / preAvg) * 100 : 0

  const postPassingStudents = new Set(postRows.filter((row) => toNum(row.passed) === 1).map((row) => String(row.student_id)))
  const totalPostStudents = new Set(postRows.map((row) => String(row.student_id))).size
  const preFailingStudents = new Set(preRows.filter((row) => toNum(row.passed) !== 1).map((row) => String(row.student_id)))
  const postPassingButPreFailing = Array.from(postPassingStudents).filter((studentId) => preFailingStudents.has(studentId)).length

  const unitData = useMemo(() => {
    const units = ['U1', 'U2', 'U3', 'U4']
    return units.map((unit) => {
      const unitPre = preRows.filter((row) => sameText(row.unit_id, unit))
      const unitPost = postRows.filter((row) => sameText(row.unit_id, unit))

      return {
        unit,
        Pre: unitPre.length ? unitPre.reduce((sum, row) => sum + toNum(row.score_pct), 0) / unitPre.length : 0,
        Post: unitPost.length ? unitPost.reduce((sum, row) => sum + toNum(row.score_pct), 0) / unitPost.length : 0,
      }
    })
  }, [preRows, postRows])

  const monthRows = useMemo(() => {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
    return months
      .map((month) => {
        const monthPosts = postRows.filter((row) => (row.eval_month ?? '').toString().trim().slice(0, 3) === month)
        return {
          month,
          score: monthPosts.length ? monthPosts.reduce((sum, row) => sum + toNum(row.score_pct), 0) / monthPosts.length : 0,
        }
      })
      .sort((left, right) => monthSortIndex(left.month) - monthSortIndex(right.month))
  }, [postRows])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <KPICard title="Pre-Eval Avg Score" value={formatPercent(preAvg)} subtitle="baseline assessment average" accent="orange-600" />
        <KPICard title="Post-Eval Avg Score" value={formatPercent(postAvg)} subtitle={`+${improvement.toFixed(1)}% vs pre`} accent="orange-600" badge={deltaBadge(improvement)} />
        <KPICard title="Students Passing" value={`${postPassingStudents.size}/${totalPostStudents}`} subtitle={`${postPassingButPreFailing} improved from pre-eval`} accent="orange-600" />
        <KPICard title="Avg Learning Gain" value={`${gain.toFixed(1)}pp`} subtitle={gain >= 20 ? 'High Gain' : gain >= 10 ? 'Moderate Gain' : 'Low Gain'} accent="orange-600" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Pre vs Post — Average by Standard">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="unit" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" label="Pass" />
                <Legend />
                <Bar dataKey="Pre" fill="#9ca3af" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Post" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Term Progress Trend">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="score" stroke="#f97316" fill="#fdba74" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}