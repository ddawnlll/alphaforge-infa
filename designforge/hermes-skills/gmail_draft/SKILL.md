# DesignForge — Hermes Skill: Gmail Draft & Reply Monitor

**Skill Name A:** `designforge:gmail_draft`
**Skill Name B:** `designforge:reply_monitor`

---

## A. Gmail Draft

**Goal:** Create a draft email in Gmail (never auto-send).

### Implementation
1. Use Gmail API (OAuth2) to create drafts
2. Draft is created in Drafts folder — user reviews and sends manually
3. Log draft ID, recipient, date to lead DB

### Safety
- `draft_create()` never calls `send()`
- Double confirmation gate: draft only
- Log every draft with timestamp for compliance

---

## B. Reply Monitor

**Goal:** Check Gmail inbox for replies to sent outreach emails.

### Frequency
- Every 2 hours during business hours (09:00 - 18:00)
- Via cron job

### Process
1. Query Gmail inbox for replies to threads we started
2. Filter by: our sent messages → has reply after
3. Extract: reply content, sender name, sentiment (positive/negative/neutral)
4. Classify:
   - "Interested" → high priority → immediate Discord notification
   - "Not interested" → mark lead as cold, no follow up
   - "Question" → generate suggested reply draft for user approval
5. Update lead DB

### Discord Notification

```
🔔 **New Outreach Reply**
From: Dr. Mehmet Yılmaz (Pacific NW X-Ray)
Subject: Re: Website redesign offer
Sentiment: 🟢 Interested
Preview: "We've been thinking about updating our site. What would you charge for..."
Action: https://mail.google.com/ → Reply suggested below:
[AI-generated reply draft]
```

### Cron Config
```yaml
schedule: "0 */2 * * 1-5"
name: designforge-reply-monitor
prompt: "Check Gmail inbox for replies to sent outreach emails. If new reply found, classify and notify Discord."
```
