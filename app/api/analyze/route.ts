// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EnrichedLead, LeadStatus } from "@/types/lead";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
export const maxDuration = 10;

// ─── Heuristic fallback (used when LLM fails) ──────────────────────
function heuristicScore(opts: {
    title: string;
    meta: string;
    bodyText: string;
    hasEmail: boolean;
    hasSocials: boolean;
}) {
    const { title, meta, bodyText, hasEmail, hasSocials } = opts;
    const hay = `${title} ${meta} ${bodyText}`.toLowerCase();
    const signals: any[] = [];

    // Business viability (max 30)
    let bv = 0;
    if (bodyText.length > 500) {
        bv += 12;
        signals.push({ category: "businessViability", label: "Substantive Site Copy", weight: 12, evidence: `${bodyText.length} chars of readable body text` });
    }
    if (/\b(b2b|enterprise|for business|our clients|case stud)\b/.test(hay)) {
        bv += 8;
        signals.push({ category: "businessViability", label: "B2B Positioning Detected", weight: 8, evidence: "Matched B2B/enterprise language in body copy" });
    }
    if (/\b(pricing|plans?|subscribe|tier)\b/.test(hay)) {
        bv += 6;
        signals.push({ category: "businessViability", label: "Productized Offering", weight: 6, evidence: "Pricing/plans language present on site" });
    }

    // Recurring model (max 25)
    let rm = 0;
    if (/\b(subscription|monthly|annually|retainer|recurring|\/mo|\/month)\b/.test(hay)) {
        rm += 15;
        signals.push({ category: "recurringModel", label: "Recurring Revenue Language", weight: 15, evidence: "Subscription/recurring keywords in copy" });
    }
    if (/\$\d/.test(hay)) {
        rm += 8;
        signals.push({ category: "recurringModel", label: "Published Pricing", weight: 8, evidence: "Dollar amounts present in site copy" });
    }

    // Modernization upside (max 25) — baseline only in heuristic mode
    const mu = 10;
    signals.push({ category: "modernizationUpside", label: "Baseline Upside Estimate", weight: 10, evidence: "Heuristic mode — full modernization analysis unavailable without LLM" });

    // Outreach feasibility (max 20)
    let of = 0;
    if (hasEmail) {
        of += 12;
        signals.push({ category: "outreachFeasibility", label: "Contact Email Found", weight: 12, evidence: "Direct email scraped from page HTML" });
    }
    if (hasSocials) {
        of += 6;
        signals.push({ category: "outreachFeasibility", label: "Social Channels Present", weight: 6, evidence: "LinkedIn/Twitter/GitHub links detected" });
    }

    const total = Math.min(100, bv + rm + mu + of);
    return {
        total,
        breakdown: {
            businessViability: Math.min(30, bv),
            recurringModel: Math.min(25, rm),
            modernizationUpside: Math.min(25, mu),
            outreachFeasibility: Math.min(20, of),
        },
        signals,
    };
}

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url || typeof url !== "string") {
            return NextResponse.json({ success: false, error: "Valid URL is required" }, { status: 400 });
        }

        // 1. URL Normalization
        let cleanUrl = url.trim().toLowerCase();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = `https://${cleanUrl}`;
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(cleanUrl);
        } catch {
            return NextResponse.json({ success: false, error: "Invalid URL format" }, { status: 400 });
        }

        const apexDomain = parsedUrl.hostname.replace(/^www\./, "");
        const leadId = `lead_${Buffer.from(apexDomain)
            .toString("base64")
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 10)}`;

        // 2. Fast 2.5-Second Live HTTP Handshake
        let html = "";
        let httpStatusCode = "0";
        let status: LeadStatus = "DEAD_INACTIVE";
        let finalDestination = cleanUrl;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const response = await fetch(cleanUrl, {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
                redirect: "follow",
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            httpStatusCode = String(response.status);
            finalDestination = response.url || cleanUrl;

            if (response.status === 200) {
                status = "VERIFIED_ALIVE";
                const rawHtml = await response.text();
                html = rawHtml.length > 400_000 ? rawHtml.slice(0, 400_000) : rawHtml;
            } else if (response.status === 403 || response.status === 429 || response.status === 503) {
                status = "BOT_SHIELDED";
            } else {
                status = "DEAD_INACTIVE";
            }
        } catch (err: any) {
            if (err.name === "AbortError") {
                status = "TIMEOUT_SLOW";
                httpStatusCode = "408";
            } else {
                status = "DEAD_INACTIVE";
                httpStatusCode = "500";
            }
        }

        // 3. Handle Shielded / Dead / Timeout Sites
        if (status === "BOT_SHIELDED") {
            const shieldedLead: EnrichedLead = {
                id: leadId,
                rawInput: url,
                domain: apexDomain,
                finalUrl: finalDestination,
                status: "BOT_SHIELDED",
                httpStatusCode: "403",
                scrapedAt: new Date().toISOString(),
                companyName: apexDomain,
                businessModels: ["Protected Target"],
                detectedSocials: {},
                aiConfidence: 0.5,
                score: {
                    total: 50,
                    breakdown: {
                        businessViability: 20,
                        recurringModel: 10,
                        modernizationUpside: 15,
                        outreachFeasibility: 5,
                    },
                },
                signals: [
                    {
                        category: "businessViability",
                        label: "Cloudflare / Anti-Bot Shield Encountered",
                        weight: 15,
                        evidence: "Target operates an enterprise bot-shield; high traffic indicator",
                    },
                ],
                summary: "Protected enterprise domain. Automated scraping challenged by CDN.",
                coldOutreachHook: `Noticed your team operates high-volume infrastructure at ${apexDomain}—open to discussing operational efficiencies?`,
            };
            return NextResponse.json({ success: true, lead: shieldedLead });
        }

        if (status !== "VERIFIED_ALIVE" || !html) {
            const deadLead: EnrichedLead = {
                id: leadId,
                rawInput: url,
                domain: apexDomain,
                finalUrl: finalDestination,
                status: status,
                httpStatusCode: httpStatusCode,
                scrapedAt: new Date().toISOString(),
                companyName: apexDomain,
                businessModels: ["Inactive"],
                detectedSocials: {},
                aiConfidence: 0.9,
                score: {
                    total: 0,
                    breakdown: { businessViability: 0, recurringModel: 0, modernizationUpside: 0, outreachFeasibility: 0 },
                },
                signals: [
                    {
                        category: "businessViability",
                        label: status === "TIMEOUT_SLOW" ? "Server Handshake Exceeded 2.5s Limit" : "Domain Unreachable / Parked",
                        weight: -50,
                        evidence: `HTTP Status Code: ${httpStatusCode}`,
                    },
                ],
                summary: "Target domain is inaccessible, offline, or DNS resolution failed.",
                coldOutreachHook: "N/A - Domain offline",
            };
            return NextResponse.json({ success: true, lead: deadLead });
        }

        // 4. DOM Parsing & Sanitization
        const $ = cheerio.load(html);
        $("script, style, svg, noscript, iframe, nav, footer, header").remove();

        const title = $("title").text().trim() || apexDomain;
        const metaDescription =
            $('meta[name="description"]').attr("content") ||
            $('meta[property="og:description"]').attr("content") ||
            "";

        const headings: string[] = [];
        $("h1, h2")
            .slice(0, 6)
            .each((_, el) => {
                const text = $(el).text().trim().replace(/\s+/g, " ");
                if (text && text.length > 5) headings.push(text);
            });

        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        const matchedEmails = html.match(emailRegex) || [];
        const validEmails = matchedEmails.filter(
            (e) => !e.endsWith(".png") && !e.endsWith(".jpg") && !e.includes("example.com") && !e.includes("sentry.io"),
        );
        const contactEmail = validEmails[0] || undefined;

        const detectedSocials: EnrichedLead["detectedSocials"] = {};
        $("a[href]").each((_, el) => {
            const href = $(el).attr("href") || "";
            if (href.includes("linkedin.com/company") && !detectedSocials.linkedin) detectedSocials.linkedin = href;
            if ((href.includes("twitter.com/") || href.includes("x.com/")) && !detectedSocials.twitter) detectedSocials.twitter = href;
            if (href.includes("github.com/") && !detectedSocials.github) detectedSocials.github = href;
        });

        const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 2500);

        const pageContext = `
Domain: ${apexDomain}
Title: ${title}
Meta Description: ${metaDescription}
Headings: ${headings.join(" | ")}
Email: ${contactEmail || "None"}
Socials: ${Object.keys(detectedSocials).join(", ") || "None"}

BODY TEXT (only cite facts that appear below):
${bodyText}
`;

        // 5. Gemini AI Engine — model cascade with hard time budget
        let aiOutput: any = null;
        let llmDiagnostic = "not_attempted";

        if (process.env.GEMINI_API_KEY) {
            try {
                const prompt = `You are an M&A analyst for Caprae Capital — a PE/ETA firm that acquires small, profitable businesses ($500K–$10M EBITDA, <200 employees) and modernizes them with AI. Score this website as a potential acquisition target.

Return ONLY raw JSON (no markdown fences):

{
  "companyName": string,
  "businessModels": string[],
  "aiConfidence": number,
  "score": {
    "total": number,
    "breakdown": {
      "businessViability": number,
      "recurringModel": number,
      "modernizationUpside": number,
      "outreachFeasibility": number
    }
  },
  "signals": [{"category": "businessViability"|"recurringModel"|"modernizationUpside"|"outreachFeasibility", "label": string, "weight": number, "evidence": string}],
  "summary": string,
  "coldOutreachHook": string
}

═══ THE CAPRAE TARGET PROFILE — WHAT SCORES 75-95 ═══

A small, cash-flowing business ($1M-$20M revenue, 10-200 employees) with:
- A dated or functionally outdated website (built 2015-2020, generic WordPress template, aging branding)
- Recurring or retainer revenue (service contracts, subscriptions, maintenance plans)
- A reachable owner (email, phone, contact page)
- Clear commercial intent (case studies, testimonials, pricing or "request quote")

THIS PROFILE IS THE PRODUCT. Score it 75-95. If a plumber with a 2018 WordPress site and $49/mo maintenance contracts scores below 75, you have failed the assignment.

═══ PILLAR 1 — BUSINESS VIABILITY (0-30) ═══

SMB in the target band (10-200 employees, $1M-$20M revenue, acquirable):
→ 26-30 points. This is the top of the range. Score it high.

Real business but too large for Caprae:
- Publicly traded / mega-cap (Stripe, Cloudflare, LinkedIn): 10-14
- Owned by Big Tech (Microsoft, Google, Adobe): 10-14
- Late-stage VC ($500M+ valuation): 12-16
- Global consumer brand (100M+ users): 10-14
- Headcount >500: 12-16

PE firms / search funds / VCs — competitors, not targets: 14-18

Signals that bump SMB scores:
- Named clients or case studies: +4
- Pricing or plans page: +4
- Founder/team page visible: +3

═══ PILLAR 2 — RECURRING MODEL (0-25) ═══

- Explicit subscription tiers ($X/mo, $Y/yr): 22-25
- Retainer / recurring contracts (maintenance plans, service agreements): 20-25
- Transactional / usage-based: 14-18
- Advisory / project-based fees: 12-16
- One-time sales only: 6-10

═══ PILLAR 3 — MODERNIZATION UPSIDE (0-25) — THE CAPRAE SIGNAL ═══

This is the reason Caprae acquires small businesses. How much would AI modernization and modern tooling improve this business?

HIGH (22-25): dated UI, table layouts, jQuery-era patterns, no mobile viewport, copyright 3+ years stale, PDF-heavy workflows, no self-serve — AND clear revenue signals.
MEDIUM (10-16): functional but old-school design, generic WordPress theme, dated color palette or typography.
LOW (0-6): modern, responsive, polished, contemporary design.

CRITICAL: Stripe, Linear, Vercel, Figma have world-class sites. Modern polished sites = 0-6, period. Do NOT award modernization upside to modern companies.

═══ PILLAR 4 — OUTREACH FEASIBILITY (0-20) ═══

- Direct founder/owner email visible: +14
- Named leadership + phone visible: +7
- Active social handles: +4
- Opaque enterprise contact form only: 6-10

═══ CALIBRATION — MATCH THESE BANDS EXACTLY ═══

TARGET PROFILE (score 78-95):
→ Local plumber, HVAC, roofing, dental, landscaping, or small agency with a dated site and clear revenue. If you evaluate this profile and output less than 75, you have misinterpreted the assignment.

REAL BUSINESS, MODERN SITE (score 55-72):
→ Basecamp, Ghost, HEY, Sentry, Railway, Fly.io, Render, Supabase, PlanetScale. Modern polished site, real revenue, but no modernization alpha.

MEGA-CAP / DISQUALIFIED (score 20-40):
→ Stripe, Cloudflare, LinkedIn, GitHub, Notion, Figma. Excellent businesses, not acquirable.

PE / SEARCH FUND / VC (score 45-62):
→ Trilogy Search Partners, ETA Equity, Brydon, Search Fund Partners. Competitors, not targets.

═══ CONSTRAINTS ═══

- score.total = sum of the four breakdown values, clamped 0-100.
- Emit 3-6 signals. Evidence MUST quote the site directly.
- businessModels: 1-3 SHORT category labels only (e.g. "B2B SaaS", "Agency", "Local Service", "Search Fund", "Private Equity", "E-commerce"). NEVER paste prompt text or pillar descriptions. Labels MUST be ≤4 words.
- If the site is a mega-cap, Big Tech owned, or late-stage VC: emit a signal under businessViability with negative weight like "Deal-Fit Disqualifier: Mega-Cap" evidence "Stripe is a $65B fintech, not an acquirable SMB target".
- If the site is a target-profile SMB: emit a signal under modernizationUpside with weight +22-25 and evidence quoting the actual site copy.
- summary: 1 sentence. coldOutreachHook: 2 sentences personalized.
- Return raw JSON only.

Website Data:
${pageContext}`;

                const candidates = [
                    "gemini-3.5-flash-lite",
                    'gemini-3.1-flash-lite',
                    "gemini-3.8-flash",
        
                ];

                const TOTAL_LLM_BUDGET_MS = 6500;
                const llmStart = Date.now();

                for (const modelName of candidates) {
                    const elapsed = Date.now() - llmStart;
                    const remaining = TOTAL_LLM_BUDGET_MS - elapsed;

                    if (remaining < 800) {
                        llmDiagnostic = `budget_exhausted_after_${elapsed}ms`;
                        console.error(`[llm] ${llmDiagnostic}`);
                        break;
                    }

                    try {
                        const model = genAI.getGenerativeModel({
                            model: modelName,
                            generationConfig: { responseMimeType: "application/json" },
                        });

                        const llmPromise = model.generateContent(prompt);

                        let timeoutHandle: any;
                        const timeoutPromise = new Promise<never>((_, reject) => {
                            timeoutHandle = setTimeout(() => reject(new Error("MODEL_TIMEOUT")), remaining);
                        });

                        try {
                            const aiRes = await Promise.race([llmPromise, timeoutPromise]);
                            clearTimeout(timeoutHandle);

                            if (aiRes) {
                                const raw = aiRes.response.text();
                                aiOutput = JSON.parse(raw);
                                llmDiagnostic = `ok_${modelName}`;
                                console.error(`[llm] SUCCESS via ${modelName}`);
                                break;
                            }
                        } catch (raceErr) {
                            clearTimeout(timeoutHandle);
                            throw raceErr;
                        }
                    } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        console.error(`[llm] ${modelName} FAILED: ${msg}`);
                        llmDiagnostic = `fail_${modelName}_${msg.slice(0, 40)}`;
                    }
                }
            } catch (e) {
                console.error("Gemini outer error:", e);
                llmDiagnostic = "outer_error";
            }
        } else {
            llmDiagnostic = "no_api_key";
        }

        // 6. Score — LLM if available, otherwise heuristic
        let finalScore: any;
        let finalSignals: any[];
        let finalConfidence: number;
        let finalSummary: string;
        let finalHook: string;
        let finalCompany: string;
        let finalModels: string[];

        if (aiOutput && aiOutput.score && typeof aiOutput.score.total === "number" && aiOutput.score.total > 0) {
            finalScore = aiOutput.score;
            finalSignals = aiOutput.signals || [];
            finalConfidence = aiOutput.aiConfidence || 0.8;
            finalSummary = aiOutput.summary || metaDescription || "Active web property.";
            finalHook = aiOutput.coldOutreachHook || `Noticed ${apexDomain} online — open to a short conversation?`;
            finalCompany = aiOutput.companyName || title.split(/[-|]/)[0].trim() || apexDomain;
            finalModels = aiOutput.businessModels || ["B2B Technology"];
        } else {
            // Heuristic fallback — never returns 0 for a live site
            const h = heuristicScore({
                title,
                meta: metaDescription,
                bodyText,
                hasEmail: !!contactEmail,
                hasSocials: Object.keys(detectedSocials).length > 0,
            });
            finalScore = { total: h.total, breakdown: h.breakdown };
            finalSignals = h.signals;
            finalConfidence = 0.45;
            finalSummary = metaDescription || `Live site at ${apexDomain} — scored heuristically.`;
            finalHook = `Noticed ${apexDomain} online — would love a short conversation about what modern tooling could unlock.`;
            finalCompany = title.split(/[-|]/)[0].trim() || apexDomain;
            finalModels = ["Unclassified"];
        }

        const lead: EnrichedLead = {
            id: leadId,
            rawInput: url,
            domain: apexDomain,
            finalUrl: finalDestination,
            status: "VERIFIED_ALIVE",
            httpStatusCode: "200",
            scrapedAt: new Date().toISOString(),
            companyName: finalCompany,
            businessModels: finalModels,
            contactEmail,
            detectedSocials,
            aiConfidence: finalConfidence,
            score: finalScore,
            signals: finalSignals,
            summary: finalSummary,
            coldOutreachHook: finalHook,
            // @ts-ignore — diagnostic field
            analysisNote: llmDiagnostic,
        };

        return NextResponse.json({ success: true, lead });
    } catch (globalError: any) {
        console.error("Global analysis error:", globalError);
        return NextResponse.json(
            { success: false, error: "Internal Server Error: " + globalError.message },
            { status: 500 },
        );
    }
}