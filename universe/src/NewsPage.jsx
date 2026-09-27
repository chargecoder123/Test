import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, Clock, ExternalLink, Newspaper, RefreshCw, Rss, Search, Sparkles, X } from 'lucide-react'
import { NEWS_TOPICS, PAGE_SIZE, TOPIC_LABELS, filterNews, formatDate, isFresh, relativeTime } from './news'

/** Local artwork stands in when an item has no image, so cards never look broken. */
function fallbackImage(item) {
  if (/black hole|neutron star|gravitational/i.test(item.title)) return '/images/black-hole.jpg'
  if (item.topic === 'earth') return '/images/earth.jpg'
  if (item.topic === 'solar') return '/images/saturn-hero.jpg'
  if (item.topic === 'missions') return '/images/nebula.jpg'
  return '/images/galaxy.jpg'
}

function NewsThumb({ item, className = '' }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [item.image])

  if (item.image && !failed) {
    return <img className={`news-thumb ${className}`} src={item.image} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
  }
  return <div className={`news-thumb news-illustration ${className}`}>
    <img src={fallbackImage(item)} alt="" loading="lazy" decoding="async" />
    <span>SITE ILLUSTRATION</span>
  </div>
}

function StatusPill({ news }) {
  const label = news.mode === 'live' ? 'Live from NASA' : news.mode === 'cached' ? 'Last synced copy' : 'Bundled snapshot'
  return <span className={`news-pill mode-${news.mode}`}>
    <span className="news-pulse" aria-hidden="true" />
    {label}
    {news.syncing && <em>syncing…</em>}
  </span>
}

function NewsCard({ item, featured = false }) {
  return <article className={`news-card ${featured ? 'news-card-featured' : ''}`}>
    <a className="news-card-media" href={item.link} target="_blank" rel="noreferrer" tabIndex={-1} aria-hidden="true">
      <NewsThumb item={item} />
      {isFresh(item.published) && <span className="news-badge">NEW</span>}
    </a>
    <div className="news-card-body">
      <div className="news-card-meta">
        <span className="news-topic">{TOPIC_LABELS[item.topic] || item.source}</span>
        <span className="news-dot" aria-hidden="true" />
        <time dateTime={item.published || ''}>{formatDate(item.published)}</time>
      </div>
      <h3><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a></h3>
      {item.summary && <p>{item.summary}</p>}
      <div className="news-card-foot">
        <span className="news-source"><Rss size={12} /> {item.source}</span>
        <a className="news-read" href={item.link} target="_blank" rel="noreferrer">
          Read on NASA <ExternalLink size={13} />
          <span className="sr-only">: {item.title}</span>
        </a>
      </div>
      {item.credit && <small className="news-credit">{item.credit}</small>}
    </div>
  </article>
}

