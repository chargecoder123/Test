# Universe — A little closer.

An animated, responsive field guide to the cosmos, built with **Vite + React**. This is a standalone application in `universe/`; the existing website in the repository root is unchanged.

## Run locally

Use Node.js **22.12 or newer**.

```bash
cd universe
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

```bash
npm run build     # Production bundle in dist/
npm run preview   # Serve the production build
```

The server binds to `0.0.0.0` and accepts Arena's `.e2b.app` preview hosts. There are no API keys, backend services, or remotely hosted fonts or images.

## Explore

- **Cinematic introduction:** original Saturn artwork, twinkling stars, subtle motion, and a four-stop perspective tour.
- **Discovery library:** 16 readable guides, four topic filters, live search, empty states, and links to further reading.
- **Interactive solar system:** select any of the eight planets from the orbit diagram or the planet picker, compare facts, and open its guide.
- **Cosmic timeline:** five selectable milestones, next/previous controls, and illustrated explanations.
- **Universe models:** flat, open, and closed spatial geometries, plus clearly labeled speculative multiverse and cyclic-universe ideas.
- **Questions and surprises:** expandable answers and a random-discovery button.
- **Accessibility:** keyboard navigation, focus-trapped dialogs, inert modal backgrounds, Escape to close, Ctrl/⌘ K to search, a skip link, visible focus styles, contrast-checked text, and reduced-motion support.
- **Motion preferences:** the system's reduced-motion preference is respected by default; the hero and footer controls let visitors change it. The preference is saved locally when storage is available.

## Project structure

```text
universe/
├── public/
│   ├── images/             # Local astronomical imagery and illustrations
│   └── favicon.svg
├── src/
│   ├── App.jsx             # Experience, interaction, and reusable components
│   ├── data.js             # Guides, planet facts, timeline, and questions
│   ├── main.jsx            # React entry point and locally bundled fonts
│   └── styles.css          # Design system, responsive layouts, animations
├── tests/
│   └── universe.spec.js    # Desktop and mobile browser tests
├── playwright.config.js
└── vite.config.js
```

Edit `src/data.js` to add or update guides, planet descriptions, timeline milestones, or FAQs. Colors, responsive breakpoints, and animation settings live in `src/styles.css`.

## Tests

```bash
npx playwright install --with-deps chromium
npm test
```

The Playwright suite runs on desktop Chromium and an emulated Pixel 7. It checks filters, searches and empty states, topic readers, all eight planets, direct orbit selection, timeline navigation, the tour, theories, accordions, focus management, keyboard shortcuts, motion persistence, responsive widths from 320–1440 px, and automated WCAG accessibility checks.

If Chromium is already installed elsewhere, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its full path. Otherwise the tests use Playwright's managed browser. Build output, dependencies, traces, and test reports are ignored by Git.

## Science and image credits

This is an independent educational project, not affiliated with NASA, ESA, or any space agency. Measurements are rounded. Orbits, sizes, speeds, and geometric diagrams are illustrative—not scientific simulations. The diameter of about 93 billion light-years refers to the **observable** universe, not the unknown extent of the whole universe.

Established observations, geometric possibilities, and speculative models are distinguished in the content. Each guide includes a further-reading link, primarily to NASA's educational resources.

- `galaxy.jpg`: Hubble view of NGC 1385 (2021). Credit: **ESA/Hubble & NASA, J. Lee and the PHANGS-HST team**. [NASA image context](https://science.nasa.gov/missions/hubble/hubble-filters-a-barred-spiral/).
- `nebula.jpg`: a NIRCam Pillars of Creation image/video still. Credit: **NASA, ESA, CSA, and STScI**. [ESA/Webb image context](https://esawebb.org/news/weic2216/).
- `saturn-hero.jpg`, `earth.jpg`, `black-hole.jpg`: **AI-generated scientific illustrations**, not telescope or spacecraft photographs.
- Planet surfaces, orbital paths, timeline artwork, and wireframe diagrams: illustrative CSS/SVG graphics.
- Fonts: locally bundled **DM Sans** and **Instrument Serif**, distributed through Fontsource under their included open-font licenses.
- Icons: **Lucide**.

The website's “Science & image credits” dialog also explains the sources and limitations.
