export function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16.5 16.5 4 4" />
      </>
    ),
    steps: (
      <>
        <path d="M4 19h5v-4h5V9h6" />
        <path d="m16 5 4 4-4 4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.6 4.8L18.5 9.5 13.6 11 12 16l-1.6-5L5.5 9.5 10.4 7.8 12 3Z" />
        <path d="m18.5 14 .7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
      </>
    ),
    heart: <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />,
    card: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    back: <path d="M15 5 8 12l7 7" />,
    close: (
      <>
        <path d="m7 7 10 10" />
        <path d="M17 7 7 17" />
      </>
    ),
    heartFill: <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" fill="currentColor" stroke="none" />,
    external: (
      <>
        <path d="M14 5h5v5" />
        <path d="M13 11 19 5" />
        <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </>
    ),
    check: <path d="m5 12 5 5L20 7" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    food: (
      <>
        <path d="M8 3v8a3 3 0 0 0 3 3h0V3" />
        <path d="M8 14v7" />
        <path d="M16 3v18" />
        <path d="M16 8h3a2 2 0 0 1 0 4h-3" />
      </>
    ),
    home: (
      <>
        <path d="m4 11 8-7 8 7" />
        <path d="M6 10v9h12v-9" />
        <path d="M10 19v-5h4v5" />
      </>
    ),
    bike: (
      <>
        <circle cx="6.5" cy="16.5" r="3" />
        <circle cx="17.5" cy="16.5" r="3" />
        <path d="M6.5 16.5 10 8h3l3.5 8.5" />
        <path d="M10 8h5" />
        <path d="m14 8 1.5 4H10" />
      </>
    ),
    health: (
      <>
        <path d="M12 21s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />
        <path d="M12 9v5" />
        <path d="M9.5 11.5h5" />
      </>
    ),
    elders: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M6 20v-1a5 5 0 0 1 10 0v1" />
        <path d="M16 11.5c1.2.6 2 1.8 2 3.2V17" />
      </>
    ),
    city: (
      <>
        <path d="M4 20V9l5-3v14" />
        <path d="M9 20V7l6-3v16" />
        <path d="M15 20v-8l5 3v5" />
        <path d="M4 20h16" />
      </>
    ),
    phone: (
      <>
        <path d="M7.5 3.5h3l1.2 3.2-1.8 1.2a12 12 0 0 0 5.2 5.2l1.2-1.8 3.2 1.2v3A2 2 0 0 1 17.5 17 14.5 14.5 0 0 1 3.5 3a2 2 0 0 1 2-2Z" />
      </>
    ),
    mic: (
      <>
        <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z" />
        <path d="M19 11a7 7 0 0 1-14 0" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </>
    ),
    blog: (
      <>
        <path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        <path d="M14 4v4h4" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
  }
  return <svg {...common}>{paths[name] || paths.search}</svg>
}
