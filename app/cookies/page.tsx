import { LegalPageHeader, Section } from "@/components/legal/LegalDoc"
import { CookiePreferencesButton } from "@/components/CookiePreferencesButton"

export const metadata = { title: "Cookie Policy" }

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
      <LegalPageHeader title="Sub-tree — Cookie Policy" effectiveDate="15 July 2026" lastUpdated="15 July 2026" />

      <div className="space-y-6 text-[15px] leading-relaxed">
        <p>
          This Cookie Policy explains how the Sub-tree platform (the &ldquo;<strong>Platform</strong>&rdquo;) uses
          cookies and similar technologies. It should be read together with our Privacy Policy.
        </p>

        <hr className="border-border" />

        <Section n="1" title="What cookies are">
          <p>
            Cookies are small text files placed on your device when you visit a website. Similar technologies
            include local storage, pixels, and SDKs. They let a site remember your actions and preferences, keep
            you signed in, and understand how the site is used.
          </p>
        </Section>

        <Section n="2" title="Types of cookies we use">
          <div>
            <p className="font-medium">Strictly necessary cookies</p>
            <p>
              Required for the Platform to work: a session cookie that signs you in and keeps your session secure,
              and a short-lived cookie that remembers your plan selection while you complete sign-up. The Platform
              cannot function properly without these, so they are not subject to consent.
            </p>
          </div>

          <div>
            <p className="font-medium">Analytics cookies</p>
            <p>
              With your consent, we use <strong>Vercel Web Analytics</strong>{" "}to understand how the Platform is
              used — pages visited, approximate location, and device type. This service is{" "}
              <strong>cookieless</strong>: it does not set a cookie or store a persistent identifier on your
              device. We still ask for your consent before enabling it, via the banner shown on your first visit.
            </p>
          </div>

          <div>
            <p className="font-medium">Functional cookies</p>
            <p>We do not currently use any functional cookies beyond those listed as strictly necessary above.</p>
          </div>
        </Section>

        <Section n="3" title="Third-party cookies">
          <p>Some cookies or similar technologies may be set by third parties whose services we use, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Payment partners (Pesapal / OpenFloat)</strong>{" "}— may set cookies during the payment flow.
            </li>
          </ul>
          <p>These third parties process data under their own privacy and cookie policies.</p>
        </Section>

        <Section n="4" title="Your choices">
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Consent banner:</strong>{" "}we ask for your consent to analytics cookies when you first visit,
              and you can change your choice at any time — <CookiePreferencesButton />.
            </li>
            <li>
              <strong>Browser controls:</strong>{" "}you can block or delete cookies through your browser settings.
              Blocking strictly necessary cookies may stop parts of the Platform — including sign-in — from
              working.
            </li>
          </ul>
        </Section>

        <Section n="5" title="Changes">
          <p>
            We may update this Cookie Policy from time to time. The &ldquo;Last updated&rdquo; date shows when it
            last changed.
          </p>
        </Section>

        <Section n="6" title="Contact">
          <p>
            Questions about cookies:{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  )
}
