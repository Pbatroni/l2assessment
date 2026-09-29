/**
 * Urgency Scorer - Rule-based urgency calculation
 */

// Outright outage/lockout language — the strongest urgency signal.
const CRITICAL_KEYWORDS = [
  'down', 'outage', 'crash', 'crashed', 'not working', "can't access",
  'cannot access', 'unable to access', 'data loss', 'lost', 'breach',
  'hacked', 'unauthorized', 'unresponsive',
]

// Real but less catastrophic technical/billing friction.
const MODERATE_KEYWORDS = [
  'bug', 'error', 'failed', 'failure', 'broken', "won't load",
  'not loading', 'loading', 'timeout', 'timing out', 'stuck', 'glitch',
]

const URGENCY_WORDS = ['urgent', 'asap', 'emergency', 'critical', 'right now', 'immediately']

// Scope/impact language — affects prioritization even without outage keywords.
const IMPACT_WORDS = ['losing customers', 'losing money', 'production', 'all users', 'everyone']

// Gratitude/praise language, the reliable signal that a message is feedback,
// not a problem report — regardless of how many exclamation points it has.
const SENTIMENT_WORDS = [
  'thank', 'thanks', 'appreciate', 'love', 'great', 'awesome', 'perfect',
  'fantastic', 'wonderful', 'excellent', 'nice', 'positive', 'happy', 'glad',
]

function countMatches(lowerMessage, keywords) {
  return keywords.filter((k) => lowerMessage.includes(k)).length
}

export function calculateUrgency(message) {
  const lower = message.toLowerCase()
  let urgencyScore = 40

  const criticalHits = countMatches(lower, CRITICAL_KEYWORDS)
  const moderateHits = countMatches(lower, MODERATE_KEYWORDS)
  const urgencyWordHits = countMatches(lower, URGENCY_WORDS)
  const impactHits = countMatches(lower, IMPACT_WORDS)
  const sentimentHits = countMatches(lower, SENTIMENT_WORDS)

  urgencyScore += criticalHits * 45
  urgencyScore += moderateHits * 25
  urgencyScore += urgencyWordHits * 30
  urgencyScore += impactHits * 20
  urgencyScore -= sentimentHits * 25

  const exclamationCount = (message.match(/!/g) || []).length
  urgencyScore += Math.min(exclamationCount, 3) * 8

  // Shouting reads as urgency (frustration, emergencies), not calm — the
  // opposite of what this used to assume.
  if (message === message.toUpperCase() && message.length > 10) {
    urgencyScore += 15
  }

  // A question mark with no other signal usually means "informational
  // request," not "problem report." Skip the penalty once real signal
  // (critical/moderate/urgency keywords) is already present, so a genuine
  // "is this a known issue?" report doesn't get quietly demoted.
  const hasRealSignal = criticalHits > 0 || moderateHits > 0 || urgencyWordHits > 0
  if (message.includes('?') && !hasRealSignal) {
    urgencyScore -= 10
  }

  // A near-empty message ("hi") carries no real signal either way — nudge
  // it down slightly rather than assuming it's urgent, without reviving the
  // old blanket "anything short is Low" penalty that misfired on real
  // outage reports like "Server down now."
  if (message.trim().length < 5) {
    urgencyScore -= 10
  }

  if (urgencyScore >= 80) return 'High'
  if (urgencyScore <= 35) return 'Low'
  return 'Medium'
}
