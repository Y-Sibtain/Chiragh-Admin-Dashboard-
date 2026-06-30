export function parseCSV(csvText) {
  const text = (csvText ?? '').replace(/^\uFEFF/, '')
  if (!text.trim()) return []

  const rows = []
  let currentRow = []
  let currentCell = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const nextChar = text[index + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1
      }
      currentRow.push(currentCell.trim())
      rows.push(currentRow)
      currentRow = []
      currentCell = ''
      continue
    }

    currentCell += char
  }

  currentRow.push(currentCell.trim())
  rows.push(currentRow)

  const [headerRow = [], ...dataRows] = rows
  const headers = headerRow.map((header) => header.trim())

  return dataRows
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) =>
      headers.reduce((record, header, index) => {
        record[header] = (row[index] ?? '').trim()
        return record
      }, {}),
    )
}