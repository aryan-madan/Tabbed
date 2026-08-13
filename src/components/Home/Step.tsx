import { useNav } from '../Global/Nav'

export type Phase = { num: number, head: string, text: string }

export default function Step({ step, flip }: { step: Phase, flip: boolean }) {
  const ref = useNav<HTMLDivElement>()
  return (
    <section className={`relative z-10 flex ${flip ? 'justify-end' : 'justify-start'} ${flip ? 'pl-24 sm:pl-40' : 'pr-24 sm:pr-40'}`}>
      <div ref={ref} className={`step w-full max-w-sm rounded-3xl border-4 border-ink bg-white p-8 ${flip ? 'rotate-1' : '-rotate-1'}`}>
        <span className="key flex h-16 w-16 items-center justify-center rounded-2xl bg-pink font-display text-3xl font-bold text-cream">
          {step.num}
        </span>
        <p className="mt-6 font-display text-3xl font-bold text-ink">{step.head}</p>
        <p className="mt-3 font-body text-lg text-dim">{step.text}</p>
      </div>
    </section>
  )
}