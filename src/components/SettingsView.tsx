import { useRef, useState } from 'react'
import type { Song, SongSet } from '../lib/types'
import { emptySong } from '../lib/types'
import { exportBackup, saveSet, saveSongs, sync } from '../lib/store'
import { cloudEnabled } from '../lib/supabase'
import { GhostButton, IconButton } from './ui'
import { Close, Cloud, Download, Paste } from './icons'

export function SettingsView({
  songs,
  sets,
  syncing,
  pendingCount,
  cloudError,
  onClose,
  onImport,
}: {
  songs: Song[]
  sets: SongSet[]
  syncing: boolean
  pendingCount: number
  cloudError: string | null
  onClose: () => void
  onImport: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [restored, setRestored] = useState<string | null>(null)

  const withChords = songs.filter((song) => song.chords.trim()).length

  const restore = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { songs?: Song[]; sets?: SongSet[] }
      const incoming = (parsed.songs ?? []).map((song) => emptySong(song))
      if (incoming.length) saveSongs(incoming)
      ;(parsed.sets ?? []).forEach((set) => saveSet(set))
      setRestored(`שוחזרו ${incoming.length} שירים`)
    } catch {
      setRestored('הקובץ לא נקרא. ודא שזה קובץ גיבוי שיצא מכאן.')
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-ink">
      <header className="safe-top flex shrink-0 items-center gap-3 border-b border-line/40 px-3 pb-2.5">
        <IconButton onClick={onClose} label="סגירה">
          <Close className="size-5" />
        </IconButton>
        <h2 className="flex-1 text-center text-base font-medium text-muted">הגדרות</h2>
        <div className="min-w-10" />
      </header>

      <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-6">
        <section className="grid grid-cols-3 gap-3">
          <Stat value={songs.length} label="שירים" />
          <Stat value={withChords} label="עם אקורדים" />
          <Stat value={sets.length} label="סטים" />
        </section>

        <section className="rounded-2xl border border-line/50 bg-ink-2 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Cloud className="size-5 text-ember/80" />
            <h3 className="font-bold text-cream">גיבוי בענן</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            {!cloudEnabled
              ? 'הענן לא מוגדר, השירים נשמרים רק במכשיר הזה.'
              : cloudError
                ? cloudError
                : syncing
                  ? 'מסנכרן עכשיו'
                  : pendingCount > 0
                    ? `${pendingCount} שינויים מחכים לחיבור לרשת`
                    : 'הכל מסונכרן'}
          </p>
          {cloudEnabled && (
            <div className="mt-3">
              <GhostButton onClick={() => void sync()}>סנכרון עכשיו</GhostButton>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={onImport}
            className="flex w-full items-center gap-3 rounded-2xl border border-line/50 bg-ink-2 px-4 py-3.5 text-right active:scale-[0.99]"
          >
            <Paste className="size-5 shrink-0 text-ember/80" />
            <span className="flex-1">
              <span className="block font-medium text-cream">הדבקת רשימת שירים</span>
              <span className="block text-sm text-muted">מדביקים רשימה גולמית, היא נפרדת לשירים</span>
            </span>
          </button>

          <button
            type="button"
            onClick={exportBackup}
            className="flex w-full items-center gap-3 rounded-2xl border border-line/50 bg-ink-2 px-4 py-3.5 text-right active:scale-[0.99]"
          >
            <Download className="size-5 shrink-0 text-ember/80" />
            <span className="flex-1">
              <span className="block font-medium text-cream">ייצוא קובץ גיבוי</span>
              <span className="block text-sm text-muted">שומר את הכל לקובץ אחד אצלך</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-2xl border border-line/50 bg-ink-2 px-4 py-3.5 text-right active:scale-[0.99]"
          >
            <Download className="size-5 shrink-0 rotate-180 text-ember/80" />
            <span className="flex-1">
              <span className="block font-medium text-cream">שחזור מקובץ גיבוי</span>
              <span className="block text-sm text-muted">{restored ?? 'מוסיף בחזרה את מה שבקובץ'}</span>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void restore(file)
              event.target.value = ''
            }}
          />
        </section>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line/50 bg-ink-2 px-3 py-4 text-center">
      <div className="text-2xl font-bold text-cream">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}
