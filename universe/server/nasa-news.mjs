/**
 * NASA news aggregator — shared by the dev/preview server (live endpoint) and
 * the `npm run sync:nasa` script (static snapshot).
 *
 * Everything here is dependency-free: it reads NASA's public RSS/Atom feeds and
 * the public Astronomy Picture of the Day API, then normalizes them into one
 * predictable shape the React app can render. When NASA publishes something new,
 * the next sync picks it up — no manual editing required.
 */

const DEFAULT_TIMEOUT_MS = 12000
const DEFAULT_TTL_MS = 10 * 60 * 1000
const MAX_ITEMS = 60

/** Public, keyless NASA feeds. Add or remove entries to change what syncs in. */
export const FEED_SOURCES = [
  {
    id: 'newsroom',
    label: 'NASA newsroom',
    url: 'https://www.nasa.gov/news-release/feed/',
    site: 'https://www.nasa.gov/news/',
  },
  {
    id: 'science',
    label: 'NASA Science',
    url: 'https://science.nasa.gov/feed/',
    site: 'https://science.nasa.gov/',
  },
  {
    id: 'blogs',
    label: 'NASA blogs',
    url: 'https://www.nasa.gov/feed/',
    site: 'https://www.nasa.gov/nasa-blogs/',
  },
]

/**
 * Astronomy Picture of the Day is a JSON API rather than a feed. It works with
 * the shared DEMO_KEY (rate limited); set NASA_API_KEY for a private key.
 */
export function apodUrl({ days = 14, apiKey = process.env.NASA_API_KEY || 'DEMO_KEY' } = {}) {
  const end = new Date()
  const start = new Date(end.getTime() - (days - 1) * 86400000)
  const stamp = (date) => date.toISOString().slice(0, 10)
  return `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey)}&start_date=${stamp(start)}&end_date=${stamp(end)}`
}

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–',
  mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
}

function decodeEntities(text = '') {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
}

function stripHtml(html = '') {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

/** Feeds often append "The post X appeared first on Y." — trim that boilerplate. */
function tidySummary(text = '', limit = 320) {
  const cleaned = stripHtml(text)
    .replace(/The post .* appeared first on .*\./i, '')
    .replace(/\[\s*…\s*\]|\[\.\.\.\]/g, '…')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length <= limit) return cleaned
  const cut = cleaned.slice(0, limit)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 120 ? lastSpace : limit).trimEnd()}…`
}

function tidyTitle(text = '') {
  return stripHtml(text).replace(/\s+/g, ' ').trim()
}

function tagText(block, ...names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))
    if (match) {
      const cdata = match[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/)
      return (cdata ? cdata[1] : match[1]).trim()
    }
  }
  return ''
}

function attribute(block, tag, attr) {
  const match = block.match(new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']+)["']`, 'i'))
  return match ? match[1].trim() : ''
}

