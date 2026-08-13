import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react'

type Dir = 'up' | 'down' | 'left' | 'right'

const vector: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

const map: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const Ctx = createContext<{ add: (el: HTMLElement) => void, remove: (el: HTMLElement) => void }>({
  add: () => {},
  remove: () => {},
})

export function useNav<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const { add, remove } = useContext(Ctx)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    add(el)
    return () => remove(el)
  }, [add, remove])

  return ref
}

function center(el: HTMLElement) {
  const zone = (el.closest('section') as HTMLElement) ?? el
  zone.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
}

function land(el: HTMLElement) {
  el.focus({ preventScroll: true })
  center(el)
}

export default function Nav({ children }: { children: ReactNode }) {
  const nodes = useRef(new Set<HTMLElement>())

  const add = useCallback((el: HTMLElement) => {
    el.tabIndex = -1
    nodes.current.add(el)
  }, [])

  const remove = useCallback((el: HTMLElement) => {
    nodes.current.delete(el)
  }, [])

  useEffect(() => {
    document.body.style.cursor = 'none'

    const block = (e: Event) => e.preventDefault()
    window.addEventListener('mousedown', block, true)
    window.addEventListener('click', block, true)
    window.addEventListener('contextmenu', block, true)
    window.addEventListener('wheel', block, { passive: false, capture: true })
    window.addEventListener('touchmove', block, { passive: false, capture: true })

    const move = (dir: Dir) => {
      const list = [...nodes.current]
      if (!list.length) return
      const active = document.activeElement as HTMLElement
      if (!list.includes(active)) { land(list[0]); return }
      const base = active.getBoundingClientRect()
      const [dx, dy] = vector[dir]
      let best: HTMLElement | null = null
      let score = Infinity
      for (const node of list) {
        if (node === active) continue
        const rect = node.getBoundingClientRect()
        const cx = rect.left + rect.width / 2 - (base.left + base.width / 2)
        const cy = rect.top + rect.height / 2 - (base.top + base.height / 2)
        const dot = cx * dx + cy * dy
        if (dot <= 0) continue
        const side = Math.abs(cx * dy - cy * dx)
        const total = dot + side * 2
        if (total < score) { score = total; best = node }
      }
      if (best) land(best)
    }

    const press = (e: KeyboardEvent) => {
      if (e.key === 'Tab') { e.preventDefault(); return }
      const dir = map[e.key]
      if (dir) { e.preventDefault(); move(dir); return }
      if (e.key === 'Enter' || e.key === ' ') {
        const active = document.activeElement as HTMLElement
        if (nodes.current.has(active)) {
          e.preventDefault()
          active.classList.add('hit')
          setTimeout(() => active.classList.remove('hit'), 150)
          active.click()
        }
      }
    }
    window.addEventListener('keydown', press)

    const frame = requestAnimationFrame(() => {
      const first = [...nodes.current][0]
      if (first) land(first)
    })

    return () => {
      window.removeEventListener('mousedown', block, true)
      window.removeEventListener('click', block, true)
      window.removeEventListener('contextmenu', block, true)
      window.removeEventListener('wheel', block, true)
      window.removeEventListener('touchmove', block, true)
      window.removeEventListener('keydown', press)
      cancelAnimationFrame(frame)
    }
  }, [])

  return <Ctx.Provider value={{ add, remove }}>{children}</Ctx.Provider>
}