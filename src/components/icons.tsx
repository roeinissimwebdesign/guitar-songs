type Props = { className?: string }

const base = 'size-5'

function Svg({ className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? base}
    >
      {children}
    </svg>
  )
}

export const Shuffle = (p: Props) => (
  <Svg {...p}>
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="m15 15 6 6" />
    <path d="M4 4l5 5" />
  </Svg>
)

export const ListIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="3.5" cy="6" r="1" fill="currentColor" />
    <circle cx="3.5" cy="12" r="1" fill="currentColor" />
    <circle cx="3.5" cy="18" r="1" fill="currentColor" />
  </Svg>
)

export const Layers = (p: Props) => (
  <Svg {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </Svg>
)

export const Search = (p: Props) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Svg>
)

export const Heart = ({ filled, ...p }: Props & { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinejoin="round"
    className={p.className ?? base}
  >
    <path d="M12 20s-7.5-4.7-7.5-9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 3C19.5 15.3 12 20 12 20Z" />
  </svg>
)

export const Play = (p: Props) => (
  <Svg {...p}>
    <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" />
  </Svg>
)

export const Pause = (p: Props) => (
  <Svg {...p}>
    <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
  </Svg>
)

export const Plus = (p: Props) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const Minus = (p: Props) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
)

export const Back = (p: Props) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
)

export const Forward = (p: Props) => (
  <Svg {...p}>
    <path d="m15 5-7 7 7 7" />
  </Svg>
)

export const Close = (p: Props) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
)

export const Gear = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 14H3a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 4.3 7.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.2.9Z" />
  </Svg>
)

export const Pencil = (p: Props) => (
  <Svg {...p}>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
  </Svg>
)

export const Trash = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </Svg>
)

export const Youtube = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="m10.5 9.5 5 2.5-5 2.5v-5Z" fill="currentColor" stroke="none" />
  </Svg>
)

export const Cloud = (p: Props) => (
  <Svg {...p}>
    <path d="M7 18a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17.4 11 3.5 3.5 0 0 1 17 18H7Z" />
  </Svg>
)

export const Check = (p: Props) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
)

export const Download = (p: Props) => (
  <Svg {...p}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path d="M5 19h14" />
  </Svg>
)

export const Paste = (p: Props) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6H9V4.5Z" />
    <path d="M9 12h6M9 16h4" />
  </Svg>
)
