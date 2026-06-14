import { expect, test } from "../test";

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

test("isActive treats '/' as exact-only", async ({ page, polyfill }) => {
  test.fixme(
    polyfill,
    "@virtualstate/navigation's interceptWindowClicks reports downloadRequest " +
      'as "" (not null) for plain <a> clicks, so the router skips intercept() ' +
      "and the polyfill falls back to a full-page navigation — see README#Polyfill.",
  );

  await page.goto("/");
  await expect(
    page.evaluate(() => window.__router.isActive("/")),
  ).resolves.toBe(true);

  await page.getByTestId("link-about").click();
  await expect(
    page.evaluate(() => window.__router.isActive("/")),
  ).resolves.toBe(false);
});
