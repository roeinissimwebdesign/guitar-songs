const CHORD = /^[A-H][#b]?(?:maj|min|m|M|dim|aug|sus|add|°|\+)?\d{0,2}(?:sus\d?|add\d{1,2}|maj\d|b\d|#\d)*(?:\/[A-H][#b]?)?$/

export function isChord(token: string): boolean {
  return CHORD.test(token.replace(/[(),|]/g, ''))
}

/** A line is "chords" when it is short and made almost entirely of chord tokens. */
export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean)
  if (!tokens.length || tokens.length > 14) return false
  const hits = tokens.filter(isChord).length
  return hits === tokens.length || (tokens.length > 2 && hits / tokens.length >= 0.8)
}

export type ChordLine = { kind: 'chords' | 'lyrics' | 'blank' | 'section'; text: string }

/** Section markers people write above a part: [פזמון], (בית 2), "מעבר:" */
const SECTION = /^\s*(?:\[[^\]]{1,30}\]|\([^)]{1,30}\)|[^\s:]{1,20}:)\s*$/

export function parseChordSheet(text: string): ChordLine[] {
  return text.split(/\r?\n/).map((line) => {
    if (!line.trim()) return { kind: 'blank', text: '' }
    if (SECTION.test(line) && !isChordLine(line)) return { kind: 'section', text: line.trim() }
    return { kind: isChordLine(line) ? 'chords' : 'lyrics', text: line }
  })
}

/** Shift every chord in a sheet by N semitones, for the capo / transpose control. */
const SHARP = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']
const FLAT_TO_SHARP: Record<string, string> = {
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
}

function shiftRoot(root: string, steps: number): string {
  const normalized = FLAT_TO_SHARP[root] ?? (root === 'H' ? 'B' : root)
  const index = SHARP.indexOf(normalized)
  if (index < 0) return root
  return SHARP[(index + (steps % 12) + 12) % 12]
}

export function transposeToken(token: string, steps: number): string {
  if (!steps || !isChord(token)) return token
  return token.replace(/([A-H][#b]?)/g, (root) => shiftRoot(root, steps))
}

export function transposeLine(line: string, steps: number): string {
  if (!steps) return line
  return line.replace(/\S+/g, (token) => transposeToken(token, steps))
}
