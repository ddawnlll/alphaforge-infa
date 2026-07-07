/**
 * DesignForge — Blueprint Generator
 * 
 * Takes a design direction package and generates:
 * - blueprint.yaml: complete site skeleton
 * - design_tokens.json: colors, typography, spacing
 * - component_plan.md: component selection rationale
 * - animation_plan.md: motion language specification
 * - copy_outline.md: section-by-section copy structure
 * - risks.md: potential issues
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

class BlueprintGenerator {
  constructor(outputDir = './blueprints') {
    this.outputDir = outputDir;
  }

  async generate(designDirection) {
    const { clientUrl, clientIndustry, blueprint } = designDirection;
    let name;
    if (!clientUrl || clientUrl === 'new' || clientUrl === 'null') {
      name = `${clientIndustry}-project`;
    } else {
      try {
        name = new URL(clientUrl).hostname.replace(/^www\./, '').replace(/[^a-z0-9]/g, '-');
      } catch {
        name = `${clientIndustry}-project`;
      }
    }
    const dir = path.join(this.outputDir, `${name}-${Date.now()}`);
    fs.mkdirSync(dir, { recursive: true });

    // 1. blueprint.yaml
    const bpYaml = {
      project: {
        name: name,
        industry: clientIndustry,
        generatedAt: new Date().toISOString(),
        pages: blueprint.structure.pageTypes
      },
      site: {
        sectionFlow: blueprint.structure.sectionFlow.map(section => ({
          name: section,
          componentType: blueprint.componentPlan.components.find(c => section.includes(c.section?.split('_')[0]))?.componentType || 'section',
          variants: blueprint.componentPlan.components.find(c => section.includes(c.section?.split('_')[0]))?.variants || ['default'],
          animation: blueprint.componentPlan.components.find(c => section.includes(c.section?.split('_')[0]))?.animation || 'fade_up'
        })),
        estimatedSections: blueprint.structure.sectionFlow.length,
        pageCount: blueprint.structure.pageCount
      },
      references: {
        structure: designDirection.references?.structure?.url || '—',
        mood: designDirection.references?.mood?.url || '—',
        motion: designDirection.references?.motion?.url || '—'
      }
    };
    fs.writeFileSync(path.join(dir, 'blueprint.yaml'), YAML.stringify(bpYaml));

    // 2. design_tokens.json
    fs.writeFileSync(path.join(dir, 'design_tokens.json'), JSON.stringify(blueprint.designTokens, null, 2));

    // 3. component_plan.md
    const componentMd = `# Component Plan — ${name}

## Overview
- **Total Components:** ${blueprint.componentPlan.componentCount}
- **Animation Level:** ${blueprint.componentPlan.animationLevel}
- **Registry:** ${blueprint.componentPlan.registrySource}

## Section → Component Mapping

${blueprint.componentPlan.components.map(c => 
  `### ${c.section}
- **Type:** ${c.componentType}
- **Variants:** ${c.variants.join(', ')}
- **Animation:** ${c.animation}

`
).join('')}

## Notes
- All components from @designforge/ui registry
- Animation respects prefers-reduced-motion
- Each component supports responsive breakpoints
`;
    fs.writeFileSync(path.join(dir, 'component_plan.md'), componentMd);

    // 4. animation_plan.md
    const animMd = `# Animation Plan — ${name}

## Motion Language
- **Intensity:** ${blueprint.animationPlan.intensity}
- **Duration:** ${blueprint.animationPlan.duration}
- **Easing:** ${blueprint.animationPlan.easing}
- **Reduced Motion:** ${blueprint.animationPlan.reducedMotion}

## Techniques
${(blueprint.animationPlan.techniques || []).map(t => `- \`${t}\``).join('\n')}

## Notes
${blueprint.animationPlan.notes}

## Implementation
- Use Framer Motion for React components
- Scroll-triggered via intersection observer
- Stagger children with 0.1s delay per item
- Parallax via transform + will-change
`;
    fs.writeFileSync(path.join(dir, 'animation_plan.md'), animMd);

    // 5. copy_outline.md
    const copyMd = `# Copy Outline — ${name}

## Global Tone
${blueprint.copyOutline?.globalTone || 'Clear, benefit-driven'}

## Sections
${(blueprint.copyOutline?.sections || []).map(s => 
  `### ${s.section}
- **Tone:** ${s.tone}
- **Words:** ${s.wordCount}
- **Key Message:** ${s.keyMessage || '[to be filled]'}
- **CTA:** ${s.ctaText || '[to be filled]'}

`
).join('')}

## Content Strategy
- Homepage: Hero → Trust → Value → CTA
- Interior pages: Consistent navigation, focused messaging
- Contact: Low friction, multiple touchpoints
`;
    fs.writeFileSync(path.join(dir, 'copy_outline.md'), copyMd);

    // 6. risks.md
    const risksMd = `# Risks & Mitigations — ${name}

## Risk Assessment
${(blueprint.risks || []).map(r => 
  `### [${r.severity.toUpperCase()}] ${r.type}
${r.description}
`
).join('\n')}

## Mitigation Plan
1. Address HIGH severity risks before development
2. MEDIUM risks: monitor during development
3. LOW risks: address during polish phase
`;
    fs.writeFileSync(path.join(dir, 'risks.md'), risksMd);

    console.log(`\n✅ Blueprint generated: ${dir}/`);
    console.log(`  ├── blueprint.yaml`);
    console.log(`  ├── design_tokens.json`);
    console.log(`  ├── component_plan.md`);
    console.log(`  ├── animation_plan.md`);
    console.log(`  ├── copy_outline.md`);
    console.log(`  └── risks.md`);

    return dir;
  }
}

if (require.main === module) {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node blueprint.js <designDirection JSON or path>');
    process.exit(1);
  }
  const designDirection = fs.existsSync(input) ? 
    JSON.parse(fs.readFileSync(input, 'utf-8')) : JSON.parse(input);
  
  const gen = new BlueprintGenerator();
  gen.generate(designDirection).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { BlueprintGenerator };
