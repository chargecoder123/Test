export const categories = [
  { id: 'all', label: 'All discoveries', icon: 'all' },
  { id: 'solar', label: 'Our solar system', icon: 'solar' },
  { id: 'deep', label: 'Stars & galaxies', icon: 'deep' },
  { id: 'unknown', label: 'The unknown', icon: 'unknown' },
]

export const topics = [
  {
    id: 'galaxies', title: 'Galaxies', subtitle: 'Cities of a billion suns.', category: 'deep', tag: 'THE GRAND DESIGNS', image: '/images/galaxy.jpg', imageAlt: 'Hubble view of the spiral galaxy NGC 1385, glowing with blue stars and pink star-forming regions', readTime: 3,
    intro: 'Sprawling islands of stars, dust, and possibility. Every galaxy has a story billions of years in the making.',
    body: [
      'A galaxy is a vast collection of stars, gas, dust, and dark matter, bound together by gravity. Our own is the Milky Way: a barred spiral galaxy with at least 100 billion stars. The Sun is just one of them, circling the galactic center roughly once every 230 million years.',
      'Galaxies come in many shapes. Spirals sweep their stars into graceful arms. Ellipticals resemble smooth, glowing clouds. Irregular galaxies break the pattern entirely, often reshaped by encounters with their neighbors.',
      'Looking at a distant galaxy is looking into the past. Its light may have traveled for billions of years before reaching a telescope. These ancient postcards help astronomers piece together how the universe grew from a nearly uniform beginning into the rich cosmic web we see today.',
    ],
    fact: 'The Milky Way is roughly 100,000 light-years across. Even light needs a hundred millennia to cross our galactic home.',
    source: 'https://science.nasa.gov/universe/galaxies/', sourceLabel: 'NASA · Galaxies', credit: 'ESA/Hubble & NASA, J. Lee and the PHANGS-HST team · NGC 1385',
  },
  {
    id: 'stars-nebulae', title: 'Stars & nebulae', subtitle: 'Where the universe gets creative.', category: 'deep', tag: 'BIRTHPLACES OF WONDER', image: '/images/nebula.jpg', imageAlt: 'James Webb view of the dusty Pillars of Creation in the Eagle Nebula', readTime: 3,
    intro: 'From clouds of cosmic dust to the light in our night sky. Meet the universe’s makers, dreamers, and recyclers.',
    body: [
      'Stars begin inside cold clouds of gas and dust called nebulae. Gravity gathers material into dense clumps. As a clump contracts, its core becomes hotter and denser until hydrogen fusion can begin. A star is born.',
      'A star’s mass shapes its life. Small red dwarfs burn fuel slowly and can last far longer than the universe’s current age. Massive stars shine brilliantly but live fast, sometimes ending in a spectacular supernova that scatters newly made elements into space.',
      'The carbon in our cells, the oxygen we breathe, and much of the iron in our blood were made by earlier generations of stars and stellar explosions. That material became new clouds, new stars, new planets—and eventually, us.',
    ],
    fact: 'The Pillars of Creation are about 6,500 light-years away. We see them as they were long before the first written histories.',
    source: 'https://science.nasa.gov/universe/stars/', sourceLabel: 'NASA · Stars', credit: 'NASA, ESA, CSA, STScI · James Webb Space Telescope',
  },
  {
    id: 'planets', title: 'Planets & moons', subtitle: 'Extraordinary worlds. Closer to home.', category: 'solar', tag: 'OUR COSMIC NEIGHBORHOOD', image: '/images/earth.jpg', imageAlt: 'Illustration of our blue Earth with white clouds, sunlit from the left', readTime: 3,
    intro: 'Rocky landscapes, giant storms, and oceans hidden beneath ice. There is no such thing as an ordinary world.',
    body: [
      'Our solar system has eight planets. Mercury, Venus, Earth, and Mars are rocky terrestrial worlds. Jupiter and Saturn are gas giants; Uranus and Neptune are ice giants, with greater proportions of heavier materials beneath their atmospheres.',
      'Moons are worlds in their own right. Jupiter’s Europa probably hides a salty ocean beneath its ice. Saturn’s Titan has lakes and seas of liquid methane and ethane. Our own Moon preserves a record of impacts from the solar system’s early history.',
      'Pluto is a dwarf planet, along with worlds such as Ceres, Eris, Haumea, and Makemake. Beyond our Sun, astronomers have confirmed thousands of exoplanets. Planetary systems are a common part of our galaxy, but so far Earth is the only world known to host life.',
    ],
    fact: 'Sunlight takes about 8 minutes and 20 seconds to reach Earth. Looking at the Sun is always looking a little into the past—never look without proper eye protection.',
    source: 'https://science.nasa.gov/solar-system/planets/', sourceLabel: 'NASA · Planets', credit: 'AI-generated scientific illustration; not a spacecraft photograph',
  },
  {
    id: 'black-holes', title: 'Black holes', subtitle: 'Where our understanding bends.', category: 'unknown', tag: 'AT THE EDGE OF THE KNOWN', image: '/images/black-hole.jpg', imageAlt: 'Scientific illustration of a black hole surrounded by a glowing golden accretion disk', readTime: 4,
    intro: 'A place where gravity rewrites the rules, light cannot escape, and the biggest questions are still open.',
    body: [
      'A black hole is a region where gravity is so strong that nothing—not even light—can escape once it crosses the event horizon. Some form when massive stars collapse. Supermassive black holes, with millions or billions of times the Sun’s mass, live at the centers of most large galaxies.',
      'Black holes are not cosmic vacuum cleaners. Far from the event horizon, their gravity works like that of any other object with the same mass. Replace the Sun with a black hole of equal mass, and Earth would keep orbiting—though it would become very cold and dark.',
      'The glow in an illustration comes from hot material outside the black hole, not the hole itself. We study black holes through that light, through nearby stars’ motions, and through gravitational waves. What happens at the deepest interior remains an unsolved meeting point of gravity and quantum physics.',
    ],
    fact: 'Sagittarius A*, the black hole at the Milky Way’s center, has about 4 million times the mass of our Sun.',
    source: 'https://science.nasa.gov/universe/black-holes/', sourceLabel: 'NASA · Black holes', credit: 'AI-generated scientific illustration; not a telescope photograph',
  },
  {
    id: 'sun', title: 'Our remarkable Sun', subtitle: 'The star that makes our days.', category: 'solar', tag: 'THE HEART OF OUR SYSTEM', image: '/images/saturn-hero.jpg', art: 'sun', imageAlt: 'A stylized glowing golden sun', readTime: 2,
    intro: 'An ordinary star that makes an extraordinary difference. Almost everything on Earth begins with its light.',
    body: ['The Sun is a middle-aged star about 4.6 billion years old. Deep in its core, nuclear fusion transforms hydrogen into helium, releasing the energy that eventually leaves its surface as light and heat.', 'It contains about 99.8 percent of our solar system’s mass. Its gravity holds the planets in orbit, while its magnetic activity shapes space weather. In roughly 5 billion years, it will begin expanding into a red giant, eventually leaving a dense white dwarf behind.'],
    fact: 'About 1.3 million Earths could fit inside the Sun by volume.', source: 'https://science.nasa.gov/sun/', sourceLabel: 'NASA · Our Sun',
  },
  {
    id: 'saturn', title: 'Saturn & its rings', subtitle: 'A world with a little extra wonder.', category: 'solar', tag: 'THE RINGED WORLD', image: '/images/saturn-hero.jpg', imageAlt: 'Illustration of golden Saturn and its sweeping rings', readTime: 2,
    intro: 'An airy giant, an intricate ring system, and a family of moons that keep surprising us.',
    body: ['Saturn is the sixth planet from the Sun and the second largest in our solar system. Its atmosphere is mostly hydrogen and helium, and its average density is lower than that of water.', 'The rings are not solid. They consist of countless pieces of ice and rock, ranging from dust-sized grains to boulders. Gravity, collisions, and the influence of small moons sculpt them into an intricate system of bands and gaps.', 'The Cassini mission revealed extraordinary moons, including Enceladus, whose icy jets carry water from a subsurface ocean into space, and Titan, with its thick atmosphere and methane weather cycle.'],
    fact: 'A year on Saturn lasts about 29.4 Earth years. A day is only about 10.7 hours.', source: 'https://science.nasa.gov/saturn/', sourceLabel: 'NASA · Saturn', credit: 'AI-generated scientific illustration',
  },
  {
    id: 'small-worlds', title: 'Small worlds, big stories', subtitle: 'Asteroids, comets & dwarf planets.', category: 'solar', tag: 'ANCIENT TIME CAPSULES', image: '/images/galaxy.jpg', art: 'asteroids', imageAlt: 'Stylized small rocky worlds against space', readTime: 2,
    intro: 'Leftovers from the solar system’s beginning can tell us more than you might imagine.',
    body: ['Asteroids are rocky remnants of planet formation. Most orbit the Sun between Mars and Jupiter, though others travel much closer to Earth or share giant planets’ orbits.', 'Comets contain ice, dust, and rock. When one approaches the Sun, its ices release gas, creating a hazy coma and sometimes long tails. A comet’s ion tail points away from the Sun, shaped by the solar wind.', 'Dwarf planets are round worlds that orbit the Sun but have not cleared their orbital neighborhoods. Studying these small bodies helps us reconstruct the ingredients and processes that built the planets.'],
    fact: 'Ceres is both a dwarf planet and the largest object in the asteroid belt.', source: 'https://science.nasa.gov/solar-system/', sourceLabel: 'NASA · Solar system',
  },
  {
    id: 'cosmic-web', title: 'The cosmic web', subtitle: 'The biggest picture of all.', category: 'deep', tag: 'EVERYTHING IS CONNECTED', image: '/images/galaxy.jpg', readTime: 3,
    intro: 'Step back far enough, and galaxies become threads in a structure almost too vast to imagine.',
    body: ['Galaxies are not scattered randomly. They gather in groups and clusters, along immense filaments surrounding enormous, relatively empty voids. Together these structures form the cosmic web.', 'Tiny differences in the early universe’s density grew under gravity. Dark matter helped provide the gravitational scaffolding, and ordinary matter collected within it to form stars and galaxies.', 'The web extends across the observable universe. By mapping it, astronomers test how gravity, dark matter, and cosmic expansion have shaped the universe over billions of years.'],
    fact: 'Our Milky Way belongs to the Local Group, along with Andromeda and many smaller galaxies.', source: 'https://science.nasa.gov/universe/galaxies/', sourceLabel: 'NASA · Galaxies', credit: 'NASA and ESA · Hubble image of a galaxy, not the entire cosmic web',
  },
  {
    id: 'exoplanets', title: 'Worlds beyond our Sun', subtitle: 'Other stars. Other possibilities.', category: 'deep', tag: 'DISTANT NEIGHBORS', image: '/images/earth.jpg', readTime: 3,
    intro: 'Some have two suns. Some rain molten rock. Thousands of worlds are expanding our idea of what a planet can be.',
    body: ['An exoplanet is a planet orbiting a star other than our Sun. We often find one when it passes in front of its star, causing a tiny, regular dip in starlight. Another method measures a star’s subtle wobble caused by an orbiting planet’s gravity.', 'There are hot Jupiters, rocky super-Earths, and sub-Neptunes with no exact counterpart in our solar system. A planet in a star’s habitable zone could have liquid surface water under the right conditions—but that is not proof of habitability or life.', 'Space telescopes can study starlight filtered through a planet’s atmosphere to search for chemical signatures. Finding and interpreting possible signs of life remains a careful, ongoing scientific challenge.'],
    fact: 'The first confirmed planets around a Sun-like star were unlike anything expected: giant worlds in very close orbits.', source: 'https://science.nasa.gov/exoplanets/', sourceLabel: 'NASA · Exoplanets', credit: 'AI-generated Earth illustration used to represent planetary worlds',
  },
  {
    id: 'dark-matter', title: 'The invisible universe', subtitle: 'More than meets the telescope.', category: 'unknown', tag: 'DARK MATTER & DARK ENERGY', image: '/images/galaxy.jpg', readTime: 4,
    intro: 'Everything we can see is only a small part of the cosmic story. The rest is one of science’s great mysteries.',
    body: ['In the standard cosmological model, ordinary matter makes up roughly 5 percent of the universe’s total matter-energy content. About 27 percent is dark matter, and about 68 percent is dark energy. These are different concepts, despite their similar names.', 'Dark matter has gravitational effects on galaxies, galaxy clusters, and light traveling through space, but has not been identified as a particle in the laboratory. It does not interact with light in the way ordinary matter does.', 'Dark energy is the name for whatever causes the expansion of the universe to accelerate. A cosmological constant is the simplest model that fits observations, but its physical nature is still an open question.'],
    fact: 'Ordinary atoms—the stuff of stars, planets, and us—account for only about 5% of the universe’s total matter-energy budget.', source: 'https://science.nasa.gov/dark-matter/', sourceLabel: 'NASA · Dark matter & dark energy', credit: 'NASA and ESA · Hubble galaxy image; dark matter is not directly visible',
  },
  {
    id: 'observable', title: 'The observable universe', subtitle: 'Our window into everything.', category: 'unknown', tag: 'THE LIMIT OF OUR VIEW', image: '/images/galaxy.jpg', readTime: 3,
    intro: 'The universe we can see is not necessarily the whole universe. Our cosmic horizon is a limit on information, not a wall.',
    body: ['The observable universe is the region from which light or other signals have had time to reach us since the early universe. It is centered on us only because we are the observers; an observer in another galaxy would have a different observable region.', 'Its present-day diameter is about 93 billion light-years, even though the universe is about 13.8 billion years old. Space has continued to expand while ancient light traveled toward us, so the places that emitted it are now much farther away.', 'We do not know the total size of the entire universe, or whether it is finite or infinite. The edge of what we can observe is not evidence of a physical edge to space.'],
    fact: 'The oldest light we directly observe is the cosmic microwave background, released about 380,000 years after the hot Big Bang.', source: 'https://science.nasa.gov/universe/overview/', sourceLabel: 'NASA · The universe', credit: 'NASA and ESA · An individual galaxy illustrates a much larger concept',
  },
  {
    id: 'flat', title: 'A flat universe', subtitle: 'The simplest picture. So far.', category: 'unknown', tag: 'CONSISTENT WITH OBSERVATIONS', geometry: 'flat', readTime: 3,
    intro: 'Not flat like a sheet of paper. Flat in the geometry of three-dimensional space, on the very largest scales.',
    body: ['In a spatially flat universe, the familiar large-scale rules of Euclidean geometry apply: the angles of an enormous triangle sum to 180 degrees, and initially parallel paths remain parallel. Local objects still curve spacetime through gravity.', 'Measurements of the cosmic microwave background and other observations are consistent with space being very close to flat. That does not establish that curvature is exactly zero.', 'A simply connected flat universe could extend forever, but flatness alone does not determine whether the universe is infinite. Its global topology is a separate question. The familiar sheet diagram is a two-dimensional analogy, not a picture of the universe viewed from outside.'],
    fact: 'The best-supported cosmological model uses space that is very close to flat, with dark matter and dark energy.', source: 'https://map.gsfc.nasa.gov/universe/uni_shape.html', sourceLabel: 'NASA WMAP · The shape of the universe',
  },
  {
    id: 'open', title: 'An open universe', subtitle: 'A different kind of geometry.', category: 'unknown', tag: 'A GEOMETRIC POSSIBILITY', geometry: 'open', readTime: 3,
    intro: 'What if space had a gentle, negative curvature? A saddle offers a glimpse of an unfamiliar geometry.',
    body: ['An open universe has negative spatial curvature. In a two-dimensional analogy, it resembles a saddle: paths that begin parallel diverge, and a very large triangle’s angles add to less than 180 degrees.', 'In the simplest version, such a universe is spatially infinite. The actual three-dimensional geometry cannot be fully represented by the little saddle drawing, which is only a learning aid.', 'Observations currently favor near-flat space rather than strong negative curvature. Also, spatial shape alone does not decide the universe’s ultimate fate: its energy content, especially dark energy, matters too.'],
    fact: '“Open” describes spatial geometry. It does not mean there is an opening, an edge, or a doorway somewhere in space.', source: 'https://map.gsfc.nasa.gov/universe/uni_shape.html', sourceLabel: 'NASA WMAP · The shape of the universe',
  },
  {
    id: 'closed', title: 'A closed universe', subtitle: 'Finite. But without an edge.', category: 'unknown', tag: 'A GEOMETRIC POSSIBILITY', geometry: 'closed', readTime: 3,
    intro: 'Could space curve back on itself? A universe can be finite without having a boundary.',
    body: ['A closed universe has positive spatial curvature. The usual analogy is the surface of a sphere: travel far enough in one direction and you could return to your starting point without encountering an edge.', 'That analogy represents only two dimensions. A simple closed universe would be a three-dimensional counterpart called a 3-sphere. There is no need for an external space that it sits inside.', 'Large-scale observations are consistent with near-flatness, so strong positive curvature is not favored. A closed geometry also does not guarantee a future collapse; dark energy changes how geometry and cosmic destiny are related.'],
    fact: 'In positively curved space, an enormous triangle can have angles whose sum is greater than 180 degrees.', source: 'https://map.gsfc.nasa.gov/universe/uni_shape.html', sourceLabel: 'NASA WMAP · The shape of the universe',
  },
  {
    id: 'multiverse', title: 'A multiverse?', subtitle: 'A possibility, not a discovery.', category: 'unknown', tag: 'SPECULATIVE HYPOTHESIS', geometry: 'multiverse', readTime: 3,
    intro: 'Perhaps our universe is one of many. It is an intriguing idea—and not an established scientific fact.',
    body: ['“Multiverse” is an umbrella term for several different proposals. Some versions of cosmic inflation suggest separate regions with distinct histories. Some interpretations of quantum mechanics describe branching outcomes. These are not the same claim.', 'There is currently no confirmed observational evidence for other universes. A central challenge is whether a particular version makes testable predictions that could distinguish it from alternatives.', 'Thinking about these possibilities can reveal the limits of our theories. The useful distinction is between a mathematical possibility, a testable scientific model, and something that has actually been observed.'],
    fact: 'Science is comfortable with “we don’t know yet.” An unanswered question is an invitation, not evidence for a particular answer.', source: 'https://science.nasa.gov/universe/overview/', sourceLabel: 'NASA · What we know about the universe',
  },
  {
    id: 'cyclic', title: 'A cyclic universe?', subtitle: 'Could the beginning be a beginning?', category: 'unknown', tag: 'SPECULATIVE HYPOTHESIS', geometry: 'cyclic', readTime: 3,
    intro: 'Some ideas imagine cosmic history as a series of cycles rather than a single one-way journey.',
    body: ['Cyclic and bouncing cosmologies propose ways an expanding era might follow an earlier phase. Different models invoke contraction, a quantum bounce, or entirely different connections between successive eras.', 'These ideas are not an established account of our universe. Models must confront difficult questions about entropy, the transition between phases, and whether they reproduce the observed cosmic microwave background.', 'The hot Big Bang model describes the universe’s early hot, dense state and subsequent evolution very well. It does not, by itself, settle what preceded that state or whether “before” is even a meaningful question.'],
    fact: 'The current accelerated expansion does not point to an imminent cosmic recollapse. Cyclic scenarios require additional, unconfirmed physics.', source: 'https://science.nasa.gov/universe/overview/', sourceLabel: 'NASA · The history of the universe',
  },
]

