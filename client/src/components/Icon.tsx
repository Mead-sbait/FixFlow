// small hand drawn icon set, one stroke weight everywhere
const paths: Record<string, string> = {
  bell: 'M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3V8M10 19a2 2 0 0 0 4 0',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 4 4L19 7',
  x: 'M6 6l12 12M18 6 6 18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
  arrowLeft: 'M19 12H5m7-7-7 7 7 7',
  arrowRight: 'M5 12h14m-7-7 7 7-7 7',
  pin: 'M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5ZM12 14v6',
  wrench: 'M14 6a4 4 0 0 1 4 5l-9 9-3-3 9-9a4 4 0 0 1-1-2Z',
  board: 'M4 5h16v14H4zM9 5v14M15 5v14',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  users: 'M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 19v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  logout: 'M15 4h4v16h-4M10 17l5-5-5-5M15 12H3',
  location: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  alert: 'M12 3 2 20h20L12 3Zm0 7v4m0 3h.01',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-11v6m0-10h.01',
  note: 'M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  inbox: 'M3 13h5l2 3h4l2-3h5M3 13V7l2-3h14l2 3v6M3 13v6h18v-6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v6l4 2',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  ban: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM5 5l14 14',
}

type Props = {
  name: keyof typeof paths
  size?: number
  className?: string
}

export function Icon({ name, size = 18, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}
