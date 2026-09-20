// types/lead.ts

/**
 * 4-Stage HTTP Status State Machine
 * - VERIFIED_ALIVE: HTTP 200 OK Handshake. Live target.
 * - BOT_SHIELDED: HTTP 403 / 429. Cloudflare / Bot protection detected (Flag for manual review).
 * - TIMEOUT_SLOW: Exceeded the 4-second fail-fast Vercel limit.
 * - DEAD_INACTIVE: HTTP 404, 500, or DNS resolution failure.
 */
export type LeadStatus =
  | 'VERIFIED_ALIVE'
  | 'BOT_SHIELDED'
  | 'TIMEOUT_SLOW'
  | 'DEAD_INACTIVE';

/**
 * Categories for Explainable Deal Scoring
 */
export type SignalCategory =
  | 'businessViability'
  | 'recurringModel'
  | 'modernizationUpside'
  | 'outreachFeasibility';

/**
 * Audit Trail Signal
 * Every point in the final score is justified by an audited signal.
 */
export interface ScoreSignal {
  category: SignalCategory;
  label: string;      // e.g. "Active B2B Pricing Table Found"
  weight: number;     // e.g. +15 or -10
  evidence: string;   // e.g. "Detected $49/mo tier at /pricing"
}

/**
 * Keyed Social Media Handles for UI Icon Rendering
 */
export interface DetectedSocials {
  linkedin?: string;
  twitter?: string;
  github?: string;
  facebook?: string;
}

/**
 * Score Breakdown Structure (Max 100 Points Total)
 */
export interface ScoreBreakdown {
  businessViability: number;   // Max 30: Clear value proposition & business clarity
  recurringModel: number;      // Max 25: Subscription, retainers, or B2B contracts
  modernizationUpside: number; // Max 25: Caprae PE upside (solid business + legacy tech)
  outreachFeasibility: number; // Max 20: Direct email, founders listed, active socials
}

/**
 * The Master Enriched Lead Entity Contract
 */
export interface EnrichedLead {
  id: string;                  // Unique UUID or hash
  rawInput: string;            // The original string entered by user
  domain: string;              // Apex domain (e.g. "stripe.com")
  finalUrl: string;            // Followed destination URL after redirects
  status: LeadStatus;          // Current state machine status
  httpStatusCode: string;      // Actual HTTP code (200, 301, 403, 404, etc.)
  scrapedAt: string;           // ISO-8601 Timestamp for data freshness

  // Entity Details
  companyName: string;
  businessModels: string[];    // Supports hybrids, e.g. ["B2B SaaS", "Agency Services"]
  contactEmail?: string;       // Direct scraped contact email for sales outreach
  detectedSocials: DetectedSocials;

  // Intelligence & Explainability
  aiConfidence: number;        // 0.0 to 1.0 (Model confidence score)
  score: {
    total: number;             // Sum of signals clamped [0 - 100]
    breakdown: ScoreBreakdown;
  };
  signals: ScoreSignal[];      // Audit trail justifying the total score

  // Outreach Synthesis
  summary: string;             // 1-sentence value proposition summary
  coldOutreachHook: string;    // 2-sentence hyper-personalized cold outreach icebreaker
}

/**
 * High-Level Telemetry Metrics Structure for the 4 Cards
 */
export interface TelemetryMetrics {
  totalIngested: number;
  verifiedAlive: number;
  botShielded: number;
  highConviction: number;
}