export const planets = [
  { id: 'mercury', name: 'Mercury', label: 'SMALL WORLD, BIG EXTREMES', type: 'Terrestrial planet', distance: '57.9M', year: '88', yearUnit: 'Earth days', diameter: '4,879', description: 'Small, swift, and covered in ancient craters. The closest planet to the Sun races through its year in just 88 Earth days.', fact: 'Mercury has almost no atmosphere to retain heat, so its nights are astonishingly cold.', color: '#afa391' },
  { id: 'venus', name: 'Venus', label: 'OUR BRILLIANT NEIGHBOR', type: 'Terrestrial planet', distance: '108.2M', year: '225', yearUnit: 'Earth days', diameter: '12,104', description: 'Wrapped in thick clouds, Venus is our hottest planetary neighbor. Its beautiful glow hides an extraordinary greenhouse effect.', fact: 'Venus rotates so slowly that one rotation takes longer than its orbit around the Sun.', color: '#d2b579' },
  { id: 'earth', name: 'Earth', label: 'THERE’S NO PLACE LIKE HOME', type: 'Terrestrial planet', distance: '149.6M', year: '365.25', yearUnit: 'Earth days', diameter: '12,742', description: 'An ocean world. A shelter for life. Our pale blue dot is the only place in the universe we know of that feels like home.', fact: 'Earth is the only world currently known to have liquid-water oceans on the surface and life.', color: '#86b8b0' },
  { id: 'mars', name: 'Mars', label: 'THE NEXT HORIZON', type: 'Terrestrial planet', distance: '227.9M', year: '687', yearUnit: 'Earth days', diameter: '6,779', description: 'A rusty red world with giant volcanoes, sweeping canyons, and traces of ancient rivers. Mars keeps our curiosity moving forward.', fact: 'Olympus Mons, a Martian shield volcano, is the tallest known volcano in the solar system.', color: '#c77e61' },
  { id: 'jupiter', name: 'Jupiter', label: 'THE KING OF THE PLANETS', type: 'Gas giant', distance: '778.6M', year: '11.86', yearUnit: 'Earth years', diameter: '139,820', description: 'A magnificent gas giant with swirling cloud bands and a storm larger than Earth. Jupiter turns scale into something spectacular.', fact: 'Jupiter has more than twice the mass of all the other planets combined.', color: '#c6ac91' },
  { id: 'saturn', name: 'Saturn', label: 'A WORLD OF WONDROUS RINGS', type: 'Gas giant', distance: '1.43B', year: '29.4', yearUnit: 'Earth years', diameter: '116,460', description: 'An elegant giant surrounded by countless icy fragments. Saturn is a reminder that nature has an extraordinary eye for detail.', fact: 'Saturn’s rings are made mostly of ice, with some rocky material and dust.', color: '#d7c69b' },
  { id: 'uranus', name: 'Uranus', label: 'A DIFFERENT POINT OF VIEW', type: 'Ice giant', distance: '2.87B', year: '84', yearUnit: 'Earth years', diameter: '50,724', description: 'Quietly blue-green and tilted dramatically on its side. This distant ice giant does almost everything from a different angle.', fact: 'Uranus has an axial tilt of about 98 degrees: it effectively rolls around the Sun on its side.', color: '#a4cdcd' },
  { id: 'neptune', name: 'Neptune', label: 'AT THE EDGE OF THE EIGHT', type: 'Ice giant', distance: '4.50B', year: '164.8', yearUnit: 'Earth years', diameter: '49,244', description: 'Cold, remote, and swept by supersonic winds. The most distant planet is a pale cyan-blue world in the deep solar system.', fact: 'Neptune was predicted mathematically before it was identified through a telescope in 1846.', color: '#669bad' },
]

