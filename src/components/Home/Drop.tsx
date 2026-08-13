import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useNav } from '../Global/Nav'

export type Ask = { question: string, answer: string }

export default function Drop({ ask }: { ask: Ask }) {
  const ref = useNav<HTMLButtonElement>()
  const body = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useGSAP(() => {
    const el = body.current
    if (!el) return
    gsap.to(el, { height: open ? 'auto' : 0, opacity: open ? 1 : 0, duration: 0.3, ease: 'power2.out' })
  }, { dependencies: [open] })

  return (
    <div className="drop w-full max-w-2xl rounded-3xl border-4 border-ink bg-white">
      <button ref={ref} onClick={() => setOpen(o => !o)} className="ask flex w-full items-center justify-between gap-4 border-none bg-transparent p-6 text-left font-display text-xl font-bold text-ink sm:text-2xl">
        {ask.question}
        <span className="shrink-0 text-pink">{open ? '−' : '+'}</span>
      </button>
      <div ref={body} className="h-0 overflow-hidden px-6 opacity-0">
        <p className="pb-6 font-body text-lg text-dim">{ask.answer}</p>
      </div>
    </div>
  )
}