import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowUpRight, ArrowRight, ArrowDown, ArrowUp, Search, X, Menu,
  Sparkles, Orbit, Grid2X2, Plus, Minus, Pause, Play,
  ChevronLeft, ChevronRight, Telescope, BookOpen, ExternalLink,
  Check, Shuffle,
} from 'lucide-react'
import { categories, topics, planets, epochs, questions } from './data'

const icons = { all: Grid2X2, solar: Orbit, deep: Sparkles, unknown: Telescope }
const navigation = [
  { href: '#discover', label: 'Discover' },
  { href: '#solar-system', label: 'Solar system' },
  { href: '#timeline', label: 'Cosmic timeline' },
  { href: '#perspectives', label: 'The big questions' },
]

function Logo({ light = false, onClick }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href="#top" aria-label="Universe home" onClick={onClick}>
    <svg viewBox="0 0 46 38" fill="none" aria-hidden="true"><g transform="translate(23 19) rotate(-29)" stroke="currentColor" strokeWidth="1.6"><circle r="11.5" /><ellipse rx="21" ry="7" /></g><circle cx="35.5" cy="6" r="2.2" fill="currentColor" /></svg>
    <span>universe<span className="brand-dot">.</span></span>
  </a>
}

function Eyebrow({ children, light = false }) {
  return <p className={`eyebrow ${light ? 'eyebrow-light' : ''}`}><span className="tiny-star">✳</span>{children}</p>
}

