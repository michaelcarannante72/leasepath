const PALETTES = [
  ['#a04a2c', '#7c3820', '#f2a900', '#f7efe4'],
  ['#1c2d42', '#31475f', '#e7edf3', '#f4e7c4'],
  ['#6d4a38', '#4d3326', '#f2a900', '#f6efe6'],
  ['#3d5a4c', '#24382f', '#d7ebe0', '#f2a900'],
  ['#7c3d49', '#542833', '#f2a900', '#f8ece8'],
  ['#3e4c66', '#1c2d42', '#f4e1b5', '#e7edf5'],
]

export function Building({ tone = 0 }) {
  const [wall, trim, glass, step] = PALETTES[tone % PALETTES.length]
  return (
    <svg className="facade" viewBox="0 0 320 200" aria-hidden="true">
      <rect width="320" height="200" fill="#e7ebef" />
      <rect x="36" y="28" width="248" height="172" fill={wall} />
      <rect x="48" y="40" width="52" height="40" fill={glass} />
      <rect x="134" y="40" width="52" height="40" fill={glass} />
      <rect x="220" y="40" width="52" height="40" fill={glass} />
      <rect x="48" y="96" width="52" height="40" fill={glass} />
      <rect x="220" y="96" width="52" height="40" fill={glass} />
      <rect x="128" y="108" width="64" height="72" fill={trim} />
      <rect x="154" y="140" width="10" height="10" rx="5" fill={step} />
      <rect x="78" y="164" width="164" height="8" fill={step} />
      <rect x="64" y="174" width="192" height="8" fill={step} />
      <rect x="50" y="184" width="220" height="8" fill={step} />
      <rect x="36" y="24" width="248" height="10" fill={trim} />
    </svg>
  )
}
