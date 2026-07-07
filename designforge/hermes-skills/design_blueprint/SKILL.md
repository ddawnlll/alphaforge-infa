# DesignForge — Hermes Skill: Design Blueprint

**Skill Name:** `designforge:design_blueprint`

**Goal:** Given a client URL + industry + style preferences, generate a complete design blueprint using the DesignForge engine.

## Pipeline

1. **Audit current site** (if exists) — website_audit skill
2. **Retrieve references** — find_design_direction() with 3-reference approach
3. **Generate blueprint** — blueprint.json, design_tokens.json, component plan
4. **Quality gate** — run through design-judge rubric
5. **Output** — structured JSON + markdown report

## Input
```json
{
  "client_url": "https://pacificnwxray.com",
  "industry": "medical_equipment",
  "pages": ["homepage", "catalog", "contact"],
  "style": "modern_trust",
  "animation": "subtle",
  "budget": "small"
}
```

## Output
- `blueprint.yaml` — Section flow, page structure
- `design_tokens.json` — Colors, fonts, spacing
- `component_plan.md` — Component selection with rationale
- `animation_plan.md` — Motion language
- `copy_outline.md` — Copy structure per section
- `risks.md` — Potential issues

## Integration with Outreach
When a lead replies positively, run this skill to generate a mini redesign preview:
- "Here's what I'd change about your homepage"
- "Here's a suggested section structure"
- "Here are 3 reference sites I'd draw inspiration from"
- This dramatically increases conversion vs "let me know if interested"
