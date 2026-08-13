import Step from './Step'
import type { Phase } from './Step'

const steps: Phase[] = [
  { num: 1, head: 'Build It', text: 'Make any app, site, or game that works entirely through the keyboard.' },
  { num: 2, head: 'Ship It', text: 'Deploy it somewhere public and send us the link with a short demo video, navigated with a keyboard, obviously.' },
  { num: 3, head: 'Get It', text: 'We review your project and send you your selected prize!' },
]

export default function How() {
  return (
    <section className="bg-cream px-10 py-28 sm:px-24">
      <h2 className="mb-14 text-center font-display text-6xl font-bold text-ink">How It Works</h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map(step => <Step key={step.num} step={step} />)}
      </div>
    </section>
  )
}