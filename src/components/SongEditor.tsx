import { useState } from 'react'
import type { Song } from '../lib/types'
import { deleteSong, saveSong } from '../lib/store'
import { Field, GhostButton, IconButton, PrimaryButton } from './ui'
import { Close } from './icons'

export function SongEditor({ song, onClose }: { song: Song; onClose: () => void }) {
  const [draft, setDraft] = useState<Song>(song)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const set = (patch: Partial<Song>) => setDraft((current) => ({ ...current, ...patch }))
  const isNew = !song.title

  return (
    <div className="fixed inset-0 z-60 flex flex-col bg-ink">
      <header className="safe-top flex shrink-0 items-center gap-3 border-b border-line/40 px-3 pb-2.5">
        <IconButton onClick={onClose} label="סגירה">
          <Close className="size-5" />
        </IconButton>
        <h2 className="flex-1 text-center text-base font-medium text-muted">{isNew ? 'שיר חדש' : 'עריכת שיר'}</h2>
        <div className="min-w-10" />
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-5">
        <Field label="שם השיר" value={draft.title} onChange={(title) => set({ title })} placeholder="למשל, ילדות" />
        <Field label="אמן" value={draft.artist} onChange={(artist) => set({ artist })} placeholder="למשל, שלמה ארצי" />

        <div className="grid grid-cols-3 gap-3">
          <Field label="קאפו" value={draft.capo} onChange={(capo) => set({ capo })} placeholder="2" />
          <Field label="סולם" value={draft.song_key} onChange={(song_key) => set({ song_key })} placeholder="Am" />
          <Field label="קצב" value={draft.strumming} onChange={(strumming) => set({ strumming })} placeholder="בלדה" />
        </div>

        <Field
          label="אקורדים ומילים"
          value={draft.chords}
          onChange={(chords) => set({ chords })}
          rows={12}
          placeholder={'Am        F\nהמילים של השורה\n\nC         G\nוהשורה הבאה'}
        />

        <Field
          label="קישור ליוטיוב"
          value={draft.youtube_url}
          onChange={(youtube_url) => set({ youtube_url })}
          placeholder="https://"
          ltr
        />

        <Field
          label="תגיות, מופרדות בפסיק"
          value={draft.tags.join(', ')}
          onChange={(value) =>
            set({ tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })
          }
          placeholder="שקט, מסיבה, קל"
        />

        <Field label="הערות" value={draft.notes} onChange={(notes) => set({ notes })} rows={3} />

        {!isNew && (
          <div className="pt-2">
            {confirmingDelete ? (
              <div className="space-y-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-sm text-cream/85">למחוק את השיר הזה לגמרי?</p>
                <div className="flex gap-2">
                  <GhostButton
                    danger
                    onClick={() => {
                      deleteSong(song.id)
                      onClose()
                    }}
                  >
                    כן, מחק
                  </GhostButton>
                  <GhostButton onClick={() => setConfirmingDelete(false)}>ביטול</GhostButton>
                </div>
              </div>
            ) : (
              <GhostButton danger full onClick={() => setConfirmingDelete(true)}>
                מחיקת השיר
              </GhostButton>
            )}
          </div>
        )}
      </div>

      <footer className="safe-bottom shrink-0 border-t border-line/40 px-4 pt-3">
        <PrimaryButton
          full
          onClick={() => {
            if (!draft.title.trim()) return
            saveSong({ ...draft, title: draft.title.trim(), artist: draft.artist.trim() })
            onClose()
          }}
        >
          שמירה
        </PrimaryButton>
      </footer>
    </div>
  )
}
