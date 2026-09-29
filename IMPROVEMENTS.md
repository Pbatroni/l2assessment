# Triage Improvements

## Top 3 areas for improvement

### 1. Urgency scoring is inverted (biggest business risk)
`calculateUrgency` scored punctuation, length, and politeness instead of impact:
- Every `!` added +30, so a rambling compliment scored **High**.
- Messages under 50 characters lost 40–100 points, so "Server down now" and "Database connection lost" scored **Low**.
- `?`, polite words, and positive words lowered urgency, and ALL CAPS *lowered* it.
- Urgency dropped on weekends and outside 9–5, so the same message changed priority depending on when it arrived.

For Relay AI, whose value proposition is "handle more volume without more staff," a triage tool that buries outages and promotes thank-you notes actively costs customers.

### 2. AI categorization is unreliable
- The prompt ("Categorize this customer support message") gave no category list, so the model answered in free text.
- The category was parsed by searching that text for keywords — e.g. "this is **not** a billing issue" became *Billing Issue*.
- `temperature: 0.7` made repeated runs disagree.
- When the API failed, the app silently returned a keyword guess with **randomly chosen fake "AI reasoning"**, so agents couldn't tell AI output from a fallback.

### 3. Recommended actions and escalation are wrong
- Feature requests were told to "check billing portal".
- Every technical problem got "restart your browser", including outages.
- `shouldEscalate` escalated any message over 100 characters and was never called.
- There was no category for praise/feedback, so it landed in General Inquiry.

## What I implemented

| File | Change |
|---|---|
| `src/utils/llmHelper.js` | System prompt with a fixed category list + urgency rubric based on business impact; JSON output, `temperature: 0`; validates the response. Falls back to keyword rules and labels the result `source: "rules"` instead of faking AI reasoning. Added a **Feedback** category. |
| `src/utils/urgencyScorer.js` | Rewrote as a deterministic fallback based on what the customer describes (outage, security, blocked access, billing errors → High; bugs/billing questions → Medium; questions/requests/praise → Low). Removed punctuation, length, politeness, and time-of-day rules. |
| `src/utils/templates.js` | Each category routes to the right team with an actionable next step; High-urgency Technical/Billing issues are escalated to the on-call lead. |
| `src/pages/AnalyzePage.jsx` | Uses the AI's urgency; shows a warning banner when the rule-based fallback was used. |

## Testing

Rule-based path (runs without an API key), sample messages + new ones:

| Message | Before | After |
|---|---|---|
| Database connection lost | Low | **High** · Technical · escalate |
| Server down now | Low | **High** · Technical · escalate |
| Thank you so much! … | Medium | **Low** · Feedback |
| Hi! … nice design! … positive feedback! | High | **Low** · Feedback |
| Could you add an export to CSV feature? | Low · "check billing portal" | Low · Feature Request · log for Product |
| My payment failed and now I can't access the dashboard… | Low | **High** · Billing · escalate |
| What are your business hours? | Low | Low · General Inquiry |
| hi | Low | Medium · Unknown · review manually |
| WE WERE CHARGED TWICE THIS MONTH *(new)* | Low | **High** · Billing · escalate |
| Someone logged into my account from another country *(new)* | Medium | **High** · escalate |
| Checkout page throws a 500 error for all customers *(new)* | Medium | **High** · Technical · escalate |
| Love the new update, nice work team *(new)* | Low | Low · Feedback |

"Before" results also varied by time of day; "After" results are the same at any time.

## Next improvements (not implemented)
- Move the Groq call to a backend so the API key isn't exposed in the browser.
- Input validation (e.g. prompt for more detail on messages like "hi").
- Dashboard "Avg Per Day" divides by a hard-coded 7 days.
- Let agents correct a category/urgency and use those corrections to evaluate the prompt.
