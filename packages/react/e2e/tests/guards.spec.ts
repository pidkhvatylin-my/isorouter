import { expect, test } from "@playwright/test";

test("beforeLoad returning a string redirects (replacing the entry)", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.__router.navigate("/redirect-from"));

  await expect(page).toHaveURL("/redirect-to");
  await expect(page.getByTestId("page")).toHaveText("redirect-target");
});

test("beforeLoad returning false blocks navigation and restores the current URL", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.__router.navigate("/blocked"));

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("page")).toHaveText("home");
});