function Starfield({ count = 24 }) {
  return <div className="starfield" aria-hidden="true">{Array.from({ length: count }, (_, i) =>
    <i key={i} style={{ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 23 + 7) % 100}%`, '--delay': `${i * -0.7}s`, '--size': i % 5 === 0 ? '3px' : '2px' }} />
  )}</div>
}

function Geometry({ type = 'flat' }) {
  const lines = []
  if (type === 'closed') {
    for (let i = 0; i < 12; i++) {
      const longitude = i * Math.PI / 6
      const points = Array.from({ length: 42 }, (_, j) => {
        const latitude = -Math.PI / 2 + j * Math.PI / 41
        return `${160 + Math.cos(latitude) * Math.cos(longitude) * 77},${109 + Math.sin(latitude) * 68 + Math.cos(latitude) * Math.sin(longitude) * 17}`
      }).join(' ')
      lines.push(<polyline key={`long-${i}`} points={points} />)
    }
    for (let i = 1; i < 9; i++) {
      const latitude = -Math.PI / 2 + i * Math.PI / 9
      const points = Array.from({ length: 65 }, (_, j) => {
        const longitude = j * Math.PI / 32
        return `${160 + Math.cos(latitude) * Math.cos(longitude) * 77},${109 + Math.sin(latitude) * 68 + Math.cos(latitude) * Math.sin(longitude) * 17}`
      }).join(' ')
      lines.push(<polyline key={`lat-${i}`} points={points} />)
    }
  } else if (type === 'multiverse') {
    ;[[111, 83, 40], [191, 107, 53], [130, 146, 26], [232, 59, 19]].forEach(([x, y, r], i) => {
      lines.push(<g key={i}><circle cx={x} cy={y} r={r} /><ellipse cx={x} cy={y} rx={r / 2} ry={r} /><ellipse cx={x} cy={y} rx={r} ry={r / 3} /></g>)
    })
  } else if (type === 'cyclic') {
    for (let i = 0; i < 5; i++) lines.push(<ellipse key={i} cx="160" cy="110" rx={34 + i * 15} ry={16 + i * 13} transform={`rotate(${i * 15} 160 110)`} />)
  } else {
    const point = (x, z) => {
      const height = type === 'open' ? (x * x - z * z) * 0.65 : 0
      return `${160 + (x - z) * 37},${115 + (x + z) * 15 - height * 24}`
    }
    for (let i = 0; i <= 10; i++) {
      const fixed = -1.6 + i * 0.32
      lines.push(<polyline key={`x-${i}`} points={Array.from({ length: 35 }, (_, j) => point(fixed, -1.6 + j * 3.2 / 34)).join(' ')} />)
      lines.push(<polyline key={`z-${i}`} points={Array.from({ length: 35 }, (_, j) => point(-1.6 + j * 3.2 / 34, fixed)).join(' ')} />)
    }
  }
  return <svg className={`geometry-svg geometry-${type}`} viewBox="0 0 320 220" role="img" aria-label={`${type} geometry: a simplified two-dimensional analogy`}><g fill="none" stroke="currentColor" strokeWidth="0.85">{lines}</g></svg>
}

function TopicArtwork({ topic, className = '', loading = 'lazy' }) {
  if (topic.geometry) return <div className={`topic-art art-geometry ${className}`}><Geometry type={topic.geometry} /><span className="art-caption">A VISUAL ANALOGY</span></div>
  if (topic.art) return <div className={`topic-art art-${topic.art} ${className}`}><Starfield count={14} />{topic.art === 'asteroids' ? <div className="asteroid-field"><i /><i /><i /><i /><i /></div> : <span className={`planet-sphere large-sphere ${topic.art.replace('planet-', '')}`} />}</div>
  return <img className={className} src={topic.image} alt={topic.imageAlt || `An illustration for ${topic.title}`} loading={loading} />
}

function DiscoveryCard({ topic, onOpen }) {
  return <button className="discovery-card" onClick={() => onOpen(topic)}>
    <div className={`discovery-image image-${topic.id}`}>
      <TopicArtwork topic={topic} />
      <span className="image-tag"><span />{topic.category === 'solar' ? 'CLOSER TO HOME' : topic.category === 'deep' ? 'INTO DEEP SPACE' : 'BEYOND THE FAMILIAR'}</span>
      <span className="image-arrow"><ArrowUpRight size={20} strokeWidth={1.5} /></span>
    </div>
    <div className="discovery-copy"><h3>{topic.title}</h3><p>{topic.subtitle}</p><span className="card-link">Find your wonder <ArrowRight size={15} /></span></div>
  </button>
}

function OrbitDiagram({ selected, onSelect }) {
  const radii = [36, 58, 83, 107, 136, 164, 190, 218]
  const angles = [-80, 133, 40, 208, -17, 167, 69, 252]
  return <div className="solar-diagram" aria-label="Interactive solar system illustration, sizes and orbits not to scale">
    <div className="diagram-center"><div className="solar-sun" /><span className="sun-label">SUN</span>
      {planets.map((planet, i) => <div key={planet.id} className={`orbit-track ${selected === i ? 'orbit-selected' : ''}`} style={{ '--diameter': `${radii[i] * 2}px`, '--duration': `${80 + i * 24}s`, '--angle': `${angles[i]}deg` }}>
        <button className={`orbit-planet orbit-planet-${i}`} aria-label={`Select ${planet.name}`} aria-pressed={selected === i} onClick={() => onSelect(i)}>
          <span className={`planet-sphere ${planet.id}`} />
          {selected === i && <span className="planet-pin">{planet.name}</span>}
        </button>
      </div>)}
    </div>
    <p className="diagram-note"><span />AN ARTIST’S VIEW · NOT TO SCALE</p>
  </div>
}

function Dialog({ children, onClose, className = '' }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const application = document.getElementById('root')
    const previousInert = application.inert
    application.inert = true
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => {
      const focusTarget = dialogRef.current?.querySelector('[data-autofocus]') || dialogRef.current?.querySelector('button')
      focusTarget?.focus()
    })
    const handleKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'Tab') {
        const focusable = [...(dialogRef.current?.querySelectorAll('a[href], button:not([disabled]), input, [tabindex="0"]') || [])].filter(el => el.getClientRects().length)
        const first = focusable[0], last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => { cancelAnimationFrame(frame); application.inert = previousInert; document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKey) }
  }, [onClose])
  return createPortal(<div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <div ref={dialogRef} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <button className="modal-close icon-button" aria-label="Close dialog" onClick={onClose}><X size={21} /></button>
      {children}
    </div>
  </div>, document.body)
}

function Library({ onOpen }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const results = topics.filter(t => (category === 'all' || t.category === category) && `${t.title} ${t.subtitle} ${t.tag} ${t.intro}`.toLowerCase().includes(search.toLowerCase().trim()))
  return <div className="library">
    <div className="library-header"><Eyebrow>LET CURIOSITY LEAD</Eyebrow><h2 id="dialog-title">A whole universe to <em>discover.</em></h2>
      <label className="library-search"><Search size={20} /><input data-autofocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Galaxies, black holes, other universes…" aria-label="Search discoveries" />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={17} /></button>}<kbd>ESC</kbd></label>
      <div className="library-filters">{categories.map(c => <button key={c.id} className={category === c.id ? 'selected' : ''} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</button>)}</div>
    </div>
    <div className="library-results"><p className="results-count" role="status">{results.length} {results.length === 1 ? 'discovery' : 'discoveries'} for a curious mind</p>
      <div className="library-grid">{results.map(topic => <button className="library-card" key={topic.id} onClick={() => onOpen(topic)}><div className="library-thumb"><TopicArtwork topic={topic} /></div><div><span>{topic.tag}</span><h3>{topic.title}</h3><p>{topic.subtitle}</p></div><ArrowUpRight size={18} /></button>)}</div>
      {results.length === 0 && <div className="empty-search"><Telescope size={38} strokeWidth={1} /><h3>A little beyond our horizon.</h3><p>No discoveries match that search. Try “stars,” “planets,” or “universe.”</p><button className="button button-dark" onClick={() => { setSearch(''); setCategory('all') }}>Show all discoveries <ArrowRight size={16} /></button></div>}
    </div>
  </div>
}

function TopicReader({ topic, fromLibrary, onBack }) {
  return <article className="topic-reader">
    <div className="reader-top">{fromLibrary ? <button className="text-button" onClick={onBack}><ChevronLeft size={16} /> Back to all discoveries</button> : <span className="reader-series"><Orbit size={15} /> THE UNIVERSE FIELD GUIDE</span>}</div>
    <div className={`reader-image image-${topic.id}`}><TopicArtwork topic={topic} loading="eager" /></div>
    <div className="reader-content"><div className="reader-meta"><span>{topic.tag}</span><span><BookOpen size={13} /> {topic.readTime || 2} MIN READ</span></div>
      <h2 id="dialog-title">{topic.title}</h2><p className="reader-intro">{topic.intro}</p>
      {topic.body.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
      <aside className="reader-fact"><Sparkles size={22} /><div><span>A LITTLE PERSPECTIVE</span><p>{topic.fact}</p></div></aside>
      <a className="reader-source" href={topic.source} target="_blank" rel="noreferrer">Keep exploring with {topic.sourceLabel} <ExternalLink size={15} /></a>
      {topic.credit && <small className="image-credit">Image: {topic.credit}</small>}
    </div>
  </article>
}

const tourStops = [
  { title: 'Start with our pale blue dot.', scale: '12,742 KM ACROSS', image: '/images/earth.jpg', text: 'Everything familiar—every ocean, city, and person you have ever known—belongs to this small, remarkable world.', label: 'OUR HOME' },
  { title: 'One star. A family of worlds.', scale: '8 PLANETS · ONE SUN', image: '/images/saturn-hero.jpg', text: 'Earth is one of eight planets orbiting the Sun, along with dwarf planets, moons, asteroids, and comets. We are part of a much bigger neighborhood.', label: 'OUR SOLAR SYSTEM' },
  { title: 'Now imagine a hundred billion suns.', scale: 'ABOUT 100,000 LIGHT-YEARS ACROSS', image: '/images/galaxy.jpg', text: 'Our solar system is a tiny part of the Milky Way. Like the spiral galaxy shown here, our galaxy contains a vast community of stars.', label: 'OUR GALACTIC HOME' },
  { title: 'And that is only the beginning.', scale: 'ABOUT 93 BILLION LIGHT-YEARS ACROSS', image: '/images/nebula.jpg', text: 'The observable universe contains hundreds of billions of galaxies, perhaps more. Beyond our cosmic horizon? We do not know. There is plenty of room for wonder.', label: 'OUR OBSERVABLE UNIVERSE' },
]

function QuickTour({ onFinish }) {
  const [step, setStep] = useState(0)
  const stop = tourStops[step]
  return <div className="quick-tour"><div className="tour-image" key={step}><img src={stop.image} alt={['Illustration of Earth', 'Illustration of Saturn in our solar system', 'Hubble image of spiral galaxy NGC 1385', 'Webb image of the Pillars of Creation, one small part of our universe'][step]} /><span className="tour-scale">{stop.scale}</span></div>
    <div className="tour-content"><div className="tour-eyebrow"><Eyebrow>{stop.label}</Eyebrow><span>0{step + 1} / 04</span></div><h2 id="dialog-title">{stop.title}</h2><p>{stop.text}</p>
      <div className="tour-actions"><div className="tour-dots">{tourStops.map((s, i) => <button key={s.label} className={i === step ? 'active' : ''} aria-label={`Go to tour stop ${i + 1}: ${s.label}`} aria-pressed={i === step} onClick={() => setStep(i)} />)}</div>
        <div className="tour-buttons"><button className="icon-button tour-back" disabled={step === 0} aria-label="Previous tour stop" onClick={() => setStep(step - 1)}><ChevronLeft size={20} /></button><button className="button button-dark" onClick={() => step === 3 ? onFinish() : setStep(step + 1)}>{step === 3 ? 'Keep exploring' : 'A little further'}<ArrowRight size={17} /></button></div>
      </div>
    </div>
  </div>
}

function Credits() {
  return <div className="credits-content"><Eyebrow>GROUNDED IN SCIENCE</Eyebrow><h2 id="dialog-title">A note on our <em>little guide.</em></h2><p>Universe is an independent educational project, not affiliated with NASA, ESA, or any space agency. It is designed to make big ideas a little more approachable.</p>
    <h3>Science, with a little humility.</h3><p>Cosmic ages, distances, and planet measurements are rounded estimates. Our 93-billion-light-year figure refers to the present-day diameter of the <strong>observable</strong> universe, not the entire universe. Planet sizes, orbital paths, and animation speeds are illustrative and not to scale.</p><p>Flat, open, and closed describe possibilities for spatial geometry—not separate observed universes. Multiverse and cyclic-universe ideas are speculative and clearly labeled. The geometric diagrams are simplified visual analogies.</p>
    <h3>Our starting points</h3><div className="credits-links"><a href="https://science.nasa.gov/universe/" target="_blank" rel="noreferrer">NASA · Our universe <ExternalLink size={15} /></a><a href="https://science.nasa.gov/solar-system/" target="_blank" rel="noreferrer">NASA · The solar system <ExternalLink size={15} /></a><a href="https://map.gsfc.nasa.gov/universe/uni_shape.html" target="_blank" rel="noreferrer">NASA WMAP · Cosmic geometry <ExternalLink size={15} /></a></div>
    <h3>Astronomical imagery</h3><p>Galaxy: Hubble image of NGC 1385, credited to ESA/Hubble & NASA, J. Lee and the PHANGS-HST team. Nebula: James Webb image of the Pillars of Creation, credited to NASA, ESA, CSA, and STScI. The Saturn, Earth, and black-hole images are AI-generated scientific illustrations, not observational photographs. Some images represent a broader topic rather than the exact object discussed.</p><p>All illustrations and animations are for learning, not scientific measurement. This site honors your device’s reduced-motion preference, and you can pause the animations at any time.</p>
  </div>
}

function makePlanetTopic(planet) {
  if (planet.id === 'saturn') return topics.find(t => t.id === 'saturn')
  return {
    id: planet.id, title: planet.name, tag: planet.type.toUpperCase(), readTime: 2,
    ...(planet.id === 'earth' ? { image: '/images/earth.jpg', imageAlt: 'Scientific illustration of the Earth', credit: 'AI-generated scientific illustration' } : { art: `planet-${planet.id}` }),
    intro: planet.description,
    body: [planet.fact, `${planet.name} orbits at an average distance of about ${planet.distance.replace('M', ' million').replace('B', ' billion')} kilometers from the Sun. One orbit takes approximately ${planet.year} ${planet.yearUnit.toLowerCase()}. Its mean diameter is about ${planet.diameter} kilometers.`, `${planet.type === 'Terrestrial planet' ? 'As a terrestrial planet, it has a solid, rocky surface. The four inner planets share that basic structure, yet their atmospheres, climates, and histories are remarkably different.' : planet.type === 'Ice giant' ? 'The ice giants contain a greater proportion of heavier elements than Jupiter and Saturn. The word “ice” describes ingredients such as water, ammonia, and methane—not a frozen, solid surface you could stand on.' : 'As a gas giant, it is composed primarily of hydrogen and helium. There is no solid surface like Earth’s: the atmosphere gradually becomes denser with depth.'} The distances and sizes in our interactive model are artistic, rather than to scale.`],
    fact: planet.id === 'earth' ? 'Looking after this one small world is the most down-to-Earth thing a space explorer can do.' : planet.fact,
    source: `https://science.nasa.gov/${planet.id}/`, sourceLabel: `NASA · ${planet.name}`,
  }
}

export default function App() {
  const [category, setCategory] = useState('all')
  const [selectedPlanet, setSelectedPlanet] = useState(2)
  const [epoch, setEpoch] = useState(0)
  const [faqOpen, setFaqOpen] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('#discover')
  const [modal, setModal] = useState(null)
  const [motion, setMotion] = useState(() => {
    try { const saved = localStorage.getItem('universe-motion'); if (saved !== null) return saved === 'on' } catch { /* Private browsing: use system preference. */ }
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const returnFocus = useRef(null)
  const menuButton = useRef(null)
  const openModal = useCallback((next) => {
    if (!document.querySelector('[role="dialog"]')) returnFocus.current = document.activeElement
    setMobileOpen(false)
    setModal(next)
  }, [])
  const closeModal = useCallback(() => { setModal(null); requestAnimationFrame(() => returnFocus.current?.focus({ preventScroll: true })) }, [])
  const openTopic = useCallback(topic => openModal({ type: 'topic', topic }), [openModal])
  const planet = planets[selectedPlanet]
  const currentEpoch = epochs[epoch]
  const visibleTopics = (category === 'all' ? topics : topics.filter(t => t.category === category)).slice(0, 4)

  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off'
    try { localStorage.setItem('universe-motion', motion ? 'on' : 'off') } catch { /* The experience also works without local storage. */ }
  }, [motion])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target) } })
    }, { threshold: 0.08 })
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveNav(`#${entry.target.id}`) })
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 })
    navigation.forEach(n => { const el = document.querySelector(n.href); if (el) navObserver.observe(el) })
    return () => { observer.disconnect(); navObserver.disconnect() }
  }, [])

  useEffect(() => {
    const handleKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openModal({ type: 'library' }) }
      if (e.key === 'Escape' && mobileOpen) { setMobileOpen(false); menuButton.current?.focus() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mobileOpen, openModal])

  function surpriseMe() { openTopic(topics[Math.floor(Math.random() * topics.length)]) }

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header" id="top">
      <div className="header-inner"><Logo onClick={() => setMobileOpen(false)} /><div className="brand-caption">A SMALL GUIDE TO<br />A VERY BIG PLACE.</div>
        <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(link => <a key={link.href} href={link.href} className={activeNav === link.href ? 'active' : ''} onClick={() => setActiveNav(link.href)}>{link.label}</a>)}</nav>
        <div className="header-actions"><button className="header-search icon-button" aria-label="Search the universe" title="Search discoveries (Ctrl/⌘ K)" onClick={() => openModal({ type: 'library' })}><Search size={19} strokeWidth={1.6} /></button><button className="header-cta" onClick={surpriseMe}>Surprise me <ArrowUpRight size={16} /></button><button className="menu-toggle icon-button" ref={menuButton} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="mobile-nav" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={23} /> : <Menu size={23} />}</button></div>
      </div>
      {mobileOpen && <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">{navigation.map(link => <a key={link.href} href={link.href} onClick={() => { setActiveNav(link.href); setMobileOpen(false) }}>{link.label}<ArrowUpRight size={17} /></a>)}<button onClick={surpriseMe}>Surprise me <Shuffle size={17} /></button></nav>}
    </header>

    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-background" /><div className="hero-shade" /><Starfield />
        <div className="hero-copy"><Eyebrow light>FOR THE ENDLESSLY CURIOUS</Eyebrow><h1 id="hero-title">The universe.<br /><em>A little closer.</em></h1><p>From our cosmic neighborhood to the edge of the unknown.<br className="desktop-break" /> A little understanding. A whole lot of wonder.</p>
          <div className="hero-actions"><a className="button button-lime" href="#discover">Begin your journey <ArrowUpRight size={19} /></a><button className="hero-tour" onClick={() => openModal({ type: 'tour' })}><span><Play size={12} fill="currentColor" /></span>A little perspective</button></div>
        </div>
        <button className="saturn-label" onClick={() => openTopic(topics.find(t => t.id === 'saturn'))}><span className="saturn-marker" /><span><small>OUR SOLAR SYSTEM / 06</small><strong>Saturn. Quite the ring to it.</strong></span><ArrowUpRight size={16} /></button>
        <div className="hero-bottom"><a href="#discover" className="hero-scroll"><span><ArrowDown size={16} strokeWidth={1.4} /></span>SCROLL TO DISCOVER</a><span className="hero-bottom-note">INFINITE POSSIBILITIES. NO ROCKET REQUIRED.</span><button className="motion-control" onClick={() => setMotion(!motion)} aria-label={motion ? 'Pause animations' : 'Resume animations'} aria-pressed={!motion} title={motion ? 'Pause animations' : 'Resume animations'}>{motion ? <Pause size={14} /> : <Play size={14} />}<span>{motion ? 'A MOMENT OF CALM' : 'MOTION PAUSED'}</span></button></div>
      </section>

      <section className="cosmic-stats container" aria-label="The universe, in perspective">
        <div><strong>13.8<span>B</span></strong><span>YEARS IN THE MAKING</span></div><div><strong>93<span>B</span></strong><span>LIGHT-YEARS ACROSS <button aria-label="Learn about the observable universe" onClick={() => openTopic(topics.find(t => t.id === 'observable'))}>↗</button></span></div><div><strong>100<span>B+</span></strong><span>STARS IN OUR GALAXY</span></div><div><strong className="infinity">∞</strong><span>REASONS TO STAY CURIOUS</span></div>
      </section>

      <section className="discovery-section section container" id="discover">
        <div className="section-heading reveal"><div><Eyebrow>01 / FOLLOW YOUR CURIOSITY</Eyebrow><h2>Big questions.<br className="mobile-break" /> <em>Beautiful discoveries.</em></h2></div><p>You don’t need a telescope to see things differently.<br /> Just pick a place to begin.</p></div>
        <div className="discovery-toolbar"><div className="category-tabs" aria-label="Filter discoveries">{categories.map(c => { const Icon = icons[c.icon]; return <button key={c.id} className={category === c.id ? 'active' : ''} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}><Icon size={15} strokeWidth={1.5} />{c.label}</button> })}</div><button className="view-all text-button" onClick={() => openModal({ type: 'library' })}>View all discoveries <ArrowUpRight size={17} /></button></div>
        <div className="discovery-grid" key={category}>{visibleTopics.map(topic => <DiscoveryCard key={topic.id} topic={topic} onOpen={openTopic} />)}</div>
        <div className="stardust-note reveal"><div className="stardust-symbol" aria-hidden="true">✳</div><div><span>A MOMENT OF PERSPECTIVE</span><p>You are not just in the universe. <em>The universe is in you.</em></p></div><button onClick={() => openTopic(topics.find(t => t.id === 'stars-nebulae'))} className="text-button">We’re made of stardust <ArrowUpRight size={18} /></button></div>
      </section>

      <section className="solar-section section container" id="solar-system">
        <div className="section-heading reveal"><div><Eyebrow>02 / OUR LITTLE CORNER</Eyebrow><h2>Meet the <em>neighborhood.</em></h2></div><p>Eight extraordinary worlds. One remarkable star.<br /> Select a planet. Get a little closer.</p></div>
        <div className="solar-explorer reveal"><Starfield count={30} /><div className="solar-topline"><span><Orbit size={15} /> THE SOLAR SYSTEM</span><span><i /> A LITTLE COSMIC CONTEXT</span></div>
          <div className="solar-main"><OrbitDiagram selected={selectedPlanet} onSelect={setSelectedPlanet} /><div className="planet-details" key={planet.id} style={{ '--planet-color': planet.color }}><span className="planet-eyebrow"><span />{planet.label}</span><h3>{planet.name}<span>0{selectedPlanet + 1}</span></h3><p>{planet.description}</p><div className="planet-facts"><div><strong>{planet.distance}<small> km</small></strong><span>FROM THE SUN, ON AVERAGE</span></div><div><strong>{planet.year}<small> {planet.yearUnit === 'Earth days' ? 'days' : 'years'}</small></strong><span>ONE TRIP AROUND THE SUN</span></div></div><button className="planet-read" onClick={() => openTopic(makePlanetTopic(planet))}>Get to know {planet.name}<ArrowUpRight size={18} /></button></div></div>
          <div className="planet-picker" aria-label="Choose a planet">{planets.map((p, i) => <button key={p.id} className={selectedPlanet === i ? 'selected' : ''} aria-pressed={selectedPlanet === i} onClick={() => setSelectedPlanet(i)}><span className={`planet-sphere ${p.id}`} /><span>{p.name}</span>{selectedPlanet === i && <span className="picker-dot" />}</button>)}</div>
        </div>
      </section>

      <section className="timeline-section section container" id="timeline">
        <div className="section-heading reveal"><div><Eyebrow>03 / A STORY 13.8 BILLION YEARS LONG</Eyebrow><h2>Everything has <em>a beginning.</em></h2></div><p>From the first moments to this very moment.<br /> A brief history of, well, everything.</p></div>
        <div className="timeline-track" aria-label="Choose an era in cosmic history">{epochs.map((event, i) => <button key={event.short} onClick={() => setEpoch(i)} className={epoch === i ? 'active' : ''} aria-pressed={epoch === i}><span className="timeline-date">{event.date}</span><span className="timeline-dot"><span /></span><span className="timeline-event">{event.short}</span></button>)}</div>
        <div className="epoch-panel" key={epoch} style={{ '--epoch-color': currentEpoch.color }}><div className={`epoch-art epoch-${currentEpoch.className}`} aria-hidden="true"><Starfield count={30} /><div className="epoch-rings"><i /><i /><i /><i /><i /></div><div className="epoch-glow" /><span>13.8 BILLION YEARS OF BECOMING</span></div><div className="epoch-copy"><span className="overline">{currentEpoch.label}</span><h3>{currentEpoch.title}</h3><p>{currentEpoch.description}</p><div className="epoch-fact"><Sparkles size={17} /><span>{currentEpoch.fact}</span></div><div className="epoch-controls"><span>0{epoch + 1} <i>/ 05</i></span><button className="icon-button" aria-label="Previous era" disabled={epoch === 0} onClick={() => setEpoch(epoch - 1)}><ChevronLeft size={18} /></button><button className="icon-button" aria-label="Next era" disabled={epoch === epochs.length - 1} onClick={() => setEpoch(epoch + 1)}><ChevronRight size={18} /></button></div></div></div>
      </section>

      <section className="perspectives-section" id="perspectives"><div className="container section">
        <div className="section-heading reveal"><div><Eyebrow>04 / ROOM FOR POSSIBILITY</Eyebrow><h2>One universe.<br /><em>Many ways to imagine it.</em></h2></div><div className="perspectives-intro"><p>What shape is everything? Is our universe the only one?<br /> Explore the models—and the questions still wide open.</p><span><Check size={13} /> THE SCIENCE. THE THEORIES. THE DIFFERENCE.</span></div></div>
        <div className="model-grid">{['flat', 'open', 'closed'].map((type, i) => { const topic = topics.find(t => t.id === type); return <button className="model-card" key={type} onClick={() => openTopic(topic)}><div className="model-art"><span className={`model-status ${type === 'flat' ? 'supported' : ''}`}>{type === 'flat' ? <><span /> EVIDENCE FAVORS NEAR-FLATNESS</> : <><span /> A GEOMETRIC POSSIBILITY</>}</span><Geometry type={type} /><span className="model-number">0{i + 1}</span></div><div className="model-copy"><h3>{topic.title}<ArrowUpRight size={21} strokeWidth={1.4} /></h3><p>{['Space that follows familiar rules. Potentially infinite, with more than one possible topology.', 'Negative curvature. A saddle-shaped analogy for a universe that opens outward.', 'Positive curvature. A universe that could be finite, yet have no boundary.'][i]}</p><span>{['ZERO CURVATURE', 'NEGATIVE CURVATURE', 'POSITIVE CURVATURE'][i]}</span></div></button> })}</div>
        <div className="further-questions"><span>AND IF WE LOOK A LITTLE FURTHER…</span><div><button onClick={() => openTopic(topics.find(t => t.id === 'multiverse'))}>A multiverse? <ArrowUpRight size={15} /></button><button onClick={() => openTopic(topics.find(t => t.id === 'cyclic'))}>A cyclic universe? <ArrowUpRight size={15} /></button><span className="hypothesis-label">Intriguing ideas. Not established facts.</span></div></div>
      </div></section>

      <section className="faq-section container section"><div className="faq-heading"><Eyebrow>GOOD QUESTIONS NEVER GET OLD</Eyebrow><h2>A few things<br /><em>you might wonder.</em></h2><p>Big questions don’t always have simple answers.<br />But they’re always worth asking.</p><span className="faq-doodle" aria-hidden="true"><Orbit size={90} strokeWidth={0.65} /></span></div><div className="faq-list">{questions.map((question, i) => <div key={question.q} className={`faq-item ${faqOpen === i ? 'open' : ''}`}><h3><button onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i} aria-controls={`answer-${i}`}><span>{question.q}</span>{faqOpen === i ? <Minus size={18} /> : <Plus size={18} />}</button></h3><div id={`answer-${i}`} hidden={faqOpen !== i}><p>{question.a}</p></div></div>)}</div></section>

      <section className="wonder-section container reveal"><div className="wonder-orbits" aria-hidden="true"><i /><i /><i /><span>✳</span></div><div><Eyebrow light>STAY A LITTLE STARSTRUCK</Eyebrow><h2>There’s always<br /><em>more to wonder.</em></h2><p>Let your curiosity take the long way home.</p><button className="button button-lime" onClick={surpriseMe}>Show me something extraordinary <ArrowUpRight size={18} /></button></div><span className="wonder-footnote">A SMALL CLICK. A NEW PERSPECTIVE.</span></section>
    </main>

    <footer className="site-footer container"><div className="footer-top"><div><Logo /><p>A small guide to a very big place.</p></div><div className="footer-message">Grounded in science.<br /><em>Open to wonder.</em></div><a href="#top" className="back-to-top">Back to the stars <span><ArrowUp size={17} /></span></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Universe. Made for curious minds.</span><div><button onClick={() => openModal({ type: 'credits' })}>Science & image credits <ArrowUpRight size={13} /></button><span className="footer-dot" /><button onClick={() => setMotion(!motion)}>{motion ? <Pause size={12} /> : <Play size={12} />}Motion {motion ? 'on' : 'off'}</button></div></div></footer>

    {modal && <Dialog key={`${modal.type}-${modal.topic?.id || ''}`} onClose={closeModal} className={`modal-${modal.type}`}>
      {modal.type === 'library' && <Library onOpen={topic => openModal({ type: 'topic', topic, fromLibrary: true })} />}
      {modal.type === 'topic' && <TopicReader topic={modal.topic} fromLibrary={modal.fromLibrary} onBack={() => openModal({ type: 'library' })} />}
      {modal.type === 'tour' && <QuickTour onFinish={() => { closeModal(); document.getElementById('discover').scrollIntoView({ behavior: motion ? 'smooth' : 'instant' }) }} />}
      {modal.type === 'credits' && <Credits />}
    </Dialog>}
  </>
}
