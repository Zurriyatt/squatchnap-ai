import { useState } from "react";
import { Check, Copy } from "./icons";
import { LeadStatus } from "@/types/lead";
export function useCopy() {
    const [copied, setCopied] = useState(false);
    const copy = (text: string) => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };
    return { copied, copy };
}

export function CopyButton({
    value,
    label = "Copy",
    className = "",
}: {
    value: string;
    label?: string;
    className?: string;
}) {
    const { copied, copy } = useCopy();
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                copy(value);
            }}
            className={`group/cp inline-flex items-center gap-1.5 rounded-md border border-hairline bg-elevated px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-hairline-strong hover:text-white ${className}`}
        >
            {copied ? (
                <Check width={13} height={13} className="text-emerald-400" />
            ) : (
                <Copy width={13} height={13} className="text-zinc-500 group-hover/cp:text-zinc-300" />
            )}
            {copied ? "Copied" : label}
        </button>
    );
}

const STATUS_META: Record<LeadStatus, { bg: string; border: string; text: string; dot: string; label: string }> = {
    VERIFIED_ALIVE: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-400",
        dot: "#10b981",
        label: "Live",
    },
    BOT_SHIELDED: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-400",
        dot: "#f59e0b",
        label: "Shielded",
    },
    TIMEOUT_SLOW: {
        bg: "bg-zinc-500/10",
        border: "border-zinc-500/20",
        text: "text-zinc-400",
        dot: "#71717a",
        label: "Slow/Timeout",
    },
    DEAD_INACTIVE: {
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        text: "text-rose-400",
        dot: "#f43f5e",
        label: "Dead",
    },
};

export function StatusBadge({ status, code }: { status: LeadStatus; code: string }) {
    // Safe fallback if status is missing
    const m = STATUS_META[status] || STATUS_META.DEAD_INACTIVE;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${m.bg} ${m.border} ${m.text}`}
        >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: m.dot, boxShadow: `0 0 6px ${m.dot}` }} />
            <span className="tnum font-mono">{code}</span>
            <span className="text-zinc-400">{m.label}</span>
        </span>
    );
}
export function ScorePill({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
    const tone =
        score >= 75
            ? { text: "text-emerald-300", bg: "bg-emerald-500/12", ring: "border-emerald-500/30" }
            : score >= 55
              ? { text: "text-amber-300", bg: "bg-amber-500/12", ring: "border-amber-500/30" }
              : { text: "text-rose-300", bg: "bg-rose-500/12", ring: "border-rose-500/30" };
    const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-md border font-mono font-semibold tnum ${tone.bg} ${tone.ring} ${tone.text} ${pad}`}
        >
            {score}
            <span className="text-[0.8em] font-normal text-zinc-500">/100</span>
        </span>
    );
}

export function Favicon({ domain, company }: { domain: string; company: string }) {
    const [failed, setFailed] = useState(false);
    const letter = company.charAt(0).toUpperCase();
    if (failed) {
        return (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-hairline bg-elevated text-xs font-semibold text-zinc-300">
                {letter}
            </div>
        );
    }
    return (
        <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt=""
            onError={() => setFailed(true)}
            className="size-7 shrink-0 rounded-md border border-hairline bg-elevated object-contain p-1"
        />
    );
}

export function ScoreRing({ score }: { score: number }) {
    const r = 26;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, score));
    const stroke = score >= 75 ? "#10b981" : score >= 55 ? "#f59e0b" : "#f43f5e";
    return (
        <div className="relative size-[68px] shrink-0">
            <svg className="size-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={r} fill="none" stroke="#27272a" strokeWidth="5" />
                <circle
                    cx="32"
                    cy="32"
                    r={r}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c - (pct / 100) * c}
                    style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-lg font-semibold tnum leading-none text-white">{score}</span>
                <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-zinc-500">score</span>
            </div>
        </div>
    );
}

export function ModelTags({ models }: { models: string[] }) {
    return (
        <div className="flex flex-wrap gap-1">
            {models.map((m) => (
                <span
                    key={m}
                    className="rounded border border-hairline bg-elevated/60 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400"
                >
                    {m}
                </span>
            ))}
        </div>
    );
}
