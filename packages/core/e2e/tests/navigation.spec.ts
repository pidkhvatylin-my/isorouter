import { expect, test } from "../test";

test("renders the initial route on load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("page")).toHaveText("home");
  await expect(page).toHaveTitle("Home");
});

test("intercepts link clicks and updates the URL without a full reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("link-about").click();

  await expect(page.getByTestId("page")).toHaveText("about");
  await expect(page).toHaveTitle("About");
  await expect(page).toHaveURL("/about");
});

test("matches dynamic segments and exposes decoded params", async ({
  page,
}) => {
  await page.goto("/concerts/kyiv");
  await expect(page.getByTestId("page")).toHaveText("concerts:kyiv");
  await expect(page).toHaveTitle("Concerts in kyiv");
});

test("matches a splat route and joins the remaining segments", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("link-files").click();

  await expect(page.getByTestId("page")).toHaveText("files:a/b/c");
  await expect(page).toHaveURL("/files/a/b/c");
});

test("renders a not-found state for unmatched paths", async ({ page }) => {
  await page.goto("/does-not-exist");
  await expect(page.getByTestId("page")).toHaveText("not-found");
});

test("back/forward traverse the session history", async ({
  page,
  polyfill,
}) => {
  test.fixme(
    polyfill,
    "@virtualstate/navigation's interceptWindowClicks reports downloadRequest " +
      'as "" (not null) for plain <a> clicks, so the router skips intercept() ' +
      "and the polyfill falls back to a full-page navigation, resetting its " +
      "history stack — see README#Polyfill.",
  );

  await page.goto("/");
  await page.getByTestId("link-about").click();
  await expect(page).toHaveURL("/about");

  await page.evaluate(() => window.__router.back());
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("page")).toHaveText("home");

  await page.evaluate(() => window.__router.forward());
  await expect(page).toHaveURL("/about");
  await expect(page.getByTestId("page")).toHaveText("about");
});
