export function toNum(val) {
  if (val === undefined || val === null || val === '') return 0
  const cleaned = val.toString().replace(/[^0-9.-]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

export function sameText(a, b) {
  return (a ?? '').toString().trim().toLowerCase() === (b ?? '').toString().trim().toLowerCase()
}

export function formatTime(value) {
  if (!value) return 'Not updated yet'
  return new Intl.DateTimeFormat('en-PK', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

export function formatPercent(value, digits = 1) {
  return `${toNum(value).toFixed(digits)}%`
}

export function getDayName(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
}

export function formatReadableDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

export function monthSortIndex(monthValue) {
  const order = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
  const normalized = (monthValue ?? '').toString().trim().slice(0, 3)
  const index = order.findIndex((month) => sameText(month, normalized))
  return index === -1 ? order.length : index
}