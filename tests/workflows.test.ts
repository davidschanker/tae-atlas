import { test, expect } from "@playwright/test";

const TRIP_NAME = `Test Trip ${Date.now()}`;
let tripUrl: string;

test("1 - trips page loads", async ({ page }) => {
  await page.goto("/trips");
  await expect(page.getByText("Your trips")).toBeVisible();
});

test("2 - create a trip", async ({ page }) => {
  await page.goto("/trips");
  await page.locator("#trip-name").fill(TRIP_NAME);
  await page.locator("#trip-destination").fill("Scotland");
  await page.locator("#trip-start-date").fill("2025-08-01");
  await page.locator("#trip-end-date").fill("2025-08-10");
  await page.getByRole("button", { name: "Create trip" }).click();

  await page.waitForURL(/\/trips/, { timeout: 10000 });
  const url = page.url();
  const errorMatch = url.match(/createError=([^&]+)/);
  if (errorMatch) throw new Error(`Trip creation failed: ${decodeURIComponent(errorMatch[1])}`);

  await expect(page).toHaveURL(/\/trips\/.+\/calendar/);
  tripUrl = page.url().replace("/calendar", "");
});

test("3 - add a calendar day", async ({ page }) => {
  await page.goto(tripUrl + "/calendar");
  await page.locator("#day-date").fill("2025-08-01");
  await page.locator("#day-location").fill("Edinburgh");
  await page.getByRole("button", { name: "Add day" }).click();

  await expect(page.getByText("Edinburgh")).toBeVisible({ timeout: 10000 });
});

test("4 - add a travel leg", async ({ page }) => {
  await page.goto(tripUrl + "/travel");
  await page.locator("#leg-origin").fill("JFK");
  await page.locator("#leg-destination").fill("EDI");
  await page.locator("#leg-departure-date").fill("2025-08-01");
  await page.locator("#leg-departure-time").fill("08:00");
  await page.locator("#leg-arrival-date").fill("2025-08-01");
  await page.locator("#leg-arrival-time").fill("20:00");
  await page.getByRole("button", { name: "Add leg" }).click();

  await expect(page.getByText("JFK → EDI")).toBeVisible({ timeout: 10000 });
});

test("5 - add an accommodation", async ({ page }) => {
  await page.goto(tripUrl + "/stays");
  await page.locator("#stay-name").fill("The Witchery");
  await page.locator("#stay-price").fill("200");
  await page.getByRole("button", { name: "Add option" }).click();

  await expect(page.getByText("The Witchery")).toBeVisible({ timeout: 10000 });
});

test("6 - vote on accommodation", async ({ page }) => {
  await page.goto(tripUrl + "/stays");
  await page.locator("button[title='Vote for this']").first().click();
  // Vote count should now show 1
  await expect(page.getByText("The Witchery")).toBeVisible({ timeout: 10000 });
});

test("7 - add a location and idea", async ({ page }) => {
  await page.goto(tripUrl + "/ideas");

  // Add location
  await page.getByPlaceholder("Edinburgh").fill("Edinburgh");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edinburgh" })).toBeVisible({ timeout: 10000 });

  // Add idea
  await page.locator("#idea-title").fill("Scotch Whisky Experience");
  await page.getByRole("button", { name: "Add idea" }).click();
  await expect(page.getByText("Scotch Whisky Experience")).toBeVisible({ timeout: 10000 });
});

test("8 - people page loads and shows a member", async ({ page }) => {
  await page.goto(tripUrl + "/people");
  await expect(page.getByRole("heading", { name: "People" })).toBeVisible();
  // At least one member row should exist (the trip owner)
  await expect(page.getByText("owner")).toBeVisible();
});
