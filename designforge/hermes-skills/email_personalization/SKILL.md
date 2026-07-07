# DesignForge — Hermes Skill: Email Personalization

**Skill Name:** `designforge:email_personalization`

**Goal:** Generate a personalized, conversion-optimized cold outreach email for a redesign lead.

## Rules

1. **NEVER auto-send.** Create GMail draft only. Human approves.
2. **Reference the site specifically.** Mention a specific page or issue you found.
3. **Don't say "your site is ugly."** Say "your business is strong but your website doesn't reflect it."
4. **Offer value first.** Free homepage concept before quoting.
5. **Include opt-out.** "If this isn't relevant, I won't follow up."
6. **Personalize per industry.** Medical gets different tone than industrial.

## Template

**Subject:** Quick thought on [Company]'s website

**Body:**
Hello [Name/Team],

I came across [Company] while looking for [industry/product] suppliers. Your [products/services/knowledge] look solid — but I noticed your website doesn't really do justice to what you offer.

Specifically:
- [Specific issue 1: e.g., "The homepage loads slowly and the product catalog is hard to navigate"]
- [Specific issue 2: e.g., "The site doesn't work well on mobile devices"]
- [Specific issue 3: e.g., "There's no clear way to request a quote or contact your team"]

I'm a web developer, and I specialize in redesigning outdated business websites into modern, conversion-focused experiences. I can share a quick homepage concept so you can see the direction without any commitment.

As a portfolio project, I can do this at a very reasonable rate: just $50 for a full homepage + contact page.

Here's a recent reference project: https://giydiriyo.com/

If interested, I'm happy to discuss. If not, no worries — I won't follow up.

Best regards,
[Your Name]

## Personalization Variables
- `{{company}}` — Company name
- `{{industry}}` — Industry/vertical
- `{{specific_issue_1/2/3}}` — From website audit
- `{{portfolio_url}}` — giydiriyo.com (or other work)
- `{{price}}` — $50 introductory
- `{{offer}}` — "Free homepage concept"

## Industry-Specific Tone Adjustments

| Industry | Tone | Key Angle |
|---|---|---|
| Medical | Empathetic, precise | "Patient trust starts online" |
| Industrial | Direct, professional | "Your products deserve better showcase" |
| Dental | Warm, local | "First impression for new patients" |
| HVAC | Practical, no-nonsense | "Customers search → find outdated site → leave" |
| Restaurant | Appetite-driven | "Menu photos should make people hungry" |
| Auto repair | Trust-focused | "Your expertise > your website says otherwise" |
