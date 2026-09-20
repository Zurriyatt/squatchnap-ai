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
[Target URL / Dirty CSV]
│
▼
[1. Ingestion & Normalization]
├── Regex Apex Domain Extractor (removes paths, www., query params)
└── Client-Side CSV Parser (PapaParse + Auto-Alias Sniffing + Fallback Dropdown)
│
▼
[2. Network State Machine & Triage (4s Fail-Fast)]
├── HTTP 200 ➔ VERIFIED_ALIVE (Proceeds to DOM scraping)
├── HTTP 403/429 ➔ BOT_SHIELDED (Flagged for manual review; skips LLM token waste)
└── HTTP 404/500/Timeout ➔ DEAD_INACTIVE / TIMEOUT_SLOW (Halts pipeline; 0 score)
│
▼
[3. High-Density DOM Sanitization (Cheerio)]
├── Strips <script>, <style>, <svg>, <nav>, and <footer> (85% token reduction)
├── Extracts <title>, <meta description>, and core <h1>/<h2> headings
└── Scrapes direct inbound founder emails via regex (e.g. mailto: links)
│
▼
[4. Neural Evaluation (Single-Pass Constrained Decoding)]
├── Multi-Model Cascade: gemini-3.8-flash ➔ gemini-3.7-flash ➔ gemini-3.5-flash-lite
├── Enforces responseMimeType: "application/json" (Zero conversational hallucination)
└── Mathematical 4-Pillar Scoring + Explainable signals[] generation
│
▼
[5. Operator Presentation (Progressive Disclosure)]
├── Live Telemetry Counters (Websites Checked, Working Sites, Shielded, High-Conviction)
├── Qualified Deal Matrix Table (Sortable, color-coded score badges, 1-click pitch copy)
├── Slide-Over Audit Drawer (Inspection panel revealing the complete signals[] audit trail)
└── RFC-4180 Compliant CSV Export

## 3. The 4-Pillar Deal Scoring Algorithm

Scores are strictly bounded to a **100-point formula** calibrated specifically for Caprae Capital’s M&A thesis:

| Pillar | Max Weight | Evaluation Focus |
| :--- | :---: | :--- |
| **1. Business Viability** | **30 pts** | Filters out hobby/student projects; checks for clear enterprise positioning and legitimacy. |
| **2. Recurring Model** | **25 pts** | Rewards B2B subscription pricing, retainers, and contracts over one-off consumer sales. |
| **3. Modernization Upside** | **25 pts** | **The Caprae PE Signal:** Rewards established, cash-flowing businesses operating legacy/outdated tech stacks ripe for modernization. |
| **4. Outreach Feasibility** | **20 pts** | Rewards direct founder contact availability (scraped emails, active LinkedIn/Twitter). |

Every single point is accompanied by an item in the **`signals[]` audit trail** (e.g. `+15 Direct founder contact available`, `-10 Transactional D2C model`), giving associates 100% explainability.

---

## 4. Technical Stack & Infrastructure Specifications

* **Frontend:** Next.js 14+ (App Router, React 19, TypeScript)
* **Styling:** Tailwind CSS v4 (High-density dark mode inspired by Linear & Raycast)
* **DOM Engine:** Cheerio (Lightweight headless HTML parsing, zero browser overhead)
* **CSV Engine:** PapaPrse (Clienat-side RFC-4180 parsing with dynamic bracket-notation schema previewing)
* **AI Model Pipeline:** Google Generative AI SDK with an automated 7-tier Flash model cascade (`gemini-3.8-flash` down to `gemini-3.5-flash-lite`)
* **State Machine & Caching:**
  * Client-side domain deduplication.
  * In-memory 24h caching strategy for repeat domain lookups.
  * Fail-fast `AbortController` (4-second ceiling) guaranteeing runtime safety under Vercel’s 10s serverless limit.
* **Hosting & Deployment:** Vercel Edge/Serverless Functions (Scales to zero with sub-second cold starts).

---

## 5. Local Setup & Installation

### Prerequisites
* Node.js 18.x or later
* A Google AI Studio API Key (Free at [aistudio.google.com](https://aistudio.google.com/))

### Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Zurriyatt/squatchnap-ai.git
   cd squatchnap-ai
