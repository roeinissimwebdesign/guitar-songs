import { useMemo, useState } from 'react'
import type { Song, SongSet } from '../lib/types'
import { deleteSet, saveSet } from '../lib/store'
import { matches } from '../lib/text'
import { Bidi, Empty, GhostButton, IconButton, PrimaryButton, Screen } from './ui'
import { Back, Check, Close, Forward, Play, Plus, Search, Trash } from './icons'

function newSet(name: string): SongSet {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), name, song_ids: [], created_at: now, updated_at: now }
}

export function SetsView({
  songs,
  sets,
  onPlaySet,
}: {
  songs: Song[]
  sets: SongSet[]
  onPlaySet: (set: SongSet, index: number) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const open = openId ? sets.find((set) => set.id === openId) : null

  if (open) {
    return (
      <SetDetail
        set={open}
        songs={songs}
        onClose={() => setOpenId(null)}
        onPlay={(index) => onPlaySet(open, index)}
      />
    )
  }

  return (
    <Screen>
      <div className="safe-top flex shrink-0 items-center justify-between pb-3 pe-5 ps-14">
        <h1 className="text-lg font-bold text-cream">סטים</h1>
        <IconButton onClick={() => setCreating(true)} label="סט חדש">
          <Plus className="size-5" />
        </IconButton>
      </div>

      {creating && (
        <div className="mx-4 mb-4 space-y-3 rounded-2xl border border-line/60 bg-ink-2 p-4">
          <input
            autoFocus
            value={name}
            dir="auto"
            onChange={(event) => setName(event.target.value)}
            placeholder="שם הסט, למשל ערב שקט"
            className="w-full rounded-xl border border-line/70 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-ember/60"
          />
          <div className="flex gap-2">
            <PrimaryButton
              onClick={() => {
                if (!name.trim()) return
                const created = newSet(name.trim())
                saveSet(created)
                setName('')
                setCreating(false)
                setOpenId(created.id)
              }}
            >
              יצירה
            </PrimaryButton>
            <GhostButton
              onClick={() => {
                setName('')
                setCreating(false)
              }}
            >
              ביטול
            </GhostButton>
          </div>
        </div>
      )}

      {sets.length === 0 && !creating ? (
        <Empty
          title="עוד אין סטים"
          note="סט הוא רשימת שירים לסדר מסוים, למשל ערב שקט או שירים לחברים, כדי שלא תצטרך להיזכר תוך כדי."
          action={<PrimaryButton onClick={() => setCreating(true)}>סט חדש</PrimaryButton>}
        />
      ) : (
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28">
          {sets.map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => setOpenId(set.id)}
              className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-line/50 bg-ink-2 px-4 py-3.5 text-right transition active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <Bidi className="block truncate font-bold text-cream">{set.name}</Bidi>
                <span className="text-sm text-muted">{set.song_ids.length} שירים</span>
              </div>
              <Forward className="size-5 shrink-0 text-muted" />
            </button>
          ))}
        </div>
      )}
    </Screen>
  )
}

