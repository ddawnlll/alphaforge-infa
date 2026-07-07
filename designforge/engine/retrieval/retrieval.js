/**
 * DesignForge — Design Direction Retrieval Engine
 * 
 * find_design_direction() — the core function that:
 * 1. Takes a client URL + industry + style preferences
 * 2. Retrieves the best-matching reference sites (3 roles)
 * 3. Returns a structured design direction package
 * 
 * This is the heart of the Design Intelligence Engine.
 */

const { DesignIndex } = require('../index/index');
const { auditSite } = require('../audit/audit');
const path = require('path');
const fs = require('fs');

// Known good reference sites by industry (curated initial seed)
const CURATED_REFERENCES = {
  medical: [
    { url: 'https://www.ada.com/', role: 'structure', note: 'Clean medical B2C' },
    { url: 'https://www.ro.co/', role: 'mood', note: 'Trust + modern healthcare' },
    { url: 'https://zocdoc.com/', role: 'motion', note: 'Functional medical booking' }
  ],
  industrial: [
    { url: 'https://www.mcmaster.com/', role: 'structure', note: 'Ultimate industrial catalog' },
    { url: 'https://www.grainger.com/', role: 'mood', note: 'B2B industrial trust' },
    { url: 'https://www.thomasnet.com/', role: 'structure', note: 'B2B supplier directory' }
  ],
  saas: [
    { url: 'https://stripe.com/', role: 'mood', note: 'Premium fintech' },
    { url: 'https://linear.app/', role: 'motion', note: 'Minimal + fast' },
    { url: 'https://vercel.com/', role: 'structure', note: 'Clean SaaS landing' }
  ],
  agency: [
    { url: 'https://brutalistwebsites.com/', role: 'mood', note: 'Brutalist inspiration' },
    { url: 'https://studiowhy.com/', role: 'motion', note: 'Creative motion' },
    { url: 'https://www.ff0000.com/', role: 'structure', note: 'Award-winning agency' }
  ],
  ecommerce: [
    { url: 'https://www.apple.com/', role: 'structure', note: 'Premium product showcase' },
    { url: 'https://www.patagonia.com/', role: 'mood', note: 'Brand-driven commerce' },
    { url: 'https://www.nike.com/', role: 'motion', note: 'High-energy product display' }
  ],
  restaurant: [
    { url: 'https://nusr-et.com.tr/', role: 'mood', note: 'Premium steakhouse' },
    { url: 'https://www.dominos.com/', role: 'structure', note: 'Conversion-focused food' }
  ],
  education: [
    { url: 'https://www.duolingo.com/', role: 'motion', note: 'Playful educational' },
    { url: 'https://www.khanacademy.org/', role: 'structure', note: 'Content-first learning' }
  ],
  fashion: [
    { url: 'https://www.ssense.com/', role: 'mood', note: 'Editorial fashion' },
    { url: 'https://www.aceandtate.com/', role: 'structure', note: 'Clean ecommerce fashion' }
  ]
};

class DesignRetrieval {
  constructor() {
    this.index = new DesignIndex(
      path.join(__dirname, '../../data')
    );
  }

