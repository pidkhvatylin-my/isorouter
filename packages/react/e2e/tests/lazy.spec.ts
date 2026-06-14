import { expect, test } from "@playwright/test";

test("resolves a lazy component on first navigation and caches it across revisits", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("link-user").click();
  await expect(page.getByTestId("page")).toHaveText("user:42");
  await expect(page.evaluate(() => window.__userLoadCount)).resolves.toBe(1);

  await page.getByTestId("link-home").click();
  await expect(page.getByTestId("page")).toHaveText("home");

  await page.getByTestId("link-user").click();
  await expect(page.getByTestId("page")).toHaveText("user:42");
  await expect(page.evaluate(() => window.__userLoadCount)).resolves.toBe(1);
});
