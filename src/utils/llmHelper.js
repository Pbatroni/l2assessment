import Groq from 'groq-sdk';
import { calculateUrgency } from './urgencyScorer.js';

/**
 * LLM Helper for triaging customer support messages
 * Using Groq API for AI-powered categorization and urgency
 */

export const CATEGORIES = [
  "Billing Issue",
  "Technical Problem",
  "Feature Request",
  "General Inquiry",
  "Feedback",
  "Unknown",
];

const URGENCY_LEVELS = ["High", "Medium", "Low"];

const SYSTEM_PROMPT = `You are a support triage assistant for a SaaS company. Classify each customer message.

Categories (pick exactly one):
- "Billing Issue": payments, charges, invoices, refunds, plan changes, subscriptions.
- "Technical Problem": outages, errors, bugs, crashes, pages not loading, login/access failures.
- "Feature Request": asking for new functionality or improvements to the product.
- "General Inquiry": questions about the product, company, hours, or how to do something.
- "Feedback": praise, complaints, or comments that do not need a fix or an answer.
- "Unknown": too short or vague to classify (e.g. "hi").
If a message touches two categories, pick the one the support team must act on first
(e.g. "payment failed so I can't access the dashboard" is a Billing Issue blocking access).

Urgency (pick exactly one), based on business impact, NOT tone, punctuation, or length:
- "High": service down, data loss, security concern, customer blocked from using the product, money charged incorrectly.
- "Medium": something is broken or wrong but there is a workaround, or a billing question with a deadline.
- "Low": questions, feature requests, feedback, praise.

Respond with JSON only: {"category": "...", "urgency": "...", "reasoning": "one or two sentences"}`;

let groq = null;

function getClient() {
  if (!groq) {
    groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true // Required for browser-based calls (not recommended for production!)
    });
  }
  return groq;
}

/**
 * Triage a customer support message using Groq AI
 *
 * @param {string} message - The customer support message
 * @returns {Promise<{category: string, urgency: string, reasoning: string, source: "ai" | "rules"}>}
 */
export async function categorizeMessage(message) {
  try {
    const response = await getClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : "Unknown",
      urgency: URGENCY_LEVELS.includes(parsed.urgency) ? parsed.urgency : calculateUrgency(message),
      reasoning: parsed.reasoning || "",
      source: "ai",
    };
  } catch (error) {
    console.warn('Groq API failed, using rule-based fallback:', error.message);
    return getRuleBasedTriage(message);
  }
}

/**
 * Keyword-based triage for when the API is unavailable.
 * Labeled as such so agents know to double-check it.
 */
export function getRuleBasedTriage(message) {
  const text = message.toLowerCase();
  const has = (...words) => words.some(w => text.includes(w));

  let category = "Unknown";
  if (has('bill', 'payment', 'charge', 'invoice', 'credit card', 'subscription', 'refund', 'plan')) {
    category = "Billing Issue";
  } else if (has('bug', 'error', 'broken', 'not working', 'crash', 'down', 'server', 'loading',
                 'load', 'slow', 'connection', 'timing out', "can't access", 'cannot access',
                 'log in', 'logged in', 'logged into', 'login', 'password')) {
    category = "Technical Problem";
  } else if (has('feature', 'would like to see', 'would love', 'suggestion', 'wish', 'could you add',
                 'enhancement', 'would be great', 'would be useful')) {
    category = "Feature Request";
  } else if (has('thank', 'appreciate', 'love', 'great job', 'feedback')) {
    category = "Feedback";
  } else if (text.includes('?') || has('how ', 'what ', 'when ', 'where ', 'can i', 'is there')) {
    category = "General Inquiry";
  }

  return {
    category,
    urgency: calculateUrgency(message),
    reasoning: "AI service unavailable — categorized with keyword rules. Please verify before acting.",
    source: "rules",
  };
}
