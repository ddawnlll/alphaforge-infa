# DesignForge — Hermes Skill: Discord Notify

**Skill Name:** `designforge:discord_notify`

**Goal:** Send structured notifications to Discord channel for key events.

## Notification Types

### Daily Lead Report (09:00)
```
📊 **DesignForge Daily Report — 7 July 2026**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 **Lead Discovery**: 50 sites scanned
   ├─ Scored ≥ 7: 12 leads
   ├─ Have email: 8 leads
   └─ Top pick: [Pacific Northwest X-Ray](https://pacificnwxray.com) (9.2/10 ugly)
📧 **Drafts**: 5 created (pending your approval)
   ├─ pacificnwxray.com → Dr. Mehmet Yılmaz
   ├─ mcdbparts.uk → Sales Team
   ├─ tagteamsigns.com → Dave
   ├─ headhunterhair.com → Info
   └─ greatdreams.com → Webmaster
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Review drafts: https://mail.google.com/
```

### Reply Alert
```
🔔 **Reply Received**
From: Pacific Northwest X-Ray
Re: Website redesign offer
───────────────
Sentiment: 🟢 Interested
───────────────
"We've been thinking about updating our site. Can you share more details about what you'd do?"
───────────────
📝 Suggested reply ready: designforge/drafts/reply-pnwx.md
```

### Error Alert
```
⚠️ **DesignForge Error**
Skill: lead_discovery
Error: Exa API rate limit exceeded (402)
Action: Wait 1 hour, retry with reduced parallelism
```

### Weekly Stats (Monday 09:00)
```
📈 **DesignForge Weekly — Week 27**
━━━━━━━━━━━━━━━━━━━━━
Sites audited: 350
Leads scored: 248
Drafts created: 42
Emails sent (you): 18
Replies received: 3 (16.7% response rate)
Interested: 2 (11.1% conversion)
Clients won: 1 (5.6% close rate)
Revenue: $XXX
━━━━━━━━━━━━━━━━━━━━━
Recommendation: Increase to 15 drafts/day. Reply rate > 10% is healthy.
```

## Webhook Config
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CHANNEL_ID=1234567890
```
