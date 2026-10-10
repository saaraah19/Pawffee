/**
 * Takes the screenshots used in the README and saves them to docs/screenshots.
 *
 * Usage:
 *   1. Start the site with demo data:   npm run seed && npm run dev
 *   2. In another terminal, one time:   npm install --no-save playwright
 *                                       npx playwright install chromium
 *   3. Run:                             npm run screenshots
 *
 * Settings (all optional):
 *   BASE_URL        where the site is running, default http://localhost:3000
 *   ADMIN_EMAIL     admin login, read from .env.local if not set
 *   ADMIN_PASSWORD  admin login, read from .env.local if not set
 *
 * This is plain JavaScript on purpose. The Next.js build type-checks every
 * .ts file in the repo, and this script needs a package that is not part of
 * the app's own dependencies.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const OUT_DIR = path.resolve("docs", "screenshots");

try {
  const { config } = await import("dotenv");
  config({ path: ".env.local", quiet: true });
  config({ quiet: true });
} catch {
  // dotenv is only a convenience, the variables can also come from the shell.
}

let playwright;
try {
  playwright = await import("playwright");
} catch {
  console.error(
    "Playwright is not installed. Run these two commands, then try again:\n" +
      "  npm install --no-save playwright\n" +
      "  npx playwright install chromium"
  );
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

const taken = [];
const skipped = [];

async function settle(page) {
  // Walk down the page so lazy images load, then come back to the top.
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight / 2);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(250);
}

async function go(page, route) {
  const res = await page.goto(BASE_URL + route, { waitUntil: "domcontentloaded", timeout: 90_000 });
  if (res && res.status() >= 400) throw new Error(`${route} answered ${res.status()}`);
  await settle(page);
}

// Scrolls so the element sits just under the sticky header.
async function scrollTo(page, locator, offset = 90) {
  await locator.first().waitFor({ state: "attached", timeout: 5000 });
  await locator.first().evaluate((el, off) => {
    const top = el.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo(0, Math.max(0, top));
  }, offset);
  await page.waitForTimeout(250);
}

async function shot(page, name, label) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  taken.push(name);
  console.log(`  saved ${path.relative(process.cwd(), file)}  (${label})`);
}

async function attempt(name, fn) {
  try {
    await fn();
  } catch (err) {
    skipped.push(name);
    console.warn(`  skipped ${name}: ${err.message.split("\n")[0]}`);
  }
}

async function firstHref(page, selector) {
  const href = await page.locator(selector).first().getAttribute("href", { timeout: 5000 });
  if (!href) throw new Error(`no link matches ${selector}`);
  return href;
}

await mkdir(OUT_DIR, { recursive: true });
console.log(`Capturing ${BASE_URL}`);

const browser = await playwright.chromium.launch();

try {
  // Public site, desktop
  const desktop = await browser.newContext({ viewport: DESKTOP });
  const page = await desktop.newPage();

  console.log("\nPublic site");
  let recipePath = null;
  let recipeWord = "cake";

  await attempt("home", async () => {
    await go(page, "/");
    await shot(page, "home", "home page");
  });

  await attempt("home-featured", async () => {
    await scrollTo(page, page.getByRole("heading", { name: "Featured recipes" }), 110);
    await shot(page, "home-featured", "featured recipes");
  });

  await attempt("recipes", async () => {
    await go(page, "/recipes");
    recipePath = await firstHref(page, 'a[href^="/recipes/"]:not([href*="?"])');
    const title = (await page.locator('a[href^="/recipes/"] h3').first().innerText()).trim();
    recipeWord = title.split(/\s+/)[0].replace(/[^\p{L}\p{N}]/gu, "") || recipeWord;
    await shot(page, "recipes", "recipe library");
  });

  await attempt("search", async () => {
    await go(page, `/recipes?q=${encodeURIComponent(recipeWord)}`);
    await shot(page, "search", `search for "${recipeWord}"`);
  });

  await attempt("categories", async () => {
    await go(page, "/categories");
    await shot(page, "categories", "categories");
  });

  await attempt("category", async () => {
    await go(page, "/categories");
    const href = await firstHref(page, 'a[href^="/categories/"]');
    await go(page, href);
    await shot(page, "category", "one category");
  });

  await attempt("recipe", async () => {
    if (!recipePath) throw new Error("no recipe link was found on /recipes");
    await go(page, recipePath);
    await shot(page, "recipe", "recipe page, top");
  });

  await attempt("recipe-details", async () => {
    await scrollTo(page, page.getByRole("heading", { name: "Ingredients" }));
    await shot(page, "recipe-details", "ingredients and instructions");
  });

  await attempt("recipe-notes", async () => {
    await scrollTo(page, page.getByText(/^(My tips|My little secret|Cooking notes|My verdict)$/), 110);
    await shot(page, "recipe-notes", "personal notes");
  });

  await attempt("about", async () => {
    await go(page, "/about");
    await shot(page, "about", "about page");
  });

  await desktop.close();

  // Public site, phone
  console.log("\nPhone");
  const phone = await browser.newContext({
    viewport: PHONE,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobile = await phone.newPage();

  await attempt("mobile-home", async () => {
    await go(mobile, "/");
    await shot(mobile, "mobile-home", "home on a phone");
  });

  await attempt("mobile-menu", async () => {
    await mobile.locator('summary[aria-label="Open menu"]').click();
    await mobile.waitForTimeout(200);
    await shot(mobile, "mobile-menu", "navigation menu open");
  });

  await attempt("mobile-recipe", async () => {
    if (!recipePath) throw new Error("no recipe link was found");
    await go(mobile, recipePath);
    await shot(mobile, "mobile-recipe", "recipe on a phone");
  });

  await phone.close();

  // Admin
  console.log("\nAdmin");
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn("  skipped admin screenshots: set ADMIN_EMAIL and ADMIN_PASSWORD (or put them in .env.local)");
    skipped.push("admin-*");
  } else {
    const admin = await browser.newContext({ viewport: DESKTOP });
    const ap = await admin.newPage();

    await attempt("admin-login", async () => {
      await go(ap, "/admin/login");
      await shot(ap, "admin-login", "sign in");
    });

    let signedIn = false;
    await attempt("sign-in", async () => {
      await ap.fill("#email", ADMIN_EMAIL);
      await ap.fill("#password", ADMIN_PASSWORD);
      await ap.getByRole("button", { name: "Sign in" }).click();
      await ap.waitForURL(/\/admin(\/|$)(?!login)/, { timeout: 60_000 });
      signedIn = true;
    });

    if (signedIn) {
      await attempt("admin-dashboard", async () => {
        await go(ap, "/admin");
        await shot(ap, "admin-dashboard", "dashboard");
      });

      let editPath = null;
      await attempt("admin-recipes", async () => {
        await go(ap, "/admin/recipes");
        editPath = await firstHref(ap, 'a[href^="/admin/recipes/"][href$="/edit"]');
        await shot(ap, "admin-recipes", "recipe list");
      });

      await attempt("admin-editor", async () => {
        if (!editPath) throw new Error("no recipe to edit was found");
        await go(ap, editPath);
        await shot(ap, "admin-editor", "recipe editor");
      });

      await attempt("admin-editor-notes", async () => {
        await scrollTo(ap, ap.getByRole("heading", { name: "Personal notes" }), 30);
        await shot(ap, "admin-editor-notes", "editor, personal notes and publish bar");
      });

      await attempt("admin-categories", async () => {
        await go(ap, "/admin/categories");
        await shot(ap, "admin-categories", "category manager");
      });
    }

    await admin.close();
  }
} finally {
  await browser.close();
}

console.log(`\n${taken.length} screenshots saved to ${path.relative(process.cwd(), OUT_DIR)}`);
if (skipped.length) {
  console.log(`Skipped: ${skipped.join(", ")}`);
  process.exitCode = 1;
}
