"use client";
import s from "./page.module.css";
import Cursor from "@/components/Cursor";

const steps = [
    {
        n: "01",
        title: "build it",
        body: "make any app, site, or game that works entirely through the keyboard. no mouse. no trackpad. just keys.",
    },
    {
        n: "02",
        title: "ship it",
        body: "deploy it somewhere public and send us the link with a short demo video — navigated with a keyboard, obviously.",
    },
    {
        n: "03",
        title: "get it",
        body: "we review your project and send you up to $200 toward a mechanical keyboard of your choice.",
    },
];

const faqs = [
    {
        q: "what counts as keyboard-only?",
        a: "your project should be fully usable without a mouse or touch input. arrow keys, tab, shortcuts, vim bindings — all good. if you need to click anything to use it, it doesn't count.",
    },
    {
        q: "what can i build?",
        a: "literally anything — a code editor, a game, a music player, a weird interactive poem. as long as it works with just the keyboard.",
    },
    {
        q: "who can apply?",
        a: "teens 18 and under. that's the only hard rule.",
    },
    {
        q: "what's the deadline?",
        a: "rolling. submit whenever you ship. there's no hard cutoff.",
    },
    {
        q: "how does the $200 grant work?",
        a: "once your project is approved, we send you the grant money and you buy the keyboard yourself. up to $200.",
    },
    {
        q: "does it have to be a web project?",
        a: "it should be something people can try online, so a web app or site works best. if you have another idea, ask us in #tabbed on the hack club slack.",
    },
];

const team = [
    {
        name: "Rudransh Goel",
        role: "made the site",
        note: "randomly got this idea at 2am",
    },
    {
        name: "Aryan Madan",
        role: "designing & brainstorming",
        note: "was on vacation for 90% of the time",
    },
];

export default function Home() {
    return (
        <>
            <Cursor />

            <div className={s.page}>
                <a
                    href="https://hackclub.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        className={s.hcFlag}
                        src="https://assets.hackclub.com/flag-orpheus-left.svg"
                        alt="Hack Club"
                    />
                </a>

                <section className={s.secHero}>
                    <div className={s.wordmark}>
                        {"tabbed".split("").map((char, i) => (
                            <div key={i} className={s.key}>
                                {char}
                            </div>
                        ))}
                    </div>

                    <p className={s.label}>a hack club ysws</p>

                    <h1 className={s.h1}>
                        build something
                        <br />
                        <span className={s.accent}>keyboard only.</span>
                    </h1>

                    <p className={s.body}>
                        make any app, site, or tool that works entirely through
                        the keyboard — no mouse, no clicks.
                    </p>
                    <p className={`${s.body} ${s.bodyLast}`}>
                        ship it, get{" "}
                        <strong style={{ color: "var(--fg)" }}>
                            up to $200
                        </strong>{" "}
                        toward a mechanical keyboard.
                    </p>

                    <a
                        href="https://tabbed.fillout.com/rsvp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.cta}
                    >
                        rsvp →
                    </a>
                    <p className={s.sub}>
                        open to teens ≤18 · rolling deadline
                    </p>
                </section>

                <div className={s.divider} />

                <section className={s.sec}>
                    <p className={s.label}>what is tabbed?</p>
                    <h2 className={s.h2}>how it works.</h2>
                    <div className={s.steps}>
                        {steps.map(({ n, title, body }) => (
                            <div key={n} className={s.step}>
                                <span className={s.stepNum}>{n}</span>
                                <div>
                                    <h3 className={s.stepTitle}>{title}</h3>
                                    <p className={s.stepBody}>{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className={s.divider} />

                <section className={s.sec}>
                    <p className={s.label}>the team</p>
                    <h2 className={s.h2}>who made this.</h2>
                    <div className={s.team}>
                        {team.map(({ name, role, note }) => (
                            <div key={name}>
                                <p className={s.memberName}>{name}</p>
                                <p className={s.memberRole}>{role}</p>
                                <p className={s.memberNote}>{note}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className={s.divider} />

                <section className={s.sec}>
                    <p className={s.label}>faq</p>
                    <h2 className={s.h2}>questions.</h2>
                    <div>
                        {faqs.map(({ q, a }, i) => (
                            <div key={i} className={s.faqItem}>
                                <p className={s.faqQ}>{q}</p>
                                <p className={s.faqA}>{a}</p>
                            </div>
                        ))}
                        <div className={s.faqEnd} />
                    </div>
                </section>

                <footer className={s.footer}>
                    <span>tabbed</span>
                    <span>hack club ysws</span>
                </footer>
            </div>
        </>
    );
}
