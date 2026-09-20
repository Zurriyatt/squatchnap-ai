// components/Ingestion.tsx
import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Bolt, Cloud, Grid } from './icons'
import type { EnrichedLead } from '@/types/lead'

export function Ingestion({
  setLeads,
  onCsvAmbiguous,
}: {
  setLeads: React.Dispatch<React.SetStateAction<EnrichedLead[]>>
  onCsvAmbiguous: (columns: string[], rows: any[], fileName: string) => void
}) {
  const [tab, setTab] = useState<'bulk' | 'csv'>('bulk')
  const [deep, setDeep] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Real hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // The Master Scraping Runner
  const runScrapeBatch = async (domains: string[]) => {
    if (domains.length === 0) return
    setLoading(true)

    for (const singleDomain of domains) {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: singleDomain }),
        })
        const data = await res.json()
        if (data.success && data.lead) {
          setLeads((prev) => [data.lead, ...prev])
        }
      } catch (err) {
        console.error('Failed to scrape:', singleDomain, err)
      }
    }
    setLoading(false)
  }

  // Handle Typed Bulk Text
  const handleTextSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const domains = text.replaceAll(' ', '').replaceAll('\n', ',').split(',').filter(Boolean)
    await runScrapeBatch(domains)
    setText('')
  }

  // Handle REAL CSV File Drop or Selection
  const handleFileProcess = (file: File) => {
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        const rows = results.data as Record<string, any>[]

        // Search for known website column aliases
        const aliases = ['website', 'url', 'domain', 'site', 'link', 'web']
        const matchedCol = headers.find((h) => {
          const clean = h.toLowerCase().replace(/[^a-z]/g, '')
          return aliases.some((a) => clean.includes(a))
        })

        if (matchedCol) {
          // AUTO-DETECTED! Start scraping immediately!
          const domains = rows.map((r) => String(r[matchedCol] || '').trim()).filter(Boolean)
          runScrapeBatch(domains)
        } else {
          // AMBIGUOUS: Open the modal and let the user pick the column!
          onCsvAmbiguous(headers, rows, file.name)
        }
      },
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileProcess(e.target.files[0])
        }}
      />

      {/* Tab Strip */}
      <div className="flex items-center gap-1 border-b border-hairline px-2 pt-2">
        <button
          onClick={() => setTab('bulk')}
          className={`flex items-center gap-2 rounded-t-md px-3.5 py-2.5 text-sm font-medium ${
            tab === 'bulk' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Grid width={15} height={15} />
          Bulk Paste
          {tab === 'bulk' && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-amber-500" />}
        </button>

        <button
          onClick={() => setTab('csv')}
          className={`flex items-center gap-2 rounded-t-md px-3.5 py-2.5 text-sm font-medium ${
            tab === 'csv' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Cloud width={15} height={15} />
          Drag &amp; Drop CSV
          {tab === 'csv' && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-amber-500" />}
        </button>
      </div>

      <div className="p-4">
        {tab === 'bulk' ? (
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter domains: stripe.com, vercel.com, linear.app"
              className="h-32 w-full resize-none rounded-lg border border-hairline bg-elevated p-3 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <span
                  onClick={() => setDeep(!deep)}
                  className={`flex size-4 items-center justify-center rounded border ${
                    deep ? 'border-amber-500 bg-amber-500' : 'border-hairline-strong bg-elevated'
                  }`}
                >
                  {deep && <span className="size-1.5 rounded-full bg-zinc-950" />}
                </span>
                Look deeper <span className="text-xs text-zinc-600">(pricing &amp; about pages)</span>
              </label>

              <button
                onClick={handleTextSubmit}
                disabled={loading || !text.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 disabled:opacity-40"
              >
                <Bolt width={16} height={16} />
                {loading ? 'Checking...' : 'Check These Companies'}
              </button>
            </div>
          </div>
        ) : (
          /* Real Drag & Drop Zone */
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              if (e.dataTransfer.files?.[0]) handleFileProcess(e.dataTransfer.files[0])
            }}
            className={`flex h-[184px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed text-center transition-colors ${
              dragging ? 'border-amber-500 bg-amber-500/5' : 'border-hairline-strong hover:bg-elevated'
            }`}
          >
            <div className="flex size-12 items-center justify-center rounded-full border border-hairline bg-surface text-amber-400">
              <Cloud width={22} height={22} />
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-200">
                {loading ? 'Analyzing CSV targets...' : 'Drop a spreadsheet here, or click to browse'}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Supports any CSV from Google Maps, Apollo, or SaaSQuatch.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}