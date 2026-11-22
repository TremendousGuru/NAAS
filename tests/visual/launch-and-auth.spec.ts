import { test, expect } from "@playwright/test";

test("branded intro resolves to the unauthenticated sign-in route", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("main", { name: "Loading NAASCONNECT" })).toBeVisible();
  const introLogo = page.getByRole("img", { name: "NAASCONNECT Nigeria" });
  await expect(introLogo).toBeVisible();
  await expect.poll(() => introLogo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: `artifacts/intro-${testInfo.project.name}.png`, fullPage: true });

  await page.waitForURL(/\/login(?:\?.*)?$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Sign in to continue" })).toBeVisible();
  expect(pageErrors, "The intro route must not throw browser errors").toEqual([]);
});

test("login branding assets load and the layout fits the viewport", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Sign in to continue" })).toBeVisible();
  for (const name of ["NAAS", "NAASCONNECT"]) {
    const logo = page.getByRole("img", { name });
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow, "The login page should not overflow horizontally").toBe(false);
  await page.screenshot({ path: `artifacts/login-${testInfo.project.name}.png`, fullPage: true });
  expect(pageErrors, "The login route must not throw browser errors").toEqual([]);
});
