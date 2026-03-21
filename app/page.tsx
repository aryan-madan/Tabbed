"use client";
import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import s from "./page.module.css";

const steps = [
    { n: "1", name: "build it", info: "make any app, site, or game that works entirely through the keyboard. no mouse. no trackpad. just keys." },
    { n: "2", name: "ship it", info: "deploy it somewhere public and send us the link with a short demo video, navigated with a keyboard, obviously." },
    { n: "3", name: "get it", info: "we review your project and send you up to $200 toward a mechanical keyboard of your choice." },
];

const faqs = [
    { q: "what counts as keyboard-only?", a: "your project should be fully usable without a mouse or touch input. arrow keys, tab, shortcuts, vim bindings, all good. no mouse scrolling allowed either. if you need to click or scroll with a trackpad, it doesn't count." },
    { q: "what can i build?", a: "literally anything, a code editor, a game, a music player, a weird interactive poem. as long as it works with just the keyboard." },
    { q: "who can apply?", a: "teens 18 and under. that's the only hard rule." },
    { q: "what's the deadline?", a: "rolling. submit whenever you ship. there's no hard cutoff." },
    { q: "how does the grant work?", a: "once your project is approved, we send you the grant money and you buy the keyboard yourself. up to $200." },
    { q: "does it have to be a web project?", a: "it should be something people can try online, so a web app or site works best. if you have another idea, ask us in #tabbed on the hack club slack." },
];

export default function Home() {
    const fire = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff3366', '#1a1a1a', '#ffffff']
        });
    };

    useEffect(() => {
        document.body.classList.add("keys");

        const handleKeys = (e: KeyboardEvent) => {
            if (["x", "c", "p"].includes(e.key.toLowerCase())) {
                fire();
            }

            if (e.key === "Tab" || (e.key === " " && e.target === document.body)) {
                e.preventDefault();
            }

            const interactables = Array.from(
                document.querySelectorAll('a[href], button, details[data-focus], [tabindex="0"]')
            ) as HTMLElement[];

            const active = document.activeElement as HTMLElement;
            const idx = interactables.indexOf(active);

            if (e.key.toLowerCase() === "s") {
                e.preventDefault();
                let next = idx >= 0 ? (idx + 1) : 0;
                if (next >= interactables.length) next = interactables.length - 1;
                interactables[next].focus({ preventScroll: true });
                interactables[next].scrollIntoView({ behavior: "smooth", block: "center" });
            }

            if (e.key.toLowerCase() === "w") {
                e.preventDefault();
                let prev = idx > 0 ? idx - 1 : 0;
                if (idx === -1) prev = 0;
                interactables[prev].focus({ preventScroll: true });
                interactables[prev].scrollIntoView({ behavior: "smooth", block: "center" });
            }

            if (e.key === "Enter" || e.key === " ") {
                if (active && active.tagName.toLowerCase() === "details") {
                    e.preventDefault();
                    if (active.hasAttribute("open")) {
                        active.removeAttribute("open");
                    } else {
                        active.setAttribute("open", "true");
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeys);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(s.active);
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        const revs = document.querySelectorAll(`.${s.reveal}`);
        revs.forEach((r) => observer.observe(r));

        return () => {
            window.removeEventListener("keydown", handleKeys);
            observer.disconnect();
        };
    }, []);

    return (
        <main className={s.main}>
            <div className={s.hint}>
                <kbd>W/S</kbd> Navigate • <kbd>Enter</kbd> Confirm
            </div>

            <a href="https://hackclub.com/" target="_blank" rel="noopener noreferrer" className={`${s.logo} ${s.reveal}`} tabIndex={0}>
                <img src="https://assets.hackclub.com/flag-orpheus-left.svg" alt="Hack Club" />
            </a>

            <section className={`${s.view} ${s.hero}`}>
                <div className={s.pad}>
                    <div className={`${s.word} ${s.reveal}`}>
                        {"tabbed".split("").map((c, i) => (
                            <div key={i} className={s.key}>{c}</div>
                        ))}
                    </div>

                    <h1 className={`${s.head} ${s.reveal}`} style={{ transitionDelay: '0.1s' }}>
                        build something
                        <br />
                        <span className={s.pop}>keyboard only.</span>
                    </h1>

                    <p className={`${s.text} ${s.reveal}`} style={{ transitionDelay: '0.2s' }}>
                        make any app, site, or tool that works entirely through the keyboard, no mouse, no clicks.
                    </p>
                    <p className={`${s.text} ${s.end} ${s.reveal}`} style={{ transitionDelay: '0.3s' }}>
                        ship it, get up to $200 toward a mechanical keyboard.
                    </p>

                    <div className={s.reveal} style={{ transitionDelay: '0.4s' }}>
                        <a id="btn-rsvp" href="https://tabbed.fillout.com/rsvp" target="_blank" rel="noopener noreferrer" className={s.link} tabIndex={0}>
                            rsvp
                        </a>
                    </div>
                </div>
            </section>

            <section className={s.view}>
                <div className={s.pad}>
                    <div className={`${s.sec} ${s.reveal}`}>
                        <h2 className={s.head}>how it works</h2>
                    </div>
                    <div className={s.path}>
                        {steps.map(({ n, name, info }, i) => (
                            <div key={n} className={`${s.step} ${s.reveal}`} style={{ transitionDelay: `${i * 0.15}s` }}>
                                <div className={s.skeycap}>
                                    <span className={s.num}>{n}</span>
                                </div>
                                <div className={s.scontent}>
                                    <h3 className={s.name}>{name}</h3>
                                    <p className={s.info}>{info}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className={s.view}>
                <div className={s.pad}>
                    <div className={`${s.sec} ${s.reveal}`}>
                        <h2 className={s.head}>questions</h2>
                    </div>
                    <div className={s.faqs}>
                        {faqs.map(({ q, a }, i) => (
                            <div key={i} className={s.reveal} style={{ transitionDelay: `${i * 0.1}s` }}>
                                <details className={s.ask} tabIndex={0} data-focus="true">
                                    {/* Moved tabIndex=0 to the Details container so the outline covers EVERYTHING inside it! */}
                                    <summary className={s.q}>{q}</summary>
                                    <p className={s.a}>{a}</p>
                                </details>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className={`${s.view} ${s.footView}`}>
                <div className={s.pad}>
                    <footer className={`${s.foot} ${s.reveal}`}>
                        <a href="https://hackclub.com" target="_blank" rel="noopener noreferrer" className={s.fhack} tabIndex={0}>
                            A Hack Club YSWS
                        </a>
                        <p className={s.fcreators}>
                            Aryan Madan & Rudransh Goel
                        </p>
                    </footer>
                </div>
            </section>
        </main>
    );
}
