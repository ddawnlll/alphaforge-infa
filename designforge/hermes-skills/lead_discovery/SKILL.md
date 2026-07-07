# DesignForge — Hermes Skill: Outreach Lead Discovery

**Skill Name:** `designforge:lead_discovery`

**Trigger:** Daily cron job (09:00)

**Goal:** Find 50 outdated, ugly, or trust-killing business websites that are prime redesign candidates.

## Pipeline

1. **Search Sources** (parallel, 5 queries each)
   - `"site:yellowpages.com" + "web design" + "outdated" + industry`
   - `"dental clinic website" + "2005" OR "old design"`
   - `"industrial supplier" + "website" + "bad" OR "ugly"`
   - `"medical equipment" + "website" + "old" OR "outdated"`
   - `"local business website" + "1990s" OR "2000s"`
   - Cross-reference with known bad site lists (Pacific NW X-Ray, etc.)
   - Google dork: `intitle:"welcome to" + "our website" + "since 200"`
   
2. **Score Leads** (website_audit skill)
   - Audit each candidate via browser snapshot
   - Score on: `outdated_layout`, `mobile_broken`, `trust_damage`, `easy_redesign_fit`
   - Accept if: `ugly_score >= 7 AND has_public_email == true`

3. **Extract Contact** (contact_extraction skill)
   - Find email, phone, address from site
   - Verify email deliverability

4. **Enrich** (optional)
   - Find LinkedIn profile, company size, industry

5. **Log to Lead DB**
   ```json
   {
     "url": "...",
     "company": "...",
     "email": "...",
     "industry": "...",
     "ugly_score": 8,
     "audited_at": "...",
     "status": "new"
   }
   ```

## Output
- `data/leads/daily-<date>.json` — 50 leads
- `data/leads/top10-<date>.json` — highest scored
- Discord report: "Today: 50 leads found, 10 scored ⩾ 7, 5 have emails"

## Cron Config
```yaml
schedule: "0 9 * * *"
name: designforge-lead-discovery
prompt: "Run lead_discovery skill. Find 50 outdated business websites for redesign outreach."
```

## Tools Allowed
- web_search
- web_extract (Exa MCP)
- browser_navigate/snapshot
- read_file/write_file (lead DB only)
- discord_notify (report only, no auto-send)
