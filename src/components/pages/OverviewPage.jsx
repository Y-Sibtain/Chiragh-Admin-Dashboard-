import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import KPICard from '../KPICard'
import { averageByDay, filterRowsByCenter, getDistinctStudentCount, percentage } from '../../utils/analytics'
import { formatPercent, getDayName, toNum } from '../../utils/helpers'

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function OverviewPage({ data, selectedCenter }) {
  const centerLookup = Object.fromEntries(data.centers.map((center) => [String(center.center_id), center.center_name]))
  const students = filterRowsByCenter(data.students, selectedCenter, centerLookup)
  const videoSessions = filterRowsByCenter(data.videoSessions, selectedCenter, centerLookup)
  const gameAttempts = filterRowsByCenter(data.gameAttempts, selectedCenter, centerLookup)

  const activeLearners = getDistinctStudentCount(students, (student) => toNum(student.is_active) === 1)
  const totalWatchSeconds = videoSessions.reduce((sum, session) => sum + toNum(session.duration_seconds), 0)
  const totalWatchHours = totalWatchSeconds / 3600
  const completionRate = percentage(videoSessions.filter((session) => toNum(session.completed) === 1).length, videoSessions.length)
  const firstTryAttempts = gameAttempts.filter((attempt) => toNum(attempt.attempt_number) === 1)
  const winRatio = percentage(
    firstTryAttempts.filter((attempt) => toNum(attempt.first_try_pass) === 1).length,
    firstTryAttempts.length,
  )

  const watchPerformance = averageByDay(
    videoSessions,
    'session_date',
    'duration_minutes',
  ).map((day) => {
    const scoreRows = gameAttempts.filter((attempt) => getDayName(attempt.attempt_date) === day.day)
    const scoreAverage = scoreRows.length
      ? scoreRows.reduce((sum, attempt) => sum + toNum(attempt.score_pct), 0) / scoreRows.length
      : day.averageScore

    return {
      ...day,
      averageScore: scoreAverage,
    }
  })

  const funnelStages = [
    {
      label: 'Videos Started',
      count: getDistinctStudentCount(videoSessions),
    },
    {
      label: 'Videos Completed',
      count: getDistinctStudentCount(videoSessions, (session) => toNum(session.completed) === 1),
    },
    {
      label: 'Games Attempted',
      count: getDistinctStudentCount(gameAttempts),
    },
    {
      label: 'Games Passed 1st Try',
      count: getDistinctStudentCount(gameAttempts, (attempt) => toNum(attempt.first_try_pass) === 1),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <KPICard title="Active Learners" value={activeLearners.toString()} subtitle="Nursery to Grade 5" accent="blue-600" />
        <KPICard title="Total Watch Time" value={`${totalWatchHours.toFixed(1)}h`} subtitle="avg minutes/day per learner" accent="blue-600" />
        <KPICard title="Video Completion %" value={formatPercent(completionRate)} subtitle="Start → finish rate" accent="blue-600" />
        <KPICard title="Game Win Ratio" value={formatPercent(winRatio)} subtitle="1st-attempt pass rate" accent="blue-600" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Watch-Time vs. Game Performance">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={watchPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="minutes" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="averageScore" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Engagement Funnel">
          <div className="space-y-5">
            {funnelStages.map((stage, index) => {
              const baseline = funnelStages[0].count || 1
              const previousCount = index === 0 ? baseline : funnelStages[index - 1].count || 1
              const pctOfStageOne = percentage(stage.count, baseline)
              const drop = index === 0 ? 0 : Math.max(0, percentage(previousCount - stage.count, previousCount))

              return (
                <div key={stage.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="font-semibold text-slate-800">{stage.label}</div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>{stage.count} students</span>
                      <span>{pctOfStageOne.toFixed(1)}%</span>
                      {index > 0 ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">-{drop.toFixed(1)}%</span> : null}
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, pctOfStageOne)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}