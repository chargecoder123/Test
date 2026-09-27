#!/usr/bin/env node
/**
 * Regenerates `src/data/nasa-news.json`, the snapshot the news page renders
 * before (or instead of) a live sync.
 *
 * Run it by hand with `npm run sync:nasa`, or automatically — the included
 * GitHub Actions workflow runs it every 30 minutes and commits the result, so a
 * statically hosted copy of the site stays current with NASA's own feeds.
 *
 * Environment:
 *   NASA_API_KEY      Optional private api.nasa.gov key (defaults to DEMO_KEY).
 *   NASA_NEWS_LIMIT   Max items written to the snapshot (default 40).
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { fetchNasaNews } from '../server/nasa-news.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(root, 'src', 'data', 'nasa-news.json')
const limit = Number(process.env.NASA_NEWS_LIMIT) || 40

const payload = await fetchNasaNews()

if (payload.items.length === 0) {
  console.error('⚠️  No NASA items were fetched. Keeping the existing snapshot.\n')
  for (const source of payload.sources) {
    console.error(`   ${source.ok ? '✓' : '✗'} ${source.label}${source.ok ? ` (${source.count})` : ` — ${source.error}`}`)
  }
  process.exit(1)
}

const snapshot = {
  generatedAt: payload.fetchedAt,
  sources: payload.sources,
  items: payload.items.slice(0, limit),
}

await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`)

const failed = snapshot.sources.filter(source => !source.ok)
console.log(`✓ Wrote ${snapshot.items.length} NASA updates to src/data/nasa-news.json`)
for (const source of snapshot.sources) {
  console.log(`   ${source.ok ? '✓' : '✗'} ${source.label}: ${source.ok ? `${source.count} items` : source.error}`)
}
if (failed.length) console.log(`\nNote: ${failed.length} source(s) were unavailable; the others still synced.`)
