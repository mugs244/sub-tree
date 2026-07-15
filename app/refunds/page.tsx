import Link from "next/link"
import { Placeholder, LegalPageHeader, Section, Clause } from "@/components/legal/LegalDoc"

export const metadata = { title: "Refund & Dispute Policy" }

export default function RefundsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
      <LegalPageHeader
        title="Sub-tree — Refund & Dispute Policy"
        effectiveDate="15 July 2026"
        lastUpdated="15 July 2026"
      />

      <div className="space-y-6 text-[15px] leading-relaxed">
        <p>
          This policy explains how refunds, reversals, and disputes work on the Sub-tree platform (the &ldquo;
          <strong>Platform</strong>&rdquo;). It forms part of our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>
          .
        </p>

        <p>
          Remember that <strong>Sub-tree is a technology platform, not a payment service provider.</strong>{" "}Funds
          are processed by our licensed payment partners, <strong>Pesapal and OpenFloat</strong>{" "}(regulated by the
          Bank of Uganda). Their rules also apply to any refund or reversal.
        </p>

        <hr className="border-border" />

        <Section n="1" title="Gifts and donations are generally non-refundable">
          <p>
            Gifts, tips, and donations sent through the Platform are <strong>voluntary transfers</strong>{" "}from a
            Supporter to a Creator. Once a payment is made and funds are made available to the Creator, it is
            generally <strong>final and non-refundable</strong>, because:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>the payment is a voluntary gift, not a purchase of goods or services; and</li>
            <li>Creators may withdraw funds promptly (including via instant payout).</li>
          </ul>
          <p>Please make sure you intend to support the Creator before you send a payment.</p>
        </Section>

        <Section n="2" title="When a refund or reversal may still apply">
          <p>We will review a request for a refund or reversal in limited circumstances, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Unauthorised or fraudulent payment</strong>{" "}— for example, a payment made using a payment
              method without the owner&apos;s authorisation.
            </li>
            <li>
              <strong>Duplicate or erroneous charge</strong>{" "}— a clear technical error resulted in you being
              charged more than once or the wrong amount.
            </li>
            <li>
              <strong>Failed delivery of a promised benefit</strong>{" "}— where a Creator expressly offered a specific
              good, service, or benefit in exchange for payment and did not deliver it (see clause 4).
            </li>
            <li>
              <strong>Where required by law</strong>{" "}or by our payment partners&apos; rules.
            </li>
          </ul>
          <p>
            Refunds, where approved, are made through the original payment method via our payment partners and may
            take time to process. Fees already incurred may not always be recoverable.
          </p>
        </Section>

        <Section n="3" title="How to request a refund">
          <p>
            Contact us at{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>{" "}
            as soon as possible, and within <strong>14 days</strong>{" "}of the transaction, with:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>the transaction reference,</li>
            <li>the date and amount,</li>
            <li>the Creator involved, and</li>
            <li>the reason for your request.</li>
          </ul>
          <p>
            We will acknowledge your request and aim to respond within <strong>7–14 days</strong>. We may ask for
            more information and may consult the relevant Creator and our payment partners.
          </p>
        </Section>

        <Section n="4" title="Creator-offered goods and services">
          <p>
            If a Creator offered a specific good, service, subscription, or benefit in exchange for payment, that
            is a <strong>direct contract between the Supporter and the Creator</strong>. The Creator is responsible
            for delivering it and for handling any refund. Sub-tree may help mediate but is not a party to that
            contract and is not liable for the Creator&apos;s delivery or non-delivery. See clause 5 of the{" "}
            <Link href="/terms" className="underline underline-offset-4">
              Terms of Service
            </Link>
            .
          </p>
        </Section>

        <Section n="5" title="Chargebacks">
          <p>
            If you dispute a payment directly with your bank or mobile-money provider (a &ldquo;chargeback&rdquo;)
            instead of contacting us first, we ask that you contact{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>{" "}
            so we can try to resolve it faster. Note that:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              we may place a <strong>hold on the disputed amount</strong>{" "}and, where the funds have been paid out,
              may recover them from the Creator&apos;s balance;
            </li>
            <li>Creators may be charged any chargeback fees imposed by the payment partners; and</li>
            <li>
              repeated or abusive chargebacks may lead to account suspension under our{" "}
              <Link href="/acceptable-use" className="underline underline-offset-4">
                Acceptable Use Policy
              </Link>
              .
            </li>
          </ul>
        </Section>

        <Section n="6" title="Creator payout disputes">
          <p>
            If you are a Creator and believe a payout is incorrect, delayed, or missing, contact{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>{" "}
            with your account details and the relevant transaction references. Payouts may be delayed or held
            where required for verification, fraud investigation, chargebacks, or legal compliance, as described in
            the Terms of Service.
          </p>
        </Section>

        <Section n="7" title="Fraud and abuse">
          <p>
            Fraudulent refund or chargeback claims, or attempts to abuse this policy, are prohibited and may lead
            to loss of access, withholding of funds, and reporting to authorities.
          </p>
        </Section>

        <Section n="8" title="Contact">
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
