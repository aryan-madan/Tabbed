import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Card from './Card'
import type { Item } from './Card'

const items: Item[] = [
  { name: 'Mug', price: 3, img: 'https://picsum.photos/seed/mug/300/200' },
  { name: 'Hoodie', price: 12, img: 'https://picsum.photos/seed/hoodie/300/200' },
  { name: 'Keyboard', price: 40, img: 'https://picsum.photos/seed/keyboard/300/200' },
  { name: 'Headphones', price: 25, img: 'https://picsum.photos/seed/headphones/300/200' },
  { name: 'Sticker', price: 1, img: 'https://picsum.photos/seed/sticker/300/200' },
  { name: 'Backpack', price: 18, img: 'https://picsum.photos/seed/backpack/300/200' },
]

export default function Marquee() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const track = ref.current
    if (!track) return
    const width = track.scrollWidth / 2
    gsap.to(track, { x: -width, duration: 24, ease: 'none', repeat: -1 })
  }, { scope: ref })

  return (
    <section className="relative overflow-hidden bg-cream py-28">
      <h2 className="mb-14 text-center font-display text-6xl font-bold text-ink">Shop</h2>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-cream to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-cream to-transparent" />
      <div ref={ref} className="flex w-max">
        {[...items, ...items].map((item, i) => (
          <Card key={i} item={item} />
        ))}
      </div>
    </section>
  )
}