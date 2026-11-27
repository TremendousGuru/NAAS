import { test, expect } from "./fixtures";

test("public landing page is the first visitor destination and exposes the portal selector", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /One family/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Join NAASCONNECT" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Events and announcements." })).toBeVisible();
  const imageFailures = await page.locator("img").evaluateAll(images =>
    images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.getAttribute("src"))
  );
  expect(imageFailures, "Public landing brand images should load").toEqual([]);
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow, "The public landing page should not overflow horizontally").toBe(false);
  await page.screenshot({ path: `artifacts/public-landing-${testInfo.project.name}.png`, fullPage: true });

  await page.getByRole("link", { name: "Portals", exact: true }).first().click();
  await expect(page).toHaveURL(/portals$/);
  await expect(page.getByRole("heading", { name: /The right portal for your role/ })).toBeVisible();
  for (const portal of ["Member portal", "National portal", "Union portal", "Zone portal", "Institution / chapter portal"]) {
    await expect(page.getByRole("heading", { name: portal })).toBeVisible();
  }
  expect(pageErrors, "The public routes must not throw browser errors").toEqual([]);
});

test("login branding assets load and the layout fits the viewport", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Sign in to continue" })).toBeVisible();
  for (const name of ["NAAS", "NAASCONNECT"]) {
    const logo = page.getByRole("img", { name, exact: true });
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  const imageFailures = await page.locator("img").evaluateAll(images =>
    images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.getAttribute("src"))
  );
  expect(imageFailures, "Every rendered login image should load").toEqual([]);

  const resendInput = page.getByPlaceholder("Enter your registration email");
  const resendButton = page.getByRole("button", { name: "Resend confirmation email" });
  await expect(resendInput).toBeVisible();
  await expect(resendButton).toBeVisible();
  const resendInputBox = await resendInput.boundingBox();
  const resendButtonBox = await resendButton.boundingBox();
  expect(resendInputBox).not.toBeNull();
  expect(resendButtonBox).not.toBeNull();
  expect(resendInputBox!.width, "The resend email field should occupy the form width").toBeGreaterThan(200);
  expect(resendButtonBox!.y, "The resend action should sit below its email field, not beside or over it")
    .toBeGreaterThanOrEqual(resendInputBox!.y + resendInputBox!.height - 1);

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow, "The login page should not overflow horizontally").toBe(false);
  await page.screenshot({ path: `artifacts/login-${testInfo.project.name}.png`, fullPage: true });
  expect(pageErrors, "The login route must not throw browser errors").toEqual([]);
});
