import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("parse, add, and reset records without external requests", async ({
  page,
}) => {
  const externalRequests = [];
  page.on("request", (request) => {
    if (
      !request.url().startsWith("http://127.0.0.1:4174/") &&
      !request.url().startsWith("blob:")
    )
      externalRequests.push(request.url());
  });
  await expect(page.getByTestId("record-count")).toHaveText("8");
  await page
    .getByRole("button", { name: "Parse message", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add 1 record to dashboard" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add 1 record to dashboard" }).click();
  await expect(page.getByTestId("record-count")).toHaveText("9");
  await expect(page.getByTestId("labor-hours")).toHaveText("72 hrs");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep my records" }).click();
  await expect(page.getByTestId("record-count")).toHaveText("9");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset notebook", exact: true })
    .click();
  await expect(page.getByTestId("record-count")).toHaveText("8");
  expect(externalRequests).toEqual([]);
});

test("errors are actionable and editing invalidates the prior parse", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Try an error" }).click();
  await page
    .getByRole("button", { name: "Parse message", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "People must be a whole number",
  );
  await expect(page.getByTestId("record-count")).toHaveText("8");
  await page.getByRole("button", { name: "Two records", exact: true }).click();
  await page
    .getByRole("button", { name: "Parse message", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add 2 records to dashboard" }),
  ).toBeVisible();
  await page
    .getByLabel("Your message", { exact: true })
    .fill("A-TASK-1-2-EXTRA");
  await expect(
    page.getByRole("button", { name: /Add .* to dashboard/ }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Parse message", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Use field - task - people - hours.",
  );
});

test("filters update totals and export only visible records", async ({
  page,
}) => {
  await page
    .getByLabel("Filter by field", { exact: true })
    .selectOption("North Plot");
  await expect(page.getByTestId("record-count")).toHaveText("2");
  await expect(page.getByTestId("labor-hours")).toHaveText("9.5 hrs");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), "utf8");
  expect(csv.trim().split("\r\n")).toHaveLength(3);
  expect(csv).toContain("North Plot");
  expect(csv).not.toContain("South Plot");
  await page.getByLabel("Search records", { exact: true }).fill("missing");
  await expect(
    page.getByRole("heading", { name: "No matching records" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeDisabled();
});

test("sample batch appears in dashboard and page fits the viewport", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Two records", exact: true }).click();
  await page
    .getByRole("button", { name: "Parse message", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add 2 records to dashboard" })
    .click();
  await expect(page.getByTestId("record-count")).toHaveText("10");
  await expect(page.getByTestId("labor-hours")).toHaveText("79.5 hrs");
  const size = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(size.scrollWidth).toBeLessThanOrEqual(size.width);
  await page.reload();
  await expect(page.getByTestId("record-count")).toHaveText("8");
});