  /**
   * THE MAIN ENTRY POINT
   * 
   * Given a client's URL, industry, and style preferences,
   * returns a complete design direction package.
   */
  async findDesignDirection(clientUrl, clientIndustry, preferences = {}) {
    const {
      targetStyle = 'modern',
      animationPreference = 'subtle',
      budget = 'small',
      pages = ['homepage', 'catalog', 'contact']
    } = preferences;

    console.log(`\n=== find_design_direction ===`);
    console.log(`Client: ${clientUrl}`);
    console.log(`Industry: ${clientIndustry}`);
    console.log(`Style: ${targetStyle}`);
    console.log(`=============================\n`);

    // Step 1: Audit client's current site (if exists)
    let clientAudit = null;
    if (clientUrl && clientUrl !== 'new') {
      try {
        clientAudit = await auditSite(clientUrl);
      } catch (err) {
        console.log(`Could not audit client site: ${err.message}`);
      }
    }

    // Step 2: Retrieve reference sites (3 roles)
    const references = await this._retrieveReferences(clientIndustry, preferences);

    // Step 3: Generate structure blueprint
    const structure = this._generateStructure(
      references.structure,
      pages,
      clientIndustry
    );

    // Step 4: Generate design tokens
    const designTokens = this._generateDesignTokens(
      references.mood,
      clientIndustry,
      targetStyle
    );

    // Step 5: Generate component plan
    const componentPlan = this._generateComponentPlan(
      structure,
      designTokens,
      animationPreference
    );

    // Step 6: Generate animation plan
    const animationPlan = this._generateAnimationPlan(
      animationPreference,
      references.motion
    );

    // Step 7: Generate copy outline
    const copyOutline = this._generateCopyOutline(
      structure,
      clientIndustry,
      clientUrl
    );

    // Step 8: Identify risks
    const risks = this._identifyRisks(
      clientAudit,
      structure,
      clientIndustry,
      budget
    );

    return {
      clientUrl,
      clientIndustry,
      clientAudit: clientAudit ? {
        finalScore: clientAudit.finalScore,
        verdict: clientAudit.verdict,
        topIssues: clientAudit.recommendations
      } : null,
      references,
      blueprint: {
        structure,
        designTokens,
        componentPlan,
        animationPlan,
        copyOutline,
        risks
      },
      generatedAt: new Date().toISOString()
    };
  }

  async _retrieveReferences(industry, preferences) {
    // 1. Try indexed sites first
    const candidates = this.index.searchByBrief({
      industry,
      targetScore: preferences.targetScore || 6
    });

    // 2. Fall back to curated references
    const curated = CURATED_REFERENCES[industry] || CURATED_REFERENCES.saas;
    
    return {
      structure: candidates.find((_, i) => i % 3 === 0) || curated.find(r => r.role === 'structure'),
      mood: candidates.find((_, i) => i % 3 === 1) || curated.find(r => r.role === 'mood'),
      motion: candidates.find((_, i) => i % 3 === 2) || curated.find(r => r.role === 'motion'),
      alternatives: candidates.slice(0, 5).map(c => ({ url: c.url, score: c.audit?.finalScore }))
    };
  }

  _generateStructure(reference, pages, industry) {
    // Section flow templates by industry
    const flows = {
      medical: ['hero_trust', 'services_overview', 'why_us', 'testimonials', 'insurance_partners', 'cta_appointment', 'footer_contact'],
      industrial: ['hero_products', 'categories', 'featured_products', 'trust_certifications', 'quote_request', 'contact'],
      saas: ['hero_features', 'how_it_works', 'benefits_grid', 'pricing', 'testimonials', 'faq', 'cta_demo'],
      agency: ['hero_showcase', 'featured_work', 'services', 'process', 'clients', 'testimonials', 'cta_contact'],
      ecommerce: ['hero_promo', 'categories', 'featured', 'new_arrivals', 'testimonials', 'newsletter', 'footer'],
      default: ['hero', 'features', 'benefits', 'testimonials', 'pricing', 'faq', 'cta', 'footer']
    };

    const flow = flows[industry] || flows.default;
    
    return {
      sectionFlow: flow,
      pageCount: pages.length,
      pageTypes: pages,
      referenceStructure: reference?.url || 'none',
      estimatedSections: flow.length
    };
  }

