export default function Hint() {
  return (
    <div className="fixed bottom-0 right-0 z-50 flex items-center gap-2 rounded-tl-xl border-l-2 border-t-2 border-ink bg-ink px-4 py-2 font-body text-sm text-cream">
      <span className="key rounded-md bg-pink px-2 py-0.5 text-xs font-bold">↑↓←→</span>
      <span>Navigate</span>
      <span className="text-dim">•</span>
      <span className="key rounded-md bg-pink px-2 py-0.5 text-xs font-bold">Enter</span>
      <span>Confirm</span>
    </div>
  )
}