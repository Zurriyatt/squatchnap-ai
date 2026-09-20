"use client";

import { useState } from "react";
import type { EnrichedLead } from "@/types/lead";
import { TopBar } from "@/components/TopBar";
import { Telemetry } from "@/components/Telemetry";
import { Ingestion } from "@/components/Ingestion";
import { DealMatrix } from "@/components/DealMatrix";
import { AuditDrawer } from "@/components/AuditDrawer";
import { ColumnMapperModal } from "@/components/ColumnMapperModal";

export default function App() {
    const [csvData, setCsvData] = useState<{ columns: string[]; rows: any[]; fileName: string }>({
        columns: [],
        rows: [],
        fileName: "",
    });

    // 1. Master state for all analyzed leads
    const [leads, setLeads] = useState<EnrichedLead[]>([]);

    // 2. Active lead for the slide-over inspection drawer
    const [active, setActive] = useState<EnrichedLead | null>(null);

    // 3. Modal state for ambiguous CSV mapping
    const [mapperOpen, setMapperOpen] = useState(false);

    // 4. Function to add newly analyzed leads to our matrix
    const handleLeadsProcessed = (newLeads: EnrichedLead[]) => {
        setLeads((prev) => [...newLeads, ...prev]);
    };

    // 5. 1-Click CSV Export
    const handleExportCSV = () => {
        if (leads.length === 0) return;
        const headers = "Company,Domain,Status,HTTP Code,Business Models,Score,Summary,Contact Email,Pitch Hook\n";
        const rows = leads
            .map(
                (l) =>
                    `"${l.companyName}","${l.domain}","${l.status}","${l.httpStatusCode}","${(l.businessModels || []).join("; ")}",${
                        typeof l.score === "object" ? l.score.total : l.score
                    },"${l.summary.replace(/"/g, '""')}","${l.contactEmail || ""}","${(l.coldOutreachHook || "").replace(/"/g, '""')}"`,
            )
            .join("\n");

        const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `squatchnap_leads_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleCsvAmbiguous = (columns: string[], rows: any[], fileName: string) => {
        setCsvData({ columns, rows, fileName });
        setMapperOpen(true);
    };

    // When user picks the column and clicks Confirm in the modal
    const handleModalConfirm = async (domains: string[]) => {
        for (const singleDomain of domains) {
            try {
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: singleDomain }),
                });
                const data = await res.json();
                if (data.success && data.lead) {
                    setLeads((prev) => [data.lead, ...prev]);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="min-h-screen bg-canvas text-zinc-100 font-sans">
            {/* TopBar with live Export button */}
            <TopBar onExport={handleExportCSV} exportEnabled={leads.length > 0} />

            <main className="mx-auto max-w-[1440px] px-6 py-8">
                {/* 1. Context / Hero */}
                <section className="mb-6 max-w-2xl">
                    <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
                        Check and rank companies you might want to buy —{" "}
                        <span className="text-amber-400">automatically</span>
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                        Paste a list of websites or drop a spreadsheet from Apollo or Google Maps. SquatchNap visits
                        each site, figures out what the company sells, and gives it a score so you know which ones are
                        worth your time.
                    </p>
                </section>

                {/* 2. Action / Ingestion — passes new leads up */}
                <Ingestion setLeads={setLeads} onCsvAmbiguous={handleCsvAmbiguous} />

                {/* 3. Outcome — Telemetry + Qualified Deal Matrix */}
                <div className="mt-8">
                    <div className="mb-3 flex items-center gap-2">
                        <div className="h-4 w-1 rounded-full bg-amber-500" />
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Results</h2>
                    </div>
                    <div className="space-y-4">
                        {/* Live Telemetry Cards */}
                        <Telemetry leads={leads} />

                        {/* Live Deal Matrix Table */}
                        <DealMatrix leads={leads} onInspect={setActive} activeId={active?.id ?? null} />
                    </div>
                </div>
            </main>

            {/* Dynamic State A: Guided Schema Fallback Modal */}
            {mapperOpen && (
                <ColumnMapperModal
                    columns={csvData.columns}
                    rows={csvData.rows}
                    fileName={csvData.fileName}
                    onClose={() => setMapperOpen(false)}
                    onConfirm={handleModalConfirm}
                />
            )}

            {/* Dynamic State B: Progressive Disclosure Slide-Over Panel */}
                        <AuditDrawer 
                lead={active} 
                onClose={() => setActive(null)} 
            />

        </div>
    );
}
