import { useNav } from './Nav'

export default function Footer() {
  const love = useNav<HTMLButtonElement>()
  const hackClub = useNav<HTMLAnchorElement>()
  const slack = useNav<HTMLAnchorElement>()

  return (
    <footer className="bg-cream px-6 py-14 sm:px-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 sm:flex-row">
        <div className="flex items-center gap-3">
          <img src="/assets/designs/logo.png" alt="Tabbed" className="footer-logo h-11 w-11" />
          <p className="font-body text-sm font-bold text-dim">Made with <button ref={love} className="love text-pink">love ❤️</button> · A Hack Club YSWS</p>
        </div>
        <nav className="flex items-center gap-5 font-body text-sm font-bold">
          <a ref={hackClub} href="https://hackclub.com" className="footer-link text-ink">Hack Club</a>
          <a ref={slack} href="https://hackclub.enterprise.slack.com/archives/C0APGH99DJ9" className="footer-link text-ink">Join #tabbed on Slack</a>
        </nav>
      </div>
    </footer>
  )
}
