import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useNav } from '../components/Global/Nav'

type Item = { id: number; name: string; descr: string | null; price: number; stock: number; image: string | null; active: boolean }
type User = { name: string | null; hours: number; admin: boolean } | null
type Order = { id: number; name: string; price: number; created: string }
type AdminUser = { slack_id: string; name: string | null; email: string | null; hours: number; admin: boolean }

const api = import.meta.env.VITE_API || ''

function Link({ href, children }: { href: string; children: ReactNode }) {
  const ref = useNav<HTMLAnchorElement>()
  return <a ref={ref} href={href}>{children}</a>
}

function Tab({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const ref = useNav<HTMLButtonElement>()
  return <button ref={ref} onClick={onClick}>{children}</button>
}

function Buy({ item, user, onBuy }: { item: Item; user: User; onBuy: (id: number) => void }) {
  const ref = useNav<HTMLButtonElement>()
  return (
    <article className="card flex min-h-105 flex-col overflow-hidden">
      {item.image
        ? <img className="h-48 w-full border-b-4 border-ink object-cover" src={item.image} alt={item.name} />
        : <div className="flex h-48 items-center justify-center border-b-4 border-ink bg-pink text-5xl font-black text-cream">{item.name[0]}</div>}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex justify-between gap-2">
          <h2 className="text-xl font-bold">{item.name}</h2>
          <span className="pill">{item.price.toFixed(2)} hrs</span>
        </div>
        <p className="flex-1 text-sm text-dim">{item.descr}</p>
        <div className="flex items-center justify-between">
          <span className="pill">{item.stock === -1 ? 'unlimited' : item.stock > 0 ? `${item.stock} left` : 'sold out'}</span>
          <button
            ref={ref}
            className="press"
            disabled={item.stock === 0 || (!!user && user.hours < item.price)}
            onClick={() => onBuy(item.id)}
          >
            {item.stock === 0 ? 'sold out' : user && user.hours < item.price ? 'need more hrs' : 'redeem'}
          </button>
        </div>
      </div>
    </article>
  )
}

function AdminForm({ onAdd }: { onAdd: (evt: FormEvent<HTMLFormElement>) => void }) {
  const ref = useNav<HTMLButtonElement>()
  return (
    <form className="card mt-10 grid gap-4 p-6 sm:grid-cols-2" onSubmit={onAdd}>
      <input name="name" placeholder="Name" required />
      <input name="price" placeholder="Price in hours" type="number" min="0" step="0.01" required />
      <input name="stock" placeholder="Stock (-1 unlimited)" type="number" />
      <input name="image" placeholder="Image URL" type="url" />
      <textarea className="sm:col-span-2" name="descr" placeholder="Description" />
      <button ref={ref} className="press w-fit" type="submit">Add product</button>
    </form>
  )
}

export default function Shop() {
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setitems] = useState<Item[]>([])
  const [user, setuser] = useState<User>(null)
  const [orders, setorders] = useState<Order[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [view, setview] = useState(location.pathname === '/orders' ? 'orders' : location.pathname === '/admin' ? 'admin' : 'shop')
  const [note, setnote] = useState('')
  const logo = useNav<HTMLButtonElement>()

  useEffect(() => {
    setview(location.pathname === '/orders' ? 'orders' : location.pathname === '/admin' ? 'admin' : 'shop')
  }, [location.pathname])

  const load = async () => {
    const [prodRes, meRes] = await Promise.all([fetch(`${api}/api/products`), fetch(`${api}/api/me`)])
    const prod = prodRes.ok ? await prodRes.json() : []
    const mine = meRes.ok ? await meRes.json() : null
    setitems(prod)
    setuser(mine)
  }

  useEffect(() => { void load() }, [])
  useEffect(() => {
    if (view === 'orders') fetch(`${api}/api/orders`).then(res => res.ok ? res.json() : []).then(setorders)
    if (view === 'admin') {
      Promise.all([
        fetch(`${api}/api/admin`).then(res => res.ok ? res.json() : []),
        fetch(`${api}/api/admin/users`).then(res => res.ok ? res.json() : []),
      ]).then(([products, users]) => {
        setitems(products)
        setAdminUsers(users)
      })
    }
  }, [view])

  const go = (val: string) => {
    setview(val)
    navigate(val === 'shop' ? '/shop' : `/${val}`)
  }

  const loginHref = `${api}/login?next=${encodeURIComponent(`${window.location.origin}/shop`)}`

  const buy = async (id: number) => {
    const res = await fetch(`${api}/api/buy/${id}`, { method: 'POST' })
    if (res.status === 401) {
      window.location.href = loginHref
      return
    }
    setnote(res.ok ? 'Redeemed successfully.' : 'That item is unavailable.')
    if (res.ok) void load()
  }

  const add = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    const val = Object.fromEntries(new FormData(evt.currentTarget))
    const res = await fetch(`${api}/api/admin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(val) })
    setnote(res.ok ? 'Product added.' : 'Could not add product.')
    if (res.ok) {
      evt.currentTarget.reset()
      void load()
    }
  }

  const adjustHours = async (slackId: string, delta: number) => {
    const res = await fetch(`${api}/api/admin/users/${encodeURIComponent(slackId)}/hours`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta_hours: delta, reason: 'manual admin adjustment' }),
    })

    if (!res.ok) {
      setnote('Could not update hours.')
      return
    }

    setnote(delta > 0 ? 'Hours added.' : 'Hours removed.')
    const updated = await fetch(`${api}/api/admin/users`).then(res => res.ok ? res.json() : [])
    setAdminUsers(updated)
    if (user) {
      const nextUser = await fetch(`${api}/api/me`).then(res => res.ok ? res.json() : null)
      setuser(nextUser)
    }
  }

  return <div className="min-h-screen bg-cream text-ink">
    <header className="border-b-4 border-ink">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <button ref={logo} className="font-display text-2xl font-black" onClick={() => go('shop')}>Tabbed <span className="text-pink">Shop</span></button>
        <nav className="flex items-center gap-3 text-sm font-bold">
          {user && <>
            <span className="pill">{user.hours.toFixed(2)} hrs</span>
            <Tab onClick={() => go('orders')}>my orders</Tab>
            {user.admin && <Tab onClick={() => go('admin')}>admin</Tab>}
            <Link href={`${api}/logout`}>log out</Link>
          </>}
          {!user && <Link href={loginHref}>Sign in with Slack</Link>}
        </nav>
      </div>
    </header>
    {note && <p className="mx-auto mt-6 max-w-5xl rounded-lg border-4 border-ink bg-pink px-4 py-3 font-bold text-cream">{note}</p>}
    {view === 'shop' && <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-5xl font-black">Spend your hours.</h1>
      <p className="mt-3 max-w-xl text-lg text-dim">Every hour you put into hacking turns into hours you can spend here. Pick something good.</p>
      <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => <Buy key={item.id} item={item} user={user} onBuy={buy} />)}
      </section>
      {items.length === 0 && <p className="card mt-10 p-10 text-center font-bold">Nothing here yet.</p>}
    </main>}
    {view === 'orders' && <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-5xl font-black">My orders.</h1>
      <p className="mt-3 text-lg text-dim">Everything you've redeemed, most recent first.</p>
      <div className="card mt-10 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr><th>Product</th><th>Cost</th><th>Date</th></tr></thead>
          <tbody>{orders.map(order => <tr key={order.id}><td>{order.name}</td><td>{order.price.toFixed(2)} hrs</td><td>{new Date(order.created).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </div>
    </main>}
    {view === 'admin' && <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-5xl font-black">Run the shop.</h1>
      <AdminForm onAdd={add} />

      <section className="card mt-10 overflow-x-auto p-4">
        <h2 className="mb-4 font-display text-3xl font-black">Users</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Hours</th>
              <th>Role</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map(userEntry => (
              <tr key={userEntry.slack_id}>
                <td>{userEntry.name || userEntry.slack_id}</td>
                <td>{userEntry.email || '—'}</td>
                <td>{userEntry.hours.toFixed(2)}</td>
                <td>{userEntry.admin ? 'admin' : 'member'}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="press" onClick={() => adjustHours(userEntry.slack_id, -1)}>−1</button>
                    <button className="press" onClick={() => adjustHours(userEntry.slack_id, 1)}>+1</button>
                    <button className="press" onClick={() => adjustHours(userEntry.slack_id, 5)}>+5</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {adminUsers.length === 0 && <p className="mt-4 font-bold text-dim">No users found.</p>}
      </section>
    </main>}
  </div>
}