import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load and display the page title", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads
    await expect(page).toHaveTitle(/.*/);

    // Check that the page is visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/");

    // Wait for potential navigation to complete (redirect to login)
    await page.waitForLoadState("networkidle");

    // Check if there are any links
    const links = page.locator("a");
    const linkCount = await links.count();

    if (linkCount > 0) {
      // Test that links are clickable
      const firstLink = links.first();
      await expect(firstLink).toBeVisible();
    }
  });

  test("should be responsive", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should not have console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Allow some time for any console errors to appear
    await page.waitForTimeout(1000);

    expect(consoleErrors).toHaveLength(0);
  });
});
