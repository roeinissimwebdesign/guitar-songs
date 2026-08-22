import { useEffect, useRef, useState } from 'react'
import type { Song } from '../lib/types'
import { emptySong } from '../lib/types'
import { deleteSong, saveSong } from '../lib/store'
import { splitLine } from '../lib/parse'
import { isMusicLink, resolveTrack } from '../lib/link'
import { normalize } from '../lib/text'
import { Bidi } from './ui'
import { Check, Close, Paste, Plus, Trash } from './icons'

function isDuplicate(songs: Song[], title: string, artist: string): boolean {
  if (!title) return false
  const key = normalize(`${title} ${artist}`)
  return songs.some(
    (s) => normalize(`${s.title} ${s.artist}`) === key || (!artist && normalize(s.title) === normalize(title)),
  )
}

/**
 * Reachable from every screen, for the moment Roei just remembers a song and
 * wants it captured in a second — no navigating into a full editor. Stays
 * open after each add so several songs can be typed back to back.
 *
 * The sheet itself must be rendered at the App root, as a sibling of the other
 * full-screen views, not nested under this button. This button lives inside an
 * absolutely-positioned, z-30 header overlay; that overlay and <nav> share the
 * same z-index, and <nav> sits later in the DOM, so it would paint on top of
 * anything stacked inside the overlay — including a modal with a much higher
 * z-index of its own, since nested stacking contexts only out-rank their own
 * siblings, not their ancestor's siblings.
 */
export function QuickAddButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="הוספה מהירה"
      className="grid size-10 place-items-center rounded-full bg-ember text-ink shadow-lg shadow-black/30 transition active:scale-95"
    >
      <Plus className="size-5" />
    </button>
  )
}

export function QuickAddSheet({
  songs,
  initial = '',
  onClose,
}: {
  songs: Song[]
  initial?: string
  onClose: () => void
}) {
  const [value, setValue] = useState(initial)
  const [sessionIds, setSessionIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // A link arriving from the share sheet is already the whole job; opening
    // the keyboard on top of it just gets in the way.
    if (!initial) inputRef.current?.focus()
  }, [initial])

  /**
   * The moment a music link lands in the field — pasted, shared or typed — it
   * is swapped for the song's real name, so everything downstream (duplicate
   * check, save) keeps working on plain text and Roei can still edit it.
   */
  useEffect(() => {
    if (!isMusicLink(value)) return
    let alive = true
    setBusy(true)
    setNote('')
    void resolveTrack(value).then((track) => {
      if (!alive) return
      setBusy(false)
      if (track) setValue(track.artist ? `${track.title} - ${track.artist}` : track.title)
      else setNote('לא הצלחתי לזהות את השיר מהקישור, אפשר לכתוב את השם')
    })
    return () => {
      alive = false
    }
  }, [value])

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) setValue(text.trim())
      else setNote('הלוח ריק')
    } catch {
      setNote('לא הצלחתי לקרוא מהלוח, אפשר להדביק בשדה')
      inputRef.current?.focus()
    }
  }

  const [title, artist] = splitLine(value)
  const duplicate = isDuplicate(songs, title, artist)

  const submit = () => {
    if (!title) return
    const song = emptySong({ title, artist })
    saveSong(song)
    setSessionIds((ids) => [song.id, ...ids])
    setValue('')
    setNote('')
    inputRef.current?.focus()
  }

  const undo = (id: string) => {
    deleteSong(id)
    setSessionIds((ids) => ids.filter((sid) => sid !== id))
  }

  const added = sessionIds
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s))

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <button
        type="button"
        aria-label="סגירה"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="animate-rise safe-bottom relative rounded-t-3xl border-t border-line/60 bg-ink-2 px-5 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-cream">הוספה מהירה</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="סיום"
            className="grid size-8 place-items-center rounded-full text-muted active:scale-95"
          >
            <Close className="size-5" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="שם שיר, או הדבקת קישור"
            dir="auto"
            enterKeyHint="done"
            className="w-full rounded-full border border-line/70 bg-ink px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-ember/60"
          />
          {!value && (
            <button
              type="button"
              onClick={pasteFromClipboard}
              aria-label="הדבקת קישור מהלוח"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line/70 text-muted transition active:scale-95"
            >
              <Paste className="size-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={!title || busy}
            aria-label="הוספה"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-ember text-ink transition disabled:opacity-40 active:scale-95"
          >
            <Plus className="size-5" />
          </button>
        </form>

        <div className="min-h-5 px-1 pt-1.5 text-sm text-muted">
          {busy
            ? 'מזהה את השיר מהקישור…'
            : note ||
              (duplicate ? 'כבר יש שיר כזה ברשימה — יתווסף בכל זאת אם תשמור' : '')}
        </div>

        <div className="no-scrollbar max-h-[40vh] overflow-y-auto pb-4">
          {added.map((song) => (
            <div key={song.id} className="flex items-center gap-3 rounded-2xl px-2 py-2">
              <Check className="size-4 shrink-0 text-ember" />
              <div className="min-w-0 flex-1">
                <Bidi className="block truncate font-medium text-cream">{song.title}</Bidi>
                {song.artist && <Bidi className="block truncate text-sm text-muted">{song.artist}</Bidi>}
              </div>
              <button
                type="button"
                onClick={() => undo(song.id)}
                aria-label="ביטול הוספה"
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted/70 active:scale-95"
              >
                <Trash className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