function findImage(block) {
  const candidates = [
    ...[...block.matchAll(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*>/gi)].map(m => [m[1], m[0]]),
    ...[...block.matchAll(/<media:(?:content|thumbnail)\b[^>]*url=["']([^"']+)["']/gi)].map(m => [m[1], m[0]]),
    ...[...block.matchAll(/<itunes:image\b[^>]*href=["']([^"']+)["']/gi)].map(m => [m[1], '']),
  ]
  for (const [url, attrs] of candidates) {
    if (/type=["'](?!image)/i.test(attrs)) continue
    if (/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url) || /image/i.test(attrs)) return url
  }
  const inline = block.match(/<img\b[^>]*src=["']([^"']+)["']/i)
  return inline ? inline[1] : null
}

function findLink(block) {
  const atom = block.match(/<link\b(?![^>]*rel=["'](?:self|edit|enclosure|replies|related|payment))/i)
  const atomSelfless = block.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
  if (atomSelfless) return atomSelfless[1]
  const anyHref = block.match(/<link\b[^>]*href=["']([^"']+)["']/i)
  if (anyHref) return anyHref[1]
  const plain = tagText(block, 'link')
  if (plain && /^https?:/i.test(plain)) return plain
  const guid = block.match(/<guid\b[^>]*isPermaLink=["']true["'][^>]*>([^<]+)</i)
  if (guid && /^https?:/i.test(guid[1].trim())) return guid[1].trim()
  return atom ? '' : ''
}

function findDate(block) {
  return tagText(block, 'pubDate', 'published', 'updated', 'dc:date', 'a10:updated')
}

function categoriesOf(block) {
  return [
    ...[...block.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category>/gi)].map(m => tidyTitle(m[1])),
    ...[...block.matchAll(/<category\b[^>]*term=["']([^"']+)["']/gi)].map(m => m[1]),
  ].filter(Boolean)
}

/**
 * Topics power the filter chips on the news page. Scoring keeps an item that
 * mentions both "Hubble" and "space station" in a sensible place.
 */
const TOPIC_KEYWORDS = {
  universe: ['galaxy', 'galaxies', 'universe', 'cosmic', 'cosmology', 'black hole', 'nebula', 'star', 'stellar',
    'exoplanet', 'planet outside', 'dark matter', 'dark energy', 'big bang', 'supernova', 'pulsar', 'quasar',
    'neutron star', 'gravity', 'cluster', 'webb', 'hubble', 'chandra', 'spitzer', 'roman', 'xrism', 'astrophysic',
    'gravitational', 'skywatch', 'constellation', 'zodiacal', 'ecliptic', 'solstice', 'equinox', 'comet', 'asteroid'],
  solar: ['sun', 'solar system', 'moon', 'lunar', 'mars', 'jupiter', 'saturn', 'venus', 'mercury', 'neptune',
    'uranus', 'pluto', 'dwarf planet', 'kuiper', 'rover', 'crater', 'regolith', 'heliophysic'],
  earth: ['earth', 'climate', 'hurricane', 'typhoon', 'volcano', 'volcanic', 'ocean', 'sea ice', 'wildfire',
    'atmosphere', 'weather', 'rainfall', 'observatoryearth', 'glacier', 'flood', 'drought', 'air quality'],
  missions: ['iss', 'space station', 'crewed', 'crew-', 'astronaut', 'cosmonaut', 'launch', 'rocket', 'spacecraft',
    'mission', 'artemis', 'orion', 'dragon', 'starliner', 'cygnus', 'progress', 'flyby', 'orbit', 'telescope',
    'observatory', 'satellite', 'rover', 'expedition', 'docking', 'reboost', 'spacesuit', 'spacewalk'],
}

export function classify(text = '') {
  const haystack = text.toLowerCase()
  let best = 'missions'
  let bestScore = 0
  for (const [topic, words] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0
    for (const word of words) if (haystack.includes(word)) score += word.includes(' ') ? 2 : 1
    if (score > bestScore) { best = topic; bestScore = score }
  }
  return best
}

function toIso(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function slug(text = '') {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function normalizeFeedItem(block, source) {
  const title = tidyTitle(tagText(block, 'title'))
  const link = findLink(block)
  const published = toIso(findDate(block))
  const rawSummary = tagText(block, 'description', 'summary', 'content:encoded', 'content')
  if (!title || !link) return null
  const categories = categoriesOf(block)
  return {
    id: `${source.id}-${slug(link) || slug(title)}`,
    title,
    summary: tidySummary(rawSummary),
    link,
    published,
    source: source.label,
    sourceId: source.id,
    sourceUrl: source.site,
    image: findImage(block),
    topic: classify(`${title} ${categories.join(' ')} ${stripHtml(rawSummary).slice(0, 400)}`),
    credit: null,
  }
}

function normalizeApodItem(entry, index) {
  if (!entry?.title || entry.media_type !== 'image') return null
  const [year, month, day] = (entry.date || '').split('-')
  const link = year ? `https://apod.nasa.gov/apod/ap${year.slice(2)}${month}${day}.html` : 'https://science.nasa.gov/apod/'
  return {
    id: `apod-${entry.date || index}`,
    title: entry.title,
    summary: tidySummary(entry.explanation, 300),
    link,
    published: entry.date ? new Date(`${entry.date}T06:00:00Z`).toISOString() : null,
    source: 'Astronomy Picture of the Day',
    sourceId: 'apod',
    sourceUrl: 'https://science.nasa.gov/apod/',
    image: entry.url || entry.hdurl || null,
    topic: classify(`${entry.title} ${entry.explanation || ''}`),
    credit: entry.copyright ? `© ${entry.copyright.replace(/\s+/g, ' ').trim()}` : null,
  }
}

async function readText(url, timeoutMs) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'user-agent': 'Universe/1.0 (educational space-news reader; +https://github.com/chargecoder123/Test)',
      accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*',
    },
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response.text()
}

async function fetchFeedSource(source, timeoutMs) {
  const xml = await readText(source.url, timeoutMs)
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map(match => match[0])
  return blocks
    .map(block => normalizeFeedItem(block, source))
    .filter(Boolean)
}

async function fetchApodSource(timeoutMs, days) {
  const payload = JSON.parse(await readText(apodUrl({ days }), timeoutMs))
  const entries = Array.isArray(payload) ? payload : [payload]
  return entries.map(normalizeApodItem).filter(Boolean)
}

function byNewestFirst(a, b) {
  return (b.published ? Date.parse(b.published) : 0) - (a.published ? Date.parse(a.published) : 0)
}

function dedupe(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = item.link || item.title
    const id = key.toLowerCase()
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/**
 * Fetches every source in parallel. Individual failures are reported per source
 * instead of failing the whole sync, so one quiet feed never blanks the page.
 */
export async function fetchNasaNews({ timeoutMs = DEFAULT_TIMEOUT_MS, apodDays = 14 } = {}) {
  const jobs = [
    ...FEED_SOURCES.map(async source => {
      try {
        const items = await fetchFeedSource(source, timeoutMs)
        return { id: source.id, label: source.label, url: source.url, site: source.site, ok: true, count: items.length, items }
      } catch (error) {
        return { id: source.id, label: source.label, url: source.url, site: source.site, ok: false, count: 0, error: String(error?.message || error), items: [] }
      }
    }),
    (async () => {
      const source = { id: 'apod', label: 'Astronomy Picture of the Day', url: apodUrl({ days: apodDays }), site: 'https://science.nasa.gov/apod/' }
      try {
        const items = await fetchApodSource(timeoutMs, apodDays)
        return { ...source, ok: true, count: items.length, items }
      } catch (error) {
        return { ...source, ok: false, count: 0, error: String(error?.message || error), items: [] }
      }
    })(),
  ]

  const sources = await Promise.all(jobs)
  const items = dedupe(sources.flatMap(source => source.items)).sort(byNewestFirst).slice(0, MAX_ITEMS)

  return {
    items,
    fetchedAt: new Date().toISOString(),
    sources: sources.map(({ id, label, url, site, ok, count, error }) => ({ id, label, url, site, ok, count, error: error || null })),
  }
}

/**
 * Tiny in-memory cache with stale-on-error behaviour: if NASA is unreachable for
 * a moment, visitors keep seeing the last good result instead of an error page.
 */
export function createNewsCache({ ttlMs = Number(process.env.NASA_NEWS_TTL_MS) || DEFAULT_TTL_MS } = {}) {
  let pending = null
  let lastGood = null

  return async function getNews({ force = false } = {}) {
    const fresh = lastGood && Date.now() - Date.parse(lastGood.fetchedAt) < ttlMs
    if (!force && fresh) return { ...lastGood, cached: true, stale: false }

    if (!force && pending) return pending

    pending = (async () => {
      try {
        const result = await fetchNasaNews()
        lastGood = result
        return { ...result, cached: false, stale: false }
      } catch (error) {
        if (lastGood) return { ...lastGood, cached: true, stale: true, error: String(error?.message || error) }
        throw error
      } finally {
        pending = null
      }
    })()

    return pending
  }
}
