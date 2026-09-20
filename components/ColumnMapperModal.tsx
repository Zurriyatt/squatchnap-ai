// components/ColumnMapperModal.tsx
import { useState } from 'react'
import { Close, Warning } from './icons'

export function ColumnMapperModal({
  columns,
  rows,
  fileName,
  onClose,
  onConfirm,
}: {
  columns: string[]
  rows: Record<string, any>[]
  fileName: string
  onClose: () => void
  onConfirm: (domains: string[]) => void // Passes the REAL list of extracted domains!
}) {
  const [selectedCol, setSelectedCol] = useState(columns[0] || '')

  const handleConfirm = () => {
    if (!selectedCol) return
    // 1. Extract the actual domain strings from that chosen column
    const extractedDomains = rows
      .map((r) => String(r[selectedCol] || '').trim())
      .filter((d) => d.length > 0)

    // 2. Hand them to the scraper!
    onConfirm(extractedDomains)
    onClose()
  }

  // Real preview of the first 3 rows of the selected column
  const previews = rows.slice(0, 3).map((r) => String(r[selectedCol] || '—'))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-hairline bg-elevated shadow-2xl animate-modal-in"
      >
        <div className="flex items-start gap-3 border-b border-hairline p-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-400">
            <Warning width={18} height={18} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Select Website Column</h3>
            <p className="mt-0.5 text-xs text-zinc-500 font-mono">
              {fileName} · {rows.length} rows detected
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-surface hover:text-white"
          >
            <Close width={16} height={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-zinc-400">
            Select which column contains the company websites:
          </p>

          <div className="relative">
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="w-full appearance-none rounded-lg border border-hairline bg-surface px-3 py-2.5 font-mono text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>

          {selectedCol && (
            <div className="rounded-lg border border-hairline bg-surface animate-fade-in">
              <div className="border-b border-hairline px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Preview · First 3 rows of &quot;{selectedCol}&quot;
              </div>
              <ul className="divide-y divide-hairline">
                {previews.map((val, i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-2">
                    <span className="font-mono text-xs text-zinc-600 tnum">{i + 1}</span>
                    <span className="truncate font-mono text-sm text-zinc-300">{val}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-hairline bg-surface/50 p-4">
          <button
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-elevated hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedCol}
            className="rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            Confirm &amp; Ingest Leads
          </button>
        </div>
      </div>
    </div>
  )
}