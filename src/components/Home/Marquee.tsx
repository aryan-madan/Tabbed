import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Card from './Card'
import { items } from './Card'
import { useNav } from '../Global/Nav'

export default function Marquee() {
  const track = useRef<HTMLDivElement>(null)
  const zone = useNav<HTMLElement>()

  useGSAP(() => {
    const el = track.current
    if (!el) return
    const width = el.scrollWidth / 2
    gsap.to(el, { x: -width, duration: 24, ease: 'none', repeat: -1 })
  }, { scope: track })

  return (
    <section ref={zone} className="relative overflow-hidden bg-cream py-28">
      <h2 className="mb-14 text-center font-display text-6xl font-bold text-ink">Shop</h2>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-cream to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-cream to-transparent" />
      <div ref={track} className="flex w-max">
        {[...items, ...items].map((item, i) => (
          <Card key={i} item={item} color={item.color} />
        ))}
      </div>
    </section>
  )
}
