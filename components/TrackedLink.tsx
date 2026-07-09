"use client"

interface TrackedLinkProps {
  href: string
  linkId: number
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function TrackedLink({ href, linkId, children, className, style }: TrackedLinkProps) {
  function handleClick() {
    fetch(`/api/links/${linkId}/click`, { method: "POST" }).catch(() => {})
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  )
}
