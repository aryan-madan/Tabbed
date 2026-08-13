import { useNav } from '../Global/Nav'

export type Phase = { num: number, head: string, text: string }

export default function Step({ step }: { step: Phase }) {
  const ref = useNav<HTMLDivElement>()
  return (
    <div ref={ref} className="card w-full rounded-3xl bg-white p-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pink font-display text-2xl font-bold text-cream">
        {step.num}
      </span>
      <p className="mt-6 font-display text-3xl font-bold text-ink">{step.head}</p>
      <p className="mt-3 font-body text-base text-dim sm:text-lg">{step.text}</p>
    </div>
  )
}