import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
})

test('loads the experience with local assets and no runtime errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.reload()
  await expect(page).toHaveTitle('Universe — A little closer.')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The universe.')
  await expect(page.locator('.discovery-card')).toHaveCount(4)
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
  await page.locator('.site-footer').scrollIntoViewIfNeeded()
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true)
  expect(errors).toEqual([])
})

test('filters discovery cards into useful collections', async ({ page }) => {
  const filters = page.getByLabel('Filter discoveries')
  await filters.getByRole('button', { name: 'Our solar system' }).click()
  await expect(page.locator('.discovery-card')).toHaveCount(4)
  await expect(page.locator('.discovery-grid')).toContainText('Saturn & its rings')
  await expect(page.locator('.discovery-grid')).not.toContainText('Black holes')
  await filters.getByRole('button', { name: 'Stars & galaxies' }).click()
  await expect(page.locator('.discovery-grid')).toContainText('The cosmic web')
  await filters.getByRole('button', { name: 'The unknown' }).click()
  await expect(page.locator('.discovery-grid')).toContainText('A flat universe')
  await filters.getByRole('button', { name: 'All discoveries' }).click()
  await expect(page.locator('.discovery-grid')).toContainText('Stars & nebulae')
})

test('searches all topics, reads a result, and returns to the library', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Search the universe', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog')
  const search = dialog.getByRole('textbox', { name: 'Search discoveries' })
  await expect(search).toBeFocused()
  await expect(dialog.locator('.library-card')).toHaveCount(16)
  await search.fill('black holes')
  await expect(dialog.locator('.library-card')).toHaveCount(1)
  await dialog.locator('.library-card').click()
  await expect(dialog.getByRole('heading', { name: 'Black holes', exact: true })).toBeVisible()
  await expect(dialog).toContainText('Black holes are not cosmic vacuum cleaners.')
  await dialog.getByRole('button', { name: 'Back to all discoveries' }).click()
  await expect(dialog.getByRole('textbox', { name: 'Search discoveries' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('handles an empty search and supports keyboard shortcuts', async ({ page }) => {
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Search discoveries' }).fill('xyzzyzz-unfindable')
  await expect(dialog).toContainText('No discoveries match that search.')
  await dialog.getByRole('button', { name: 'Show all discoveries' }).click()
  await expect(dialog.locator('.library-card')).toHaveCount(16)
  await dialog.getByRole('button', { name: 'Our solar system', exact: true }).click()
  await expect(dialog.locator('.library-card')).toHaveCount(4)
  await dialog.getByRole('button', { name: 'Close dialog' }).click()
  await expect(dialog).not.toBeVisible()
})

test('explores all eight planets and opens their field guides', async ({ page }) => {
  const picker = page.getByLabel('Choose a planet')
  for (const name of ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']) {
    await picker.getByRole('button', { name, exact: true }).click()
    await expect(page.locator('.planet-details h3')).toContainText(name)
    await expect(picker.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
  }
  await page.getByRole('button', { name: 'Get to know Neptune' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Neptune', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText('mathematically')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Select Mars', exact: true }).click()
  await expect(page.locator('.planet-details h3')).toContainText('Mars')
})

test('travels through the timeline with direct selection and next/previous controls', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Previous era', exact: true })).toBeDisabled()
  const titles = ['The universe becomes transparent.', 'And then, there were stars.', 'A little corner to call home.', 'The universe gets curious.']
  for (const title of titles) {
    await page.getByRole('button', { name: 'Next era', exact: true }).click()
    await expect(page.locator('.epoch-copy h3')).toHaveText(title)
  }
  await expect(page.getByRole('button', { name: 'Next era', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Previous era', exact: true }).click()
  await expect(page.locator('.epoch-copy h3')).toHaveText('A little corner to call home.')
  await page.getByRole('button', { name: '13.8 billion years ago The Big Bang' }).click()
  await expect(page.locator('.epoch-copy h3')).toHaveText('A very big beginning.')
})

test('distinguishes measured geometry from speculative theories', async ({ page }) => {
  await page.locator('.model-card').filter({ hasText: 'A flat universe' }).click()
  await expect(page.getByRole('dialog')).toContainText('CONSISTENT WITH OBSERVATIONS')
  await expect(page.getByRole('dialog')).toContainText('topology')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'A multiverse?', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('SPECULATIVE HYPOTHESIS')
  await expect(page.getByRole('dialog')).toContainText('no confirmed observational evidence')
  await page.keyboard.press('Escape')
  const question = page.getByRole('button', { name: 'Are there really other universes?' })
  await question.click()
  await expect(question).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#answer-2')).toBeVisible()
  await question.click()
  await expect(page.locator('#answer-2')).toBeHidden()
})

test('takes a four-stop tour and resumes exploring', async ({ page }) => {
  await page.getByRole('button', { name: 'A little perspective', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading')).toHaveText('Start with our pale blue dot.')
  await expect(dialog.getByRole('button', { name: 'Previous tour stop' })).toBeDisabled()
  for (let i = 0; i < 3; i++) await dialog.getByRole('button', { name: 'A little further' }).click()
  await expect(dialog.getByRole('heading')).toHaveText('And that is only the beginning.')
  await dialog.getByRole('button', { name: 'Previous tour stop' }).click()
  await expect(dialog.getByRole('heading')).toHaveText('Now imagine a hundred billion suns.')
  await dialog.getByRole('button', { name: 'A little further' }).click()
  await dialog.getByRole('button', { name: 'Keep exploring' }).click()
  await expect(dialog).not.toBeVisible()
})

test('persists the motion preference', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
  await page.getByRole('button', { name: 'Resume animations', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on')
  await page.getByRole('button', { name: 'Pause animations', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
})

test('keeps the reader keyboard focus inside the dialog', async ({ page }) => {
  await page.getByRole('button', { name: 'Search the universe', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const close = dialog.getByRole('button', { name: 'Close dialog' })
  await close.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.locator('.library-card').last()).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
})

test('fits narrow screens and provides working mobile navigation', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  const menu = page.getByRole('button', { name: 'Open navigation' })
  await menu.click()
  const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' })
  await expect(mobileNav).toBeVisible()
  await mobileNav.getByRole('link', { name: 'Solar system' }).click()
  await expect(mobileNav).not.toBeVisible()
  await expect(page).toHaveURL(/#solar-system$/)
  await page.getByRole('button', { name: 'Search the universe', exact: true }).click()
  expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
})

test('opens credits and a random topic', async ({ page }) => {
  await page.getByRole('button', { name: 'Science & image credits' }).click()
  await expect(page.getByRole('dialog')).toContainText('AI-generated scientific illustrations')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Show me something extraordinary' }).click()
  await expect(page.getByRole('dialog').locator('.reader-content h2')).toBeVisible()
  await expect(page.getByRole('dialog').locator('.reader-source')).toHaveAttribute('href', /^https:\/\//)
})


test('passes automated WCAG checks on the page and its reading rooms', async ({ page }) => {
  const audit = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations).toEqual([])
  }
  await audit()
  await page.getByRole('button', { name: 'Search the universe', exact: true }).click()
  await audit()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Search discoveries' }).fill('black holes')
  await dialog.locator('.library-card').click()
  await audit()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'A little perspective', exact: true }).click()
  await audit()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Science & image credits' }).click()
  await audit()
})
