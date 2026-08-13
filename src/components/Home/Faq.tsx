import Drop from './Drop'
import type { Ask } from './Drop'

const asks: Ask[] = [
  { question: 'Who is eligible?', answer: 'Anyone can participate in Tabbed as long as you are between the ages of 13 and 18.' },
  { question: 'How much does it cost?', answer: 'Tabbed is 100% free. You can build and submit your project for cool prizes without paying a cent (except customs fees)!' },
  { question: 'What counts as keyboard only?', answer: 'Your project should be fully usable without a touchpad or a mouse. It should be fully operable using just your keyboard. You CANNOT use the Tab key.' },
  { question: 'What can I build?', answer: 'You can make any app, site, game, or tool. It should be open source and publicly usable.' },
  { question: 'How do I submit my project?', answer: 'You can ship your project by filling the submission form, which can be found by interacting with the Submit button.' },
  { question: 'Is this even legit?', answer: "Yes, Hack club is the world's largest community of teenage makers, and a 501(c)(3) nonprofit. we've hosted programs like high seas and summer of making which gave out prizes for building other sorts of projects. we're supported by donations from companies like GitHub or individual generous donations!" },
]

export default function Faq() {
  return (
    <section className="flex flex-col items-center gap-14 bg-cream px-10 py-28 sm:px-24">
      <h2 className="font-display text-6xl font-bold text-ink">FAQ</h2>
      <div className="flex w-full flex-col items-center gap-6">
        {asks.map((ask, i) => <Drop key={i} ask={ask} />)}
      </div>
    </section>
  )
}