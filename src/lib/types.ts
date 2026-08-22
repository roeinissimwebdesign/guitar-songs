export type Song = {
  id: string
  title: string
  artist: string
  chords: string
  capo: string
  song_key: string
  strumming: string
  youtube_url: string
  notes: string
  tags: string[]
  favorite: boolean
  play_count: number
  last_played_at: string | null
  created_at: string
  updated_at: string
}

export type SongSet = {
  id: string
  name: string
  song_ids: string[]
  created_at: string
  updated_at: string
}

export function emptySong(partial: Partial<Song> = {}): Song {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: '',
    artist: '',
    chords: '',
    capo: '',
    song_key: '',
    strumming: '',
    youtube_url: '',
    notes: '',
    tags: [],
    favorite: false,
    play_count: 0,
    last_played_at: null,
    created_at: now,
    updated_at: now,
    ...partial,
  }
}
