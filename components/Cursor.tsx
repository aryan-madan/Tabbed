"use client";
import { useEffect, useRef } from "react";

export default function Cursor({ mode }: { mode: string }) {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "keys") return;
    const d = dot.current!;
    const r = ring.current!;
    const s = spot.current!;
    let mx = -100, my = -100, rx = -100, ry = -100;

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
    function tick() {
      rx = lerp(rx, mx, 0.13); ry = lerp(ry, my, 0.13);
      r.style.left = rx + "px"; r.style.top = ry + "px";
      requestAnimationFrame(tick);
    }
    tick();

    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      d.style.left = mx + "px"; d.style.top = my + "px";
      s.style.setProperty("--x", mx + "px");
      s.style.setProperty("--y", my + "px");
    };
    const leave = () => { d.style.opacity = "0"; r.style.opacity = "0"; };
    const enter = () => { d.style.opacity = "1"; r.style.opacity = "1"; };
    const down  = (e: MouseEvent) => { document.body.classList.add("click"); burst(e.clientX, e.clientY); };
    const up    = () => document.body.classList.remove("click");
    const sel   = "a, button, [tabindex]";
    const over  = (e: MouseEvent) => { if ((e.target as Element).closest(sel)) document.body.classList.add("hover"); };
    const out   = (e: MouseEvent) => { if ((e.target as Element).closest(sel)) document.body.classList.remove("hover"); };

    function burst(x: number, y: number) {
      const w = document.createElement("div");
      w.className = "burst";
      w.style.left = x + "px"; w.style.top = y + "px";
      for (let i = 0; i < 7; i++) {
        const p = document.createElement("span");
        const a = (i / 7) * Math.PI * 2;
        const dist = 12 + Math.random() * 8;
        p.style.setProperty("--tx", `translate(${Math.cos(a)*dist}px,${Math.sin(a)*dist}px)`);
        w.appendChild(p);
      }
      document.body.appendChild(w);
      setTimeout(() => w.remove(), 450);
    }

    document.addEventListener("mousemove",  move);
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);
    document.addEventListener("mousedown",  down);
    document.addEventListener("mouseup",    up);
    document.addEventListener("mouseover",  over);
    document.addEventListener("mouseout",   out);
    return () => {
      document.removeEventListener("mousemove",  move);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
      document.removeEventListener("mousedown",  down);
      document.removeEventListener("mouseup",    up);
      document.removeEventListener("mouseover",  over);
      document.removeEventListener("mouseout",   out);
    };
  }, [mode]);

  if (mode === "keys") return null;

  return (
    <>
      <div ref={dot}  className="dot" />
      <div ref={ring} className="ring" />
      <div ref={spot} className="spot" style={{"--x":"-100px","--y":"-100px"} as React.CSSProperties} />
    </>
  );
}
