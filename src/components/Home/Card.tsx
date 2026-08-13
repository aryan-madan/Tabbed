export type Item = {
  name: string
  price: number
  img: string
  text: string
  color: string
}

export const items: Item[] = [
  {
    name: 'Aula F75', price: 69, color: '#b9d3e6',
    text: 'A 75% tri-mode mechanical keyboard with hot-swappable switches.',
    img: 'https://www.whatgeek.com/cdn/shop/files/AULA_F75_KEYBOARD_blue_6.jpg?v=1747045396&width=1200',
  },
  {
    name: 'Keychron K2', price: 69, color: '#d7d0c5',
    text: 'A compact wireless mechanical keyboard for your everyday setup.',
    img: 'https://keychron.in/wp-content/uploads/2021/03/C1.png',
  },
  {
    name: 'Custom Keycap Set', price: 69, color: '#e7c7d4',
    text: 'Give your board a fresh look with a full set of PBT keycaps.',
    img: 'https://cannonkeys.com/cdn/shop/files/DSC01801_be9818f5-1732-43fa-99eb-c650a99e1876.jpg',
  },
  {
    name: 'Mechanical Switch Pack', price: 69, color: '#cfe2ec',
    text: 'A set of smooth switches to tune the feel of every keystroke.',
    img: 'https://res.cloudinary.com/kineticlabs/image/upload/q_auto/c_fit,w_1000/f_auto/v1/api-images/listing/switches/penguin-switches-jwk_xtp8vu',
  },
  {
    name: 'Keyboard Wrist Rest', price: 69, color: '#e7c7a1',
    text: 'A comfortable desk companion for long, clicky build nights.',
    img: 'https://i.etsystatic.com/36710056/r/il/9f43e6/5995586293/il_fullxfull.5995586293_9njc.jpg',
  },
]

export default function Card({ item, color }: { item: Item, color: string }) {
  return (
    <article className="card mx-4 w-80 shrink-0 rounded-3xl p-6 text-left" style={{ backgroundColor: color }}>
      <img src={item.img} alt={item.name} className="h-52 w-full rounded-2xl object-cover" />
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="font-body text-2xl font-bold text-ink">{item.name}</p>
        <span className="shrink-0 rounded-full bg-pink px-4 py-2 font-body text-lg font-bold text-cream">
          {item.price}h
        </span>
      </div>
    </article>
  )
}
