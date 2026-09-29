/**
 * Urgency Scorer - Rule-based urgency calculation
 *
 * Scores urgency from what the customer is describing (business impact),
 * not from punctuation, message length, politeness, or the time of day.
 * Used as the fallback when the LLM is unavailable.
 */

const HIGH_URGENCY_PATTERNS = [
  /\b(down|outage|offline)\b/,
  /\bproduction\b/,
  /\bdata (loss|lost|breach|leak)\b/,
  /\b(security|hacked|breach|unauthori[sz]ed|compromised)\b/,
  /\bconnection (lost|failed|refused)\b/,
  /\bcan(no|')?t (log ?in|access|sign ?in|use)\b/,
  /\b(locked out|not loading|won't load|crash(ed|ing)?)\b/,
  /\bcharged (twice|double|incorrectly)\b|\bdouble charged\b/,
  /\bpayment (failed|declined)\b/,
  /\b(urgent|emergency|asap|immediately|critical)\b/,
  /\ball (users|customers)\b/,
  /\b(someone|somebody) (else )?(logged|accessed|is using)\b/,
  /\b(logged|signed) into my account\b/,
]

const MEDIUM_URGENCY_PATTERNS = [
  /\b(bug|error|broken|not working|issue|problem|fail(s|ed|ing)?)\b/,
  /\b(slow|timing out|times? out|keeps loading)\b/,
  /\b(refund|invoice|billing|charge[ds]?|payment|subscription)\b/,
  /\bcancel\b/,
]

const LOW_URGENCY_PATTERNS = [
  /\b(thank(s| you)|appreciate|love|great job|keep up|feedback)\b/,
  /\b(feature|suggestion|would be (nice|great|useful)|would love|wish)\b/,
  /\b(business hours|pricing|how do i|can i|is there a way)\b/,
]

/**
 * @param {string} message - The customer support message
 * @returns {"High" | "Medium" | "Low"}
 */
export function calculateUrgency(message) {
  const text = message.toLowerCase()

  if (HIGH_URGENCY_PATTERNS.some(p => p.test(text))) return "High"
  if (MEDIUM_URGENCY_PATTERNS.some(p => p.test(text))) return "Medium"
  if (LOW_URGENCY_PATTERNS.some(p => p.test(text))) return "Low"
  return "Medium"
}
