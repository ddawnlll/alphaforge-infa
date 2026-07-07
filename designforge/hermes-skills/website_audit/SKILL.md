# DesignForge — Hermes Skill: Website Audit

**Skill Name:** `designforge:website_audit`

**Goal:** Audit a website URL and produce a structured design quality report. Used both for lead scoring and design direction.

## Audit Process

1. **Screenshot Capture** (browser_navigate + browser_snapshot)
   - Desktop viewport (1920×1080)
   - Mobile viewport (390×844)
   
2. **Visual Audit** (VLM-as-Judge)
   Score each dimension 1-10:
   - `outdated_layout` — Does it look like 2005? Gradient nav? Clipart?
   - `mobile_broken` — Is mobile layout broken or missing?
   - `text_readability` — Can you read body text? Font size, contrast?
   - `trust_damage` — Does the design make you doubt the company?
   - `conversion_loss` — Is it hard to find contact, buy, or book?
   - `easy_redesign_fit` — Would a modern makeover have outsized impact?

3. **Technical Audit**
   - Check: HTTPS, mobile responsive, load speed estimate
   - Check: Has business email visible? Phone? Address?

4. **Scoring Formula**
   ```javascript
   ugly_score = (
     outdated_layout * 0.25 +
     mobile_broken * 0.20 +
     text_readability * 0.15 +
     trust_damage * 0.25 +
     conversion_loss * 0.15
   )
   // Accept if ugly_score >= 7 AND has_contact == true
   ```

5. **Output JSON**
   ```json
   {
     "url": "...",
     "ugly_score": 8.2,
     "dimensions": {
       "outdated_layout": 9,
       "mobile_broken": 8,
       "text_readability": 6,
       "trust_damage": 9,
       "conversion_loss": 7,
       "easy_redesign_fit": 10
     },
     "has_email": true,
     "has_phone": true,
     "industry_hint": "medical_equipment",
     "redesign_opportunity": "high"
   }
   ```

## Few-Shot Examples (for VLM)

**Example 1: Pacific Northwest X-Ray**
- outdated_layout: 9/10 (clear 2002 template, blue gradient)
- mobile_broken: 9/10 (no mobile layout)
- trust_damage: 9/10 (real company but looks like scam)
- conversion_loss: 8/10 (hard to find products, contact)

**Example 2: Giydiriyo**
- outdated_layout: 2/10 (modern, not outdated)
- mobile_broken: 2/10 (responsive)
- text_readability: 3/10 (fine)
- trust_damage: 3/10 (trust level OK but generic)
- conversion_loss: 4/10 (CTA weak)
- diagnosis: Not ugly, but generic. "AI slop" risk.
