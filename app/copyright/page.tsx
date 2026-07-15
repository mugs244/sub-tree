import Link from "next/link"
import { Placeholder, LegalPageHeader, Section, Clause } from "@/components/legal/LegalDoc"

export const metadata = { title: "Copyright & Intellectual Property Policy" }

export default function CopyrightPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
      <LegalPageHeader
        title="Sub-tree — Copyright & Intellectual Property Policy"
        effectiveDate="15 July 2026"
        lastUpdated="15 July 2026"
      />

      <div className="space-y-6 text-[15px] leading-relaxed">
        <p>
          Sub-tree respects intellectual property rights and expects its users to do the same. This policy
          explains how to report content on the Sub-tree platform (the &ldquo;<strong>Platform</strong>&rdquo;)
          that you believe infringes your copyright or other intellectual property rights, and how we respond. It
          forms part of our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>
          .
        </p>

        <p>
          We handle infringement in line with the <strong>Copyright and Neighbouring Rights Act, 2006</strong>{" "}of
          Uganda and other applicable law.
        </p>

        <hr className="border-border" />

        <Section n="1" title="Reporting infringement">
          <p>
            If you believe content on the Platform infringes your rights, send a notice to{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>{" "}
            including:
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Your name and contact details.</li>
            <li>Identification of the work you say is infringed (for example, a link to or description of the original).</li>
            <li>The location of the allegedly infringing content on the Platform (the profile URL and a description).</li>
            <li>A statement that you have a good-faith belief the use is not authorised by the rights holder, an agent, or the law.</li>
            <li>A statement that the information in your notice is accurate, and that you are the rights holder or authorised to act on their behalf.</li>
            <li>Your signature (physical or electronic).</li>
          </ol>
          <p>Submitting a false or bad-faith notice may expose you to liability.</p>
        </Section>

        <Section n="2" title="What we do with a notice">
          <p>When we receive a valid notice, we may:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>review the reported content;</li>
            <li>remove or disable access to it;</li>
            <li>notify the user who posted it and provide them a copy of the notice; and</li>
            <li>where appropriate, restrict or terminate accounts of repeat infringers.</li>
          </ul>
        </Section>

        <Section n="3" title="Counter-notice">
          <p>
            If your content was removed and you believe this was a mistake or that you have the right to use it,
            you may send a counter-notice to{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>{" "}
            including:
          </p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Your name and contact details.</li>
            <li>Identification of the content removed and where it appeared.</li>
            <li>
              A statement, under penalty of perjury or its equivalent under Ugandan law, that you have a good-faith
              belief the content was removed by mistake or misidentification.
            </li>
            <li>Your consent to the jurisdiction of the courts of Uganda.</li>
            <li>Your signature.</li>
          </ol>
          <p>
            We may restore the content if the original complainant does not pursue the matter within a reasonable
            period, unless we are otherwise required to keep it down.
          </p>
        </Section>

        <Section n="4" title="Repeat infringers">
          <p>
            We may suspend or terminate the accounts of users who repeatedly infringe intellectual property
            rights.
          </p>
        </Section>

        <Section n="5" title="Trademarks and impersonation">
          <p>
            Reports of trademark infringement or impersonation can be sent to the same address,{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>
            , with details identifying the mark and the infringing use. Impersonation is also prohibited under our{" "}
            <Link href="/acceptable-use" className="underline underline-offset-4">
              Acceptable Use Policy
            </Link>
            .
          </p>
        </Section>

        <Section n="6" title="Contact">
          <p>
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>{" "}
            — <Placeholder>[OPERATING ENTITY NAME — pending registration]</Placeholder>,{" "}
            <Placeholder>[REGISTERED ADDRESS]</Placeholder>.
          </p>
        </Section>
      </div>
    </div>
  )
}
