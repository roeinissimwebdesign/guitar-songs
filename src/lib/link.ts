import { splitLine } from './parse'
import { normalize } from './text'

export type Track = { title: string; artist: string }

const LINK_RE = /https?:\/\/\S+/i
const MUSIC_HOST = /(open\.spotify\.com|spotify\.link|music\.apple\.com|youtu\.be|youtube\.com|shazam\.com|deezer\.com|tidal\.com)/i

/** "(Official Video)", "[HD]", "- Topic" — noise a share link drags along. */
const NOISE =
  /\s*[([][^)\]]*(official|video|audio|lyrics?|hd|4k|remaster\w*|visuali[sz]er|mv|clip|full|live|hq)[^)\]]*[)\]]/gi

export function findLink(text: string): string | null {
  const match = text.match(LINK_RE)
  return match ? match[0].replace(/[.,;]+$/, '') : null
}

export function isMusicLink(text: string): boolean {
  const url = findLink(text)
  return Boolean(url && MUSIC_HOST.test(url))
}

async function json(url: string): Promise<any> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

/** Apple's catalogue is the one open, key-free way to turn a name into a pair. */
async function itunes(term: string): Promise<Track | null> {
  const data = await json(
    `https://itunes.apple.com/search?media=music&entity=song&limit=1&term=${encodeURIComponent(term)}`,
  )
  const hit = data?.results?.[0]
  return hit?.trackName ? { title: hit.trackName, artist: hit.artistName ?? '' } : null
}

async function fromYouTube(url: string): Promise<Track | null> {
  const data = await json(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)
  const raw = String(data?.title ?? '').replace(NOISE, '').trim()
  const author = String(data?.author_name ?? '').replace(/\s*-\s*Topic$/i, '').trim()
  if (!raw) return null
  // YouTube titles read "artist - song", the mirror image of how we store them.
  const [first, second] = splitLine(raw)
  return second ? { title: second, artist: first } : { title: raw, artist: author }
}

async function fromSpotify(url: string): Promise<Track | null> {
  const data = await json(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
  const title = String(data?.title ?? '').trim()
  if (!title) return null
  // Spotify hands back the track name and nothing else, so the artist comes
  // from a lookup — only trusted when the name it answers with is the same one.
  const hit = await itunes(title).catch(() => null)
  return hit && normalize(hit.title) === normalize(title) ? hit : { title, artist: '' }
}

async function fromApple(url: string): Promise<Track | null> {
  const parsed = new URL(url)
  const id = parsed.searchParams.get('i')
  if (id) {
    const data = await json(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}`)
    const hit = data?.results?.[0]
    if (hit?.trackName) return { title: hit.trackName, artist: hit.artistName ?? '' }
  }
  return fromSlug(parsed)
}

/** Last resort: most music URLs carry the name in the path as a dashed slug. */
async function fromSlug(parsed: URL): Promise<Track | null> {
  const slug = parsed.pathname
    .split('/')
    .filter((part) => part && !/^\d+$/.test(part))
    .pop()
  if (!slug) return null
  const term = decodeURIComponent(slug).replace(/-/g, ' ').trim()
  return term ? itunes(term) : null
}

/**
 * A song link copied out of Spotify, YouTube or Apple Music, turned into a
 * title and an artist. Returns null when nothing recognisable comes back —
 * the raw text is then left alone for Roei to type over.
 */
export async function resolveTrack(text: string): Promise<Track | null> {
  const url = findLink(text)
  if (!url) return null
  try {
    if (/youtu\.be|youtube\.com/i.test(url)) return await fromYouTube(url)
    if (/spotify/i.test(url)) return await fromSpotify(url)
    if (/music\.apple\.com/i.test(url)) return await fromApple(url)
    return await fromSlug(new URL(url))
  } catch {
    return null
  }
}
