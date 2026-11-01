// Captures portfolio screenshots for the browser projects.
// Usage: NODE_PATH=~/projects/capital-crm/node_modules node tools/capture.cjs [vision|find]
// PNGs go to $OUT (default /tmp/portfolio-shots); convert them into assets/shots/*.webp.
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright-core");

const sandbox = path.resolve(__dirname, "../..");
const out = process.env.OUT || "/tmp/portfolio-shots";
fs.mkdirSync(out, { recursive: true });
const only = process.argv[2];

async function visionApi(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  const page = await ctx.newPage();
  const result = {
    region: "Medan Johor, Medan, Indonesia",
    next_prayer: { name: "Maghrib", time: "18:24", in: "2h 14m" },
    schedule: [
      { name: "Fajr", time: "04:59", done: true },
      { name: "Dhuhr", time: "12:21", done: true },
      { name: "Asr", time: "15:22", done: false, due: true },
      { name: "Maghrib", time: "18:24", done: false },
      { name: "Isha", time: "19:33", done: false },
    ],
  };
  let polls = 0;
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (url.pathname === "/api/healthz") return json({ ok: true });
    if (url.pathname === "/api/v1/providers") return json({ providers: ["claude", "codex", "opencode"], default_provider: "claude", default_model: "claude-sonnet-5-5", default_reasoning_effort: "medium" });
    if (url.pathname === "/api/v1/models") return json({ models: [
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", group: "Anthropic", reasoning_efforts: ["low", "medium", "high"] },
      { id: "claude-opus-5-5", label: "Claude Opus 5.5", group: "Anthropic", reasoning_efforts: ["low", "medium", "high"] },
    ] });
    if (url.pathname === "/api/v1/jobs" && route.request().method() === "POST") return json({ id: "7f3a9c2e-4b1d-4e8a-9f6c-2d5b8a1e3c70", status: "queued" }, 202);
    if (url.pathname.startsWith("/api/v1/jobs/")) {
      polls++;
      return json({ id: "7f3a9c2e-4b1d-4e8a-9f6c-2d5b8a1e3c70", status: "succeeded", response: { _metadata: { provider: "claude", model: "claude-sonnet-5-5", reasoning_effort: "medium", token_usage: { input_tokens: 1843, output_tokens: 212, total_tokens: 2055 } }, result } });
    }
    return route.abort();
  });
  // Needs the playground dev server: (cd vision-api && bunx vite --port 27199)
  await page.goto("http://127.0.0.1:27199/");
  await page.waitForTimeout(1200);
  await page.locator('input[type="file"]').first().setInputFiles(path.join(sandbox, "pray-time-promo/public/app/compact-afternoon-dark.png"));
  await page.locator("textarea").first().fill("Read this prayer-time widget and return the schedule as JSON.");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, "vision-api.png") });
  await ctx.close();
}

async function extensionContext(ext, opts = {}) {
  return chromium.launchPersistentContext("", {
    headless: true,
    channel: "chromium",
    colorScheme: "dark",
    viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
    ...opts,
  });
}

async function viewportFind() {
  const ext = path.join(sandbox, "viewport-find");
  const ctx = await extensionContext(ext, { colorScheme: "light" });
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><html><head><title>Compose notes</title><style>
    body{font:17px/1.65 Georgia,serif;max-width:760px;margin:40px auto;color:#222;padding:0 24px}
    h1{font-family:system-ui;font-size:30px} h2{font-family:system-ui;margin-top:2em}</style></head><body>
    <h1>Notes on state in Jetpack Compose</h1>
    <p>State in Compose is any value that can change over time. A composable reads state, and when that state changes, Compose schedules a recomposition of every composable that read it.</p>
    <p>Hoisting state means moving it up to the caller so a composable becomes stateless. Stateless composables are easier to preview, test, and reuse, because the state lives in one place.</p>
    <h2>Remember and rememberSaveable</h2>
    <p><code>remember</code> keeps a value across recompositions, but the state is lost on configuration change. <code>rememberSaveable</code> stores the state in a Bundle so it survives rotation and process death.</p>
    <p>Derived state should be computed with <code>derivedStateOf</code> when the input state changes more often than the output you care about.</p>
    <h2>Side effects</h2>
    <p>Effects such as <code>LaunchedEffect</code> run when their keys change. Reading state inside an effect does not restart it unless that state is one of the keys.</p>
    <p>Prefer a single source of truth: a ViewModel exposes UI state as a StateFlow, and the screen collects that state with lifecycle awareness.</p>
    </body></html>`);
  await page.addStyleTag({ path: path.join(ext, "highlight.css") });
  await page.evaluate(() => (window.chrome = window.chrome || {}));
  await page.addScriptTag({ path: path.join(ext, "content.js") });
  await page.waitForTimeout(300);
  await page.keyboard.type("state");
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, "viewport-find.png") });
  await ctx.close();
}

(async () => {
  if (!only || only === "vision") { const b = await chromium.launch({ channel: "chromium" }); await visionApi(b); await b.close(); }
  if (!only || only === "find") await viewportFind();
})().catch((e) => { console.error(e); process.exit(1); });
