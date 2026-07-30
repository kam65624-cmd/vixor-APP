const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("file:///tmp/tasks-report.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await page.pdf({
    path: "/home/z/my-project/download/VIXOR-Tasks-Report.pdf",
    width: "720px",
    height: "1020px",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();
  console.log("PDF generated");
})();
