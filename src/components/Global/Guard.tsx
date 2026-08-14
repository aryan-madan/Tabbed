import { useEffect, useState } from 'react'

const api = import.meta.env.VITE_API || ''

export default function Guard({ children }: { children: React.ReactNode }) {
  const [ready, setready] = useState(false)
  const [ok, setok] = useState(false)

  useEffect(() => {
    fetch(`${api}/api/me`)
      .then(res => res.json())
      .then(val => {
        if (val) {
          setok(true)
          setready(true)
        } else {
          location.href = `${api}/login?next=/shop`
        }
      })
  }, [])

  if (!ready || !ok) return null
  return <>{children}</>
}