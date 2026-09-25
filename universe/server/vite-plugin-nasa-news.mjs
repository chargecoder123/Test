import { createNewsCache } from './nasa-news.mjs'

/**
 * Serves `/api/nasa-news` from Vite's dev server and preview server.
 *
 * The browser cannot read NASA's feeds directly (no CORS headers), so the page
 * asks this same-origin endpoint instead. It caches upstream for
 * NASA_NEWS_TTL_MS (10 minutes by default) and falls back to the last good
 * response if NASA is briefly unreachable. Static hosts without this endpoint
 * simply fall back to the bundled snapshot in `src/data/nasa-news.json`.
 */
export default function nasaNewsApi({ path = '/api/nasa-news' } = {}) {
  const getNews = createNewsCache()

  const middleware = async (req, res, next) => {
    const [url] = (req.url || '').split('?')
    if (url !== path) return next()

    const force = new URL(req.url, 'http://localhost').searchParams.has('refresh')
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'no-store')

    try {
      const payload = await getNews({ force })
      // Partial results are still useful; a total miss is reported as an error so
      // the page can say so instead of silently showing an empty feed.
      const totalFailure = payload.items.length === 0 && !payload.stale
      if (totalFailure) {
        res.statusCode = 502
        res.end(JSON.stringify({ ...payload, error: payload.sources?.map(source => `${source.label}: ${source.error || 'unavailable'}`).join(' · ') || 'NASA is unreachable.' }))
        return
      }
      res.statusCode = 200
      res.end(JSON.stringify(payload))
    } catch (error) {
      res.statusCode = 502
      res.end(JSON.stringify({ items: [], fetchedAt: null, error: String(error?.message || error) }))
    }
  }

  return {
    name: 'universe-nasa-news-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
