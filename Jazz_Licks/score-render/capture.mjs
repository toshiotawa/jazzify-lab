/**
 * Headless frame capture for somisira slides (Jazzify ChordVoicingStaff).
 * Usage: node capture.mjs <config.json> <outputDir>
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SIZES = {
  horizontal: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  vertical_lower: { width: 1080, height: 1920 },
};

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function main() {
  const configPath = process.argv[2];
  const outDir = process.argv[3];
  if (!configPath || !outDir) {
    console.error("Usage: node capture.mjs <config.json> <outputDir>");
    process.exit(1);
  }
  const items = JSON.parse(fs.readFileSync(configPath, "utf8"));
  fs.mkdirSync(outDir, { recursive: true });

  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const template = fs.readFileSync(path.join(__dirname, "slide.html"), "utf8");
  const staffBundleUri = `file://${path.join(__dirname, "dist-staff/staff-bundle.js")}`;
  const staffCssUri = `file://${path.join(__dirname, "dist-staff/somisira-staff-bundle.css")}`;

  for (const item of items) {
    const scoreJson = JSON.stringify(item.scoreData);
    const html = template
      .replaceAll("{{STAFF_BUNDLE_URI}}", staffBundleUri)
      .replaceAll("{{STAFF_CSS_URI}}", staffCssUri)
      .replaceAll("{{PERFORMER}}", escapeHtml(item.performer))
      .replaceAll("{{TITLE}}", escapeHtml(item.title))
      .replaceAll("{{RECORD_TITLE}}", escapeHtml(item.recordTitle || ""))
      .replaceAll("{{COVER_URI}}", item.coverUri)
      .replaceAll("{{ORIENTATION}}", item.orientation)
      .replaceAll("{{SCORE_JSON}}", scoreJson.replaceAll("</", "<\\/"));

    const size = SIZES[item.orientation] || SIZES.horizontal;
    const tmpHtml = path.resolve(outDir, `_slide_${item.id}_${item.orientation}.html`);
    fs.writeFileSync(tmpHtml, html);
    await page.setViewport({ ...size, deviceScaleFactor: 1 });
    const fileUrl = new URL(`file://${tmpHtml}`).href;
    await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 120000 });
    await page.waitForFunction(() => window.__slideReady === true, { timeout: 120000 });

    const check = await page.evaluate((expected) => {
      const err = window.__slideStaffError;
      const ellipses = document.querySelectorAll(
        'ellipse[data-voicing-group-id], ellipse[data-voicing-index]',
      );
      return {
        err,
        count: ellipses.length,
        expected,
      };
    }, item.scoreData.noteCount ?? 5);

    if (check.err) {
      throw new Error(`${item.id} ${item.orientation}: ${check.err}`);
    }
    if (check.count !== check.expected) {
      throw new Error(
        `${item.id} ${item.orientation}: expected ${check.expected} note heads, got ${check.count}`,
      );
    }

    const outPng = path.join(outDir, `${item.id}_${item.orientation}.png`);
    await page.screenshot({ path: outPng, type: "png" });
    console.log("wrote", outPng, `notes=${check.count}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
