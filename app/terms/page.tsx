import Link from "next/link"
import { Placeholder, LegalPageHeader, Section, Clause } from "@/components/legal/LegalDoc"

export const metadata = { title: "Terms of Service" }

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
      <LegalPageHeader title="Sub-tree — Terms of Service" effectiveDate="15 July 2026" lastUpdated="15 July 2026" />

      <div className="space-y-6 text-[15px] leading-relaxed">
        <p>
          These Terms of Service (&ldquo;<strong>Terms</strong>&rdquo;) govern your access to and use of the
          Sub-tree platform, including our website, creator profiles, dashboard, links, gifting and donation
          features, analytics, and any related services (collectively, the &ldquo;<strong>Platform</strong>&rdquo;).
        </p>

        <p>
          The Platform is operated by <Placeholder>[OPERATING ENTITY NAME — pending registration]</Placeholder>, a
          company incorporated in Uganda with registration number{" "}
          <Placeholder>[REGISTRATION NO.]</Placeholder>, whose registered office is at{" "}
          <Placeholder>[REGISTERED ADDRESS]</Placeholder> (&ldquo;<strong>Sub-tree</strong>&rdquo;, &ldquo;
          <strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>our</strong>&rdquo;).
        </p>

        <p>
          By creating an account, accessing, or using the Platform, you agree to these Terms. If you do not agree,
          do not use the Platform.
        </p>

        <hr className="border-border" />

        <Section n="1" title="Who can use Sub-tree">
          <Clause n="1.1">
            You must be at least <strong>18 years old</strong>{" "}and capable of entering into a legally binding
            contract under the laws of Uganda. The Platform is not directed at, and may not be used by, anyone
            under 18.
          </Clause>
          <Clause n="1.2">
            If you use the Platform on behalf of an organisation, you represent that you are authorised to bind
            that organisation, and &ldquo;you&rdquo; refers to both you and that organisation.
          </Clause>
          <Clause n="1.3">
            You may not use the Platform if you are subject to sanctions, or located in a jurisdiction where use of
            the Platform would be unlawful.
          </Clause>
        </Section>

        <Section n="2" title="Accounts">
          <Clause n="2.1" lead="Registration.">
            Account creation and authentication are handled by our own account system, using secure session
            cookies and one-time email verification codes. You are responsible for keeping your login credentials
            confidential and for all activity that occurs under your account.
          </Clause>
          <Clause n="2.2" lead="Accurate information.">
            You agree to provide accurate, current, and complete information and to keep it up to date. This is
            particularly important for <strong>Creators</strong>{" "}who receive payouts, where identity and payout
            details must be accurate for verification and settlement.
          </Clause>
          <Clause n="2.3" lead="Account security.">
            Notify us immediately at{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>{" "}
            if you suspect unauthorised access to your account. We are not liable for losses arising from your
            failure to safeguard your credentials.
          </Clause>
        </Section>

        <Section n="3" title="The role Sub-tree plays">
          <Clause n="3.1">
            <strong>We are a technology platform, not a bank or payment service provider.</strong>{" "}Sub-tree
            provides software that allows Creators to publish a profile, share links, and receive gifts,
            donations, and other supporter payments from Supporters. Sub-tree is <strong>not</strong>{" "}a bank,
            deposit-taking institution, money transmitter, or payment service provider, and does not itself hold,
            transmit, or settle funds.
          </Clause>
          <Clause n="3.2">
            <strong>Payments are processed by licensed third parties.</strong>{" "}All movement of funds is carried out
            by our third-party payment partners, <strong>Pesapal and/or OpenFloat</strong>, which are licensed and
            regulated by the <strong>Bank of Uganda</strong>{" "}under the National Payment Systems Act, 2020. Your use
            of payment features is also subject to those partners&apos; own terms and privacy policies.
          </Clause>
          <Clause n="3.3" lead="No endorsement.">
            Sub-tree does not endorse any Creator, Supporter, or the content, causes, or campaigns they promote.
            Transactions are between the Supporter and the Creator; Sub-tree facilitates them through software
            only.
          </Clause>
        </Section>

        <Section n="4" title="Gifting, donations, and supporter payments">
          <Clause n="4.1" lead="Nature of payments.">
            Payments made through the Platform (gifts, tips, donations, or similar) are voluntary transfers of
            value from a Supporter to a Creator. Unless a Creator expressly offers a specific good or service in
            exchange, such payments do <strong>not</strong>{" "}entitle the Supporter to any product, service, refund,
            or return.
          </Clause>
          <Clause n="4.2" lead="Finality.">
            Because gifts and donations are voluntary and are typically paid out to Creators promptly, they are{" "}
            <strong>generally non-refundable</strong>. See our{" "}
            <Link href="/refunds" className="underline underline-offset-4">
              Refund &amp; Dispute Policy
            </Link>{" "}
            for the limited circumstances in which a refund or reversal may apply.
          </Clause>
          <Clause n="4.3" lead="Fees.">
            Sub-tree charges:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>a <strong>gifting fee</strong>{" "}— a percentage and/or fixed amount applied to each supporter payment; and</li>
              <li>a <strong>withdrawal fee</strong>{" "}— applied when a Creator withdraws funds, including a <strong>premium for instant payouts</strong>.</li>
            </ul>
            <p className="mt-2">
              Current fee rates are displayed in the dashboard and at{" "}
              <a href="https://sub-tree.com" className="underline underline-offset-4">sub-tree.com</a>, and may be
              updated from time to time under clause 12. Payment partner and network charges may also apply and
              are disclosed at the point of transaction where practicable.
            </p>
          </Clause>
          <Clause n="4.4" lead="Currency.">
            Unless stated otherwise, transactions are denominated in <strong>Ugandan Shillings (UGX)</strong>.
            Where a Supporter pays in another currency, conversion is handled by the payment partner at their
            applicable rate.
          </Clause>
        </Section>

        <Section n="5" title="Creator terms and payouts">
          <Clause n="5.1" lead="Verification (KYC).">
            Before a Creator can withdraw funds, we (or our payment partners) may require identity verification and
            payout account details. We may delay, limit, or withhold a payout where verification is incomplete,
            information is inconsistent, or we reasonably suspect fraud or unlawful activity.
          </Clause>
          <Clause n="5.2" lead="Payout schedule.">
            Payouts are made to a Creator&apos;s nominated account through our payment partners. Standard payouts
            are subject to processing times set by the payment partner; <strong>instant payouts</strong>{" "}are
            available for the premium withdrawal fee described in clause 4.3.
          </Clause>
          <Clause n="5.3" lead="Minimums and holds.">
            We may set minimum withdrawal thresholds and may place reasonable holds on funds where required to
            investigate suspected fraud, chargebacks, disputes, or breaches of these Terms, or to comply with law
            or payment partner requirements.
          </Clause>
          <Clause n="5.4" lead="Taxes.">
            Creators are solely responsible for determining, reporting, and paying any taxes due on amounts they
            receive, including any obligations to the <strong>Uganda Revenue Authority (URA)</strong>. Sub-tree
            does not provide tax advice and, unless required by law, does not withhold tax on Creators&apos;
            behalf.
          </Clause>
          <Clause n="5.5" lead="Creator content and offers.">
            If a Creator offers any specific good, service, subscription, or benefit in return for payment, that
            arrangement is a direct contract between the Creator and the Supporter. The Creator is responsible for
            delivering it, and for any refund, warranty, or consumer-protection obligation arising from it.
          </Clause>
        </Section>

        <Section n="6" title="Acceptable use">
          <Clause n="6.1">
            Your use of the Platform must comply with our{" "}
            <Link href="/acceptable-use" className="underline underline-offset-4">
              Acceptable Use Policy
            </Link>
            , which forms part of these Terms. In summary, you must not use the Platform for fraud, money
            laundering, illegal content, harassment, infringement of others&apos; rights, or any unlawful purpose.
          </Clause>
          <Clause n="6.2">
            We may investigate suspected breaches and may suspend or terminate access, remove content, reverse or
            withhold funds, and report to authorities where we reasonably believe it is necessary.
          </Clause>
        </Section>

        <Section n="7" title="Content and intellectual property">
          <Clause n="7.1" lead="Your content.">
            You retain ownership of the content you post (profile information, links, images, text, and other
            material — &ldquo;<strong>Your Content</strong>&rdquo;). You grant Sub-tree a worldwide, non-exclusive,
            royalty-free licence to host, store, reproduce, display, and distribute Your Content{" "}
            <strong>solely</strong>{" "}for the purpose of operating, promoting, and improving the Platform. This
            licence ends when you delete Your Content or your account, except for content already shared with
            others and reasonable backup copies.
          </Clause>
          <Clause n="7.2" lead="Your responsibility.">
            You represent that you own or have the necessary rights to Your Content and that it does not infringe
            any third party&apos;s rights or violate any law.
          </Clause>
          <Clause n="7.3" lead="Our platform.">
            The Platform itself — including its software, design, trademarks, and the &ldquo;Sub-tree&rdquo; name
            and branding — is owned by Sub-tree or its licensors and is protected by intellectual property laws.
            You may not copy, modify, reverse-engineer, or create derivative works from the Platform except as
            permitted by law.
          </Clause>
          <Clause n="7.4" lead="Infringement.">
            If you believe content on the Platform infringes your intellectual property, follow the process in our{" "}
            <Link href="/copyright" className="underline underline-offset-4">
              Copyright Policy
            </Link>
            .
          </Clause>
        </Section>

        <Section n="8" title="Third-party services">
          <p>
            The Platform relies on and links to third-party services, including Pesapal and OpenFloat (payments),
            Vercel (hosting and web analytics), and Resend (transactional email). Your use of those services is
            governed by their terms and privacy policies. We are not responsible for third-party services, and
            their availability is outside our control.
          </p>
        </Section>

        <Section n="9" title="Availability and changes to the Platform">
          <Clause n="9.1">
            We aim to keep the Platform available but do not guarantee uninterrupted or error-free operation. We
            may modify, suspend, or discontinue features at any time.
          </Clause>
          <Clause n="9.2">
            The Platform is provided on an &ldquo;<strong>as is</strong>&rdquo; and &ldquo;
            <strong>as available</strong>&rdquo; basis. To the fullest extent permitted by law, we disclaim all
            warranties not expressly stated in these Terms.
          </Clause>
        </Section>

        <Section n="10" title="Limitation of liability">
          <Clause n="10.1">
            To the fullest extent permitted by the laws of Uganda:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Sub-tree is not liable for any indirect, incidental, special, consequential, or punitive loss, or for loss of profits, revenue, data, or goodwill;</li>
              <li>Sub-tree is not liable for the acts, omissions, content, or conduct of any Creator, Supporter, or third party, including the delivery or non-delivery of any good or service a Creator offers;</li>
              <li>Sub-tree is not liable for losses caused by our payment partners, authentication provider, hosting provider, or other third parties.</li>
            </ul>
          </Clause>
          <Clause n="10.2">
            Where liability cannot lawfully be excluded, our total aggregate liability to you arising out of or in
            connection with the Platform is limited to the greater of (a) the total fees you paid to Sub-tree in
            the <strong>three (3) months</strong>{" "}preceding the event giving rise to the claim, or (b){" "}
            <Placeholder>UGX [AMOUNT — TBD]</Placeholder>.
          </Clause>
          <Clause n="10.3">
            Nothing in these Terms excludes liability that cannot be excluded under Ugandan law, including for
            fraud or death or personal injury caused by negligence.
          </Clause>
        </Section>

        <Section n="11" title="Indemnity">
          <p>
            You agree to indemnify and hold harmless Sub-tree, its officers, employees, and agents from any
            claims, losses, or expenses (including reasonable legal fees) arising from your breach of these Terms,
            your content, or your use of the Platform, to the extent permitted by law.
          </p>
        </Section>

        <Section n="12" title="Changes to these Terms">
          <p>
            We may update these Terms from time to time. If we make material changes, we will give reasonable
            notice — for example, by posting the updated Terms on the Platform and updating the &ldquo;Last
            updated&rdquo; date, and, where appropriate, by notifying you directly. Your continued use after
            changes take effect constitutes acceptance. If you do not agree, you must stop using the Platform.
          </p>
        </Section>

        <Section n="13" title="Suspension and termination">
          <Clause n="13.1">
            You may stop using the Platform and delete your account at any time. Certain obligations survive
            termination, including outstanding fees, payout reconciliation, indemnities, and limitations of
            liability.
          </Clause>
          <Clause n="13.2">
            We may suspend or terminate your access, with or without notice, if you breach these Terms, if
            required by law or a payment partner, or to protect the Platform, other users, or third parties. Where
            funds are involved, we will make reasonable efforts to reconcile and release amounts lawfully due to
            you, subject to any holds under clause 5.3.
          </Clause>
        </Section>

        <Section n="14" title="Governing law and disputes">
          <Clause n="14.1">
            These Terms are governed by the <strong>laws of Uganda</strong>.
          </Clause>
          <Clause n="14.2">
            The <strong>courts of Uganda</strong>{" "}have exclusive jurisdiction over any dispute arising out of or in
            connection with these Terms, though we may first ask you to attempt to resolve the matter informally
            by contacting{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>
            .
          </Clause>
        </Section>

        <Section n="15" title="General">
          <Clause n="15.1" lead="Entire agreement.">
            These Terms, together with the policies referenced in them, form the entire agreement between you and
            Sub-tree regarding the Platform.
          </Clause>
          <Clause n="15.2" lead="Severability.">
            If any provision is found unenforceable, the rest remains in effect.
          </Clause>
          <Clause n="15.3" lead="No waiver.">
            Our failure to enforce a provision is not a waiver of it.
          </Clause>
          <Clause n="15.4" lead="Assignment.">
            You may not assign these Terms without our consent. We may assign them to an affiliate or successor,
            including within our corporate group.
          </Clause>
          <Clause n="15.5" lead="Contact.">
            Questions about these Terms:{" "}
            <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
              admin@sub-tree.com
            </a>
            , <Placeholder>[OPERATING ENTITY NAME — pending registration]</Placeholder>,{" "}
            <Placeholder>[REGISTERED ADDRESS]</Placeholder>.
          </Clause>
        </Section>
      </div>
    </div>
  )
}
