import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const rubricFile = {
  name: "imported-rubric.json",
  mimeType: "application/json",
  buffer: Buffer.from(
    JSON.stringify({
      version: "auraone-rubric-v1",
      criteria: [
        { criterion_id: "accuracy", label: "Accuracy", scale: "binary", weight: 1 },
        { criterion_id: "clarity", label: "Clarity", scale: "binary", weight: 1 },
      ],
    }),
  ),
};

const responsesFile = {
  name: "imported-responses.jsonl",
  mimeType: "application/json",
  buffer: Buffer.from(
    JSON.stringify({
      output_id: "imported-output",
      response: "A synthetic response used by the rendered browser test.",
      labels: { accuracy: 1, clarity: 0.75 },
    }),
  ),
};

async function openPlayground(page: Page) {
  await page.route("https://cdn.jsdelivr.net/pyodide/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tutorial", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Rubric editor")).toBeVisible({ timeout: 20_000 });
}

async function assertNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
}

test("imports rubric and responses, evaluates locally, and exposes exact evidence", async ({ page }) => {
  await openPlayground(page);

  const rubricChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import rubric" }).click();
  await (await rubricChooser).setFiles(rubricFile);
  await expect(page.getByText("Imported imported-rubric.json")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Rubric 2/ })).toHaveAttribute("aria-selected", "true");

  const responsesChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import responses" }).click();
  await (await responsesChooser).setFiles(responsesFile);
  await expect(page.getByText("Imported imported-responses.jsonl")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Responses 1/ })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: "Run evaluation" }).click();
  await expect(page.getByText("Evidence ready", { exact: true })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "local-fallback" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Fallback score" })).toBeVisible();
  await expect(page.getByText(/local fallback produced this run/)).toBeVisible();
  await expect(page).toHaveURL(/#.+/);

  await page.getByText("Raw result JSON").click();
  await expect(page.locator(".raw-output pre")).toContainText('"runtime": "local-fallback"');
});

test("supports visible keyboard focus and WAI-ARIA tab navigation", async ({ page }) => {
  await openPlayground(page);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to workspace" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#workspace")).toBeFocused();

  const rubricTab = page.getByRole("tab", { name: /Rubric/ });
  const responsesTab = page.getByRole("tab", { name: /Responses/ });
  await rubricTab.focus();
  await expect(rubricTab).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(responsesTab).toBeFocused();
  await expect(responsesTab).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(rubricTab).toBeFocused();
  await expect(rubricTab).toHaveAttribute("aria-selected", "true");

  const focusOutline = await rubricTab.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(focusOutline).not.toBe("none");
});

test("has no serious or critical axe violations before and after evidence is rendered", async ({ page }) => {
  await openPlayground(page);

  const initial = await new AxeBuilder({ page }).analyze();
  expect(initial.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);

  await page.getByRole("button", { name: "Run evaluation" }).click();
  await expect(page.getByText("Evidence ready", { exact: true })).toBeVisible();
  const completed = await new AxeBuilder({ page }).analyze();
  expect(completed.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
});

test("honors reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPlayground(page);

  const motion = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.className = "spin";
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const result = { duration: style.animationDuration, iterations: style.animationIterationCount };
    probe.remove();
    return result;
  });
  expect(motion.iterations).toBe("1");
  expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(0.01);
});

test("remains legible and operable in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openPlayground(page);

  await page.getByRole("button", { name: "Run evaluation" }).focus();
  const styles = await page.getByRole("button", { name: "Run evaluation" }).evaluate((element) => {
    const computed = getComputedStyle(element);
    return { outline: computed.outlineStyle, foreground: computed.color, background: computed.backgroundColor };
  });
  expect(styles.outline).not.toBe("none");
  expect(styles.foreground).not.toBe(styles.background);
  await assertNoPageOverflow(page);
});

test("wraps long imported content without page-level overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openPlayground(page);

  const longId = `output-${"very-long-segment-".repeat(24)}`;
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import responses" }).click();
  await (await chooser).setFiles({
    name: "long-content.jsonl",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ output_id: longId, response: "x".repeat(4000), labels: {} })),
  });

  await expect(page.getByText(/Label for quality is missing/)).toBeVisible();
  await page.getByRole("button", { name: "Run evaluation" }).click();
  await expect(page.getByRole("rowheader", { name: "local-fallback" })).toBeVisible();
  await assertNoPageOverflow(page);
});

for (const width of [320, 390, 768, 1440]) {
  test(`keeps the complete workflow usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width <= 390 ? 900 : 960 });
    await openPlayground(page);

    await expect(page.getByRole("button", { name: "Run evaluation" })).toBeInViewport();
    await expect(page.getByRole("tablist", { name: "Input editors" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
    await assertNoPageOverflow(page);

    const columns = await page.locator(".workspace").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(width <= 768 ? 1 : 2);

    if (width <= 390) {
      const targets = await page.locator(".button, .select-control, .runtime-status").evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().height),
      );
      expect(Math.min(...targets)).toBeGreaterThanOrEqual(44);
    }
  });
}
