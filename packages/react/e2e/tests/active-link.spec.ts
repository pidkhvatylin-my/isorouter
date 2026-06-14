import { expect, test } from "@playwright/test";

test("Link sets the active class and aria-current for the current route", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("link-home")).toHaveClass(/active/);
  await expect(page.getByTestId("link-home")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByTestId("link-about")).not.toHaveClass(/active/);
  await expect(page.getByTestId("link-about")).not.toHaveAttribute(
    "aria-current",
  );

  await page.getByTestId("link-settings").click();
  await expect(page).toHaveURL("/dashboard/settings");

  await expect(page.getByTestId("link-home")).not.toHaveClass(/active/);
  await expect(page.getByTestId("link-dashboard")).toHaveClass(/active/);
  await expect(page.getByTestId("link-dashboard")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByTestId("link-settings")).toHaveAttribute(
    "aria-current",
    "page",
  );
});
