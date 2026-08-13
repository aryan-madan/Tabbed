import type { ReactNode } from 'react'
import { useNav } from './Nav'

export default function Press({ children, click }: { children: ReactNode, click?: () => void }) {
  const ref = useNav<HTMLButtonElement>()
  return (
    <button ref={ref} onClick={click} className="press cta">
      {children}
    </button>
  )
}