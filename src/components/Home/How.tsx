import Step from './Step'
import type { Phase } from './Step'

const steps: Phase[] = [
  { num: 1, head: 'Build It', text: 'Make any app, site, or game that works entirely through the keyboard.' },
  { num: 2, head: 'Ship It', text: 'Deploy it somewhere public and send us the link with a short demo video, navigated with a keyboard, obviously.' },
  { num: 3, head: 'Get It', text: 'We review your project and send you your selected prize!' },
]

export default function How() {
  return (
    <section className="flex flex-col items-center gap-20 bg-cream px-10 py-28 sm:px-24">
      <h2 className="font-display text-6xl font-bold text-ink">How It Works</h2>
      <div className="relative flex w-full max-w-3xl flex-col gap-24">
        <svg className="absolute inset-0 z-0 hidden h-full w-full sm:block" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 30 10 C 70 25, 10 25, 70 50 C 110 65, 10 65, 30 90" fill="none" stroke="var(--color-ink)" strokeOpacity="0.35" strokeWidth="5.5" strokeDasharray="5.5 5.5" vectorEffect="non-scaling-stroke" />
        </svg>
        {steps.map((step, i) => <Step key={step.num} step={step} flip={i % 2 === 1} />)}
      </div>
    </section>
  )
}