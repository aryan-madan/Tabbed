import Home from './pages/Home'
import Nav from './components/Global/Nav'
import Flag from './components/Global/Flag'
import Hint from './components/Global/Hint'

export default function App() {
  return (
    <Nav>
      <Flag />
      <Home />
      <Hint />
    </Nav>
  )
}