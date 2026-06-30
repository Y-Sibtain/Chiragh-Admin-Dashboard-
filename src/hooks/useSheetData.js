import { useEffect, useState } from 'react'
import { parseCSV } from '../utils/csvParser'

const SOURCES = {
  centers: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSvZ8J-YCdG3_fnclZgXNzhdAIHxK-aEC34GA5ukZeAw0lUo6iarqb8HpsgYzTz3lVSOy8xUEqDB29Z/pub?gid=0&single=true&output=csv',
  students: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSvZ8J-YCdG3_fnclZgXNzhdAIHxK-aEC34GA5ukZeAw0lUo6iarqb8HpsgYzTz3lVSOy8xUEqDB29Z/pub?gid=317064619&single=true&output=csv',
  videoSessions: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSvZ8J-YCdG3_fnclZgXNzhdAIHxK-aEC34GA5ukZeAw0lUo6iarqb8HpsgYzTz3lVSOy8xUEqDB29Z/pub?gid=90966986&single=true&output=csv',
  gameAttempts: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSvZ8J-YCdG3_fnclZgXNzhdAIHxK-aEC34GA5ukZeAw0lUo6iarqb8HpsgYzTz3lVSOy8xUEqDB29Z/pub?gid=560026872&single=true&output=csv',
  evaluations: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSvZ8J-YCdG3_fnclZgXNzhdAIHxK-aEC34GA5ukZeAw0lUo6iarqb8HpsgYzTz3lVSOy8xUEqDB29Z/pub?gid=1185998874&single=true&output=csv',
  sloMap: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSvZ8J-YCdG3_fnclZgXNzhdAIHxK-aEC34GA5ukZeAw0lUo6iarqb8HpsgYzTz3lVSOy8xUEqDB29Z/pub?gid=296118212&single=true&output=csv',
}

const EMPTY_DATA = {
  centers: [],
  students: [],
  videoSessions: [],
  gameAttempts: [],
  evaluations: [],
  sloMap: [],
}

export function useSheetData() {
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshToken, setRefreshToken] = useState(1)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const entries = Object.entries(SOURCES)
        const responses = await Promise.all(
          entries.map(async ([key, url]) => {
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`Failed to load ${key} data (${response.status})`)
            }
            const text = await response.text()
            return [key, parseCSV(text)]
          }),
        )

        if (cancelled) return

        setData(Object.fromEntries(responses))
        setLastUpdated(new Date())
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [refreshToken])

  function refresh() {
    setRefreshToken((value) => value + 1)
  }

  return { data, loading, error, lastUpdated, refresh }
}