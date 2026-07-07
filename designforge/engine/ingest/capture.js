/**
 * DesignForge — Playwright-based website capture engine
 * 
 * Takes a URL, captures full-page + viewport screenshots,
 * extracts DOM, fonts, colors, section layout, and animation metadata.
 * 
 * Usage: node engine/ingest/capture.js <url> [outputDir]
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Color extraction from computed styles
function extractColors(element) {
  const styles = window.getComputedStyle(element);
  const colors = new Set();
  const props = ['color', 'background-color', 'border-color', 'background'];
  props.forEach(prop => {
    const val = styles[prop];
    if (val && val.startsWith('rgb')) {
      colors.add(val);
    }
  });
  return Array.from(colors);
}

// Font extraction
function extractFonts() {
  const fonts = new Set();
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const font = style['font-family'];
    if (font) {
      font.split(',').forEach(f => fonts.add(f.trim().replace(/['"]/g, '')));
    }
  });
  return Array.from(fonts);
}

// Section detection based on semantic/visual boundaries
function detectSections() {
  const sections = [];
  const candidates = document.querySelectorAll(
    'section, header, footer, main, article, [class*="hero"], [class*="section"], [class*="feature"], ' +
    '[class*="pricing"], [class*="testimonial"], [class*="cta"], [class*="contact"], ' +
    '[class*="footer"], [id*="hero"], [id*="section"], [id*="feature"]'
  );
  
  candidates.forEach((el, i) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 200 && rect.height > 50) { // Filter out tiny elements
      sections.push({
        index: i,
        tag: el.tagName.toLowerCase(),
        id: el.id,
        classes: Array.from(el.classList),
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        textLength: el.innerText?.length || 0,
        hasImages: el.querySelectorAll('img, svg, video').length > 0,
        hasForm: el.querySelectorAll('form, input, button, a[href*="contact"]').length > 0
      });
    }
  });
  return sections;
}

async function captureSite(url, outputDir) {
  const siteId = crypto.createHash('md5').update(url).digest('hex').slice(0, 8);
  const dir = path.join(outputDir || './data/sites', siteId);
  fs.mkdirSync(dir, { recursive: true });
  
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  console.log(`Capturing: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Let animations settle
    
    // Capture screenshots
    await page.screenshot({ path: path.join(dir, 'viewport.png'), fullPage: false });
    await page.screenshot({ path: path.join(dir, 'fullpage.png'), fullPage: true });
    
    // Mobile screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(dir, 'mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Extract design metadata
    const fonts = await page.evaluate(extractFonts);
    const sections = await page.evaluate(detectSections);
    const html = await page.content();
    
    // Extract computed styles for colors
    const colors = await page.evaluate(() => {
      const all = document.querySelectorAll('*');
      const colorSet = new Set();
      all.forEach(el => {
        const s = window.getComputedStyle(el);
        ['color', 'background-color'].forEach(p => {
          const v = s[p];
          if (v && (v.startsWith('rgb') || v.startsWith('#'))) colorSet.add(v);
        });
      });
      return Array.from(colorSet).slice(0, 50);
    });
    
    // Save metadata
    const metadata = {
      url,
      capturedAt: new Date().toISOString(),
      siteId,
      viewport: { width: 1920, height: 1080 },
      fonts,
      colors: colors.slice(0, 20),
      sections,
      sectionCount: sections.length,
      hasHero: sections.some(s => /hero/i.test(s.id || s.classes.join(' '))),
      hasFooter: sections.some(s => /footer/i.test(s.id || s.classes.join(' '))),
      hasNav: sections.some(s => /nav/i.test(s.id || s.classes.join(' ')))
    };
    
    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    fs.writeFileSync(path.join(dir, 'page.html'), html);
    
    console.log(`Done: ${url} → ${dir}/`);
    return metadata;
    
  } catch (err) {
    console.error(`Failed: ${url} - ${err.message}`);
    throw err;
  } finally {
    await browser.close();
  }
}

// CLI entry point
if (require.main === module) {
  const url = process.argv[2];
  const outputDir = process.argv[3];
  if (!url) {
    console.error('Usage: node capture.js <url> [outputDir]');
    process.exit(1);
  }
  captureSite(url, outputDir).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { captureSite };
