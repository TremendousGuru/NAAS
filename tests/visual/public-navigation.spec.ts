import { expect, test } from "@playwright/test";

test("public navigation opens as a mobile menu and visits real pages", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name.includes("mobile")) {
    const toggle = page.getByRole("button", { name: "Open navigation menu" });
    await expect(toggle).toBeVisible();
    await toggle.click();
    const nav = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    await nav.getByRole("link", { name: "Community" }).click();
    await expect(page).toHaveURL(/\/community$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One family");
  } else {
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "About" })).toBeVisible();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Events" }).click();
    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Stay close");
  }
});

test("public destinations are separate pages with working browser history", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About", exact: true }).first().click();
  await expect(page).toHaveURL(/\/about$/);
  await page.getByRole("link", { name: "Community", exact: true }).first().click();
  await expect(page).toHaveURL(/\/community$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
});

test("public pages do not create horizontal overflow on mobile", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile viewport check");
  for (const path of ["/", "/about", "/community", "/events", "/portals"]) {
    await page.goto(path);
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(widths.content, `Horizontal overflow on ${path}: ${JSON.stringify(widths)}`).toBeLessThanOrEqual(widths.viewport + 1);
  }
});
