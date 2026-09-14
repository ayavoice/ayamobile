/**
 * Post-processes `expo export -p web` output before deploying.
 *
 * Metro mirrors any asset that lives under node_modules/ (e.g. the vector
 * icon fonts) into dist/assets/node_modules/... . Vercel's static file
 * server silently 404s any path containing a `node_modules` segment, so
 * that folder needs renaming — and every reference to it inside the built
 * JS bundles needs rewriting to match.
 *
 * Also polishes index.html for production a11y / SEO (lang, title, meta,
 * skip link).
 */
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");
const FROM_DIR = path.join(DIST, "assets", "node_modules");
const TO_DIR = path.join(DIST, "assets", "vendor");
const FROM_URL = "/assets/node_modules/";
const TO_URL = "/assets/vendor/";

const APP_TITLE = "Aya — Voice mobile money";
const APP_DESCRIPTION =
  "Accessibility-first voice agent for mobile money in Akan (Twi) and Ewe. Speak naturally to send money, check balance, and buy airtime.";
const THEME_COLOR = "#5528E8";

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function polishIndexHtml(html) {
  let out = html;

  // Ensure html lang
  if (/<html[^>]*>/i.test(out)) {
    out = out.replace(/<html([^>]*)>/i, (_m, attrs) => {
      if (/\blang\s*=/i.test(attrs)) {
        return `<html${attrs.replace(/\blang\s*=\s*["'][^"']*["']/i, ' lang="en"')}>`;
      }
      return `<html lang="en"${attrs}>`;
    });
  }

  const headExtras = [
    `<title>${APP_TITLE}</title>`,
    `<meta name="description" content="${APP_DESCRIPTION}">`,
    `<meta name="theme-color" content="${THEME_COLOR}">`,
    `<meta name="application-name" content="Aya">`,
    `<meta property="og:title" content="${APP_TITLE}">`,
    `<meta property="og:description" content="${APP_DESCRIPTION}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="webscan-site-verification" content="4aR5GmM-xu2Cm33ZecygYDsehPWbQjSF">`,
    `<style id="aya-a11y">
.aya-skip-link{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:10000;padding:12px 16px;background:#5528E8;color:#fff;font:600 16px/1.2 system-ui,sans-serif;text-decoration:none;border-radius:0 0 8px 0}
.aya-skip-link:focus,.aya-skip-link:focus-visible{left:0;top:0;width:auto;height:auto;overflow:visible;outline:3px solid #2830F0;outline-offset:2px}
:focus-visible{outline:3px solid #5528E8;outline-offset:2px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
</style>`,
  ].join("\n    ");

  // Replace or insert title
  if (/<title>[^<]*<\/title>/i.test(out)) {
    out = out.replace(/<title>[^<]*<\/title>/i, `<title>${APP_TITLE}</title>`);
  }

  // Inject meta + styles once into <head>
  if (!out.includes('name="description"')) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}\n    ${headExtras}`);
  } else if (!out.includes("webscan-site-verification")) {
    out = out.replace(
      /<head[^>]*>/i,
      (m) =>
        `${m}\n    <meta name="webscan-site-verification" content="4aR5GmM-xu2Cm33ZecygYDsehPWbQjSF">`,
    );
  }

  // Deduplicate title if we injected one and an old one remained
  const titles = out.match(/<title>[^<]*<\/title>/gi) || [];
  if (titles.length > 1) {
    let seen = false;
    out = out.replace(/<title>[^<]*<\/title>/gi, (t) => {
      if (seen) return "";
      seen = true;
      return `<title>${APP_TITLE}</title>`;
    });
  }

  // Skip link before app root
  const skip =
    '<a class="aya-skip-link" href="#main-content">Skip to main content</a>';
  if (!out.includes("aya-skip-link")) {
    if (/<body[^>]*>/i.test(out)) {
      out = out.replace(/<body([^>]*)>/i, `<body$1>\n    ${skip}`);
    }
  }

  return out;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function moveDir(from, to) {
  if (fs.existsSync(to)) removeDir(to);
  try {
    fs.renameSync(from, to);
  } catch {
    // Windows often blocks rename across antivirus / open handles — fall back to copy+delete.
    copyDir(from, to);
    removeDir(from);
  }
}

function main() {
  if (!fs.existsSync(DIST)) {
    throw new Error(`dist/ not found at ${DIST} — run "expo export -p web" first.`);
  }

  if (fs.existsSync(FROM_DIR)) {
    moveDir(FROM_DIR, TO_DIR);
    console.log(`Moved ${path.relative(DIST, FROM_DIR)} -> ${path.relative(DIST, TO_DIR)}`);
  } else {
    console.log(`No ${path.relative(DIST, FROM_DIR)} directory to rename — skipping.`);
  }

  let rewritten = 0;
  for (const file of walk(DIST)) {
    if (!file.endsWith(".js")) continue;
    const content = fs.readFileSync(file, "utf8");
    if (!content.includes(FROM_URL)) continue;
    fs.writeFileSync(file, content.split(FROM_URL).join(TO_URL));
    rewritten++;
    console.log(`Rewrote asset URLs in ${path.relative(DIST, file)}`);
  }

  if (rewritten === 0 && fs.existsSync(TO_DIR)) {
    console.warn(
      "Renamed the assets folder but found no JS bundle referencing the old path — check manually.",
    );
  }

  const vercelJsonSrc = path.join(__dirname, "..", "vercel.json");
  if (fs.existsSync(vercelJsonSrc)) {
    fs.copyFileSync(vercelJsonSrc, path.join(DIST, "vercel.json"));
    console.log("Copied vercel.json into dist/ (expo export doesn't preserve it).");
  }

  const indexHtmlPath = path.join(DIST, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    const html = fs.readFileSync(indexHtmlPath, "utf8");
    fs.writeFileSync(indexHtmlPath, polishIndexHtml(html));
    console.log("Polished dist/index.html (lang, title, meta, skip link, a11y CSS).");
  }
}

main();
