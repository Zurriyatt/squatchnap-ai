import { EnrichedLead } from '@/types/lead'
import { Clock, Close, Github, Linkedin, Mail, Sparkle, Twitter } from './icons'
import { CopyButton, ScoreRing, StatusBadge, useCopy } from './ui'
import { Check, Copy } from './icons'

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-hairline px-5 py-5">
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </h4>
      {children}
    </div>
  )
}

export function AuditDrawer({ lead, onClose }: { lead: EnrichedLead | null; onClose: () => void }) {
  const { copied, copy } = useCopy()
  if (!lead) return null

  // Safely grab social handles
  const socials = lead.detectedSocials || {}
  const detectedSocials = [
    { key: 'linkedin', href: socials.linkedin, Icon: Linkedin },
    { key: 'twitter', href: socials.twitter, Icon: Twitter },
    { key: 'github', href: socials.github, Icon: Github },
  ].filter((s) => s.href)

  // Safe outreach hook reference
  const hookText = lead.coldOutreachHook || ''
  // Safe score reference
  const scoreValue = typeof lead.score === 'object' ? lead.score.total : lead.score

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-hairline bg-elevated shadow-2xl animate-drawer-in">
        
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-hairline p-5">
          <ScoreRing score={scoreValue} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold tracking-tight text-white">
                {lead.companyName}
              </h3>
            </div>
            <a
              href={`https://${lead.domain}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-zinc-500 hover:text-amber-400"
            >
              {lead.domain}
            </a>
            <div className="mt-2">
              <StatusBadge status={lead.status} code={lead.httpStatusCode || "200"} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-surface hover:text-white"
          >
            <Close width={18} height={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Telemetry & Contact */}
          <Section label="Telemetry & Contact">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm">
                  <Mail width={15} height={15} className="text-zinc-500" />
                  {lead.contactEmail ? (
                    <span className="font-mono text-zinc-200">{lead.contactEmail}</span>
                  ) : (
                    <span className="italic text-zinc-600">No email located</span>
                  )}
                </span>
                {lead.contactEmail && <CopyButton value={lead.contactEmail} />}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {detectedSocials.length ? (
                    detectedSocials.map(({ key, href, Icon }) => (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex size-8 items-center justify-center rounded-md border border-hairline bg-surface text-zinc-400 transition-colors hover:border-hairline-strong hover:text-white"
                      >
                        <Icon width={15} height={15} />
                      </a>
                    ))
                  ) : (
                    <span className="text-xs italic text-zinc-600">No social handles found</span>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock width={13} height={13} />
                  Scraped {lead.scrapedAt}
                  <span className="text-zinc-700">·</span>
                  <span className="font-mono">Cache 24h</span>
                </span>
              </div>
            </div>
          </Section>

          {/* Audit Trail · signals[] */}
          <Section label="The Audit Trail · signals[]">
            <ul className="space-y-2">
              {lead.signals && lead.signals.length > 0 ? (
                lead.signals.map((s, i) => {
                  // Uses s.weight (with fallback if named delta)
                  const weightVal = s.weight !== undefined ? s.weight : (s as any).delta || 0
                  const pos = weightVal >= 0
                  return (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-surface px-3 py-2.5"
                    >
                      <span
                        className={`mt-px shrink-0 rounded font-mono text-xs font-semibold tnum ${
                          pos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {pos ? '+' : ''}
                        {weightVal}
                      </span>
                      <span className="text-sm leading-snug text-zinc-300">{s.label}</span>
                    </li>
                  )
                })
              ) : (
                <li className="text-xs italic text-zinc-600">No audit signals recorded</li>
              )}
            </ul>
          </Section>

          {/* Outreach Synthesis */}
          <Section label="Outreach Synthesis">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-400">
                <Sparkle width={13} height={13} />
                AI-generated cold hook
              </div>
              <p className="text-sm leading-relaxed text-zinc-200">{hookText}</p>
            </div>
          </Section>
        </div>

        {/* Sticky CTA */}
        <div className="border-t border-hairline bg-surface/60 p-4">
          <button
            onClick={() => copy(hookText)}
            disabled={!hookText}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-semibold text-amber-950 shadow-[0_0_24px_-8px_rgba(245,158,11,0.8)] transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            {copied ? <Check width={16} height={16} /> : <Copy width={16} height={16} />}
            {copied ? 'Copied to Clipboard' : 'Copy Icebreaker to Clipboard'}
          </button>
        </div>

      </aside>
    </div>
  )
}