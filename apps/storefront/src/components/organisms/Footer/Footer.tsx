import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import footerLinks from "@/data/footerLinks"

export function Footer() {
  return (
    <footer className="bg-primary container" data-testid="footer">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="p-6 border rounded-sm" data-testid="footer-customer-services">
          <h2 className="heading-sm text-primary mb-3 uppercase">
            Customer services
          </h2>
          <nav className="space-y-3" aria-label="Customer services navigation">
            {footerLinks.customerServices.map(({ label, path }) => (
              <FooterLink key={label} label={label} path={path} />
            ))}
          </nav>
        </div>

        <div className="p-6 border rounded-sm" data-testid="footer-about">
          <h2 className="heading-sm text-primary mb-3 uppercase">About</h2>
          <nav className="space-y-3" aria-label="About navigation">
            {footerLinks.about.map(({ label, path }) => (
              <FooterLink key={label} label={label} path={path} />
            ))}
          </nav>
        </div>

        <div className="p-6 border rounded-sm" data-testid="footer-connect">
          <h2 className="heading-sm text-primary mb-3 uppercase">connect</h2>
          <nav className="space-y-3" aria-label="Social media navigation">
            {footerLinks.connect.map(({ label, path }) => (
              <FooterLink key={label} label={label} path={path} />
            ))}
          </nav>
        </div>
      </div>

      <div className="py-6 border rounded-sm " data-testid="footer-copyright">
        <p className="text-md text-secondary text-center ">
          © {new Date().getFullYear()} Sub-shop · Marketiffy Technologies Limited
        </p>
      </div>
    </footer>
  )
}

// Sub-tree pages and email are external; only storefront paths get the
// region prefix from LocalizedClientLink.
function FooterLink({ label, path }: { label: string; path: string }) {
  const testId = `footer-link-${label.toLowerCase().replace(/\s+/g, "-")}`
  if (/^(https?:|mailto:)/.test(path)) {
    const external = path.startsWith("http")
    return (
      <a
        href={path}
        className="block label-md"
        data-testid={testId}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {label}
      </a>
    )
  }
  return (
    <LocalizedClientLink href={path} className="block label-md" data-testid={testId}>
      {label}
    </LocalizedClientLink>
  )
}
