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

test("a superseded navigation's guard is aborted before its side effect runs", async ({
  page,
}) => {
  await page.goto("/");

  await page.evaluate(() => {
    window.__router.navigate("/slow/1");
    window.__router.navigate("/slow/2");
  });

  await expect(page).toHaveURL("/slow/2");
  await expect(page.getByTestId("page")).toHaveText("slow:2");
  await expect(page.evaluate(() => window.__slowLog)).resolves.toEqual(["2"]);
});
