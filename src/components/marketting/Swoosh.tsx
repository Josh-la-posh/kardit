type Variant = 'default' | 'subtle' | 'ink'

const variants: Record<Variant, {
  thickStops: Array<[string, string, string]>
  thinStops: Array<[string, string, string]>
  thickStroke?: string
  thinStroke?: string
}> = {
  default: {
    thickStops: [
      ['0', '#9A1A1A', '0.0'],
      ['0.18', '#9A1A1A', '0.45'],
      ['0.55', '#C8242C', '0.62'],
      ['1', '#E63946', '0.0'],
    ],
    thinStops: [
      ['0', '#E63946', '0.0'],
      ['0.4', '#E63946', '0.40'],
      ['0.85', '#E63946', '0.0'],
    ],
  },
  subtle: {
    thickStops: [
      ['0', '#9A1A1A', '0.0'],
      ['0.55', '#C8242C', '0.50'],
      ['1', '#E63946', '0.0'],
    ],
    thinStops: [
      ['0.4', '#E63946', '0.30'],
      ['0.85', '#E63946', '0.0'],
    ],
  },
  ink: {
    thickStops: [],
    thinStops: [],
    thickStroke: 'rgba(43,161,93,0.18)',
    thinStroke: 'rgba(191,229,206,0.16)',
  },
}

let _id = 0
const nextId = () => `swoosh-${++_id}`

export function Swoosh({ variant = 'default' }: { variant?: Variant }) {
  const v = variants[variant]
  const idThick = nextId()
  const idThin = nextId()
  const useGradients = variant !== 'ink'
  return (
    <div className="hero__bg" aria-hidden="true">
      <svg className="swoosh" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        {useGradients && (
          <defs>
            <linearGradient id={idThick} x1="0" x2="1" y1="0" y2="0">
              {v.thickStops.map(([o, c, op], i) => (
                <stop key={i} offset={o} stopColor={c} stopOpacity={op} />
              ))}
            </linearGradient>
            <linearGradient id={idThin} x1="0" x2="1" y1="0" y2="0">
              {v.thinStops.map(([o, c, op], i) => (
                <stop key={i} offset={o} stopColor={c} stopOpacity={op} />
              ))}
            </linearGradient>
          </defs>
        )}
        <path data-stroke="thick" d=""
          stroke={useGradients ? `url(#${idThick})` : v.thickStroke}
          strokeWidth={32} strokeLinecap="round" fill="none" />
        <path data-stroke="thin" d=""
          stroke={useGradients ? `url(#${idThin})` : v.thinStroke}
          strokeWidth={14} strokeLinecap="round" fill="none" />
      </svg>
    </div>
  )
}
