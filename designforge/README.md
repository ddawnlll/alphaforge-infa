# DesignForge

**Design Intelligence Engine** — "URL ver → 10 saniyede redesign blueprint"

DesignForge is a design intelligence engine that transforms any website brief into a unique, conversion-focused, visually stunning design blueprint. It combines award-winning design retrieval, automated visual audit, a taxonomy-tagged component registry, and a motion library to produce production-ready output.

Built as a Hermes-native system inside [AlphaForge](https://github.com/ddawnlll/alphaforge-infa).

---

## Architecture

```
forge.js (entry)
  │
  ├── INGEST ─────────── Playwright capture + Awwwards scraper
  │     └── site schema → screenshots, colors, fonts, sections
  │
  ├── AUDIT ──────────── Lighthouse + VLM visual critique
  │     └── structured scores + actionable feedback
  │
  ├── INDEX ──────────── SigLIP embeddings + layout fingerprints
  │     └── pgvector (MVP) → Qdrant (scale)
  │
  ├── RETRIEVAL ──────── find_design_direction()
  │     └── 3-reference approach (structure / mood / motion)
  │
  ├── BLUEPRINT ──────── Generator → 6 output files
  │     ├── blueprint.yaml
  │     ├── design_tokens.json
  │     ├── component_plan.md
  │     ├── animation_plan.md
  │     ├── copy_outline.md
  │     └── risks.md
  │
  └── REGISTRY ──────── shadcn-compatible component registry
        └── 9 taxonomy-tagged components (MIT-based)
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Playwright (`npx playwright install chromium`)
- (Optional) Exa API key for web search

### Install
```bash
cd designforge
npm install playwright yaml
npx playwright install chromium
```

### Run: "URL ver → redesign blueprint"
```bash
# Existing site redesign
node forge.js https://pacificnwxray.com medical modern

# New project from scratch
node forge.js new saas premium

# Options
node forge.js <url|"new"> <industry> <style>
# industry: medical | industrial | saas | agency | ecommerce | restaurant | education | fashion
# style:    modern | premium | playful | brutalist | editorial | minimal
```

### Test with Giydiriyo
```bash
node forge.js https://giydiriyo.com saas modern
```

---

## Directory Structure

```
designforge/
├── forge.js                 # Main entry point
├── AGENTS.md                # Hermes agent rules (read first)
├── SOUL.designer.md         # Design intelligence system prompt
├── SOUL.design-judge.md     # Design quality arbiter prompt
├── .gitignore
│
├── config/
│   ├── profile.yaml         # Hermes profile config
│   └── audit-rubric.yaml    # Scoring rubric + few-shot examples
│
├── engine/
│   ├── ingest/              # Website capture & scraper
│   │   ├── capture.js       # Playwright: screenshots + DOM
│   │   └── scraper.js       # Awwwards/CSSDA discovery
│   ├── audit/               # Design audit
│   │   └── audit.js         # Lighthouse + VLM critique
│   ├── index/               # Vector index
│   │   └── index.js         # Embedding + search
│   ├── retrieval/           # Design direction
│   │   └── retrieval.js     # find_design_direction()
│   └── blueprint/           # Blueprint generator
│       └── blueprint.js     # 6-file output generator
│
├── registry/
│   ├── registry.json        # shadcn-compatible component registry
│   ├── components/          # React component source files
│   │   ├── hero/
│   │   └── sections/
│   └── animations/
│       └── ANIMATION_TAXONOMY.md
│
├── data/
│   ├── sites/               # Captured site data (gitignored)
│   ├── leads/               # Outreach lead database
│   │   └── leads.json
│   ├── blueprints/          # Generated blueprints (gitignored)
│   └── embeddings/          # Vector embeddings (gitignored)
│
└── hermes-skills/           # Hermes Agent skills for outreach
    ├── lead_discovery/
    ├── website_audit/
    ├── contact_extraction/
    ├── email_personalization/
    ├── gmail_draft/
    ├── reply_monitor/
    ├── discord_notify/
    └── design_blueprint/
```

---

## Integration with AlphaForge

DesignForge uses the existing tri-gate system for design quality:

| Gate | Role | Model | Function |
|---|---|---|---|
| **T1** | Designer | Claude Sonnet 5 / DeepSeek V4 | Generates design blueprint |
| **T2** | Design Challenger | DeepSeek V4 | Scrutinizes blueprint for issues |
| **T3** | **Design Judge** (new) | VLM (GPT-4o/Llama) | Visual quality arbitration |
| **T4** | Human | — | Final approval for client delivery |

The **Design Judge** (T3) uses the [UICrit](https://arxiv.org/html/2407.08850) approach: few-shot expert critiques + screenshot analysis → structured quality scores with bounding box feedback.

---

## Hermes Skills for Outreach

The `hermes-skills/` directory contains 8 skills for the automated cold outreach pipeline:

| Skill | Cron Schedule | Function |
|---|---|---|
| `lead_discovery` | Daily 09:00 | Find 50 outdated websites |
| `website_audit` | On-demand | Score lead quality |
| `contact_extraction` | On-demand | Extract email/phone/address |
| `email_personalization` | On-demand | Generate personalized draft |
| `gmail_draft` | Daily 10:00 | Create Gmail drafts (never auto-send) |
| `reply_monitor` | Every 2h (weekdays) | Check for replies |
| `discord_notify` | Event-triggered | Send notifications |
| `design_blueprint` | On positive reply | Generate redesign preview |

### Safety
- **NO_AUTOMATIC_SEND = true** — drafts only, human approval required
- **Outreach sandbox** — isolated from v7-engine and praxis workspaces
- **Lead DB audit trail** — every email logged with timestamp

---

## Research Foundations

DesignForge is built on peer-reviewed research:

| Paper | Finding | Application |
|---|---|---|
| **UIClip** (UIST'24, CMU) | CLIP fine-tuned on 2.3M UI pairs scores + retrieves designs | Similarity search + quality scoring |
| **UICrit** (UIST'24) | Few-shot expert critiques improve VLM feedback by 55% | Visual audit engine |
| **UISearch** (2025) | Graph-based structural embedding + visual search | Layout similarity |
| **Design2Code** (NAACL'25) | Screenshot→code benchmark with automated metrics | Quality gate |
| **DesignPref** (2025) | Personal design preference modeling | Client taste profiling |
| **Relume** (2026) | 1000+ component library, sitemap→wireframe AI | Competitive reference |

---

## License

DesignForge is part of AlphaForge infra — private. Component registry based on MIT-licensed code (Magic UI). See `registry/` for per-component license notes.
