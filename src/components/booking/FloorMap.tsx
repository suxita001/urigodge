import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { Floor, FloorItem } from '../../data/booking'
import { ITEM_LABELS } from '../../data/booking'
import type { Lang } from '../../data/types'

export type TableState = 'free' | 'selected' | 'taken' | 'unfit'

interface FloorMapProps {
  floor: Floor
  lang: Lang
  /** Booking mode: how each table should look; tables without a state are drawn as plain tables. */
  tableState?: (item: FloorItem) => TableState | undefined
  onTableClick?: (item: FloorItem) => void
  /** Editor mode: selection + dragging. */
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onMove?: (id: string, x: number, y: number) => void
  grid?: number
  className?: string
}

const COLORS = {
  free: { fill: '#ffffff', stroke: '#3a5a40', seat: '#3a5a40', text: '#1c1a16' },
  selected: { fill: '#3a5a40', stroke: '#2b4530', seat: '#c6f36b', text: '#ffffff' },
  taken: { fill: '#ece6da', stroke: '#c9c1b1', seat: '#c9c1b1', text: '#9a9387' },
  unfit: { fill: '#f6f2ea', stroke: '#ddd5c6', seat: '#ddd5c6', text: '#b3ab9d' },
  plain: { fill: '#ffffff', stroke: '#8a8478', seat: '#8a8478', text: '#1c1a16' },
}

/** Little chairs around a table, spread evenly like seats in a cinema row. */
function seatPositions(it: FloorItem): { x: number; y: number }[] {
  const n = it.seats ?? 4, cx = it.x + it.w / 2, cy = it.y + it.h / 2, out: { x: number; y: number }[] = []
  if (it.shape !== 'rect') {
    const r = Math.min(it.w, it.h) / 2 + 13
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }) }
    return out
  }
  const horizontal = it.w >= it.h
  const long = horizontal ? it.w : it.h
  const ends = n >= 6 && n % 2 === 0 ? 2 : n >= 5 ? 1 : 0
  const side = n - ends, top = Math.ceil(side / 2), bottom = side - top
  const place = (count: number, offset: number) => { for (let i = 0; i < count; i++) { const k = ((i + 0.5) / count) * long; out.push(horizontal ? { x: it.x + k, y: offset } : { x: offset, y: it.y + k }) } }
  place(top, horizontal ? it.y - 13 : it.x - 13)
  place(bottom, horizontal ? it.y + it.h + 13 : it.x + it.w + 13)
  if (ends >= 1) out.push(horizontal ? { x: it.x - 13, y: cy } : { x: cx, y: it.y - 13 })
  if (ends >= 2) out.push(horizontal ? { x: it.x + it.w + 13, y: cy } : { x: cx, y: it.y + it.h + 13 })
  return out
}

