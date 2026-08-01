import { useEffect, useMemo, useRef, useState } from 'react'
import type { Song } from '../lib/types'
import { markPlayed, toggleFavorite } from '../lib/store'
import { parseChordSheet, transposeLine } from '../lib/chords'
import { isHebrew } from '../lib/text'
import { Bidi, IconButton } from './ui'
import { Back, Check, Forward, Heart, Minus, Pause, Pencil, Play, Plus, Youtube } from './icons'

const SIZES = [16, 18, 20, 23, 26, 30]

export function PlayView({
  song,
  onClose,
  onEdit,
  onPrev,
  onNext,
  position,
}: {
  song: Song
  onClose: () => void
  onEdit: () => void
  onPrev?: () => void
  onNext?: () => void
  position?: string
}) {
  const [sizeStep, setSizeStep] = useState(() => Number(localStorage.getItem('gs.fontStep') ?? 2))
  const [transpose, setTranspose] = useState(0)
  const [scrolling, setScrolling] = useState(false)
  const [speed, setSpeed] = useState(() => Number(localStorage.getItem('gs.scrollSpeed') ?? 2))
  const [played, setPlayed] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const sheet = useMemo(() => parseChordSheet(song.chords), [song.chords])
  const hasChords = song.chords.trim().length > 0
  const rtlSheet = isHebrew(song.chords)

  useEffect(() => localStorage.setItem('gs.fontStep', String(sizeStep)), [sizeStep])
  useEffect(() => localStorage.setItem('gs.scrollSpeed', String(speed)), [speed])

  // Reset per song, so moving through a set doesn't carry the previous state.
  useEffect(() => {
    setTranspose(0)
    setScrolling(false)
    setPlayed(false)
    bodyRef.current?.scrollTo({ top: 0, left: 0 })
  }, [song.id])

  // A song that stayed open for a minute counts as played.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      markPlayed(song.id)
      setPlayed(true)
    }, 60_000)
    return () => window.clearTimeout(timer)
  }, [song.id])

  useEffect(() => {
    if (!scrolling) return
    let frame = 0
    let carry = 0
    let last = performance.now()

    const step = (now: number) => {
      const element = bodyRef.current
      if (element) {
        carry += ((now - last) / 1000) * speed * 9
        const whole = Math.floor(carry)
        if (whole > 0) {
          carry -= whole
          element.scrollTop += whole
          if (element.scrollTop + element.clientHeight >= element.scrollHeight - 1) setScrolling(false)
        }
      }
      last = now
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [scrolling, speed])

  const fontSize = SIZES[Math.min(Math.max(sizeStep, 0), SIZES.length - 1)]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="safe-top flex shrink-0 items-center gap-2 border-b border-line/40 px-3 pb-2.5">
        <IconButton onClick={onClose} label="חזרה">
          <Back className="size-5" />
        </IconButton>

        <div className="min-w-0 flex-1 text-center">
          <Bidi className="block truncate text-base font-bold text-cream">{song.title}</Bidi>
          <Bidi className="block truncate text-xs text-muted">{position ?? song.artist}</Bidi>
        </div>

        <IconButton onClick={() => toggleFavorite(song.id)} label="מועדף" active={song.favorite}>
          <Heart filled={song.favorite} className="size-5" />
        </IconButton>
        <IconButton onClick={onEdit} label="עריכה">
          <Pencil className="size-5" />
        </IconButton>
      </header>

      {(song.capo || song.song_key || song.strumming || song.youtube_url || transpose !== 0) && (
        <div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto border-b border-line/40 px-4 py-2 text-sm">
          {song.capo && <Chip label="קאפו" value={song.capo} />}
          {song.song_key && <Chip label="סולם" value={song.song_key} />}
          {transpose !== 0 && <Chip label="טרנספוז" value={transpose > 0 ? `+${transpose}` : String(transpose)} />}
          {song.strumming && <Chip label="קצב" value={song.strumming} />}
          {song.youtube_url && (
            <a
              href={song.youtube_url}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-line/70 bg-ink-2 px-3 py-1 text-cream/85"
            >
              <Youtube className="size-4" />
              שמיעה
            </a>
          )}
        </div>
      )}

      {/* overflow-x lets a wide chord line be panned instead of wrapping —
          a wrapped chord line no longer sits above the word it belongs to. */}
      <div
        ref={bodyRef}
        dir={rtlSheet ? 'rtl' : 'ltr'}
        className="no-scrollbar flex-1 overflow-x-auto overflow-y-auto px-5 py-5"
      >
        {hasChords ? (
          <pre
            dir={rtlSheet ? 'rtl' : 'ltr'}
            className="w-max min-w-full whitespace-pre font-sans leading-[1.35]"
            style={{ fontSize: `${fontSize}px` }}
          >
            {sheet.map((line, index) => {
              if (line.kind === 'blank') return <div key={index} className="h-4" />
              if (line.kind === 'section')
                return (
                  <div key={index} className="mt-4 mb-1 text-sm font-bold text-ember/80">
                    {line.text}
                  </div>
                )
              if (line.kind === 'chords')
                return (
                  <ChordRow key={index} text={transposeLine(line.text, transpose)} rtl={rtlSheet} />
                )
              return (
                <div key={index} className="pb-1.5 text-cream/95">
                  {line.text}
                </div>
              )
            })}
          </pre>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Bidi className="text-4xl font-bold text-cream">{song.title}</Bidi>
            {song.artist && <Bidi className="text-base text-muted">{song.artist}</Bidi>}
            <p className="max-w-xs text-sm leading-relaxed text-muted/80">
              לשיר הזה עוד לא שמורים אקורדים. אם תרצה אותם על המסך בזמן נגינה, אפשר להוסיף אותם בעריכה.
            </p>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-line/70 bg-ink-2 px-5 py-2.5 text-sm text-cream/85"
            >
              הוספת אקורדים
            </button>
          </div>
        )}

        {song.notes && (
          <p dir="auto" className="mt-8 border-t border-line/40 pt-4 text-sm leading-relaxed text-muted">
            {song.notes}
          </p>
        )}
      </div>

      <footer className="safe-bottom shrink-0 border-t border-line/40 px-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          {hasChords ? (
            <>
              <Stepper
                label="גודל"
                onMinus={() => setSizeStep((v) => Math.max(0, v - 1))}
                onPlus={() => setSizeStep((v) => Math.min(SIZES.length - 1, v + 1))}
              />
              <button
                type="button"
                onClick={() => setScrolling((v) => !v)}
                aria-label="גלילה אוטומטית"
                className={`grid size-12 place-items-center rounded-full transition active:scale-95 ${
                  scrolling ? 'bg-ember text-ink' : 'border border-line/70 bg-ink-2 text-cream/85'
                }`}
              >
                {scrolling ? <Pause className="size-5" /> : <Play className="size-5" />}
              </button>
              <Stepper
                label="מהירות"
                onMinus={() => setSpeed((v) => Math.max(1, v - 1))}
                onPlus={() => setSpeed((v) => Math.min(9, v + 1))}
              />
              <Stepper
                label="טון"
                onMinus={() => setTranspose((v) => v - 1)}
                onPlus={() => setTranspose((v) => v + 1)}
              />
            </>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 pb-1">
          {onPrev && (
            <IconButton onClick={onPrev} label="הקודם">
              <Back className="size-5" />
            </IconButton>
          )}
          <button
            type="button"
            onClick={() => {
              markPlayed(song.id)
              setPlayed(true)
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition active:scale-[0.98] ${
              played ? 'border border-ember/50 bg-ember/10 text-ember' : 'border border-line/70 bg-ink-2 text-cream/80'
            }`}
          >
            {played ? <Check className="size-4" /> : null}
            {played ? 'סומן שניגנת' : 'ניגנתי את זה'}
          </button>
          {onNext && (
            <IconButton onClick={onNext} label="הבא">
              <Forward className="size-5" />
            </IconButton>
          )}
        </div>
      </footer>
    </div>
  )
}

/**
 * A chord line above Hebrew lyrics has to run right-to-left like the words it
 * sits over — first chord above the first (rightmost) word — while each chord
 * itself stays readable left-to-right. Isolating every token with <bdi> gives
 * exactly that; a plain dir="rtl" would keep the whole run in Latin order.
 */
function ChordRow({ text, rtl }: { text: string; rtl: boolean }) {
  if (!rtl) {
    return <div className="font-mono font-bold text-ember">{text}</div>
  }
  return (
    <div dir="rtl" className="font-mono font-bold text-ember">
      {text.split(/(\s+)/).map((part, index) =>
        part.trim() ? <bdi key={index}>{part}</bdi> : <span key={index}>{part}</span>,
      )}
    </div>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="shrink-0 rounded-full border border-line/70 bg-ink-2 px-3 py-1 text-cream/85">
      <span className="text-muted">{label} </span>
      <span dir="auto">{value}</span>
    </span>
  )
}

function Stepper({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMinus}
          aria-label={`${label} פחות`}
          className="grid size-8 place-items-center rounded-full border border-line/70 bg-ink-2 text-cream/80 active:scale-95"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={onPlus}
          aria-label={`${label} יותר`}
          className="grid size-8 place-items-center rounded-full border border-line/70 bg-ink-2 text-cream/80 active:scale-95"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <span className="text-[0.65rem] text-muted">{label}</span>
    </div>
  )
}
