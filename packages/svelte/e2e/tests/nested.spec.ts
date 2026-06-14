import { expect, test } from "@playwright/test";

test("renders a layout's index child and applies the layout's title", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("link-dashboard").click();

  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator("h1")).toHaveText("Dashboard");
  await expect(page.getByTestId("page")).toHaveText("overview");
  await expect(page).toHaveTitle("Dashboard");
});

test("renders a nested child inside its parent's outlet and the deepest title wins", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("link-settings").click();

  await expect(page).toHaveURL("/dashboard/settings");
  await expect(page.locator("h1")).toHaveText("Dashboard");
  await expect(page.getByTestId("page")).toHaveText("settings");
  await expect(page).toHaveTitle("Dashboard - Settings");
});
