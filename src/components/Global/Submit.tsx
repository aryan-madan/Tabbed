import { useEffect, useRef } from 'react'
import { useNav } from './Nav'

export default function Submit() {
  const ref = useRef<HTMLDivElement>(null)
  const key = useNav<HTMLButtonElement>()

  useEffect(() => {
    if (document.querySelector('script[src="https://server.fillout.com/embed/v1/"]')) return
    const script = document.createElement('script')
    script.src = 'https://server.fillout.com/embed/v1/'
    document.body.appendChild(script)
  }, [])

  return (
    <div ref={ref} className="submit">
      <div data-fillout-id="dao8UxtPX3us" data-fillout-embed-type="slider" data-fillout-slider-direction="right" data-fillout-inherit-parameters="true" data-fillout-domain="forms.hackclub.com" data-fillout-popup-size="medium" />
      <button ref={key} onClick={() => ref.current?.querySelector<HTMLElement>('button')?.click()} className="press cta">Submit</button>
    </div>
  )
}
