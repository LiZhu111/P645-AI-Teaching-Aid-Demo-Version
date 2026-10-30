import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${process.env.BASE_URL || "http://127.0.0.1:3105"}/assessment`);
  await page.getByRole("heading", { name: "Feedback", exact: true }).waitFor();
  await page.getByRole("combobox", { name: "Assessor decision" }).selectOption("correct");
  await page.locator("div.rounded-lg").filter({ hasText: /^Marked correct by assessor$/ }).waitFor();
  const correctText = await page.locator("section").last().innerText();
  assert.match(correctText, /Aita explanation/i);
  assert.match(correctText, /Criterion 1\.2 - Construction Hazards/);
  assert.match(correctText, /does not mark answers/);
  await page.getByRole("combobox", { name: "Assessor decision" }).selectOption("incorrect");
  await page.locator("div.rounded-lg").filter({ hasText: /^Marked incorrect by assessor$/ }).waitFor();
  const incorrectText = await page.locator("section").last().innerText();
  assert.notEqual(correctText, incorrectText);
  assert.match(incorrectText, /does not mark answers.*model-answer key/i);
  assert.deepEqual(errors, []);
  console.log("PASS Correct and Incorrect feedback cases show distinct assessor decisions, explanations, source and marking boundary");
} finally {
  await browser.close();
}
