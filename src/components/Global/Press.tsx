import type { ReactNode } from 'react'
import { useNav } from './Nav'

export default function Press({ children, click, href }: { children: ReactNode, click?: () => void, href?: string }) {
  const ref = useNav<HTMLButtonElement>()
  return (
    <button ref={ref} onClick={() => href ? window.location.assign(href) : click?.()} className="press cta">
      {children}
    </button>
  )
}
