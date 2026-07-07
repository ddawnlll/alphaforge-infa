/**
 * DesignForge — Awwwards & CSS Design Awards scraper
 * 
 * Discovers and indexes award-winning websites from:
 * - Awwwards (awwwards.com/websites)
 * - CSS Design Awards (cssdesignawards.com)
 * - Godly (godly.website)
 * - Land-book (land-book.com)
 * 
 * Output: array of site metadata → ingest pipeline
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCES = {
  awwwards: {
    url: 'https://www.awwwards.com/websites/',
    selector: '.section-item',
    fields: { title: '.section-item-title', url: 'a', tags: '.tag' }
  },
  cssda: {
    url: 'https://www.cssdesignawards.com/',
    selector: '.website-card',
    fields: { title: '.card-title', url: 'a', tags: '.category-tag' }
  }
};

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'DesignForge/1.0 (+https://github.com/ddawnlll/alphaforge-infa)' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractSitesFromHTML(html, source) {
  // Simplified extraction — in production, use cheerio or jsdom
  const sites = [];
  
  // Pattern: find URLs in the page that point to site showcases
  const siteUrlPattern = /https?:\/\/[^"'\s]+/g;
  const urls = html.match(siteUrlPattern) || [];
  
  // Filter to likely site URLs (not social/share/static)
  const filtered = urls.filter(u => {
    try {
      const url = new URL(u);
      return !['twitter.com', 'facebook.com', 'instagram.com', 'github.com', 'linkedin.com']
        .some(blocked => url.hostname.includes(blocked));
    } catch { return false; }
  });
  
  // Deduplicate
  return [...new Set(filtered)].slice(0, 50).map(url => ({
    url,
    source,
    discoveredAt: new Date().toISOString()
  }));
}

async function discoverSites() {
  const allSites = [];
  
  for (const [source, config] of Object.entries(SOURCES)) {
    try {
      console.log(`Fetching ${source}...`);
      const html = await fetchPage(config.url);
      const sites = extractSitesFromHTML(html, source);
      console.log(`  Found ${sites.length} sites from ${source}`);
      allSites.push(...sites);
    } catch (err) {
      console.error(`  Error fetching ${source}: ${err.message}`);
    }
  }
  
  return allSites;
}

// Save discovered sites to queue
async function run() {
  const sites = await discoverSites();
  const outputPath = path.join(__dirname, '../../data/sites/discovered.json');
  
  // Merge with existing discovered sites
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  } catch { /* file doesn't exist yet */ }
  
  const existingUrls = new Set(existing.map(s => s.url));
  const newSites = sites.filter(s => !existingUrls.has(s.url));
  
  const merged = [...existing, ...newSites];
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  
  console.log(`\nTotal: ${existing.length} existing + ${newSites.length} new = ${merged.length}`);
  
  // Return new sites for immediate capture
  return newSites;
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { discoverSites, run };
