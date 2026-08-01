import { useMemo, useState } from 'react'
import type { Song } from '../lib/types'
import { initial, matches } from '../lib/text'
import { Bidi, Empty, PrimaryButton, Screen } from './ui'
import { Heart, Plus, Search } from './icons'

type Filter = 'all' | 'favorites' | 'chords'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'favorites', label: 'מועדפים' },
  { id: 'chords', label: 'עם אקורדים' },
]

export function SongRow({ song, onClick, trailing }: { song: Song; onClick: () => void; trailing?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition active:bg-ink-2"
    >
      <div className="min-w-0 flex-1">
        <Bidi className="block truncate text-[1.05rem] font-bold text-cream">{song.title}</Bidi>
        {song.artist && <Bidi className="block truncate text-sm text-muted">{song.artist}</Bidi>}
      </div>
      {trailing ?? (
        <div className="flex shrink-0 items-center gap-2">
          {song.chords.trim() && <span className="text-[0.7rem] text-ember/70">אקורדים</span>}
          {song.favorite && <Heart filled className="size-4 text-ember/80" />}
        </div>
      )}
    </button>
  )
}

export function ListView({
  songs,
  onOpen,
  onAdd,
}: {
  songs: Song[]
  onOpen: (song: Song) => void
  onAdd: () => void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const groups = useMemo(() => {
    const filtered = songs
      .filter((song) => (filter === 'favorites' ? song.favorite : filter === 'chords' ? song.chords.trim() : true))
      .filter((song) => matches(query, song.title, song.artist, song.tags.join(' ')))
      .sort((a, b) => a.title.localeCompare(b.title, 'he'))

    const map = new Map<string, Song[]>()
    filtered.forEach((song) => {
      const letter = initial(song.title)
      map.set(letter, [...(map.get(letter) ?? []), song])
    })
    return [...map.entries()]
  }, [songs, query, filter])

  const total = groups.reduce((sum, [, list]) => sum + list.length, 0)

  return (
    <Screen>
      {/* ps-14 keeps the search field clear of the floating settings button */}
      <div className="safe-top shrink-0 pb-3 pe-4 ps-14">
        <div className="flex items-center gap-2 rounded-full border border-line/70 bg-ink-2 px-4">
          <Search className="size-4 shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="חיפוש שיר או אמן"
            dir="auto"
            className="w-full bg-transparent py-3 text-cream placeholder:text-muted/60 outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="shrink-0 text-sm text-muted">
              נקה
            </button>
          )}
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
                filter === item.id
                  ? 'border-ember/60 bg-ember/15 text-ember'
                  : 'border-line/60 bg-ink-2 text-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ms-auto shrink-0 self-center ps-2 text-sm text-muted/70">{total}</span>
        </div>
      </div>

      {total === 0 ? (
        <Empty
          title={query ? 'לא נמצא שיר כזה' : 'הרשימה ריקה'}
          note={query ? 'נסה חלק מהשם או את שם האמן.' : undefined}
          action={query ? undefined : <PrimaryButton onClick={onAdd}>הוספת שירים</PrimaryButton>}
        />
      ) : (
        <div className="no-scrollbar flex-1 overflow-y-auto px-2 pb-28">
          {groups.map(([letter, list]) => (
            <section key={letter}>
              <h2 className="sticky top-0 z-10 bg-ink/95 px-3 py-1.5 text-sm font-bold text-ember/70 backdrop-blur">
                {letter}
              </h2>
              {list.map((song) => (
                <SongRow key={song.id} song={song} onClick={() => onOpen(song)} />
              ))}
            </section>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        aria-label="הוספת שירים"
        className="absolute bottom-5 start-5 grid size-14 place-items-center rounded-full bg-ember text-ink shadow-lg shadow-black/40 transition active:scale-95"
      >
        <Plus className="size-6" />
      </button>
    </Screen>
  )
}
