import type { ReactNode } from 'react'

export function Screen({ children }: { children: ReactNode }) {
  return <div className="animate-rise flex h-full flex-col">{children}</div>
}

export function TopBar({ title, left, right }: { title?: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <header className="safe-top flex shrink-0 items-center gap-3 px-4 pb-3">
      <div className="flex min-w-10 justify-start">{right}</div>
      <h1 className="flex-1 text-center text-base font-medium tracking-wide text-muted">{title}</h1>
      <div className="flex min-w-10 justify-end">{left}</div>
    </header>
  )
}

export function IconButton({
  onClick,
  label,
  children,
  active,
}: {
  onClick: () => void
  label: string
  children: ReactNode
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid size-10 place-items-center rounded-full border transition active:scale-95 ${
        active ? 'border-ember/60 bg-ember/15 text-ember' : 'border-line/70 bg-ink-2 text-cream/80'
      }`}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  rows,
  ltr,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  ltr?: boolean
}) {
  const shared =
    'w-full rounded-2xl border border-line/70 bg-ink-2 px-4 py-3 text-cream placeholder:text-muted/50 outline-none focus:border-ember/60'
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-sm text-muted">{label}</span>
      {rows ? (
        <textarea
          value={value}
          rows={rows}
          dir={ltr ? 'ltr' : 'auto'}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${shared} resize-y leading-relaxed`}
        />
      ) : (
        <input
          value={value}
          dir={ltr ? 'ltr' : 'auto'}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={shared}
        />
      )}
    </label>
  )
}

export function Empty({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
      <p className="text-xl font-bold text-cream/90">{title}</p>
      {note && <p className="text-sm leading-relaxed text-muted">{note}</p>}
      {action}
    </div>
  )
}

export function PrimaryButton({
  onClick,
  children,
  full,
}: {
  onClick: () => void
  children: ReactNode
  full?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full bg-ember px-7 py-3.5 text-base font-bold text-ink transition active:scale-[0.97] ${
        full ? 'w-full' : ''
      }`}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  onClick,
  children,
  full,
  danger,
}: {
  onClick: () => void
  children: ReactNode
  full?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-line/70 bg-ink-2 px-6 py-3 text-base font-medium transition active:scale-[0.97] ${
        danger ? 'text-red-300/90' : 'text-cream/85'
      } ${full ? 'w-full' : ''}`}
    >
      {children}
    </button>
  )
}

/** Titles can be Hebrew or English — dir="auto" keeps punctuation on the right side. */
export function Bidi({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span dir="auto" className={className}>
      {children}
    </span>
  )
}
