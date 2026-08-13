import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Press from '../Global/Press'

export default function Hero() {
    const ref = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        gsap.from('.mark', { y: -30, opacity: 0, duration: 0.7, ease: 'power3.out' })
        gsap.to('.mark', { scale: 1.15, duration: 0.35, delay: 0.7, yoyo: true, repeat: 1, ease: 'power2.inOut' })
        gsap.from('.line', { y: 50, opacity: 0, stagger: 0.15, duration: 0.7, delay: 0.25, ease: 'back.out(1.7)' })
        gsap.from('.sub', { y: 20, opacity: 0, duration: 0.6, delay: 0.65, ease: 'back.out(1.7)' })
        gsap.from('.cta', { y: 20, opacity: 0, duration: 0.6, delay: 0.85, ease: 'back.out(1.7)', clearProps: 'all' })
    }, { scope: ref })

    return (
        <section ref={ref} className="flex min-h-screen items-center justify-center bg-cream px-10 sm:px-24">
            <div className="flex flex-col items-start text-left">
                <img src="/assets/designs/header.png" alt="Tabbed" className="mark w-72 sm:w-96" />
                <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight text-ink sm:text-8xl">
                    <span className="line block">Build Something</span>
                    <span className="line block text-pink">Keyboard Only.</span>
                </h1>
                <p className="sub mt-5 font-body text-base text-dim sm:text-lg">
                    Ship it and earn real prizes for your time.
                </p>
                <div className="mt-10">
                    <Press>Start Now</Press>
                </div>
            </div>
        </section>
    )
}