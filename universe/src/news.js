import { useCallback, useEffect, useRef, useState } from 'react'
import snapshot from './data/nasa-news.json'

/**
 * NASA news for the front end.
 *
 * Priority order:
 *   1. `/api/nasa-news` — served by the Vite dev/preview server (live sync).
 *      This endpoint is what keeps the page current: it re-reads NASA's feeds on
 *      a timer, so a new NASA post shows up here without a code change.
 *   2. The last successfully synced copy in localStorage.
 *   3. `src/data/nasa-news.json` — the snapshot committed by `npm run sync:nasa`
 *      (and refreshed by the scheduled GitHub Actions workflow).
 *
 * On a static host with no endpoint, request #1 simply fails and the page keeps
 * rendering #2 or #3, so the page is never empty.
 */

const ENDPOINT = '/api/nasa-news'
const STORAGE_KEY = 'universe-nasa-news'
const AUTO_SYNC_MS = 10 * 60 * 1000
const REQUEST_TIMEOUT_MS = 12000
const PAGE_SIZE = 12

export const NEWS_TOPICS = [
  { id: 'all', label: 'Everything' },
  { id: 'universe', label: 'Universe & galaxies' },
  { id: 'solar', label: 'Solar system' },
  { id: 'earth', label: 'Earth' },
  { id: 'missions', label: 'Missions' },
]

export const TOPIC_LABELS = Object.fromEntries(NEWS_TOPICS.map(topic => [topic.id, topic.label]))

export function relativeTime(value) {
  if (!value) return 'just now'
  const then = Date.parse(value)
  if (Number.isNaN(then)) return 'just now'
  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.round(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export function formatDate(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Date to be confirmed'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export function isFresh(value, hours = 48) {
  const then = Date.parse(value || '')
  return !Number.isNaN(then) && Date.now() - then < hours * 3600000
}

export function filterNews(items, { topic = 'all', query = '' } = {}) {
  const needle = query.trim().toLowerCase()
  return items.filter(item => {
    if (topic !== 'all' && item.topic !== topic) return false
    if (!needle) return true
    return `${item.title} ${item.summary} ${item.source} ${TOPIC_LABELS[item.topic] || ''}`.toLowerCase().includes(needle)
  })
}

function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.items) && parsed.items.length ? parsed : null
  } catch {
    return null
  }
}

function writeCache(items, fetchedAt) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, fetchedAt }))
  } catch {
    /* Private browsing: the snapshot still covers us. */
  }
}

function initialState() {
  const cache = readCache()
  const cacheIsNewer = cache && Date.parse(cache.fetchedAt || 0) > Date.parse(snapshot.generatedAt || 0)
  const source = cacheIsNewer ? cache : snapshot
  return {
    items: Array.isArray(source.items) ? source.items : [],
    mode: cacheIsNewer ? 'cached' : 'snapshot',
    lastUpdated: cacheIsNewer ? cache.fetchedAt : snapshot.generatedAt,
    sources: source.sources || snapshot.sources || [],
  }
}

/**
 * One hook, one sync loop: the news page and the home-page teaser share it.
 */
export function useNasaNews() {
  const [state, setState] = useState(initialState)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const lastSynced = useRef(Date.parse(state.lastUpdated || 0) || 0)
  const inFlight = useRef(null)

  const sync = useCallback(async ({ force = false } = {}) => {
    if (inFlight.current) return inFlight.current

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    setSyncing(true)

    inFlight.current = (async () => {
      try {
        const response = await fetch(`${ENDPOINT}${force ? '?refresh=1' : ''}`, {
          signal: controller.signal,
          headers: { accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`Sync unavailable (${response.status})`)
        const payload = await response.json()
        if (!Array.isArray(payload.items) || payload.items.length === 0) throw new Error('No updates available yet')

        lastSynced.current = Date.parse(payload.fetchedAt) || Date.now()
        writeCache(payload.items, payload.fetchedAt)
        setState({
          items: payload.items,
          mode: 'live',
          lastUpdated: payload.fetchedAt || new Date().toISOString(),
          sources: payload.sources || [],
        })
        setError(null)
      } catch (caught) {
        // Keep whatever we already have; this is a background refresh, not a page load.
        setError(controller.signal.aborted ? 'Sync timed out.' : String(caught.message || caught))
      } finally {
        clearTimeout(timer)
        inFlight.current = null
        setSyncing(false)
      }
    })()

    return inFlight.current
  }, [])

  // First sync once the page is settled, then keep it current on a timer.
  useEffect(() => {
    const kickoff = setTimeout(() => { sync() }, 400)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') sync()
    }, AUTO_SYNC_MS)
    return () => { clearTimeout(kickoff); clearInterval(interval) }
  }, [sync])

  // Returning to the tab after a while should not mean reading yesterday's news.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastSynced.current >= AUTO_SYNC_MS) sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [sync])

  return { ...state, syncing, error, sync, autoSyncMinutes: AUTO_SYNC_MS / 60000 }
}

export { PAGE_SIZE }