export const epochs = [
  { date: '13.8 billion years ago', short: 'The Big Bang', title: 'A very big beginning.', description: 'Our observable universe was once extraordinarily hot and dense. Space expanded and cooled—not an explosion into empty space, but the expansion of space itself.', fact: 'The hot Big Bang model describes the early universe. Its ultimate origin is still an open question.', color: '#e6ba72', label: '01 / THE BEGINNING', className: 'bang' },
  { date: '380,000 years later', short: 'First light', title: 'The universe becomes transparent.', description: 'The universe cooled enough for electrons and nuclei to form neutral atoms. Light could finally travel freely. We can still detect that ancient glow as the cosmic microwave background.', fact: 'Expansion has stretched that early light into microwaves, with a temperature of about 2.7 kelvin today.', color: '#daa66d', label: '02 / A COSMIC AFTERGLOW', className: 'light' },
  { date: 'About 100–200M years later', short: 'The first stars', title: 'And then, there were stars.', description: 'Gravity gathered hydrogen and helium into the first brilliant stars. Over time, they transformed the cosmos, making heavier elements and helping to build the first galaxies.', fact: 'The timing and nature of the first stars are active research questions—not a precisely known cosmic date.', color: '#abc9c5', label: '03 / THE COSMIC DAWN', className: 'stars' },
  { date: '4.6 billion years ago', short: 'Our solar system', title: 'A little corner to call home.', description: 'A cloud of gas and dust collapsed into a new star. In the disk around it, small grains became rocks, worlds, and moons. Our Sun and its family were taking shape.', fact: 'Meteorites preserve material from the solar system’s earliest days, helping us measure its age.', color: '#d8e7ad', label: '04 / OUR NEIGHBORHOOD', className: 'solar' },
  { date: 'Right here, right now', short: 'You, looking up', title: 'The universe gets curious.', description: 'Billions of years of cosmic history led to this moment: a small part of the universe trying to understand itself. The story is still unfolding—and you are part of it.', fact: 'When you look at the stars, you are seeing both the past and the place our ingredients came from.', color: '#bad8ad', label: '05 / STILL BECOMING', className: 'today' },
]

export const questions = [
  { q: 'Does the universe have an edge?', a: 'The observable universe has a horizon: a limit to how far we can receive information. That is not a physical wall. The entire universe could be infinite, or finite without an edge. We do not yet know its total extent.' },
  { q: 'How can we see 46.5 billion light-years away in a 13.8-billion-year-old universe?', a: 'Because space has expanded while the light was traveling. The farthest regions whose ancient light we can detect are now about 46.5 billion light-years away. The observable universe’s roughly 93-billion-light-year diameter is a present-day distance, not the distance that light crossed through a static universe.' },
  { q: 'Are there really other universes?', a: 'We do not have confirmed evidence for other universes. Some theoretical ideas allow a multiverse, but a possibility is not the same as a discovery. We clearly label these ideas as speculative throughout this guide.' },
  { q: 'I’m new to space. Where should I start?', a: 'Start close to home: select a planet in our interactive solar system, then zoom out to stars and galaxies. The cosmic timeline puts the big events in order. You do not need equations or a telescope—just curiosity.' },
]
