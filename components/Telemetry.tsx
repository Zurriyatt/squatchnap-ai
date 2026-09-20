import type { EnrichedLead } from '@/types/lead'

export function Telemetry({ leads = [] }: { leads?: EnrichedLead[] }) {
  // 1. Calculate the 4 live metrics from the leads array
  const totalIngested = leads.length
  
  const verifiedAlive = leads.filter(
    (l) => l.status === 'VERIFIED_ALIVE'
  ).length

  const botShielded = leads.filter(
    (l) => l.status === 'BOT_SHIELDED'
  ).length

  const highConviction = leads.filter((l) => {
    const scoreVal = typeof l.score === 'object' ? l.score.total : l.score
    return scoreVal >= 75
  }).length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      
      {/* Card 1: Total Ingested */}
      <div className="relative overflow-hidden rounded-xl border border-hairline bg-surface p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Websites Checked
        </div>
        <div className="mt-2 font-mono text-3xl font-bold tracking-tight text-white tnum">
          {totalIngested}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Total companies added
        </div>
      </div>

      {/* Card 2: Verified 200 OK */}
      <div className="relative overflow-hidden rounded-xl border border-hairline bg-surface p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
          Working Sites
        </div>
        <div className="mt-2 font-mono text-3xl font-bold tracking-tight text-emerald-400 tnum">
          {verifiedAlive}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Live and open for business
        </div>
      </div>

      {/* Card 3: 403 Bot Shielded */}
      <div className="relative overflow-hidden rounded-xl border border-hairline bg-surface p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
          <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
          Need a Manual Look
        </div>
        <div className="mt-2 font-mono text-3xl font-bold tracking-tight text-amber-400 tnum">
          {botShielded}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Blocked us — check by hand
        </div>
      </div>

      {/* Card 4: High Conviction (75+) */}
      <div className="relative overflow-hidden rounded-xl border border-hairline bg-surface p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Best Matches
        </div>
        <div className="mt-2 font-mono text-3xl font-bold tracking-tight text-amber-400 tnum">
          {highConviction}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Top-scoring targets
        </div>
      </div>

    </div>
  )
}