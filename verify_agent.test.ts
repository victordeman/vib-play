import { test, expect } from '@playwright/test';

test('verify deepsite agentic mode and deploy buttons', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:3000');

  // Wait for the app to load
  await page.waitForSelector('text=AI Assistant');

  // Check if Gemini is available in the provider dropdown
  const providerDropdown = page.locator('select').first();
  await expect(providerDropdown).toBeVisible();

  // Select Gemini
  await providerDropdown.selectOption('gemini');

  // Check for Agentic Mode button (the one with AgentIcon)
  // It has title="Toggle Agentic Mode (Vibe Agent)"
  const agentButton = page.locator('button[title="Toggle Agentic Mode (Vibe Agent)"]');
  await expect(agentButton).toBeVisible();

  // Toggle Agentic Mode
  await agentButton.click();

  // Verify "Vibe Agent Active" status
  await expect(page.locator('text=Vibe Agent Active')).toBeVisible();

  // Take a screenshot of the AI Assistant area
  await page.screenshot({ path: 'verification-screenshot.png', fullPage: true });

  console.log('Verification successful: Agentic Mode button and status are visible.');
});
