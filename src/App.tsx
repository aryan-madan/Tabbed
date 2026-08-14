import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Guard from './components/Global/Guard'
import Nav from './components/Global/Nav'
import Hint from './components/Global/Hint'
import Flag from './components/Global/Flag'
import Footer from './components/Global/Footer'

export default function App() {
  return (
    <BrowserRouter>
      <Nav>
        <Flag />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Guard><Shop /></Guard>} />
          <Route path="/orders" element={<Guard><Shop /></Guard>} />
          <Route path="/admin" element={<Guard><Shop /></Guard>} />
        </Routes>
        <Footer />
        <Hint />
      </Nav>
    </BrowserRouter>
  )
}