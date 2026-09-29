/**
 * Recommendation Templates - Maps categories to routing and recommended actions
 */

const actionTemplates = {
  "Billing Issue": {
    team: "Billing",
    action: "Route to Billing. Verify the account's payment status and recent charges before replying.",
  },
  "Technical Problem": {
    team: "Technical Support",
    action: "Route to Technical Support. Collect the affected page/feature, error message, and when it started.",
  },
  "Feature Request": {
    team: "Product",
    action: "Thank the customer, log the request in the product feedback board, and share any existing workaround.",
  },
  "General Inquiry": {
    team: "Support",
    action: "Answer directly or link the relevant help-center article.",
  },
  "Feedback": {
    team: "Support",
    action: "Send a personal thank-you and share the feedback with the team. No fix needed.",
  },
  "Unknown": {
    team: "Support",
    action: "Review manually and ask the customer for more details.",
  },
}

/**
 * Get recommended action for a given category
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @returns {string} - Recommended next step
 */
export function getRecommendedAction(category, urgency) {
  const template = actionTemplates[category] || actionTemplates["Unknown"]
  if (shouldEscalate(category, urgency)) {
    return `ESCALATE: page the on-call ${template.team} lead now. ${template.action}`
  }
  return template.action
}

/**
 * Get all available categories
 *
 * @returns {string[]} - List of categories
 */
export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

/**
 * Determines if message should be escalated
 *
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @returns {boolean} - Whether to escalate
 */
export function shouldEscalate(category, urgency) {
  return urgency === "High" && (category === "Technical Problem" || category === "Billing Issue")
}
