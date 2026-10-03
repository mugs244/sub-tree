// The head-and-shoulders placeholder shown when someone has no profile photo,
// like WhatsApp's default picture. Fills its box; the parent sets the circle
// and background, this draws the figure.
export function DefaultAvatar({ color = "#ffffff", className = "h-full w-full" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="38" r="18" fill={color} />
      <path d="M14 100c2-20 17-33 36-33s34 13 36 33z" fill={color} />
    </svg>
  )
}
