import { useCallback, useEffect, useRef, useState } from 'react'
import type { Song } from '../lib/types'
import { toggleFavorite } from '../lib/store'
import { Bidi, Empty, PrimaryButton, Screen } from './ui'
import { Heart, Play, Shuffle } from './icons'

/**
 * Weighted pick: songs he hasn't touched in a while surface first, which is
 * the whole point — the ones he forgets are the ones he never plays.
 */
function weightOf(song: Song): number {
  if (!song.last_played_at) return 4
  const days = (Date.now() - new Date(song.last_played_at).getTime()) / 86_400_000
  return 1 + Math.min(days, 90) / 30
}

function pick(songs: Song[], avoid: string[]): Song | null {
  const pool = songs.filter((s) => !avoid.includes(s.id))
  const from = pool.length ? pool : songs
  if (!from.length) return null
  const total = from.reduce((sum, s) => sum + weightOf(s), 0)
  let roll = Math.random() * total
  for (const song of from) {
    roll -= weightOf(song)
    if (roll <= 0) return song
  }
  return from[from.length - 1]
}

function agoLabel(iso: string | null): string {
  if (!iso) return 'עוד לא ניגנת אותו מכאן'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'ניגנת אותו היום'
  if (days === 1) return 'ניגנת אותו אתמול'
  if (days < 30) return `ניגנת אותו לפני ${days} ימים`
  const months = Math.round(days / 30)
  return months === 1 ? 'ניגנת אותו לפני חודש' : `ניגנת אותו לפני ${months} חודשים`
}

export function SurpriseView({
  songs,
  onOpen,
  onAdd,
}: {
  songs: Song[]
  onOpen: (song: Song) => void
  onAdd: () => void
}) {
  const [current, setCurrent] = useState<Song | null>(null)
  const history = useRef<string[]>([])

  const roll = useCallback(() => {
    const next = pick(songs, history.current.slice(-12))
    if (!next) return
    history.current = [...history.current, next.id].slice(-40)
    setCurrent(next)
  }, [songs])

  useEffect(() => {
    if (!current && songs.length) roll()
  }, [songs, current, roll])

  // The stored copy can change under us (favorite, play count) — always render fresh.
  const song = current ? (songs.find((s) => s.id === current.id) ?? current) : null

  if (!songs.length) {
    return (
      <Screen>
        <Empty
          title="עוד אין פה שירים"
          note="הדבק את הרשימה שלך ואני אסדר אותה לשירים נפרדים, או הוסף שיר אחד ידנית."
          action={<PrimaryButton onClick={onAdd}>הוספת שירים</PrimaryButton>}
        />
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
        {song && (
          <div key={song.id} className="animate-rise flex w-full flex-col items-center">
            {song.artist && (
              <Bidi className="mb-3 text-sm font-medium tracking-wide text-ember/90">{song.artist}</Bidi>
            )}
            <Bidi className="text-[2.6rem] leading-[1.08] font-bold text-cream">{song.title}</Bidi>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>{agoLabel(song.last_played_at)}</span>
              {song.capo && <span className="text-muted/60">קאפו {song.capo}</span>}
              {song.song_key && <span className="text-muted/60">סולם {song.song_key}</span>}
            </div>

            <div className="mt-9 flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleFavorite(song.id)}
                aria-label="מועדף"
                className={`grid size-12 place-items-center rounded-full border transition active:scale-95 ${
                  song.favorite
                    ? 'border-ember/60 bg-ember/15 text-ember'
                    : 'border-line/70 bg-ink-2 text-cream/70'
                }`}
              >
                <Heart filled={song.favorite} className="size-5" />
              </button>

              <button
                type="button"
                onClick={() => onOpen(song)}
                className="flex items-center gap-2 rounded-full border border-line/70 bg-ink-2 px-6 py-3.5 font-medium text-cream/90 transition active:scale-[0.97]"
              >
                <Play className="size-4" />
                {song.chords.trim() ? 'לנגן' : 'לפתוח'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-7 pb-4">
        <button
          type="button"
          onClick={roll}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-ember py-4 text-lg font-bold text-ink transition active:scale-[0.98]"
        >
          <Shuffle className="size-5" />
          הפתע אותי
        </button>
      </div>
    </Screen>
  )
}
