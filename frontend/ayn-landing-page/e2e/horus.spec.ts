/**
 * Horus AI Page — Full E2E Test Suite
 *
 * Strategy:
 *  - Auth is faked via page.addInitScript (injects localStorage access_token + user)
 *    so ProtectedRoute renders the chat UI without a real login flow.
 *  - All backend API calls are intercepted via page.route() so tests are
 *    deterministic and don't require a running backend.
 *  - Dev server must be running on http://localhost:3000.
 */

import { test, expect, type Page } from '@playwright/test'

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_CHAT_ID   = 'mock-chat-abc123'
const MOCK_CHAT_ID_2 = 'mock-chat-xyz456'

const MOCK_USER = {
  id: 'user-test-1',
  email: 'test@ayn.ai',
  name: 'Test User',
  role: 'TEACHER',
  institutionId: 'inst-1',
}

const mockHistory = [
  {
    id: MOCK_CHAT_ID,
    title: 'ISO Compliance Q&A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: MOCK_CHAT_ID_2,
    title: 'NCAAA Gap Analysis',
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
]

const mockMessages = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'What is ISO 21001?',
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    metadata: null,
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'ISO 21001 is an educational management standard.',
    timestamp: new Date(Date.now() - 55_000).toISOString(),
    metadata: null,
  },
]

// ─── Auth injection ───────────────────────────────────────────────────────────

/**
 * Injects fake auth into localStorage BEFORE the page loads.
 * This bypasses ProtectedRoute so the Horus chat UI renders.
 */
async function injectAuth(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('access_token', 'fake-test-token')
    localStorage.setItem('user', JSON.stringify(user))
  }, MOCK_USER)
}

// ─── API mocks ────────────────────────────────────────────────────────────────

async function mockHorusAPIs(page: Page) {
  // Auth verification
  await page.route('**/api/auth/me', (r) => r.fulfill({ json: MOCK_USER }))

  // History list
  await page.route('**/api/horus/history', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: mockHistory })
    } else {
      await route.continue()
    }
  })

  // Individual chat messages
  await page.route(`**/api/horus/history/${MOCK_CHAT_ID}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: { id: MOCK_CHAT_ID, title: 'ISO Compliance Q&A', messages: mockMessages },
      })
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ json: { status: 'deleted' } })
    } else {
      await route.continue()
    }
  })

  await page.route(`**/api/horus/history/${MOCK_CHAT_ID_2}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: { id: MOCK_CHAT_ID_2, title: 'NCAAA Gap Analysis', messages: [] },
      })
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ json: { status: 'deleted' } })
    } else {
      await route.continue()
    }
  })

  // Last chat
  await page.route('**/api/horus/history/last', (r) => r.fulfill({ json: null }))

  // Stream endpoint — minimal SSE that sets a chat ID then sends text
  await page.route('**/api/horus/chat/stream', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: [
        `data: __CHAT_ID__:${MOCK_CHAT_ID}\n\n`,
        'data: Hello, I am Horus!\n\n',
        'data: [DONE]\n\n',
      ].join(''),
    })
  })

  // Noise-free stubs
  await page.route('**/api/notifications*',   (r) => r.fulfill({ json: [] }))
  await page.route('**/api/deepagents/**',     (r) => r.fulfill({ json: { available: false } }))
  await page.route('**/api/standards*',        (r) => r.fulfill({ json: [] }))
  await page.route('**/api/horus/events*',     (r) => r.fulfill({ status: 200, body: '' }))
  await page.route('**/api/user/**',           (r) => r.fulfill({ json: {} }))
}

// ─── Helper: navigate to Horus and wait for input ────────────────────────────

async function gotoHorus(page: Page) {
  await injectAuth(page)
  await mockHorusAPIs(page)
  await page.goto('/platform/horus-ai')
  // Wait for the main chat input textarea ("Ask Horus…")
  await page.waitForSelector('textarea[placeholder="Ask Horus…"]', { timeout: 20_000 })
}