  _generateDesignTokens(moodRef, industry, style) {
    // Color palettes by industry + style combination
    const palettes = {
      medical: {
        modern: { primary: '#0A6EBD', secondary: '#1A8FE3', neutral: '#F8FAFC', accent: '#059669' },
        premium: { primary: '#1B3A4B', secondary: '#2E5A6B', neutral: '#F5F0EB', accent: '#C7A951' }
      },
      industrial: {
        modern: { primary: '#1E293B', secondary: '#475569', neutral: '#F1F5F9', accent: '#F59E0B' },
        premium: { primary: '#1A1A2E', secondary: '#16213E', neutral: '#F8F8F8', accent: '#E94560' }
      },
      saas: {
        modern: { primary: '#6366F1', secondary: '#818CF8', neutral: '#F8FAFC', accent: '#10B981' },
        premium: { primary: '#0F0F1A', secondary: '#1A1A2E', neutral: '#F5F5F5', accent: '#FFD700' }
      },
      agency: {
        modern: { primary: '#111111', secondary: '#333333', neutral: '#FAFAFA', accent: '#FF3366' },
        premium: { primary: '#0A0A0A', secondary: '#C9A96E', neutral: '#F5F0EB', accent: '#D4A853' }
      },
      default: {
        modern: { primary: '#1E293B', secondary: '#3B82F6', neutral: '#FFFFFF', accent: '#F59E0B' },
        premium: { primary: '#1A1A2E', secondary: '#E94560', neutral: '#F5F0EB', accent: '#FFD700' }
      }
    };

    const industryPalette = palettes[industry] || palettes.default;
    const palette = industryPalette[style] || industryPalette.modern;

    return {
      colors: {
        primary: palette.primary,
        secondary: palette.secondary,
        neutral: palette.neutral,
        accent: palette.accent,
        background: palette.neutral,
        foreground: palette.primary
      },
      typography: {
        heading: style === 'premium' ? 'serif' : 'sans-serif',
        body: style === 'premium' ? 'system-ui' : 'Inter, system-ui',
        scale: industry === 'medical' ? 'large' : 'standard'
      },
      spacing: {
        sectionPadding: industry === 'ecommerce' ? 'compact' : 'generous',
        gridGap: '1.5rem'
      },
      radius: {
        default: industry === 'medical' ? '8px' : '4px',
        button: industry === 'saas' ? '8px' : '4px'
      },
      shadows: {
        card: '0 1px 3px rgba(0,0,0,0.1)',
        elevated: '0 10px 40px rgba(0,0,0,0.1)'
      }
    };
  }

  _generateComponentPlan(structure, tokens, animation) {
    // Map sections to component types from registry
    const sectionComponentMap = {
      hero: { type: 'hero', variants: ['split', 'center', 'full-bleed'] },
      features: { type: 'section', variants: ['grid-3', 'grid-4', 'alternating'] },
      pricing: { type: 'section', variants: ['cards-3', 'cards-4', 'toggle'] },
      testimonials: { type: 'section', variants: ['carousel', 'grid', 'marquee'] },
      cta: { type: 'section', variants: ['simple', 'split', 'centered'] },
      faq: { type: 'section', variants: ['accordion', 'grid'] },
      footer: { type: 'section', variants: ['simple', 'multicolumn', 'compact'] }
    };

    const plan = structure.sectionFlow.map(section => {
      const key = Object.keys(sectionComponentMap).find(k => section.includes(k)) || 'content';
      return {
        section,
        componentType: sectionComponentMap[key]?.type || 'section',
        variants: sectionComponentMap[key]?.variants || ['default'],
        animation: animation === 'subtle' ? 'fade-up' : animation === 'medium' ? 'slide-reveal' : 'none'
      };
    });

    return {
      componentCount: plan.length,
      components: plan,
      animationLevel: animation,
      registrySource: '@designforge/ui'
    };
  }

