import { chromium } from 'playwright';

const htmlPath = '/home/z/my-project/scripts/vixor_report.html';
const outputPath = '/home/z/my-project/download/VIXOR_Workflow_Report_Bilingual.pdf';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle', timeout: 60000 });

// Wait for fonts to load
await page.waitForTimeout(3000);

await page.pdf({
  path: outputPath,
  width: '720px',
  height: '1020px',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: true,
});

await browser.close();
console.log('PDF generated:', outputPath);