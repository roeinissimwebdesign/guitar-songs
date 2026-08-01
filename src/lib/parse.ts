import { normalize } from './text'

export type ParsedRow = {
  key: string
  title: string
  artist: string
  duplicate: boolean
}

const BULLET = /^\s*(?:[-–—*•‣·]|\d{1,3}[.)\]]|\(\d{1,3}\))\s+/
const SPLITTERS = ['\t', ' — ', ' – ', ' - ', ' | ', ' / ', ' ~ ']
const TRAILING_PARENS = /^(.*?)[\s]*[(（]([^()]{2,40})[)）]\s*$/

function splitLine(line: string): [string, string] {
  for (const sep of SPLITTERS) {
    const at = line.indexOf(sep)
    if (at > 0) return [line.slice(0, at).trim(), line.slice(at + sep.length).trim()]
  }
  const parens = line.match(TRAILING_PARENS)
  if (parens) return [parens[1].trim(), parens[2].trim()]
  return [line.trim(), '']
}

/**
 * Turns a pasted list into rows. Roei's lists are handwritten, so the shape
 * varies line to line: bullets, numbers, "song - artist", or a bare title.
 */
export function parseRawList(
  raw: string,
  options: { artistFirst?: boolean; existing?: { title: string; artist: string }[] } = {},
): ParsedRow[] {
  const seen = new Set(
    (options.existing ?? []).map((s) => normalize(`${s.title} ${s.artist}`)),
  )
  const rows: ParsedRow[] = []

  raw
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET, '').trim())
    .filter((line) => line.length > 0)
    .forEach((line, index) => {
      let [a, b] = splitLine(line)
      if (options.artistFirst && b) [a, b] = [b, a]
      if (!a) return

      const fingerprint = normalize(`${a} ${b}`)
      if (rows.some((r) => normalize(`${r.title} ${r.artist}`) === fingerprint)) return

      rows.push({
        key: `${index}-${fingerprint}`,
        title: a,
        artist: b,
        duplicate: seen.has(fingerprint) || seen.has(normalize(a)),
      })
    })

  return rows
}