export default function NewsPage({ news, onBrowseTopics }) {
  const [topic, setTopic] = useState('all')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const results = useMemo(() => filterNews(news.items, { topic, query }), [news.items, topic, query])
  const counts = useMemo(() => {
    const tally = { all: news.items.length }
    for (const item of news.items) tally[item.topic] = (tally[item.topic] || 0) + 1
    return tally
  }, [news.items])

  useEffect(() => { setLimit(PAGE_SIZE) }, [topic, query])

  const featured = topic === 'all' && !query.trim() ? results[0] : null
  const rest = featured ? results.slice(1) : results
  const visible = rest.slice(0, Math.max(0, limit - (featured ? 1 : 0)))
  const hidden = rest.length - visible.length

  return <div className="news-page">
    <section className="news-intro container">
      <p className="eyebrow"><span className="tiny-star">✳</span>LIVE FROM NASA</p>
      <h1>News from the <em>universe.</em></h1>
      <p className="news-intro-copy">
        Whenever NASA publishes a news release, a science update, or an astronomy picture of the day,
        it appears here automatically. No copy-paste, no rebuild—just the latest view of the cosmos.
      </p>

      <div className="news-status">
        <StatusPill news={news} />
        <span className="news-updated"><Clock size={13} /> Updated {relativeTime(news.lastUpdated)}</span>
        <span className="news-auto"><Check size={13} /> Auto-syncs every {news.autoSyncMinutes} min</span>
        <button className="news-refresh" onClick={() => news.sync({ force: true })} disabled={news.syncing}>
          <RefreshCw size={14} className={news.syncing ? 'spin' : undefined} />
          {news.syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      {news.error && <p className="news-note">
        {news.mode === 'live' ? 'Live sync will retry on its own. ' : 'Live sync is unavailable here, so this page is showing the most recent copy we have. '}
        Headlines stay current through the scheduled snapshot in <code>npm run sync:nasa</code>.
      </p>}

      <ul className="news-sources" aria-label="Sources synced into this page">
        {(news.sources.length ? news.sources : []).map(source => <li key={source.id}>
          <a href={source.site || source.url} target="_blank" rel="noreferrer">
            <Newspaper size={13} /> {source.label}
            {typeof source.count === 'number' && <em>{source.count}</em>}
          </a>
        </li>)}
      </ul>
    </section>

    <section className="news-results container" aria-labelledby="news-results-heading">
      <div className="news-toolbar">
        <div className="news-filters" aria-label="Filter NASA updates">{NEWS_TOPICS.map(filter => {
          const count = counts[filter.id] || 0
          return <button key={filter.id} className={topic === filter.id ? 'active' : ''} aria-pressed={topic === filter.id} onClick={() => setTopic(filter.id)}>
            {filter.label}<em>{count}</em>
          </button>
        })}</div>
        <label className="news-search">
          <Search size={18} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search NASA updates…" aria-label="Search NASA updates" />
          {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}
        </label>
      </div>

      <h2 id="news-results-heading" className="sr-only">Latest NASA updates</h2>
      <p className="results-count" role="status">
        {results.length} {results.length === 1 ? 'update' : 'updates'}{topic === 'all' ? '' : ` in ${TOPIC_LABELS[topic]}`}{query.trim() ? ` matching “${query.trim()}”` : ''}
      </p>

      {featured && <NewsCard item={featured} featured />}

      {visible.length > 0 && <div className="news-grid">{visible.map(item => <NewsCard key={item.id} item={item} />)}</div>}

      {hidden > 0 && <div className="news-more">
        <button className="button button-dark" onClick={() => setLimit(limit + PAGE_SIZE)}>Show {Math.min(hidden, PAGE_SIZE)} more <ArrowRight size={16} /></button>
        <span>{hidden} still waiting in the wings.</span>
      </div>}

      {results.length === 0 && <div className="empty-search">
        <Sparkles size={38} strokeWidth={1} />
        <h3>Nothing on this frequency yet.</h3>
        <p>No NASA updates match that filter. Try another topic, or clear the search.</p>
        <button className="button button-dark" onClick={() => { setTopic('all'); setQuery('') }}>Show every update <ArrowRight size={16} /></button>
      </div>}
    </section>

    <section className="news-outro container">
      <div className="news-outro-card">
        <div>
          <p className="eyebrow"><span className="tiny-star">✳</span>HOW THIS PAGE STAYS CURRENT</p>
          <h2>A page that keeps <em>itself updated.</em></h2>
          <p>
            The page asks this site’s <code>/api/nasa-news</code> endpoint for NASA’s public feeds on load,
            every {news.autoSyncMinutes} minutes, and whenever you return to the tab. A scheduled workflow runs
            <code>npm run sync:nasa</code> to refresh the bundled snapshot, so even a static copy of the site stays close to NASA.
          </p>
        </div>
        <div className="news-outro-actions">
          <a className="button button-lime" href="https://science.nasa.gov/universe/" target="_blank" rel="noreferrer">
            Explore NASA’s universe <ArrowUpRight size={17} />
          </a>
          <button className="text-button" onClick={onBrowseTopics}>Back to the field guide <ArrowRight size={16} /></button>
        </div>
      </div>
      <p className="news-disclaimer">
        Universe is an independent educational project, not affiliated with NASA. Headlines, summaries, and
        thumbnail images come from NASA’s public feeds and APIs and are credited to NASA; local artwork is used
        where a story has no image. Always follow the link to read the full update on NASA’s own site.
      </p>
    </section>
  </div>
}
