/**
 * DesignForge — Main Entry Point
 * 
 * "URL ver → 10 saniyede redesign blueprint"
 * 
 * Usage: 
 *   node forge.js <client-url> <industry> [style]
 *   node forge.js new <industry> [style]  # No existing site
 */

const { DesignRetrieval } = require('./engine/retrieval/retrieval');
const { BlueprintGenerator } = require('./engine/blueprint/blueprint');
const { auditSite } = require('./engine/audit/audit');
const path = require('path');

async function main() {
  const clientUrl = process.argv[2];
  const industry = process.argv[3] || 'saas';
  const style = process.argv[4] || 'modern';
  
  if (!clientUrl) {
    console.error('Usage: node forge.js <url|"new"> <industry> [style]');
    console.error('  url: https://pacificnwxray.com');
    console.error('  industry: medical | industrial | saas | agency | ecommerce | restaurant | education | fashion');
    console.error('  style: modern | premium | playful | brutalist | editorial | minimal');
    process.exit(1);
  }

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`  🔷 DesignForge — Design Intelligence Engine`);
  console.log(`═══════════════════════════════════════════`);
  console.log(`  Client:   ${clientUrl === 'new' ? 'New project' : clientUrl}`);
  console.log(`  Industry: ${industry}`);
  console.log(`  Style:    ${style}`);
  console.log(`═══════════════════════════════════════════\n`);

  // Step 1: Audit existing site (if any)
  if (clientUrl !== 'new') {
    try {
      console.log(`📸 Step 1/4: Auditing current site...`);
      const audit = await auditSite(clientUrl);
      console.log(`   Score: ${audit.finalScore}/10 → ${audit.verdict}`);
      console.log(`   Priority: ${audit.priority}`);
      if (audit.recommendations?.length > 0) {
        console.log(`   Top issues: ${audit.recommendations.slice(0, 3).join(', ')}`);
      }
    } catch (err) {
      console.log(`   ⚠️  Could not audit: ${err.message}`);
    }
  }

  // Step 2: Find design direction
  console.log(`\n🎨 Step 2/4: Finding design direction...`);
  const engine = new DesignRetrieval();
  const direction = await engine.findDesignDirection(
    clientUrl === 'new' ? null : clientUrl,
    industry,
    { targetStyle: style }
  );
  
  console.log(`   References: ${direction.references.structure?.url || 'curated'}`);
  console.log(`   Section flow: ${direction.blueprint.structure.sectionFlow.join(' → ')}`);

  // Step 3: Generate blueprint
  console.log(`\n📋 Step 3/4: Generating blueprint...`);
  const gen = new BlueprintGenerator(
    path.join(__dirname, 'data', 'blueprints')
  );
  const outputDir = await gen.generate(direction);
  
  // Step 4: Summary
  console.log(`\n📊 Step 4/4: Summary`);
  console.log(`   Colors: ${JSON.stringify(direction.blueprint.designTokens.colors)}`);
  console.log(`   Components: ${direction.blueprint.componentPlan.componentCount}`);
  console.log(`   Animation: ${direction.blueprint.animationPlan.intensity}`);
  console.log(`   Risks: ${direction.blueprint.risks.length} identified`);
  
  console.log(`\n✅ DONE! Blueprint saved to: ${outputDir}/`);
  console.log(`\n📂 Files:`);
  console.log(`   ├── blueprint.yaml`);
  console.log(`   ├── design_tokens.json`);
  console.log(`   ├── component_plan.md`);
  console.log(`   ├── animation_plan.md`);
  console.log(`   ├── copy_outline.md`);
  console.log(`   └── risks.md`);
}

main().catch(err => { console.error(err); process.exit(1); });
