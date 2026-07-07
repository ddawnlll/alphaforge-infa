# DesignForge — Hermes Skill: Reply Monitor

**Skill Name:** `designforge:reply_monitor`

**Goal:** Check Gmail inbox for replies to sent outreach emails and notify Discord.

## Frequency
Every 2 hours during business hours (09:00 - 18:00 weekdays)

## Process

1. **Query Gmail inbox** for threads we started (sent messages)
2. **Filter:** has reply after our last sent message
3. **Extract:** reply content, sender name, timestamp
4. **Classify sentiment:**
   - 🟢 "Interested" — high priority → immediate Discord notification + suggested reply
   - 🟡 "Question" — medium priority → generate suggested reply draft
   - 🔴 "Not interested" — mark lead as cold, no follow-up
   - ⚪ "Other" — flag for manual review
5. **Update lead DB** with status change

## Discord Notification Format

```
🔔 **New Outreach Reply**
From: {{sender}} ({{company}})
Subject: {{subject}}
Sentiment: {{sentiment_emoji}} {{sentiment}}
───────────────
"{{preview}}"
───────────────
📝 Suggested reply: designforge/drafts/reply-{{lead_id}}.md
```

## Cron Config
```yaml
schedule: "0 */2 * * 1-5"
name: designforge-reply-monitor
prompt: "Run reply_monitor skill. Check Gmail inbox for replies to sent outreach emails. Classify and notify Discord if new replies found."
```
