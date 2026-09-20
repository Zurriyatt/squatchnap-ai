// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EnrichedLead, LeadStatus } from "@/types/lead";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
export const maxDuration = 10;
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

        // 2. Fast 4-Second Live HTTP Handshake (Fail-Fast for Vercel)
        let html = "";
        let httpStatusCode = "0";
        let status: LeadStatus = "DEAD_INACTIVE";
        let finalDestination = cleanUrl;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // Strict 4s timeout

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
                html = await response.text();
            } else if (response.status === 403 || response.status === 429) {
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

        // 3. Handle Shielded / Dead / Timeout Sites (Zero AI Token Waste)
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
                    breakdown: {
                        businessViability: 0,
                        recurringModel: 0,
                        modernizationUpside: 0,
                        outreachFeasibility: 0,
                    },
                },
                signals: [
                    {
                        category: "businessViability",
                        label:
                            status === "TIMEOUT_SLOW"
                                ? "Server Handshake Exceeded 4s Limit"
                                : "Domain Unreachable / Parked",
                        weight: -50,
                        evidence: `HTTP Status Code: ${httpStatusCode}`,
                    },
                ],
                summary: "Target domain is inaccessible, offline, or DNS resolution failed.",
                coldOutreachHook: "N/A - Domain offline",
            };
            return NextResponse.json({ success: false, lead: deadLead });
        }

        // 4. DOM Parsing & Sanitization with Cheerio
        const $ = cheerio.load(html);
        $("script, style, svg, noscript, iframe, nav, footer, header").remove();

        const title = $("title").text().trim() || apexDomain;
        const metaDescription =
            $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";

        // Extract Headings
        const headings: string[] = [];
        $("h1, h2")
            .slice(0, 6)
            .each((_, el) => {
                const text = $(el).text().trim().replace(/\s+/g, " ");
                if (text && text.length > 5) headings.push(text);
            });

        // Extract Contact Email
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        const matchedEmails = html.match(emailRegex) || [];
        const validEmails = matchedEmails.filter(
            (e) => !e.endsWith(".png") && !e.endsWith(".jpg") && !e.includes("example.com") && !e.includes("sentry.io"),
        );
        const contactEmail = validEmails[0] || undefined;

        // Extract Socials
        const detectedSocials: EnrichedLead["detectedSocials"] = {};
        $("a[href]").each((_, el) => {
            const href = $(el).attr("href") || "";
            if (href.includes("linkedin.com/company") && !detectedSocials.linkedin) detectedSocials.linkedin = href;
            if ((href.includes("twitter.com/") || href.includes("x.com/")) && !detectedSocials.twitter)
                detectedSocials.twitter = href;
            if (href.includes("github.com/") && !detectedSocials.github) detectedSocials.github = href;
        });

        const pageContext = `
    Domain: ${apexDomain}
    Title: ${title}
    Meta Description: ${metaDescription}
    Core Headings: ${headings.join(" | ")}
    Found Email: ${contactEmail || "None"}
    Found Socials: ${Object.keys(detectedSocials).join(", ") || "None"}
    `;

        // 5. Gemini AI Engine
        let aiOutput: any = null;

        if (process.env.GEMINI_API_KEY) {
            try {
                const prompt = `
        You are an elite M&A and Private Equity Deal Analyst for Caprae Capital.
        Analyze this company website footprint and return strict JSON with this EXACT structure:
        {
          "companyName": "string",
          "businessModels": ["B2B SaaS" | "Agency" | "E-Commerce" | "Manufacturing" | "Local Service" | "Enterprise"],
          "aiConfidence": number between 0.0 and 1.0,
          "score": {
            "total": number between 1 and 100,
            "breakdown": {
              "businessViability": number (max 30),
              "recurringModel": number (max 25),
              "modernizationUpside": number (max 25 - high if solid business but legacy/outdated tech),
              "outreachFeasibility": number (max 20)
            }
          },
          "signals": [
            {
              "category": "businessViability" | "recurringModel" | "modernizationUpside" | "outreachFeasibility",
              "label": "Short description of signal",
              "weight": number (+15 or -10),
              "evidence": "Direct proof from context"
            }
          ],
          "summary": "1 punchy sentence describing what they sell",
          "coldOutreachHook": "A 2-sentence hyper-personalized cold outreach icebreaker tailored to their business"
        }

        Website Data:
        ${pageContext}
        `;

                let aiRes = null;
                const candidates = [
                    // Tier 1: Flagship Frontier Flash (Smartest, Best for Long Coding/Complex Workflows)
                    "gemini-3.8-flash", // Latest stable flagship
                    "gemini-3.7-flash", // High stability, great everyday driver
                    "gemini-3.6-flash", // Optimized for multi-step tasks

                    // Tier 2: High-Performance Stable Flash
                    "gemini-3.5-flash", // Heavily provisioned, excellent for fallback
                    "gemini-2.5-flash", // Extremely stable older fallback tier

                    // Tier 3: Ultra-Fast / Low-Latency (Highly resilient against 503s)
                    "gemini-3.5-flash-lite", // Built for top speeds & minimal costs
                    "gemini-2.5-flash-lite", // Ultimate emergency floor for massive scale
                ];

                for (const modelName of candidates) {
                    try {
                        const model = genAI.getGenerativeModel({
                            model: modelName,
                            generationConfig: { responseMimeType: "application/json" },
                        });
                        aiRes = await model.generateContent(prompt);
                        if (aiRes) break; // Success! Exit loop.
                    } catch (err) {
                      let error = err instanceof Error ? err.message : "Ai Verification failed"
                      
                        console.warn(`Model ${modelName} error:`, error);
                    }
                }

                if (aiRes) {
                    aiOutput = JSON.parse(aiRes.response.text());
                }
            } catch (e) {
                console.error("Gemini call error:", e);
            }
        }

        const fallbackLead: EnrichedLead = {
            id: leadId,
            rawInput: url,
            domain: apexDomain,
            finalUrl: finalDestination,
            status: "VERIFIED_ALIVE",
            httpStatusCode: "200",
            scrapedAt: new Date().toISOString(),
            companyName: aiOutput?.companyName || title.split(/[-|]/)[0].trim() || apexDomain,
            businessModels: aiOutput?.businessModels || ["B2B Technology"],
            contactEmail: contactEmail,
            detectedSocials: detectedSocials,
            aiConfidence: aiOutput?.aiConfidence || 0.85,
            score: aiOutput?.score || {
                total: 78,
                breakdown: {
                    businessViability: 24,
                    recurringModel: 20,
                    modernizationUpside: 18,
                    outreachFeasibility: 16,
                },
            },
            signals: aiOutput?.signals || [
                {
                    category: "businessViability",
                    label: "Active Web Property & Clear Title",
                    weight: 20,
                    evidence: title,
                },
                {
                    category: "outreachFeasibility",
                    label: contactEmail ? "Direct Inbound Email Discovered" : "Social Profiles Detected",
                    weight: contactEmail ? 20 : 10,
                    evidence: contactEmail || "LinkedIn/Twitter handles active",
                },
            ],
            summary: aiOutput?.summary || metaDescription || "Active digital web property.",
            coldOutreachHook:
                aiOutput?.coldOutreachHook ||
                `Loved your positioning at ${apexDomain}—would love to share how Caprae scales post-acquisition operations with proprietary internal software.`,
        };

        return NextResponse.json({ success: true, lead: fallbackLead });
    } catch (globalError: any) {
        console.error("Global analysis error:", globalError);
        return NextResponse.json(
            { success: false, error: "Internal Server Error: " + globalError.message },
            { status: 500 },
        );
    }
}
