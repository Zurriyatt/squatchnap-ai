import type { EnrichedLead } from "@/types/lead";
import { Chevron, External } from "./icons";
import { CopyButton, Favicon, ModelTags, ScorePill, StatusBadge } from "./ui";

export function DealMatrix({
    leads = [],
    onInspect,
    activeId,
}: {
    leads: EnrichedLead[];
    onInspect: (lead: EnrichedLead) => void;
    activeId: string | null;
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
            {/* Table Header */}
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-semibold text-white">Your Scored Companies</h2>
                    <span className="rounded-full border border-hairline bg-elevated px-2 py-0.5 font-mono text-xs text-zinc-400 tnum">
                        {leads.length} companies
                    </span>
                </div>
                <span className="hidden text-xs text-zinc-500 sm:block">Best matches first</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-left">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-zinc-500">
                            <th className="px-4 py-2.5 font-medium">Company &amp; Website</th>
                            <th className="px-4 py-2.5 font-medium">Site Status</th>
                            <th className="px-4 py-2.5 font-medium">What They Do</th>
                            <th className="px-4 py-2.5 font-medium">Score</th>
                            <th className="px-4 py-2.5 font-medium">What They Sell</th>
                            <th className="px-4 py-2.5 text-right font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length === 0 ? (
                            /* Empty State when no leads are checked yet */
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center">
                                    <div className="mx-auto max-w-sm space-y-1 text-center">
                                        <p className="text-sm font-medium text-zinc-400">No companies checked yet</p>
                                        <p className="text-xs text-zinc-600">
                                            Paste website domains or drop a spreadsheet above to run live verification
                                            and scoring.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            /* Live Scored Leads */
                            leads.map((lead, idx) => {
                                const scoreValue = typeof lead.score === "object" ? lead.score.total : lead.score;
                                const hookText = lead.coldOutreachHook || "";

                                return (
                                    <tr
                                        key={`${lead.id}-${idx}`}
                                        onClick={() => onInspect(lead)}
                                        className={`group cursor-pointer border-t border-hairline transition-colors ${
                                            activeId === lead.id ? "bg-amber-500/[0.06]" : "hover:bg-elevated/50"
                                        }`}
                                    >
                                        {/* Company & Domain */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Favicon domain={lead.domain} company={lead.companyName} />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-white truncate max-w-[180px]">
                                                        {lead.companyName}
                                                    </div>
                                                    <a
                                                        href={`https://${lead.domain}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500 hover:text-amber-400"
                                                    >
                                                        {lead.domain}
                                                        <External
                                                            width={11}
                                                            height={11}
                                                            className="opacity-0 transition-opacity group-hover:opacity-100"
                                                        />
                                                    </a>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="px-4 py-3">
                                            <StatusBadge status={lead.status} code={lead.httpStatusCode || "200"} />
                                        </td>

                                        {/* Business Models Tags */}
                                        <td className="px-4 py-3">
                                            <ModelTags models={lead.businessModels || ["B2B SaaS"]} />
                                        </td>

                                        {/* Score Pill */}
                                        <td className="px-4 py-3">
                                            <ScorePill score={scoreValue} size="sm" />
                                        </td>

                                        {/* Summary */}
                                        <td className="max-w-[260px] px-4 py-3">
                                            <p className="truncate text-sm text-zinc-400">{lead.summary}</p>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <CopyButton value={hookText} label="Copy Hook" />
                                                <span className="flex size-7 items-center justify-center rounded-md border border-hairline bg-elevated text-zinc-500 transition-colors group-hover:border-hairline-strong group-hover:text-white">
                                                    <Chevron width={14} height={14} />
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
