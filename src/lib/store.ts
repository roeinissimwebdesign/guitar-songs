import { useSyncExternalStore } from 'react'
import { supabase, cloudEnabled } from './supabase'
import type { Song, SongSet } from './types'

/**
 * Local-first store. The screen always renders from localStorage so the app
 * opens instantly and works with no signal; Supabase is a background mirror.
 * Anything written while offline is kept in a dirty set and flushed later.
 */

const K = {
  songs: 'gs.songs',
  sets: 'gs.sets',
  dirtySongs: 'gs.dirty.songs',
  dirtySets: 'gs.dirty.sets',
  goneSongs: 'gs.gone.songs',
  goneSets: 'gs.gone.sets',
}

type State = {
  songs: Song[]
  sets: SongSet[]
  loaded: boolean
  syncing: boolean
  pendingCount: number
  cloudError: string | null
}

let state: State = {
  songs: [],
  sets: [],
  loaded: false,
  syncing: false,
  pendingCount: 0,
  cloudError: null,
}

const listeners = new Set<() => void>()

function emit(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((fn) => fn())
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    emit({ cloudError: 'הזיכרון המקומי מלא. כדאי לייצא גיבוי מההגדרות.' })
  }
}

const ids = (key: string) => new Set(read<string[]>(key, []))
const saveIds = (key: string, set: Set<string>) => write(key, [...set])

function refreshPending() {
  emit({ pendingCount: ids(K.dirtySongs).size + ids(K.dirtySets).size + ids(K.goneSongs).size + ids(K.goneSets).size })
}

function markDirty(key: string, id: string) {
  const set = ids(key)
  set.add(id)
  saveIds(key, set)
  refreshPending()
}

function persistSongs(songs: Song[]) {
  write(K.songs, songs)
  emit({ songs })
}

function persistSets(sets: SongSet[]) {
  write(K.sets, sets)
  emit({ sets })
}

// ---------- lifecycle ----------

export async function init() {
  emit({
    songs: read<Song[]>(K.songs, []),
    sets: read<SongSet[]>(K.sets, []),
    loaded: true,
  })
  refreshPending()
  await sync()
  window.addEventListener('online', () => void sync())
}

export async function sync() {
  if (!cloudEnabled || !supabase || !navigator.onLine) return
  emit({ syncing: true })
  try {
    await push()
    await pull()
    emit({ cloudError: null })
  } catch (err) {
    emit({ cloudError: err instanceof Error ? err.message : 'הסנכרון לענן נכשל' })
  } finally {
    emit({ syncing: false })
  }
}

async function push() {
  if (!supabase) return

  const goneSongs = ids(K.goneSongs)
  if (goneSongs.size) {
    const { error } = await supabase.from('guitar_songs').delete().in('id', [...goneSongs])
    if (error) throw error
    saveIds(K.goneSongs, new Set())
  }

  const goneSets = ids(K.goneSets)
  if (goneSets.size) {
    const { error } = await supabase.from('guitar_sets').delete().in('id', [...goneSets])
    if (error) throw error
    saveIds(K.goneSets, new Set())
  }

  const dirtySongs = ids(K.dirtySongs)
  if (dirtySongs.size) {
    const rows = state.songs.filter((s) => dirtySongs.has(s.id))
    if (rows.length) {
      // Supabase rejects payloads over ~1MB, so push in slices.
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase.from('guitar_songs').upsert(rows.slice(i, i + 200))
        if (error) throw error
      }
    }
    saveIds(K.dirtySongs, new Set())
  }

  const dirtySets = ids(K.dirtySets)
  if (dirtySets.size) {
    const rows = state.sets.filter((s) => dirtySets.has(s.id))
    if (rows.length) {
      const { error } = await supabase.from('guitar_sets').upsert(rows)
      if (error) throw error
    }
    saveIds(K.dirtySets, new Set())
  }

  refreshPending()
}

async function pull() {
  if (!supabase) return

  const { data: songs, error: songErr } = await supabase.from('guitar_songs').select('*')
  if (songErr) throw songErr
  const { data: sets, error: setErr } = await supabase.from('guitar_sets').select('*')
  if (setErr) throw setErr

  // Nothing is dirty at this point (push ran first), so the cloud is the truth.
  persistSongs(((songs ?? []) as Song[]).map((s) => ({ ...s, tags: s.tags ?? [] })))
  persistSets((sets ?? []) as SongSet[])
}

// ---------- songs ----------

export function saveSong(song: Song) {
  const next = { ...song, updated_at: new Date().toISOString() }
  const existing = state.songs.some((s) => s.id === next.id)
  persistSongs(existing ? state.songs.map((s) => (s.id === next.id ? next : s)) : [...state.songs, next])
  markDirty(K.dirtySongs, next.id)
  void sync()
}

export function saveSongs(songs: Song[]) {
  const byId = new Map(state.songs.map((s) => [s.id, s]))
  songs.forEach((s) => byId.set(s.id, s))
  persistSongs([...byId.values()])
  const dirty = ids(K.dirtySongs)
  songs.forEach((s) => dirty.add(s.id))
  saveIds(K.dirtySongs, dirty)
  refreshPending()
  void sync()
}

export function deleteSong(id: string) {
  persistSongs(state.songs.filter((s) => s.id !== id))
  persistSets(
    state.sets.map((set) =>
      set.song_ids.includes(id) ? { ...set, song_ids: set.song_ids.filter((x) => x !== id) } : set,
    ),
  )
  state.sets.forEach((set) => {
    if (set.song_ids.includes(id)) markDirty(K.dirtySets, set.id)
  })
  const dirty = ids(K.dirtySongs)
  dirty.delete(id)
  saveIds(K.dirtySongs, dirty)
  markDirty(K.goneSongs, id)
  void sync()
}

export function toggleFavorite(id: string) {
  const song = state.songs.find((s) => s.id === id)
  if (song) saveSong({ ...song, favorite: !song.favorite })
}

export function markPlayed(id: string) {
  const song = state.songs.find((s) => s.id === id)
  if (!song) return
  saveSong({ ...song, play_count: (song.play_count ?? 0) + 1, last_played_at: new Date().toISOString() })
}

// ---------- sets ----------

export function saveSet(set: SongSet) {
  const next = { ...set, updated_at: new Date().toISOString() }
  const existing = state.sets.some((s) => s.id === next.id)
  persistSets(existing ? state.sets.map((s) => (s.id === next.id ? next : s)) : [...state.sets, next])
  markDirty(K.dirtySets, next.id)
  void sync()
}

export function deleteSet(id: string) {
  persistSets(state.sets.filter((s) => s.id !== id))
  const dirty = ids(K.dirtySets)
  dirty.delete(id)
  saveIds(K.dirtySets, dirty)
  markDirty(K.goneSets, id)
  void sync()
}

// ---------- backup ----------

export function exportBackup() {
  const payload = { exported_at: new Date().toISOString(), songs: state.songs, sets: state.sets }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `songs-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

// ---------- react binding ----------

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useStore(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
}
