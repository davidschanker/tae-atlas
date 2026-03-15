import { test as setup, expect } from "@playwright/test";

const authFile = "tests/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL!;
  const password = process.env.TEST_USER_PASSWORD!;

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/trips", { timeout: 10000 });
  await page.context().storageState({ path: authFile });
});
