/**
 * DesignForge — Vector Index Engine
 * 
 * Creates and manages vector embeddings for design retrieval:
 * - Visual embeddings (SigLIP-based screenshot embeddings)
 * - Layout embeddings (section-flow vectors)
 * - Text embeddings (industry, style, brand keywords)
 * 
 * Storage: pgvector (MVP) / Qdrant (scale)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// In production, this uses SigLIP via ONNX Runtime or HuggingFace.
// For MVP, we use a hash-based fingerprint + metadata matching.
class DesignIndex {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.sitesDir = path.join(dataDir, 'sites');
    this.indexPath = path.join(dataDir, 'embeddings', 'design-index.json');
    this.index = { sites: [], embeddings: {} };
    this._load();
  }

  _load() {
    try {
      this.index = JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
      console.log(`Loaded index: ${this.index.sites.length} sites`);
    } catch {
      console.log('New index created');
    }
  }

  _save() {
    fs.mkdirSync(path.dirname(this.indexPath), { recursive: true });
    fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  /**
   * Generate layout fingerprint from section metadata
   */
  _layoutFingerprint(sections) {
    if (!sections || !sections.length) return '';
    const pattern = sections.map(s => {
      const type = s.id?.toLowerCase() + ' ' + s.classes?.join(' ');
      if (/hero/i.test(type)) return 'H';
      if (/feature|service/i.test(type)) return 'F';
      if (/pricing|price/i.test(type)) return 'P';
      if (/testimonial|review/i.test(type)) return 'T';
      if (/cta|contact/i.test(type)) return 'C';
      if (/footer/i.test(type)) return 'R';
      if (/faq|accordion/i.test(type)) return 'Q';
      if (/gallery|portfolio|work/i.test(type)) return 'G';
      if (/blog|article|news/i.test(type)) return 'B';
      if (/about|team/i.test(type)) return 'A';
      if (/nav|header/i.test(type)) return 'N';
      return '?';
    }).join('');
    return pattern;
  }

  /**
   * Generate visual fingerprint (simplified — SigLIP in production)
   */
  _visualFingerprint(metadata) {
    if (!metadata) return '';
    const { colors, fonts, sections } = metadata;
    
    // Color profile
    const colorProfile = (colors || []).slice(0, 5).join('|');
    
    // Font profile
    const fontProfile = (fonts || []).slice(0, 3).join('|');
    
    // Density score
    const density = sections?.length > 15 ? 'high' : sections?.length > 8 ? 'medium' : 'low';
    
    return `${density}|${colorProfile}|${fontProfile}`;
  }

  /**
   * Generate searchable tags from metadata
   */
  _generateTags(metadata) {
    const tags = [];
    
    // Industry signals from URL/content
    const url = metadata?.url || '';
    if (/medical|health|clinic|hospital|dental/i.test(url)) tags.push('industry:medical');
    if (/tech|saas|software|cloud|app/i.test(url)) tags.push('industry:saas');
    if (/shop|store|product|ecommerce/i.test(url)) tags.push('industry:ecommerce');
    if (/agency|studio|creative|design|brand/i.test(url)) tags.push('industry:agency');
    if (/restaurant|food|cafe|bar|menu/i.test(url)) tags.push('industry:food');
    if (/fashion|style|beauty|wear/i.test(url)) tags.push('industry:fashion');
    if (/edu|school|university|course|learn/i.test(url)) tags.push('industry:education');
    if (/realestate|property|home|rent|estate/i.test(url)) tags.push('industry:realestate');
    if (/industr|manufactur|supplier|equipment|b2b|factory/i.test(url)) tags.push('industry:industrial');
    if (/finance|bank|insur|invest|fund/i.test(url)) tags.push('industry:finance');
    if (/consult|law|legal|advisory/i.test(url)) tags.push('industry:consulting');
    if (/hotel|travel|tour|trip|vacation/i.test(url)) tags.push('industry:travel');
    
    // Style signals from audit scores
    if (metadata?.audit?.visual?.commercialFit > 7) tags.push('style:commercial_strong');
    if (metadata?.audit?.visual?.brandDistinctiveness > 7) tags.push('style:distinctive');
    if (metadata?.audit?.visual?.motionQuality > 7) tags.push('style:motion_heavy');
    if (metadata?.audit?.visual?.motionQuality < 3) tags.push('style:motion_subtle');
    
    return tags;
  }

  /**
   * Index a site from its captured metadata + audit
   */
  async indexSite(siteId, metadata, audit) {
    const sections = metadata?.sections || [];
    
    const entry = {
      siteId,
      url: metadata?.url || '',
      title: metadata?.title || '',
      source: metadata?.source || 'manual',
      indexedAt: new Date().toISOString(),
      audit: audit ? {
        finalScore: audit.finalScore,
        verdict: audit.verdict,
        priority: audit.priority,
        scores: audit.visual
      } : null,
      fingerprint: {
        layout: this._layoutFingerprint(sections),
        visual: this._visualFingerprint(metadata),
        sectionCount: sections.length,
        sectionTypes: [...new Set(sections.map(s => {
          const text = (s.id + ' ' + s.classes?.join(' ')).toLowerCase();
          if (/hero/i.test(text)) return 'hero';
          if (/feature|service/i.test(text)) return 'features';
          if (/pricing/i.test(text)) return 'pricing';
          if (/testimonial/i.test(text)) return 'testimonials';
          if (/cta|contact/i.test(text)) return 'cta';
          if (/footer/i.test(text)) return 'footer';
          if (/faq/i.test(text)) return 'faq';
          if (/gallery|portfolio/i.test(text)) return 'gallery';
          if (/blog|article/i.test(text)) return 'blog';
          if (/about|team/i.test(text)) return 'about';
          if (/nav|header/i.test(text)) return 'nav';
          return 'content';
        }))]
      },
      tags: this._generateTags({ url: metadata?.url, audit })
    };
    
    // Check for existing entry
    const existingIdx = this.index.sites.findIndex(s => s.siteId === siteId);
    if (existingIdx >= 0) {
      this.index.sites[existingIdx] = entry;
    } else {
      this.index.sites.push(entry);
    }
    
    this._save();
    return entry;
  }

  /**
   * Search by industry + style criteria
   */
  searchByBrief(brief) {
    const { industry, style, targetScore, minSections, maxSections, motionIntensity } = brief;
    
    let results = this.index.sites;
    
    // Filter by industry tag
    if (industry) {
      const indTag = `industry:${industry.toLowerCase()}`;
      results = results.filter(s => s.tags.includes(indTag));
    }
    
    // Filter by score threshold
    if (targetScore) {
      results = results.filter(s => s.audit?.finalScore >= targetScore);
    }
    
    // Filter by section count
    if (minSections) results = results.filter(s => s.fingerprint.sectionCount >= minSections);
    if (maxSections) results = results.filter(s => s.fingerprint.sectionCount <= maxSections);
    
    // Sort by relevance
    results.sort((a, b) => (b.audit?.finalScore || 0) - (a.audit?.finalScore || 0));
    
    return results.slice(0, 20);
  }

  /**
   * Find similar sites by layout fingerprint
   */
  searchByUrl(url) {
    const site = this.index.sites.find(s => s.url === url);
    if (!site) return [];
    
    const layout = site.fingerprint.layout;
    const sectionCount = site.fingerprint.sectionCount;
    
    return this.index.sites
      .filter(s => s.siteId !== site.siteId)
      .map(s => ({
        ...s,
        similarity: {
          layout: this._layoutSimilarity(layout, s.fingerprint.layout),
          size: Math.abs(sectionCount - s.fingerprint.sectionCount)
        }
      }))
      .filter(s => s.similarity.layout > 0.3)
      .sort((a, b) => b.similarity.layout - a.similarity.layout)
      .slice(0, 10);
  }

  _layoutSimilarity(a, b) {
    if (!a || !b) return 0;
    let matches = 0;
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      if (a[i] === b[i]) matches++;
    }
    return matches / Math.max(a.length, b.length, 1);
  }

  getStats() {
    return {
      totalSites: this.index.sites.length,
      industries: this._countByTag('industry'),
      styles: this._countByTag('style'),
      avgScore: this.index.sites.reduce((s, site) => s + (site.audit?.finalScore || 0), 0) / 
                Math.max(this.index.sites.length, 1)
    };
  }

  _countByTag(prefix) {
    const counts = {};
    this.index.sites.forEach(s => {
      s.tags.filter(t => t.startsWith(prefix + ':')).forEach(t => {
        const key = t.split(':')[1];
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }
}

// CLI entry
if (require.main === module) {
  const action = process.argv[2];
  const index = new DesignIndex();
  
  switch (action) {
    case 'stats':
      console.log(JSON.stringify(index.getStats(), null, 2));
      break;
    case 'search':
      const brief = { industry: process.argv[3], targetScore: parseInt(process.argv[4]) || 0 };
      console.log(JSON.stringify(index.searchByBrief(brief), null, 2));
      break;
    default:
      console.log(`Index: ${index.getStats().totalSites} sites`);
  }
}

module.exports = { DesignIndex };
