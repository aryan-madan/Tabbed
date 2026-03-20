"use client";
import { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot  = dotRef.current!;
    const ring = ringRef.current!;
    const spot = spotRef.current!;
    let mx = -100, my = -100, rx = -100, ry = -100;

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
    function tick() {
      rx = lerp(rx, mx, 0.13); ry = lerp(ry, my, 0.13);
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(tick);
    }
    tick();

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
      spot.style.setProperty("--mx", mx + "px");
      spot.style.setProperty("--my", my + "px");
    };
    const onLeave = () => { dot.style.opacity = "0"; ring.style.opacity = "0"; };
    const onEnter = () => { dot.style.opacity = ""; ring.style.opacity = ""; };
    const onDown  = (e: MouseEvent) => { document.body.classList.add("cur-click"); spawnBurst(e.clientX, e.clientY); };
    const onUp    = () => document.body.classList.remove("cur-click");
    const sel     = "a, button, [tabindex]";
    const onOver  = (e: MouseEvent) => { if ((e.target as Element).closest(sel)) document.body.classList.add("cur-hover"); };
    const onOut   = (e: MouseEvent) => { if ((e.target as Element).closest(sel)) document.body.classList.remove("cur-hover"); };

    function spawnBurst(x: number, y: number) {
      const w = document.createElement("div");
      w.className = "cur-burst";
      w.style.left = x + "px"; w.style.top = y + "px";
      for (let i = 0; i < 7; i++) {
        const s = document.createElement("span");
        const a = (i / 7) * Math.PI * 2;
        const d = 12 + Math.random() * 8;
        s.style.setProperty("--tx", `translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`);
        w.appendChild(s);
      }
      document.body.appendChild(w);
      setTimeout(() => w.remove(), 450);
    }

    document.addEventListener("mousemove",  onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mousedown",  onDown);
    document.addEventListener("mouseup",    onUp);
    document.addEventListener("mouseover",  onOver);
    document.addEventListener("mouseout",   onOut);
    return () => {
      document.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mousedown",  onDown);
      document.removeEventListener("mouseup",    onUp);
      document.removeEventListener("mouseover",  onOver);
      document.removeEventListener("mouseout",   onOut);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cur-dot" />
      <div ref={ringRef} className="cur-ring" />
      <div ref={spotRef} className="spotlight" style={{"--mx":"-100px","--my":"-100px"} as React.CSSProperties} />
    </>
  );
}
