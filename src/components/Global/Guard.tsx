import { useEffect, useState } from 'react'

const api = import.meta.env.VITE_API || ''

export default function Guard({ children }: { children: React.ReactNode }) {
  const [ready, setready] = useState(false)
  const [ok, setok] = useState(false)

  useEffect(() => {
    const next = encodeURIComponent(`${window.location.origin}/shop`)

    fetch(`${api}/api/me`)
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401) window.location.href = `${api}/login?next=${next}`
          setready(true)
          return null
        }

        const val = await res.json()
        if (val) {
          setok(true)
        } else {
          window.location.href = `${api}/login?next=${next}`
        }
        setready(true)
        return val
      })
      .catch(() => setready(true))
  }, [])

  if (!ready || !ok) return null
  return <>{children}</>
}