function Decor({ it, lang }: { it: FloorItem; lang: Lang }) {
  const label = it.label || ITEM_LABELS[it.type][lang]
  const cx = it.x + it.w / 2, cy = it.y + it.h / 2
  const text = (fill: string, size = 15, y = cy) => <text x={cx} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={700} fill={fill} style={{ pointerEvents: 'none' }}>{label}</text>
  switch (it.type) {
    case 'wall':
      return <rect x={it.x} y={it.y} width={it.w} height={it.h} rx={3} fill="#4a463e" />
    case 'window':
      return <rect x={it.x} y={it.y} width={it.w} height={it.h} rx={3} fill="#bfe0ea" stroke="#8fc3d3" strokeWidth={2} />
    case 'plant':
      return (
        <g>
          <circle cx={cx} cy={cy} r={Math.min(it.w, it.h) / 2} fill="#cfe3c9" stroke="#8fae8f" strokeWidth={2} />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(it.w, it.h) * 0.55} style={{ pointerEvents: 'none' }}>🌿</text>
        </g>
      )
    case 'stage':
      return (
        <g>
          <defs><pattern id={`st-${it.id}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#2f4d36" /><line x1="0" y1="0" x2="0" y2="14" stroke="#3a5a40" strokeWidth="6" /></pattern></defs>
          <rect x={it.x} y={it.y} width={it.w} height={it.h} rx={14} fill={`url(#st-${it.id})`} />
          {text('#f6f1e7', 20)}
        </g>
      )
    case 'stairs': {
      const steps = Math.max(3, Math.round((it.w >= it.h ? it.w : it.h) / 14))
      return (
        <g>
          <rect x={it.x} y={it.y} width={it.w} height={it.h} rx={6} fill="#e9e3d6" stroke="#bdb4a2" strokeWidth={2} />
          {Array.from({ length: steps - 1 }, (_, i) => (it.w >= it.h
            ? <line key={i} x1={it.x + ((i + 1) * it.w) / steps} y1={it.y + 4} x2={it.x + ((i + 1) * it.w) / steps} y2={it.y + it.h - 4} stroke="#bdb4a2" strokeWidth={2} />
            : <line key={i} x1={it.x + 4} y1={it.y + ((i + 1) * it.h) / steps} x2={it.x + it.w - 4} y2={it.y + ((i + 1) * it.h) / steps} stroke="#bdb4a2" strokeWidth={2} />))}
          {text('#6b6458', 13)}
        </g>
      )
    }
    case 'entrance':
      return (
        <g>
          <rect x={it.x} y={it.y} width={it.w} height={it.h} rx={10} fill="#ff7a45" />
          <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" fontSize={18} fill="#fff" style={{ pointerEvents: 'none' }}>⬆</text>
          {text('#ffffff', 13, cy + 12)}
        </g>
      )
    default: {
      const style = { toilet: ['#dde9f5', '#9db8d6', '#2f5b8a', '🚻'], bar: ['#3a2f22', '#3a2f22', '#f1d9a0', '🍸'], kitchen: ['#e8e2d6', '#c9c1b1', '#6b6458', '🍳'] }[it.type as 'toilet' | 'bar' | 'kitchen'] ?? ['#eee', '#ccc', '#333', '']
      return (
        <g>
          <rect x={it.x} y={it.y} width={it.w} height={it.h} rx={12} fill={style[0]} stroke={style[1]} strokeWidth={2} />
          {Math.min(it.w, it.h) > 60 && <text x={cx} y={cy - 12} textAnchor="middle" dominantBaseline="central" fontSize={20} style={{ pointerEvents: 'none' }}>{style[3]}</text>}
          {text(style[2], 14, Math.min(it.w, it.h) > 60 ? cy + 14 : cy)}
        </g>
      )
    }
  }
}

/**
 * A floor drawn as SVG: walls, toilets, the entrance, the stage, and tables with their chairs.
 * In booking mode tables are coloured by availability and can be tapped; in editor mode every item
 * can be selected and dragged (snapped to the grid).
 */
export default function FloorMap({ floor, lang, tableState, onTableClick, selectedId, onSelect, onMove, grid = 10, className = '' }: FloorMapProps) {
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const editing = !!onMove

  const toPlan = (e: { clientX: number; clientY: number }) => {
    const el = svg.current!, pt = el.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    return pt.matrixTransform(el.getScreenCTM()!.inverse())
  }
  const down = (it: FloorItem) => (e: ReactPointerEvent) => {
    if (!editing) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    const p = toPlan(e)
    drag.current = { id: it.id, dx: p.x - it.x, dy: p.y - it.y }
    onSelect?.(it.id)
  }
  const move = (e: ReactPointerEvent) => {
    if (!drag.current || !onMove) return
    const p = toPlan(e)
    const snap = (v: number) => Math.round(v / grid) * grid
    onMove(drag.current.id, snap(p.x - drag.current.dx), snap(p.y - drag.current.dy))
  }

  return (
    <svg
      ref={svg}
      viewBox={`-30 -30 ${floor.width + 60} ${floor.height + 60}`}
      className={`w-full h-auto select-none touch-none ${className}`}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
      onPointerDown={() => editing && onSelect?.(null)}
    >
      <defs>
        <pattern id="gridp" width={grid * 4} height={grid * 4} patternUnits="userSpaceOnUse"><path d={`M ${grid * 4} 0 L 0 0 0 ${grid * 4}`} fill="none" stroke="#e6dfd1" strokeWidth="1" /></pattern>
        <pattern id="takenp" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#ece6da" /><line x1="0" y1="0" x2="0" y2="10" stroke="#ddd5c6" strokeWidth="4" /></pattern>
      </defs>
      {/* the room */}
      <rect x={-6} y={-6} width={floor.width + 12} height={floor.height + 12} rx={22} fill="#faf7f1" stroke="#4a463e" strokeWidth={6} />
      {editing && <rect x={0} y={0} width={floor.width} height={floor.height} fill="url(#gridp)" />}

      {floor.items.map((it) => {
        const isSel = editing && selectedId === it.id
        if (it.type !== 'table') {
          return (
            <g key={it.id} onPointerDown={down(it)} style={{ cursor: editing ? 'grab' : 'default' }}>
              <Decor it={it} lang={lang} />
              {isSel && <rect x={it.x - 6} y={it.y - 6} width={it.w + 12} height={it.h + 12} rx={14} fill="none" stroke="#2f6fed" strokeWidth={3} strokeDasharray="8 6" />}
            </g>
          )
        }
        const state = tableState?.(it)
        const c = COLORS[state ?? 'plain']
        const clickable = !editing && (state === 'free' || state === 'selected') && !!onTableClick
        const cx = it.x + it.w / 2, cy = it.y + it.h / 2
        return (
          <g
            key={it.id}
            onPointerDown={down(it)}
            onClick={() => clickable && onTableClick!(it)}
            style={{ cursor: editing ? 'grab' : clickable ? 'pointer' : 'not-allowed', transition: 'opacity .2s' }}
            role={clickable ? 'button' : undefined}
            aria-label={clickable ? `${it.label ?? ''} · ${it.seats ?? 0}` : undefined}
          >
            {seatPositions(it).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={8} fill={state === 'selected' ? c.seat : '#fff'} stroke={c.seat} strokeWidth={3} />)}
            {it.shape === 'rect'
              ? <rect x={it.x} y={it.y} width={it.w} height={it.h} rx={12} fill={state === 'taken' ? 'url(#takenp)' : c.fill} stroke={c.stroke} strokeWidth={3} />
              : <ellipse cx={cx} cy={cy} rx={it.w / 2} ry={it.h / 2} fill={state === 'taken' ? 'url(#takenp)' : c.fill} stroke={c.stroke} strokeWidth={3} />}
            <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={800} fill={c.text} style={{ pointerEvents: 'none' }}>{it.label || '•'}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill={c.text} opacity={0.8} style={{ pointerEvents: 'none' }}>{state === 'taken' ? '✕' : `${it.seats ?? 0} 👤`}</text>
            {isSel && <rect x={it.x - 22} y={it.y - 22} width={it.w + 44} height={it.h + 44} rx={18} fill="none" stroke="#2f6fed" strokeWidth={3} strokeDasharray="8 6" />}
          </g>
        )
      })}
    </svg>
  )
}
