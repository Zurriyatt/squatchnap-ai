import { Download } from './icons'

export function TopBar({
  exportEnabled,
  scraping = false,
  onExport
}: {
  exportEnabled: boolean
  scraping?: boolean
  onExport?: () => void
}) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-hairline bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-6 px-6">
        {/* Left: brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_16px_-5px_rgba(245,158,11,0.7)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2 4 7v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V7l-8-5Z"
                fill="#09090b"
                fillOpacity="0.25"
              />
              <path
                d="M8.5 12.5 11 15l4.5-5"
                stroke="#09090b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-baseline text-sm font-semibold tracking-tight text-white">
            SquatchNap&nbsp;<span className="text-amber-400">AI</span>
            <span className="ml-2 text-xs font-normal text-zinc-500">| Caprae Deal Intelligence</span>
          </div>
        </div>

        {/* Center: empty when idle — subtle pulse only while scraping */}
        <div className="mx-auto flex items-center">
          {scraping && (
            <div className="flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 animate-fade-in">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
              </span>
              <span className="text-xs font-medium text-amber-300">Scraping targets…</span>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="ml-auto flex items-center gap-2.5">
          <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-surface hover:text-white">
            <Download width={15} height={15} />
            <span className="hidden sm:inline">CSV Template</span>
          </button>
          <button
          onClick={onExport}
            disabled={!exportEnabled}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-amber-950 shadow-[0_0_20px_-6px_rgba(245,158,11,0.7)] transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
          >
            <Download width={15} height={15} />
            Export Clean Dataset
          </button>
        </div>
      </div>
    </header>
  )
}
