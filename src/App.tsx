import Home from './pages/Home'
import Nav from './components/Global/Nav'
import Flag from './components/Global/Flag'
import Hint from './components/Global/Hint'
import Footer from './components/Global/Footer'

export default function App() {
  return (
    <Nav>
      <Flag />
      <Home />
      <Footer />
      <Hint />
    </Nav>
  )
}