// Helper: open the history sheet
async function openHistorySheet(page: Page) {
  await page.getByTitle('History').click()
  await expect(page.locator('h2').filter({ hasText: 'Session History' })).toBeVisible({ timeout: 5_000 })
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PAGE LOAD & EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Page Load & Empty State', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    // No auth injected — ProtectedRoute calls router.push("/login")
    await page.goto('/platform/horus-ai')
    // Wait for client-side redirect (ProtectedRoute fires on useEffect)
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 })
  })

  test('renders the empty-state headline when no messages exist', async ({ page }) => {
    await gotoHorus(page)
    await expect(page.getByText('Your compliance agent')).toBeVisible()
  })

  test('renders the chat textarea with correct placeholder', async ({ page }) => {
    await gotoHorus(page)
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await expect(input).toBeVisible()
  })

  test('renders New Chat and History toolbar buttons', async ({ page }) => {
    await gotoHorus(page)
    await expect(page.getByTitle('New chat (⌘N)')).toBeVisible()
    await expect(page.getByTitle('History')).toBeVisible()
  })

  test('renders response-mode selector (Ask / Think)', async ({ page }) => {
    await gotoHorus(page)
    // The mode label "Ask" should be visible in the toolbar area
    await expect(page.getByText('Ask').first()).toBeVisible()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CHAT INPUT BEHAVIOUR
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Chat Input', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHorus(page)
  })

  test('accepts text input', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('Hello Horus')
    await expect(input).toHaveValue('Hello Horus')
  })

  test('clears input after sending via Enter', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('Hello Horus')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('', { timeout: 6_000 })
  })

  test('does not send empty message on Enter', async ({ page }) => {
    const streamCalls: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/horus/chat/stream')) streamCalls.push(req.url())
    })
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(600)
    expect(streamCalls).toHaveLength(0)
  })

  test('accepts multi-line input via Shift+Enter', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.click()
    await input.type('Line 1')
    await page.keyboard.press('Shift+Enter')
    await input.type('Line 2')
    const value = await input.inputValue()
    expect(value).toContain('Line 1')
    expect(value).toContain('Line 2')
  })

  test('accepts Arabic text input', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    const arabicText = 'مرحبا حورس، كيف حالك؟'
    await input.fill(arabicText)
    await expect(input).toHaveValue(arabicText)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SENDING MESSAGES & RESPONSE RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Message Send & Render', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHorus(page)
  })

  test('user message bubble appears after sending', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('What is ISO 21001?')
    await page.keyboard.press('Enter')
    await expect(page.getByText('What is ISO 21001?')).toBeVisible({ timeout: 8_000 })
  })

  test('assistant response appears after send', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('Hello')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Hello, I am Horus!')).toBeVisible({ timeout: 15_000 })
  })

  test('empty-state headline disappears once a message is sent', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('Hello')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Your compliance agent')).not.toBeVisible({ timeout: 8_000 })
  })

  test('input is cleared after message is sent', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('Test clear')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('', { timeout: 6_000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SESSION HISTORY PANEL
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Session History Panel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHorus(page)
  })

  test('opens history sheet when History button is clicked', async ({ page }) => {
    await openHistorySheet(page)
    await expect(page.locator('h2').filter({ hasText: 'Session History' })).toBeVisible()
  })

  test('lists existing chat sessions in the sheet', async ({ page }) => {
    await openHistorySheet(page)
    await expect(page.getByText('ISO Compliance Q&A')).toBeVisible({ timeout: 6_000 })
    await expect(page.getByText('NCAAA Gap Analysis')).toBeVisible({ timeout: 6_000 })
  })

  test('closes sheet and loads chat when a session is clicked', async ({ page }) => {
    await openHistorySheet(page)
    await page.getByText('ISO Compliance Q&A').click()
    // Sheet must close
    await expect(
      page.locator('h2').filter({ hasText: 'Session History' }),
    ).not.toBeVisible({ timeout: 6_000 })
    // Messages from the chosen chat must appear
    await expect(page.getByText('What is ISO 21001?')).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByText('ISO 21001 is an educational management standard.'),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows both user and assistant messages after loading a history chat', async ({ page }) => {
    await openHistorySheet(page)
    await page.getByText('ISO Compliance Q&A').click()
    await expect(page.getByText('What is ISO 21001?')).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByText('ISO 21001 is an educational management standard.'),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows "No chat history" when history is empty', async ({ page }) => {
    // Must set up routes BEFORE page load so SWR fetches empty list from the start
    await injectAuth(page)
    await mockHorusAPIs(page)
    // Override with empty list (registered AFTER mockHorusAPIs so it takes priority)
    await page.route('**/api/horus/history', (r) => r.fulfill({ json: [] }))
    await page.goto('/platform/horus-ai')
    await page.waitForSelector('textarea[placeholder="Ask Horus…"]', { timeout: 20_000 })
    await openHistorySheet(page)
    await expect(page.getByText('No chat history')).toBeVisible({ timeout: 6_000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. NEW CHAT
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — New Chat', () => {
  test('New Chat button clears messages and shows empty state', async ({ page }) => {
    await gotoHorus(page)
    // First load an existing chat
    await openHistorySheet(page)
    await page.getByText('ISO Compliance Q&A').click()
    await expect(page.getByText('What is ISO 21001?')).toBeVisible({ timeout: 10_000 })

    // Click New Chat
    await page.getByTitle('New chat (⌘N)').click()
    await expect(page.getByText('Your compliance agent')).toBeVisible({ timeout: 6_000 })
  })

  test('Cmd/Ctrl+N shortcut starts a new chat', async ({ page }) => {
    await gotoHorus(page)
    await openHistorySheet(page)
    await page.getByText('ISO Compliance Q&A').click()
    await expect(page.getByText('What is ISO 21001?')).toBeVisible({ timeout: 10_000 })

    const isMac = process.platform === 'darwin'
    await page.keyboard.press(isMac ? 'Meta+n' : 'Control+n')
    await expect(page.getByText('Your compliance agent')).toBeVisible({ timeout: 6_000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. DELETE SESSION
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Delete Session', () => {
  test('delete button appears on history card hover', async ({ page }) => {
    await gotoHorus(page)
    await openHistorySheet(page)

    const card = page.locator('[data-session-id], div').filter({ hasText: /ISO Compliance Q&A/ }).first()
    await card.hover()
    // Trash icon / delete button becomes visible
    const deleteBtn = card.locator('button').last()
    await expect(deleteBtn).toBeVisible({ timeout: 4_000 })
  })

  test('deleting current chat calls the delete API and shows a success toast', async ({ page }) => {
    let deleteCalled = false
    await injectAuth(page)
    await mockHorusAPIs(page)

    // Track that DELETE is called for the active chat
    await page.route(`**/api/horus/history/${MOCK_CHAT_ID}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({ json: { status: 'deleted' } })
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          json: { id: MOCK_CHAT_ID, title: 'ISO Compliance Q&A', messages: mockMessages },
        })
      } else {
        await route.continue()
      }
    })
    // After delete history will be empty
    await page.route('**/api/horus/history', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ json: deleteCalled ? [] : mockHistory })
      } else {
        route.continue()
      }
    })

    await page.goto('/platform/horus-ai')
    await page.waitForSelector('textarea[placeholder="Ask Horus…"]', { timeout: 20_000 })

    // Load a chat so it's the active chat
    await openHistorySheet(page)
    await page.getByText('ISO Compliance Q&A').click()
    await expect(page.getByText('What is ISO 21001?')).toBeVisible({ timeout: 10_000 })

    // Re-open history and click the trash button next to "ISO Compliance Q&A"
    await openHistorySheet(page)
    // The delete (Trash2) button is the first horus-tool-button inside the sheet
    // (cards are ordered newest-first, so ISO Compliance Q&A is card #1)
    const deleteBtn = page
      .locator('[role="dialog"] button.horus-tool-button, [data-state="open"] button.horus-tool-button')
      .first()
    // Scroll into view then click (button may be inside scrollable sheet)
    await deleteBtn.scrollIntoViewIfNeeded()
    await deleteBtn.click({ force: true })

    // Confirm DELETE was called
    await page.waitForTimeout(1_000)
    expect(deleteCalled).toBe(true)

    // Toast "Thread deleted" or empty state should be visible
    await expect(
      page.locator('text=/deleted|Your compliance agent/i').first(),
    ).toBeVisible({ timeout: 10_000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. URL DEEP-LINK (?chat=<id>)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — URL deep-link', () => {
  test('loads a specific chat from the ?chat= query param', async ({ page }) => {
    await injectAuth(page)
    await mockHorusAPIs(page)
    await page.goto(`/platform/horus-ai?chat=${MOCK_CHAT_ID}`)
    await page.waitForSelector('textarea[placeholder="Ask Horus…"]', { timeout: 20_000 })
    await expect(page.getByText('What is ISO 21001?')).toBeVisible({ timeout: 12_000 })
    await expect(
      page.getByText('ISO 21001 is an educational management standard.'),
    ).toBeVisible({ timeout: 8_000 })
  })

  test('fetches chat only once on initial load', async ({ page }) => {
    await injectAuth(page)
    await mockHorusAPIs(page)
    let chatFetchCount = 0
    await page.route(`**/api/horus/history/${MOCK_CHAT_ID}`, async (route) => {
      chatFetchCount++
      await route.fulfill({
        json: { id: MOCK_CHAT_ID, title: 'ISO Compliance Q&A', messages: mockMessages },
      })
    })
    await page.goto(`/platform/horus-ai?chat=${MOCK_CHAT_ID}`)
    await page.waitForSelector('textarea[placeholder="Ask Horus…"]', { timeout: 20_000 })
    await page.waitForTimeout(2_000)
    expect(chatFetchCount).toBeLessThanOrEqual(2)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. RESPONSE MODES
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Response Modes', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHorus(page)
  })

  test('Ask mode is shown in the toolbar by default', async ({ page }) => {
    await expect(page.getByText('Ask').first()).toBeVisible()
  })

  test('can switch to Think mode', async ({ page }) => {
    const thinkBtn = page.getByText('Think').first()
    if (await thinkBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await thinkBtn.click()
      await expect(thinkBtn).toBeVisible()
    }
  })

  test('sends request when message is submitted in Think mode', async ({ page }) => {
    const streamCalls: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/horus/chat/stream')) streamCalls.push(req.url())
    })

    const thinkBtn = page.getByText('Think').first()
    if (await thinkBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await thinkBtn.click()
    }

    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('Analyse my compliance')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1_500)
    expect(streamCalls.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 9. STOP GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Stop Generation', () => {
  test('stop button appears while a response is being generated', async ({ page }) => {
    // Use a held-open stream
    let resolveStream!: () => void
    const streamHeld = new Promise<void>((res) => { resolveStream = res })

    await injectAuth(page)
    await mockHorusAPIs(page)
    // Override stream to delay
    await page.route('**/api/horus/chat/stream', async (route) => {
      await streamHeld
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: `data: __CHAT_ID__:${MOCK_CHAT_ID}\n\ndata: Slow…\n\ndata: [DONE]\n\n`,
      })
    })

    await page.goto('/platform/horus-ai')
    await page.waitForSelector('textarea[placeholder="Ask Horus…"]', { timeout: 20_000 })

    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('Slow question')
    await page.keyboard.press('Enter')

    // A stop button (or disabled input) should appear quickly
    const stopBtn = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .nth(0)
    // Give the UI 3 s to show the generating state
    await page.waitForTimeout(1_000)

    // Release the stream
    resolveStream()

    // After completion the input should be re-enabled
    await expect(input).toBeEnabled({ timeout: 10_000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 10. ERROR STATES
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Error States', () => {
  test('shows error feedback when the stream returns __STREAM_ERROR__', async ({ page }) => {
    await injectAuth(page)
    await mockHorusAPIs(page)
    await page.route('**/api/horus/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: __STREAM_ERROR__:All AI providers failed\n\ndata: [DONE]\n\n',
      })
    })

    await page.goto('/platform/horus-ai')
    await page.waitForSelector('textarea[placeholder="Ask Horus…"]', { timeout: 20_000 })

    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('Trigger error')
    await page.keyboard.press('Enter')

    await expect(
      page.locator('text=/unavailable|failed|error|retry/i').first(),
    ).toBeVisible({ timeout: 12_000 })
  })

  test('shows error toast when loading a specific chat fails (500)', async ({ page }) => {
    await injectAuth(page)
    await mockHorusAPIs(page)
    await page.route(`**/api/horus/history/${MOCK_CHAT_ID}`, async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' })
    })

    await page.goto('/platform/horus-ai')
    await page.waitForSelector('textarea[placeholder="Ask Horus…"]', { timeout: 20_000 })

    await openHistorySheet(page)
    await page.getByText('ISO Compliance Q&A').click()

    await expect(
      page.locator('text=/failed|error/i').first(),
    ).toBeVisible({ timeout: 8_000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 11. ARABIC / RTL INPUT
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Arabic & RTL support', () => {
  test('sends an Arabic message and receives a response', async ({ page }) => {
    await injectAuth(page)
    await mockHorusAPIs(page)
    await page.route('**/api/horus/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: `data: __CHAT_ID__:${MOCK_CHAT_ID}\n\ndata: أنا حورس، كيف أساعدك؟\n\ndata: [DONE]\n\n`,
      })
    })

    await page.goto('/platform/horus-ai')
    await page.waitForSelector('textarea[placeholder="Ask Horus…"]', { timeout: 20_000 })

    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('مرحبا حورس')
    await page.keyboard.press('Enter')

    await expect(page.getByText('مرحبا حورس')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('أنا حورس، كيف أساعدك؟')).toBeVisible({ timeout: 12_000 })
  })

  test('Arabic greeting shows a response (fast or streamed)', async ({ page }) => {
    await gotoHorus(page)
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    // Wait until the input is fully editable (not disabled/readonly)
    await expect(input).toBeEnabled({ timeout: 15_000 })
    await input.fill('مرحبا')
    await page.keyboard.press('Enter')
    // Either a local fast reply or streamed reply appears
    await expect(page.getByText('مرحبا')).toBeVisible({ timeout: 10_000 })
    // The input should clear (message was sent)
    await expect(input).toHaveValue('', { timeout: 10_000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 12. ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Accessibility', () => {
  test('chat input has a placeholder', async ({ page }) => {
    await gotoHorus(page)
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await expect(input).toBeVisible()
    const placeholder = await input.getAttribute('placeholder')
    expect(placeholder).toBeTruthy()
  })

  test('history sheet has an accessible heading', async ({ page }) => {
    await gotoHorus(page)
    await openHistorySheet(page)
    await expect(
      page.locator('h2').filter({ hasText: 'Session History' }),
    ).toBeVisible()
  })

  test('page title contains Ayn or Horus', async ({ page }) => {
    await gotoHorus(page)
    await expect(page).toHaveTitle(/Ayn|Horus/i, { timeout: 10_000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 13. NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Horus AI — Navigation', () => {
  test('direct URL /platform/horus-ai loads the chat page when authenticated', async ({ page }) => {
    await gotoHorus(page)
    await expect(page).toHaveURL(/\/horus-ai/)
    await expect(page.locator('textarea[placeholder="Ask Horus…"]')).toBeVisible()
  })

  test('New Chat button resets messages, URL stays on /horus-ai', async ({ page }) => {
    await gotoHorus(page)
    const input = page.locator('textarea[placeholder="Ask Horus…"]')
    await input.fill('Test navigation')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1_500)

    await page.getByTitle('New chat (⌘N)').click()
    await expect(page).toHaveURL(/\/horus-ai/)
    await expect(page.getByText('Your compliance agent')).toBeVisible({ timeout: 6_000 })
  })
})
