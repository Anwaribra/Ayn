/**
 * Global setup: warm up the dev server before any tests run.
 * Next.js lazily compiles pages; hitting them once avoids cold-start timeouts.
 */
import { chromium } from '@playwright/test'

export default async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Warm up the main pages so they are compiled before tests start
  const baseURL = process.env.BASE_URL || 'http://localhost:3000'
  const pages = ['/', '/login', '/platform/horus-ai']

  for (const path of pages) {
    try {
      await page.goto(`${baseURL}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      })
    } catch {
      // Ignore errors during warmup — server may redirect or need auth
    }
  }

  await browser.close()
}
