import { expect, test } from "@playwright/test";

test("isActive matches the current path as a prefix unless exact is set", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("link-settings").click();
  await expect(page).toHaveURL("/dashboard/settings");

  await expect(
    page.evaluate(() => window.__router.isActive("/dashboard")),
  ).resolves.toBe(true);
  await expect(
    page.evaluate(() =>
      window.__router.isActive("/dashboard", { exact: true }),
    ),
  ).resolves.toBe(false);
  await expect(
    page.evaluate(() =>
      window.__router.isActive("/dashboard/settings", { exact: true }),
    ),
  ).resolves.toBe(true);
  await expect(
    page.evaluate(() => window.__router.isActive("/about")),
  ).resolves.toBe(false);
});

test("isActive treats '/' as exact-only", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.evaluate(() => window.__router.isActive("/")),
  ).resolves.toBe(true);

  await page.getByTestId("link-about").click();
  await expect(
    page.evaluate(() => window.__router.isActive("/")),
  ).resolves.toBe(false);
});

test("Link applies activeClass and aria-current based on the current route", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("link-dashboard").click();
  await expect(page).toHaveURL("/dashboard");

  const overview = page.getByTestId("dash-link-overview");
  const settings = page.getByTestId("dash-link-settings");

  await expect(overview).toHaveClass(/active/);
  await expect(overview).toHaveAttribute("aria-current", "page");
  await expect(settings).not.toHaveClass(/active/);
  await expect(settings).not.toHaveAttribute("aria-current", "page");

  await settings.click();
  await expect(page).toHaveURL("/dashboard/settings");

  await expect(overview).not.toHaveClass(/active/);
  await expect(overview).not.toHaveAttribute("aria-current", "page");
  await expect(settings).toHaveClass(/active/);
  await expect(settings).toHaveAttribute("aria-current", "page");
});
