import Link from "next/link"
import { LegalPageHeader, Section } from "@/components/legal/LegalDoc"

export const metadata = { title: "Acceptable Use Policy" }

export default function AcceptableUsePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
      <LegalPageHeader
        title="Sub-tree — Acceptable Use Policy"
        effectiveDate="15 July 2026"
        lastUpdated="15 July 2026"
      />

      <div className="space-y-6 text-[15px] leading-relaxed">
        <p>
          This Acceptable Use Policy (&ldquo;<strong>AUP</strong>&rdquo;) sets out what you may and may not do on
          the Sub-tree platform (the &ldquo;<strong>Platform</strong>&rdquo;). It forms part of, and is
          incorporated into, our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>
          . Breaching this AUP may lead to content removal, account suspension or termination, withholding or
          reversal of funds, and reporting to authorities.
        </p>

        <p>
          Because Sub-tree handles the movement of money and is evolving toward a fuller creator and social
          platform, we take misuse — especially fraud and financial abuse — seriously.
        </p>

        <hr className="border-border" />

        <Section n="1" title="General principle">
          <p>
            You may use the Platform only for lawful purposes and in a way that respects the rights and safety of
            others. You are responsible for everything you post, link to, and do through your account.
          </p>
        </Section>

        <Section n="2" title="Prohibited content and conduct">
          <p>You must not use the Platform to create, post, link to, fund, or promote:</p>

          <div>
            <p className="font-medium">Illegal activity and fraud</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Anything illegal under the laws of Uganda or another applicable jurisdiction.</li>
              <li>Fraud, scams, deceptive fundraising, fake causes, or misrepresenting who you are or what a payment is for.</li>
              <li>Money laundering, terrorist financing, or moving proceeds of crime.</li>
              <li>Pyramid, Ponzi, or similar schemes.</li>
            </ul>
          </div>

          <div>
            <p className="font-medium">Financial abuse</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Using the Platform to launder, test, or cash out stolen payment credentials.</li>
              <li>Deliberately generating chargebacks, or colluding to abuse gifts, fees, or payouts.</li>
              <li>Circumventing fees, verification (KYC), holds, or account restrictions.</li>
            </ul>
          </div>

          <div>
            <p className="font-medium">Harm to others</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Harassment, bullying, threats, or incitement to violence.</li>
              <li>Hate speech or content that attacks people based on protected characteristics.</li>
              <li>Content that sexualises minors in any form. This is strictly prohibited and will be reported to authorities.</li>
              <li>Non-consensual intimate imagery, or sharing others&apos; private information (doxxing).</li>
            </ul>
          </div>

          <div>
            <p className="font-medium">Rights and safety</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Infringing anyone&apos;s intellectual property (see our{" "}
                <Link href="/copyright" className="underline underline-offset-4">
                  Copyright Policy
                </Link>
                ).
              </li>
              <li>Malware, phishing, or links intended to harm devices, steal data, or deceive.</li>
              <li>Impersonating another person, brand, or Sub-tree itself.</li>
            </ul>
          </div>

          <div>
            <p className="font-medium">Regulated and restricted goods</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Selling or funding regulated, restricted, or dangerous goods and services where doing so is
                unlawful or violates our payment partners&apos; rules — for example, illegal drugs, weapons, or
                counterfeit goods.
              </li>
            </ul>
          </div>
        </Section>

        <Section n="3" title="Adult content">
          <p>
            Sexually explicit or pornographic content is <strong>not permitted</strong>{" "}on the Platform.
          </p>
          <p>
            Note that our payment partners (Pesapal / OpenFloat) may independently restrict certain categories of
            content, and their rules apply in addition to ours.
          </p>
        </Section>

        <Section n="4" title="Platform integrity">
          <p>You must not:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>access the Platform through automated means (bots, scrapers) except as we expressly allow;</li>
            <li>interfere with, overload, or disrupt the Platform or its infrastructure;</li>
            <li>probe, scan, or test the vulnerability of the Platform without our written permission;</li>
            <li>attempt to bypass security, authentication, or rate limits; or</li>
            <li>reverse-engineer or copy the Platform except as permitted by law.</li>
          </ul>
        </Section>

        <Section n="5" title="Reporting violations">
          <p>
            If you see content or conduct that breaches this AUP, report it to{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>{" "}
            with enough detail for us to investigate.
          </p>
        </Section>

        <Section n="6" title="Enforcement">
          <p>We may, at our discretion and where reasonable:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>remove or restrict content;</li>
            <li>suspend or terminate accounts;</li>
            <li>place holds on, withhold, or reverse funds connected to prohibited activity;</li>
            <li>cooperate with law enforcement and regulators; and</li>
            <li>take any other step required by law or our payment partners.</li>
          </ul>
          <p>
            We aim to act proportionately, but we may act immediately where there is a risk of harm, fraud, or
            legal liability.
          </p>
        </Section>
      </div>
    </div>
  )
}
