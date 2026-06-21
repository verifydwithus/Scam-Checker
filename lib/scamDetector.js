// This file contains the actual scam-detection logic.
// It is intentionally framework-agnostic so it can be imported
// on the client (for instant results) or the server (if you later
// want to hide/obscure the rules, or log results centrally).

export const PATTERNS = [
  { test: /urgent|act now|immediately|within \d+\s*(hour|minute|day)|expires? (today|soon)|last chance|final notice/i, label: "Artificial urgency", weight: 2 },
  { test: /won|winner|congratulations|prize|lottery|selected/i, label: "Too-good-to-be-true reward", weight: 2 },
  { test: /click here|click the link|verify your account|confirm your (details|identity|password)/i, label: "Suspicious link or verification request", weight: 2 },
  { test: /gift card|wire transfer|bitcoin|crypto|western union|bank transfer/i, label: "Unusual payment method requested", weight: 3 },
  { test: /password|ssn|social security|bank account|pin number|card number|cvv/i, label: "Requesting sensitive personal information", weight: 3 },
  { test: /suspend|frozen|locked|deactivat|unauthoriz/i, label: "Threat of account suspension or loss", weight: 2 },
  { test: /dear (customer|user|sir|madam)|valued (customer|member)/i, label: "Generic greeting, not personalized", weight: 1 },
  { test: /don'?t tell|keep this (private|secret|between us)|confidential.{0,20}(don'?t|do not)/i, label: "Asking for secrecy from others", weight: 3 },
  { test: /grandma|grandpa|stuck|stranded|need (money|cash) (now|urgently)|bail/i, label: "Emotional emergency pressure", weight: 3 },
  { test: /irs|tax refund|government grant|social security administration/i, label: "Impersonating a government agency", weight: 2 },
  { test: /investment opportunity|guaranteed return|double your money|risk.?free/i, label: "Unrealistic investment promise", weight: 3 },
  { test: /\b(http|https):\/\/(?!.*\.(gov|edu))[a-z0-9-]+\.[a-z]{2,}\b.*\.(tk|xyz|top|club|info)/i, label: "Suspicious shortened or unusual domain", weight: 2 },
];

export function analyzeMessage(text) {
  if (!text || text.trim().length < 5) {
    return { valid: false, score: 0, found: [] };
  }
  let score = 0;
  const found = [];
  for (const p of PATTERNS) {
    if (p.test.test(text)) {
      score += p.weight;
      found.push(p.label);
    }
  }
  return { valid: true, score, found };
}

export function riskLevel(score) {
  if (score === 0) {
    return {
      level: "Looks low risk",
      tier: "low",
      advice:
        "No common scam patterns were detected, but always trust your instincts. If something still feels off, verify with the sender directly through a separately confirmed contact method.",
    };
  }
  if (score <= 3) {
    return {
      level: "Some warning signs",
      tier: "medium",
      advice:
        "This message has a few common manipulation patterns. Be cautious. Do not click links or share information. Verify independently before responding.",
    };
  }
  return {
    level: "High risk of scam",
    tier: "high",
    advice:
      "This message shows strong characteristics of a scam or manipulation attempt. Do not click any links, do not send money or information, and do not reply. If it claims to be from someone you know, contact them directly through a different, trusted channel to confirm.",
  };
}