function SetDetail({
  set,
  songs,
  onClose,
  onPlay,
}: {
  set: SongSet
  songs: Song[]
  onClose: () => void
  onPlay: (index: number) => void
}) {
  const [picking, setPicking] = useState(false)
  const [query, setQuery] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const byId = useMemo(() => new Map(songs.map((song) => [song.id, song])), [songs])
  const items = set.song_ids.map((id) => byId.get(id)).filter((song): song is Song => Boolean(song))

  const update = (song_ids: string[]) => saveSet({ ...set, song_ids })

  const move = (index: number, delta: number) => {
    const next = [...set.song_ids]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    update(next)
  }

  if (picking) {
    const candidates = songs
      .filter((song) => matches(query, song.title, song.artist))
      .sort((a, b) => a.title.localeCompare(b.title, 'he'))

    return (
      <Screen>
        <div className="safe-top flex shrink-0 items-center gap-3 pb-3 pe-3 ps-14">
          <IconButton onClick={() => setPicking(false)} label="סיום">
            <Close className="size-5" />
          </IconButton>
          <div className="flex flex-1 items-center gap-2 rounded-full border border-line/70 bg-ink-2 px-4">
            <Search className="size-4 shrink-0 text-muted" />
            <input
              autoFocus
              value={query}
              dir="auto"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="חיפוש שיר להוספה"
              className="w-full bg-transparent py-2.5 text-cream placeholder:text-muted/60 outline-none"
            />
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-2 pb-6">
          {candidates.map((song) => {
            const inSet = set.song_ids.includes(song.id)
            return (
              <button
                key={song.id}
                type="button"
                onClick={() =>
                  update(inSet ? set.song_ids.filter((id) => id !== song.id) : [...set.song_ids, song.id])
                }
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition active:bg-ink-2"
              >
                <div className="min-w-0 flex-1">
                  <Bidi className="block truncate text-cream">{song.title}</Bidi>
                  {song.artist && <Bidi className="block truncate text-sm text-muted">{song.artist}</Bidi>}
                </div>
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full border ${
                    inSet ? 'border-ember bg-ember text-ink' : 'border-line/70 text-transparent'
                  }`}
                >
                  <Check className="size-4" />
                </span>
              </button>
            )
          })}
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="safe-top flex shrink-0 items-center gap-2 pb-3 pe-3 ps-14">
        <IconButton onClick={onClose} label="חזרה">
          <Back className="size-5" />
        </IconButton>
        <div className="min-w-0 flex-1">
          <Bidi className="block truncate text-lg font-bold text-cream">{set.name}</Bidi>
          <span className="text-sm text-muted">{items.length} שירים</span>
        </div>
        <IconButton onClick={() => setPicking(true)} label="הוספת שירים">
          <Plus className="size-5" />
        </IconButton>
      </div>

      {items.length === 0 ? (
        <Empty
          title="הסט ריק"
          note="הוסף אליו שירים מהרשימה שלך."
          action={<PrimaryButton onClick={() => setPicking(true)}>הוספת שירים</PrimaryButton>}
        />
      ) : (
        <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-28">
          {items.map((song, index) => (
            <div key={song.id} className="mb-1.5 flex items-center gap-2 rounded-2xl bg-ink-2/70 px-3 py-2.5">
              <span className="w-5 shrink-0 text-center text-sm text-muted">{index + 1}</span>
              <button type="button" onClick={() => onPlay(index)} className="min-w-0 flex-1 text-right">
                <Bidi className="block truncate font-medium text-cream">{song.title}</Bidi>
                {song.artist && <Bidi className="block truncate text-sm text-muted">{song.artist}</Bidi>}
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <SmallButton onClick={() => move(index, -1)} label="למעלה">
                  ↑
                </SmallButton>
                <SmallButton onClick={() => move(index, 1)} label="למטה">
                  ↓
                </SmallButton>
                <SmallButton
                  onClick={() => update(set.song_ids.filter((id) => id !== song.id))}
                  label="הסרה מהסט"
                >
                  ×
                </SmallButton>
              </div>
            </div>
          ))}

          <div className="mt-5">
            {confirmingDelete ? (
              <div className="space-y-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-sm text-cream/85">למחוק את הסט? השירים עצמם יישארו ברשימה.</p>
                <div className="flex gap-2">
                  <GhostButton
                    danger
                    onClick={() => {
                      deleteSet(set.id)
                      onClose()
                    }}
                  >
                    כן, מחק
                  </GhostButton>
                  <GhostButton onClick={() => setConfirmingDelete(false)}>ביטול</GhostButton>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-2 px-2 text-sm text-muted"
              >
                <Trash className="size-4" />
                מחיקת הסט
              </button>
            )}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="absolute inset-x-0 bottom-5 flex justify-center px-6">
          <button
            type="button"
            onClick={() => onPlay(0)}
            className="flex items-center gap-2 rounded-full bg-ember px-7 py-3.5 font-bold text-ink shadow-lg shadow-black/40 active:scale-[0.97]"
          >
            <Play className="size-4" />
            לנגן את הסט
          </button>
        </div>
      )}
    </Screen>
  )
}

function SmallButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-8 place-items-center rounded-full border border-line/60 text-muted active:scale-95"
    >
      {children}
    </button>
  )
}
