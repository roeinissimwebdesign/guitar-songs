import { useEffect, useState } from 'react'
import { init, useStore } from './lib/store'
import { emptySong } from './lib/types'
import type { Song, SongSet } from './lib/types'
import { SurpriseView } from './components/SurpriseView'
import { ListView } from './components/ListView'
import { SetsView } from './components/SetsView'
import { PlayView } from './components/PlayView'
import { SongEditor } from './components/SongEditor'
import { ImportView } from './components/ImportView'
import { SettingsView } from './components/SettingsView'
import { IconButton } from './components/ui'
import { Gear, Layers, ListIcon, Shuffle } from './components/icons'

type Tab = 'surprise' | 'list' | 'sets'

const TABS: { id: Tab; label: string; Icon: (props: { className?: string }) => React.ReactElement }[] = [
  { id: 'surprise', label: 'הפתע', Icon: Shuffle },
  { id: 'list', label: 'השירים', Icon: ListIcon },
  { id: 'sets', label: 'סטים', Icon: Layers },
]

/** When playing a set we remember where we are, so prev/next walk the set. */
type Playing = { songId: string; set?: { id: string; index: number } }

export default function App() {
  const { songs, sets, loaded, syncing, pendingCount, cloudError } = useStore()
  const [tab, setTab] = useState<Tab>('surprise')
  const [playing, setPlaying] = useState<Playing | null>(null)
  const [editing, setEditing] = useState<Song | null>(null)
  const [importing, setImporting] = useState(false)
  const [settings, setSettings] = useState(false)

  useEffect(() => {
    void init()
  }, [])

  const activeSet = playing?.set ? sets.find((set) => set.id === playing.set!.id) : undefined
  const song = playing ? songs.find((item) => item.id === playing.songId) : undefined

  const stepSet = (delta: number) => {
    if (!playing?.set || !activeSet) return
    const next = playing.set.index + delta
    const id = activeSet.song_ids[next]
    if (!id) return
    setPlaying({ songId: id, set: { id: activeSet.id, index: next } })
  }

  const playSet = (set: SongSet, index: number) => {
    const id = set.song_ids[index]
    if (id) setPlaying({ songId: id, set: { id: set.id, index } })
  }

  if (!loaded) return <div className="h-full bg-ink" />

  return (
    <div className="relative mx-auto flex h-full max-w-lg flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-start p-2">
        <div className="safe-top pointer-events-auto ps-2">
          <IconButton onClick={() => setSettings(true)} label="הגדרות">
            <Gear className="size-5" />
          </IconButton>
        </div>
      </div>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {tab === 'surprise' && (
          <SurpriseView
            songs={songs}
            onOpen={(item) => setPlaying({ songId: item.id })}
            onAdd={() => setImporting(true)}
          />
        )}
        {tab === 'list' && (
          <ListView
            songs={songs}
            onOpen={(item) => setPlaying({ songId: item.id })}
            onAdd={() => setImporting(true)}
          />
        )}
        {tab === 'sets' && <SetsView songs={songs} sets={sets} onPlaySet={playSet} />}
      </main>

      <nav className="safe-bottom z-30 flex shrink-0 items-stretch border-t border-line/40 bg-ink/95 backdrop-blur">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition ${
              tab === id ? 'text-ember' : 'text-muted'
            }`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>

      {song && (
        <PlayView
          song={song}
          position={
            activeSet && playing?.set
              ? `${activeSet.name} · ${playing.set.index + 1} מתוך ${activeSet.song_ids.length}`
              : undefined
          }
          onClose={() => setPlaying(null)}
          onEdit={() => setEditing(song)}
          onPrev={activeSet && playing?.set && playing.set.index > 0 ? () => stepSet(-1) : undefined}
          onNext={
            activeSet && playing?.set && playing.set.index < activeSet.song_ids.length - 1
              ? () => stepSet(1)
              : undefined
          }
        />
      )}

      {editing && <SongEditor song={editing} onClose={() => setEditing(null)} />}

      {importing && (
        <ImportView
          songs={songs}
          onClose={() => setImporting(false)}
          onAddOne={() => {
            setImporting(false)
            setEditing(emptySong())
          }}
        />
      )}

      {settings && (
        <SettingsView
          songs={songs}
          sets={sets}
          syncing={syncing}
          pendingCount={pendingCount}
          cloudError={cloudError}
          onClose={() => setSettings(false)}
          onImport={() => {
            setSettings(false)
            setImporting(true)
          }}
        />
      )}
    </div>
  )
}
