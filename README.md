# ⚡ SquatchNap AI — B2B Deal Qualification & Verification Engine
> Built for the **Caprae Capital AI-Readiness Pre-Screening Challenge**  
> Direct Enhancement for **SaaSQuatch Leads** (`saasquatchleads.com`)

![SquatchNap AI Banner](/public/og-image.png)

---

## 1. Executive Summary & Business Rationale

Traditional scraping tools (like SaaSQuatch) generate raw, unverified lists of companies from Google Maps and web directories. However, in Private Equity (PE) and Entrepreneurship Through Acquisition (ETA), raw data creates an operational bottleneck:
1. **Dirty Data & Churn:** 20–30% of scraped websites are dead (404), parked, or protected behind anti-bot firewalls (403). Sales reps waste hours verifying links manually.
2. **The "Old UI" Paradox:** In traditional sales outreach, an outdated website is discarded. In PE/ETA, an outdated website with strong underlying cash flow is a **prime acquisition target** because Caprae can modernize it with proprietary internal AI.
3. **Black-Box Skepticism:** Investment committees reject arbitrary scores. A score must be mathematically audited with visible evidence.

**SquatchNap AI** acts as the automated Deal Analyst sitting directly on top of SaaSQuatch. It validates live HTTP handshakes, bypasses token waste on dead domains, extracts founder contacts, and generates **explainable 100-point acquisition scores** backed by an audit trail.

---

## 2. Core Architecture & Pipeline Lifecycle

SquatchNap processes targets through a **5-station fail-fast assembly line**:
