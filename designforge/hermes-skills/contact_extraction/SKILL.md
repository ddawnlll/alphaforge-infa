# DesignForge — Hermes Skill: Contact Extraction

**Skill Name:** `designforge:contact_extraction`

**Goal:** Extract business contact info from a website URL: email, phone, address, social links.

## Extraction Methods

1. **Homepage scan** — Look for: "Contact Us", "Get in Touch", footer
2. **Contact page** — Navigate to /contact, /iletisim, /contact-us
3. **About page** — Check /about, /about-us, /hakkimizda
4. **Privacy Policy** — Often has legal contact email

## Patterns to Match
```
Email:   info@, contact@, hello@, support@, [name]@domain
Phone:   +90 XXX XXX XXXX, (XXX) XXX-XXXX, 0XXX XXX XX XX
Address: Street/Cadde, Sokak, No:, Mahalle, district/ilce patterns
Social:  instagram.com/, facebook.com/, linkedin.com/company/
```

## Output
```json
{
  "url": "...",
  "company_name": "...",
  "emails": ["info@company.com"],
  "phones": ["+90 555 123 4567"],
  "address": "Atatürk Cad. No:123, Kadıköy/İstanbul",
  "social": {
    "instagram": "...",
    "linkedin": "..."
  },
  "confidence": "high"
}
```

## Verification
- Try sending a test email (via Gmail draft — draft only, never auto-send)
- Check email format validity (regex)
- Cross-reference with WHOIS
