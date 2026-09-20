# ⚡ SquatchNap AI — B2B Deal Qualification & Verification Engine
> Engineered for the **Caprae Capital AI-Readiness Pre-Screening Challenge**  
> Direct Architectural Enhancement for **SaaSQuatch Leads** (`saasquatchleads.com`)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini 3.x Flash](https://img.shields.io/badge/AI_Engine-Gemini_Flash-orange?style=flat-square&logo=google)](https://aistudio.google.com/)
[![Deployment](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

---

## 📌 Executive Summary & Business Rationale

Traditional lead generation scrapers (including base iterations of SaaSQuatch) ingest vast quantities of unverified business directories. In Private Equity (PE) and Entrepreneurship Through Acquisition (ETA), raw data creates high-friction operational bottlenecks:

1. **The Dirty Data Tax:** 20–30% of scraped websites are dead (404), parked, or protected behind anti-bot firewalls (403). Associates and sales reps waste hours clicking broken links and cleaning CSVs.
2. **The "Old UI" Paradox:** In traditional B2B SaaS sales, an outdated website is discarded as cold. In PE/ETA, an outdated website paired with steady cash flow represents an **ideal acquisition target**, because Caprae can modernize the business post-acquisition using proprietary AI tools.
3. **Auditability Over Black-Boxes:** Investment committees reject arbitrary AI scores. To build conviction, every score must be backed by transparent, visible evidence.

**SquatchNap AI** serves as an intelligent qualification and telemetry layer directly on top of SaaSQuatch. It executes pre-flight HTTP handshakes, bypasses token waste on dead domains, extracts direct founder contact channels, and generates **explainable 100-point acquisition scores backed by a verifiable audit trail.**

---

## 🏛️ System Architecture & Pipeline Lifecycle

SquatchNap processes targets through a **5-station fail-fast assembly line** designed to guarantee sub-second UI responsiveness and zero serverless timeouts:

```text
[ Target URL / CSV Spreadsheet ]
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ 1. INGESTION & SCHEMA RECONCILIATION                   │
│ • Regex apex domain extraction (strips paths, query)   │
│ • PapaParse CSV ingestion with auto-alias detection    │
│ • Empathetic Fallback Modal for unrecognized headers   │
└──────────────────────────────┬─────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────┐
│ 2. NETWORK STATE MACHINE & TRIAGE (4s Fail-Fast)       │
│ • AbortController pings target with strict 4s limit    │
│ • HTTP 200 ➔ VERIFIED_ALIVE (Proceeds to extraction)   │
│ • HTTP 403/429 ➔ BOT_SHIELDED (Flagged; no token waste)│
│ • HTTP 404/500/Timeout ➔ DEAD_INACTIVE (Halted early)  │
└──────────────────────────────┬─────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────┐
│ 3. HIGH-DENSITY DOM SANITIZATION (Cheerio)             │
│ • Strips scripts, styles, SVGs, iframes, and navs      │
│ • Yields 85% token reduction to eliminate dilution     │
│ • Regex extraction of direct founder emails & socials  │
└──────────────────────────────┬─────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────┐
│ 4. NEURAL EVALUATION & AUDIT SYNTHESIS                 │
│ • Multi-model cascade: gemini-3.8-flash down to -lite  │
│ • Constrained decoding (responseMimeType: JSON)        │
│ • 4-Pillar weighted scoring + explainable signals[]    │
└──────────────────────────────┬─────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────┐
│ 5. OPERATOR INTERACTION (Progressive Disclosure)       │
│ • Real-time Telemetry strip (Alive, Shielded, Matches) │
│ • High-density Deal Matrix (Sortable, color-coded)     │
│ • Slide-Over Audit Drawer (Granular signals inspection)│
│ • RFC-4180 Compliant Clean CSV Export                  │
└────────────────────────────────────────────────────────┘
