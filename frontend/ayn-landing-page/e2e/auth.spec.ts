import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should load the landing page', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Ayn/);
        await expect(page.getByText('Framework Ready')).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/');
        // Find the login link/button. Based on UI, there might be a "Sign In" or "Get Started" button.
        // I'll try to find a link with "In" (Sign In / Login)
        const loginBtn = page.getByRole('link', { name: /log in|sign in/i }).first();
        if (await loginBtn.isVisible()) {
            await loginBtn.click();
            await expect(page).toHaveURL(/\/login/);
        } else {
            await page.goto('/login');
        }
        await expect(page.getByText(/sign in to ayn/i)).toBeVisible();
    });

    test('should show signup form', async ({ page }) => {
        await page.goto('/login');
        const signupBtn = page.getByRole('button', { name: /create account|sign up/i }).first();
        if (await signupBtn.isVisible()) {
            await signupBtn.click();
            await expect(page.getByPlaceholder(/full name/i)).toBeVisible();
        }
    });
});