  _generateAnimationPlan(preference, motionRef) {
    const plans = {
      subtle: {
        intensity: 'subtle',
        techniques: ['scroll_reveal', 'fade_up'],
        duration: '0.6s',
        easing: 'ease-out',
        reducedMotion: 'respect',
        notes: 'Minimal motion. Content-first. Scroll-triggered reveals only.'
      },
      medium: {
        intensity: 'medium',
        techniques: ['scroll_reveal', 'parallax', 'text_split', 'sticky_sections'],
        duration: '0.8s',
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        reducedMotion: 'respect',
        notes: 'Purposeful motion. Enhances narrative without overwhelming.'
      },
      heavy: {
        intensity: 'heavy',
        techniques: ['scroll_reveal', 'parallax', 'text_split', 'sticky_sections', 'WebGL', 'hover_distortion', 'marquee'],
        duration: '1.0s',
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        reducedMotion: 'respect',
        notes: 'Award-worthy motion. Best for agency/entertainment portfolios.'
      }
    };

    return plans[preference] || plans.subtle;
  }

  _generateCopyOutline(structure, industry, url) {
    const sectionCopy = structure.sectionFlow.map(section => ({
      section,
      tone: industry === 'medical' ? 'trustworthy' : 
             industry === 'agency' ? 'creative' :
             industry === 'industrial' ? 'professional' : 'conversational',
      keyMessage: '',
      ctaText: '',
      wordCount: section === 'hero' ? '30-50' : section === 'features' ? '80-120' : '50-80'
    }));

    const contentStructure = {
      pageTypes: structure.pageTypes,
      sectionCount: structure.sectionFlow.length,
      estimatedWords: structure.sectionFlow.length * 80,
      sections: sectionCopy,
      globalTone: industry === 'medical' ? 'empathetic, authoritative' :
                  industry === 'industrial' ? 'direct, professional' :
                  industry === 'saas' ? 'clear, benefit-driven' :
                  industry === 'agency' ? 'bold, creative' : 'friendly, clear'
    };

    return contentStructure;
  }

  _identifyRisks(clientAudit, structure, industry, budget) {
    const risks = [];

    if (clientAudit?.verdict === 'POOR') {
      risks.push({
        type: 'trust',
        severity: 'high',
        description: 'Current site kills trust. Redesign must prioritize credibility signals: logos, testimonials, certifications.'
      });
    }

    if (budget === 'small') {
      risks.push({
        type: 'scope',
        severity: 'medium',
        description: 'Small budget means fewer pages and simpler animations. Prioritize homepage + top landing page.'
      });
    }

    if (structure.sectionFlow.length > 10) {
      risks.push({
        type: 'complexity',
        severity: 'low',
        description: 'Many sections may overwhelm visitors. Consider progressive disclosure.'
      });
    }

    // Industry-specific risks
    if (industry === 'medical') {
      risks.push({
        type: 'compliance',
        severity: 'high',
        description: 'Medical sites need HIPAA compliance, accessibility (WCAG AA+), and clear disclaimers.'
      });
    }

    if (industry === 'ecommerce') {
      risks.push({
        type: 'performance',
        severity: 'high',
        description: 'Product images and catalog pages need aggressive optimization. Target LCP < 1.5s.'
      });
    }

    return risks;
  }
}

// CLI entry
if (require.main === module) {
  const clientUrl = process.argv[2] || 'new';
  const industry = process.argv[3] || 'saas';
  const style = process.argv[4] || 'modern';
  
  const engine = new DesignRetrieval();
  engine.findDesignDirection(clientUrl, industry, { targetStyle: style })
    .then(result => {
      console.log(JSON.stringify({
        clientUrl: result.clientUrl,
        clientIndustry: result.clientIndustry,
        clientAudit: result.clientAudit,
        blueprint: {
          structure: result.blueprint.structure.sectionFlow,
          tokens: { colors: result.blueprint.designTokens.colors },
          componentCount: result.blueprint.componentPlan.componentCount,
          animationPlan: result.blueprint.animationPlan.intensity,
          risks: result.blueprint.risks.map(r => `${r.severity}: ${r.description}`)
        }
      }, null, 2));
    })
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { DesignRetrieval };
