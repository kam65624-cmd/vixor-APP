import { chromium } from "playwright";

const htmlPath = "/home/z/my-project/scripts/vixor-report.html";
const outPath = "/home/z/my-project/download/vixor-pages-report.pdf";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.pdf({
  path: outPath,
  width: "720px",
  height: "1020px",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();
console.log("PDF saved to:", outPath);
