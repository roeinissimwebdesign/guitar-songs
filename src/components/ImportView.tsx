import { useMemo, useState } from 'react'
import type { Song } from '../lib/types'
import { emptySong } from '../lib/types'
import { parseRawList } from '../lib/parse'
import { saveSongs } from '../lib/store'
import { Bidi, GhostButton, IconButton, PrimaryButton } from './ui'
import { Close } from './icons'

const SAMPLE = `ילדות - שלמה ארצי
Wonderwall – Oasis
1. עוד יום
• תמיד כשאת בוכה / כוורת`

export function ImportView({
  songs,
  onClose,
  onAddOne,
}: {
  songs: Song[]
  onClose: () => void
  onAddOne: () => void
}) {
  const [raw, setRaw] = useState('')
  const [artistFirst, setArtistFirst] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(true)

  const rows = useMemo(
    () => parseRawList(raw, { artistFirst, existing: songs }),
    [raw, artistFirst, songs],
  )
  const toImport = skipDuplicates ? rows.filter((row) => !row.duplicate) : rows
  const duplicates = rows.length - rows.filter((row) => !row.duplicate).length

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-ink">
      <header className="safe-top flex shrink-0 items-center gap-3 border-b border-line/40 px-3 pb-2.5">
        <IconButton onClick={onClose} label="סגירה">
          <Close className="size-5" />
        </IconButton>
        <h2 className="flex-1 text-center text-base font-medium text-muted">הדבקת רשימה</h2>
        <div className="min-w-10" />
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-3 text-sm leading-relaxed text-muted">
          הדבק כאן את הרשימה כמו שהיא, שורה לכל שיר. אני מוריד מספור ותבליטים, ומפריד שם ואמן לפי מקף, לוכסן או
          סוגריים. מה שלא מזוהה נכנס כשם שיר בלבד ואפשר לתקן אחר כך.
        </p>

        <textarea
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          rows={8}
          dir="auto"
          placeholder={SAMPLE}
          className="w-full resize-y rounded-2xl border border-line/70 bg-ink-2 px-4 py-3 leading-relaxed text-cream placeholder:text-muted/40 outline-none focus:border-ember/60"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <Toggle active={artistFirst} onClick={() => setArtistFirst((v) => !v)}>
            האמן כתוב ראשון
          </Toggle>
          <Toggle active={skipDuplicates} onClick={() => setSkipDuplicates((v) => !v)}>
            לדלג על כפולים
          </Toggle>
        </div>

        {rows.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="text-sm font-bold text-cream/90">תצוגה מקדימה</h3>
              <span className="text-sm text-muted">
                {toImport.length} ייכנסו
                {duplicates > 0 && `, ${duplicates} כבר קיימים`}
              </span>
            </div>

            <ul className="divide-y divide-line/40 overflow-hidden rounded-2xl border border-line/50 bg-ink-2">
              {rows.slice(0, 120).map((row) => (
                <li key={row.key} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Bidi className="block truncate text-cream">{row.title}</Bidi>
                    {row.artist && <Bidi className="block truncate text-sm text-muted">{row.artist}</Bidi>}
                  </div>
                  {row.duplicate && <span className="shrink-0 text-xs text-muted/70">קיים</span>}
                </li>
              ))}
            </ul>
            {rows.length > 120 && (
              <p className="mt-2 px-1 text-sm text-muted">ועוד {rows.length - 120} שורות שלא מוצגות כאן.</p>
            )}
          </div>
        )}

        <div className="mt-6">
          <GhostButton full onClick={onAddOne}>
            או הוספת שיר בודד ידנית
          </GhostButton>
        </div>
      </div>

      <footer className="safe-bottom shrink-0 border-t border-line/40 px-4 pt-3">
        <PrimaryButton
          full
          onClick={() => {
            if (!toImport.length) return
            saveSongs(toImport.map((row) => emptySong({ title: row.title, artist: row.artist })))
            onClose()
          }}
        >
          {toImport.length ? `הוספת ${toImport.length} שירים` : 'הוספה'}
        </PrimaryButton>
      </footer>
    </div>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${
        active ? 'border-ember/60 bg-ember/15 text-ember' : 'border-line/60 bg-ink-2 text-muted'
      }`}
    >
      {children}
    </button>
  )
}
