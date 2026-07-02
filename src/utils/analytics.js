import { getDayName, monthSortIndex, sameText, toNum } from './helpers'

export const GRADES = ['Nursery', 'KG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5']

export const PAGE_META = {
  overview: {
    title: 'Overview',
    subtitle: 'Program-wide engagement and game performance across Pakistan.',
    color: 'blue-600',
  },
  classwise: {
    title: 'Classwise Analysis',
    subtitle: 'Grade-level progress and NFBE benchmark mastery.',
    color: 'green-600',
  },
  students: {
    title: 'Student Directory',
    subtitle: 'Search, compare, and sort learner performance cards.',
    color: 'purple-600',
  },
  nfe: {
    title: 'NFE Mapper',
    subtitle: 'Coverage and mastery across standards, units, and aligned assets.',
    color: 'teal-600',
  },
  centers: {
    title: 'Center Progress',
    subtitle: 'Compare outcomes across all 9 learning centers.',
    color: 'indigo-600',
  },
  eval: {
    title: 'Eval Analytics',
    subtitle: 'Pre/post evaluation gains and term-level progress.',
    color: 'orange-600',
  },
}

export const UNIT_TABS = ['All', 'Listening & Speaking', 'Reading', 'Writing', 'Formal Language']

export const ACCENT_TEXT_CLASSES = {
  'blue-600': 'text-blue-600',
  'green-600': 'text-green-600',
  'purple-600': 'text-purple-600',
  'teal-600': 'text-teal-600',
  'indigo-600': 'text-indigo-600',
  'orange-600': 'text-orange-600',
}

export const ACCENT_BG_CLASSES = {
  'blue-600': 'bg-blue-50',
  'green-600': 'bg-green-50',
  'purple-600': 'bg-purple-50',
  'teal-600': 'bg-teal-50',
  'indigo-600': 'bg-indigo-50',
  'orange-600': 'bg-orange-50',
}

export function buildCenterLookup(centers = [], students = []) {
  const lookup = {}

  centers.forEach((center) => {
    if (center.center_id) {
      lookup[String(center.center_id)] = center.center_name ?? ''
    }
  })

  students.forEach((student) => {
    if (student.center_id && student.center_name && !lookup[String(student.center_id)]) {
      lookup[String(student.center_id)] = student.center_name
    }
  })

  return lookup
}

export function resolveCenterName(row, centerLookup) {
  if (row.center_name) return row.center_name
  if (row.center_id && centerLookup[String(row.center_id)]) return centerLookup[String(row.center_id)]
  return ''
}

export function filterRowsByCenter(rows, selectedCenter, centerLookup) {
  if (!selectedCenter) return rows

  // Handle array of selected centers
  if (Array.isArray(selectedCenter)) {
    if (selectedCenter.some((c) => sameText(c, 'All Centers'))) return rows
    return rows.filter((row) => selectedCenter.some((sel) => sameText(resolveCenterName(row, centerLookup), sel)))
  }

  if (sameText(selectedCenter, 'All Centers')) return rows
  return rows.filter((row) => sameText(resolveCenterName(row, centerLookup), selectedCenter))
}

export function filterStudentsByGrade(students, selectedGrade) {
  if (!selectedGrade || sameText(selectedGrade, 'All Grades')) return students
  return students.filter((student) => sameText(student.grade_label, selectedGrade))
}

export function getDistinctStudentCount(rows, predicate = () => true) {
  const ids = new Set()
  rows.forEach((row) => {
    if (predicate(row) && row.student_id) {
      ids.add(String(row.student_id))
    }
  })
  return ids.size
}

export function getMostCommonValue(rows, key) {
  const counts = new Map()
  rows.forEach((row) => {
    const value = (row[key] ?? '').toString().trim()
    if (!value) return
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  let winner = ''
  let maxCount = -1
  counts.forEach((count, value) => {
    if (count > maxCount) {
      winner = value
      maxCount = count
    }
  })

  return winner
}

export function getAverage(rows, valueAccessor) {
  const values = rows.map(valueAccessor).filter((value) => Number.isFinite(value))
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function averageByKey(rows, key, valueKey) {
  const groups = new Map()
  rows.forEach((row) => {
    const keyValue = (row[key] ?? '').toString().trim()
    if (!keyValue) return
    if (!groups.has(keyValue)) groups.set(keyValue, [])
    groups.get(keyValue).push(toNum(row[valueKey]))
  })

  return Array.from(groups.entries()).map(([groupKey, values]) => ({
    key: groupKey,
    average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
    count: values.length,
  }))
}

export function averageByDay(rows, dateKey, valueKey) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const grouped = Object.fromEntries(days.map((day) => [day, { minutes: 0, values: [] }]))

  rows.forEach((row) => {
    const dayName = getDayName(row[dateKey])
    if (!grouped[dayName]) return
    grouped[dayName].minutes += toNum(row[valueKey])
    grouped[dayName].values.push(toNum(row.score_pct))
  })

  return days.map((day) => ({
    day,
    minutes: grouped[day].minutes,
    averageScore: grouped[day].values.length
      ? grouped[day].values.reduce((sum, value) => sum + value, 0) / grouped[day].values.length
      : 0,
  }))
}

export function getBuckets(students) {
  const total = students.length || 1
  const foundation = students.filter((student) => {
    const progress = toNum(student.video_progress)
    return progress >= 1 && progress <= 10
  })
  const intermediate = students.filter((student) => {
    const progress = toNum(student.video_progress)
    return progress >= 11 && progress <= 20
  })
  const advanced = students.filter((student) => {
    const progress = toNum(student.video_progress)
    return progress >= 21 && progress <= 30
  })

  return [
    { label: 'Foundation', count: foundation.length, percent: (foundation.length / total) * 100 },
    { label: 'Intermediate', count: intermediate.length, percent: (intermediate.length / total) * 100 },
    { label: 'Advanced', count: advanced.length, percent: (advanced.length / total) * 100 },
  ]
}

export function getTopPackageId(students) {
  return getMostCommonValue(students, 'package_id')
}

export function sortByNumericField(items, field, direction = 'desc') {
  return [...items].sort((left, right) => {
    const leftValue = toNum(left[field])
    const rightValue = toNum(right[field])
    return direction === 'asc' ? leftValue - rightValue : rightValue - leftValue
  })
}

export function getOrderedMonths(rows, key) {
  const seen = new Map()

  rows.forEach((row) => {
    const monthLabel = (row[key] ?? '').toString().trim()
    if (!monthLabel) return
    if (!seen.has(monthLabel)) seen.set(monthLabel, { label: monthLabel, order: monthSortIndex(monthLabel) })
  })

  return Array.from(seen.values()).sort((left, right) => left.order - right.order)
}

export function percentage(value, total) {
  if (!total) return 0
  return (value / total) * 100
}