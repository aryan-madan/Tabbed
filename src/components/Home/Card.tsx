import { useNav } from '../Global/Nav'

export type Item = { name: string, price: number, img: string }

export default function Card({ item }: { item: Item }) {
  const ref = useNav<HTMLDivElement>()
  return (
    <div ref={ref} className="card mx-4 w-80 shrink-0 rounded-3xl bg-white p-6">
      <img src={item.img} alt={item.name} className="h-52 w-full rounded-2xl object-cover" />
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="font-body text-2xl font-bold text-ink">{item.name}</p>
        <span className="shrink-0 rounded-full bg-pink px-4 py-2 font-body text-lg font-bold text-cream">
          {item.price}h
        </span>
      </div>
    </div>
  )
}