const puppeteer = require('puppeteer');
const { renderResumeHtml } = require('./html.service');

const MARGINS = {
  'classic-1': { top: '0.58in', bottom: '0.64in', left: '0.68in', right: '0.68in' },
  'classic-2': { top: '0.62in', bottom: '0.66in', left: '0.72in', right: '0.72in' },
  'compact-1': { top: '0.4in', bottom: '0.42in', left: '0.48in', right: '0.48in' },
};

let browserPromise;

function launchOptions() {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--font-render-hinting=none',
  ];
  const options = { headless: true, args };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return options;
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch(launchOptions()).catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  const browser = await browserPromise;
  if (!browser.connected) {
    browserPromise = null;
    return getBrowser();
  }
  return browser;
}

async function renderPdf(resume, templateId) {
  const html = renderResumeHtml(resume, templateId);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('print');
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: false,
      margin: MARGINS[templateId] || MARGINS['classic-1'],
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}

async function closeBrowser() {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  if (browser) await browser.close().catch(() => {});
}

module.exports = { renderPdf, closeBrowser };
