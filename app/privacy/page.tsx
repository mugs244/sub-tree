import Link from "next/link"
import { LegalPageHeader, Section } from "@/components/legal/LegalDoc"

export const metadata = { title: "Privacy Policy" }

const Email = () => (
  <a href="mailto:admin@sub-tree.com" className="underline underline-offset-4">
    admin@sub-tree.com
  </a>
)

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
      <LegalPageHeader title="Sub-tree — Privacy Policy" effectiveDate="2 October 2026" lastUpdated="2 October 2026" />

      <div className="space-y-6 text-[15px] leading-relaxed">
        <p>
          This Privacy Policy explains what personal data the Sub-tree platform (the &ldquo;<strong>Platform</strong>&rdquo;)
          collects, why, who we share it with, how long we keep it, and the rights you have. Sub-tree is operated by{" "}
          <strong>Marketiffy Technologies Limited</strong>, a company incorporated in Uganda (&ldquo;<strong>Sub-tree</strong>&rdquo;,
          &ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;), which is the data controller for the
          personal data described here.
        </p>
        <p>
          We process personal data in line with Uganda&apos;s <strong>Data Protection and Privacy Act, 2019</strong>{" "}and
          its regulations. This policy forms part of our{" "}
          <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link> and should be read with our{" "}
          <Link href="/cookies" className="underline underline-offset-4">Cookie Policy</Link>.
        </p>

        <hr className="border-border" />

        <Section n="1" title="Who this policy covers">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Creators</strong> — people who have a Sub-tree account and page;</li>
            <li><strong>Supporters</strong> — people who send a gift or donation to a Creator, with or without an account; and</li>
            <li><strong>Visitors</strong> — anyone who views the Platform or a Creator&apos;s page.</li>
          </ul>
        </Section>

        <Section n="2" title="What we collect">
          <div>
            <p className="font-medium">Account and profile</p>
            <p>
              Your email address, username, password (stored only as a secure hash, never in readable form), and, if you
              sign in with Google, your Google account email and name. What you add to your page: display name, photo,
              bio, links, template choice and country.
            </p>
          </div>
          <div>
            <p className="font-medium">Contact and payout details</p>
            <p>
              Your phone number, the mobile money number you receive and withdraw to, and, if you add one, your bank name,
              account name and account number.
            </p>
          </div>
          <div>
            <p className="font-medium">Payments and wallet</p>
            <p>
              Records of gifts and donations you send or receive (amount, date, payment method, status, the
              supporter&apos;s name and message if they give one, and the supporter&apos;s mobile money number where that
              method is used), withdrawals, fees, invoices and receipts. We do <strong>not</strong>{" "}receive or store full
              card numbers — card payments are handled entirely by our payment partner.
            </p>
          </div>
          <div>
            <p className="font-medium">Identity verification (verified badge)</p>
            <p>
              If you apply for the verified badge, you photograph your national ID (front and back) and take a face scan
              through our verification partner, <strong>Smile ID</strong>. Smile ID checks them and tells us the result. We
              keep the result, the date, and the full name shown on your ID. We do <strong>not</strong>{" "}keep your ID
              number or date of birth. See section 6 for how long ID photos are kept.
            </p>
          </div>
          <div>
            <p className="font-medium">Security and device information</p>
            <p>
              When you sign in or request a code, we record the device and browser type, the time, and an approximate
              location (city and country) worked out from your IP address. We use this to show you sign-in alerts and to
              detect suspicious activity. We also keep one-time codes, which expire within minutes.
            </p>
          </div>
          <div>
            <p className="font-medium">Usage and messages</p>
            <p>
              Page views and link clicks on Creator pages (shown to the Creator as totals), messages you send to our support
              team, and — only if you agree — analytics about how the Platform is used (see our Cookie Policy).
            </p>
          </div>
        </Section>

        <Section n="3" title="Why we use it">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>To provide the Platform</strong>{" "}— run your account and page, process gifts, show your balance, and send withdrawals (performance of our contract with you).</li>
            <li><strong>To keep accounts and money safe</strong>{" "}— sign-in codes, withdrawal codes, alerts about password, email, number and bank changes, and fraud prevention (our legitimate interest and your security).</li>
            <li><strong>To verify identity</strong>{" "}— only when you apply for the verified badge (your consent, which you give when you start the check).</li>
            <li><strong>To send you messages</strong>{" "}— receipts, gift notifications, billing reminders and service updates by email, and codes or security alerts by SMS.</li>
            <li><strong>To meet legal obligations</strong>{" "}— keeping financial records, responding to lawful requests, and anti-money-laundering requirements of our payment partners.</li>
            <li><strong>To improve the Platform</strong>{" "}— understanding usage through analytics, only with your consent.</li>
          </ul>
          <p>We do not sell your personal data, and we do not use it for advertising.</p>
        </Section>

        <Section n="4" title="What is public">
          <p>
            Your Creator page is public by design: your display name, username, photo, bio, links and verified badge can be
            seen by anyone and may appear in search engines. Your email, phone numbers, bank details, balance and
            transaction history are never shown on your page.
          </p>
        </Section>

        <Section n="5" title="Who we share it with">
          <p>We share personal data only with service providers who need it to run the Platform, under contracts that require them to protect it:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Payment partners</strong>{" "}— Pesapal and OpenFloat (both regulated by the Bank of Uganda), and MTN and Airtel mobile money — to collect gifts and payments and to send withdrawals;</li>
            <li><strong>Smile ID</strong>{" "}— identity verification for the verified badge;</li>
            <li><strong>Resend</strong>{" "}— sending emails;</li>
            <li><strong>eSMS Africa</strong>{" "}— sending SMS codes and security alerts;</li>
            <li><strong>Supabase</strong>{" "}— Google sign-in;</li>
            <li><strong>Vercel</strong>{" "}— hosting, file storage for profile photos, and analytics (with consent); and</li>
            <li><strong>Railway</strong>{" "}— database hosting.</li>
          </ul>
          <p>
            We may also disclose data where the law requires it, to protect the rights and safety of our users or the
            public, or as part of a merger or sale of our business (in which case this policy continues to apply).
          </p>
        </Section>

        <Section n="6" title="How long we keep it">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account and profile</strong>{" "}— while your account is open. When you delete your account, your page and profile are removed and your username is freed.</li>
            <li><strong>Payment, withdrawal and invoice records</strong>{" "}— for as long as tax, accounting and financial regulations require, even after your account is deleted.</li>
            <li>
              <strong>ID photos and face scans</strong>{" "}— normally not kept by Sub-tree at all. If Smile ID asks for a
              person to review your check, we keep encrypted copies only so our team can decide, then delete them as soon as
              the decision is made, and in any case within <strong>30 days</strong>.
            </li>
            <li><strong>One-time codes</strong>{" "}— expire within 10–15 minutes.</li>
            <li><strong>Support messages and security logs</strong>{" "}— for as long as needed to help you and keep the Platform secure.</li>
          </ul>
        </Section>

        <Section n="7" title="Where it is stored">
          <p>
            Some of our service providers store or process data outside Uganda. Where that happens, we rely on providers
            that offer adequate protection for personal data, as required by the Data Protection and Privacy Act.
          </p>
        </Section>

        <Section n="8" title="How we protect it">
          <p>
            Passwords are hashed; connections are encrypted; ID review photos are encrypted at rest; sensitive actions
            (withdrawals, bank details, email changes) need a one-time code; and only authorised team members can access
            admin tools. No system is perfectly secure, so please keep your password and codes private — see clause 2.3 of
            the <Link href="/terms" className="underline underline-offset-4">Terms of Service</Link>.
          </p>
        </Section>

        <Section n="9" title="Your rights">
          <p>Under the Data Protection and Privacy Act, you can ask us to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>tell you what personal data we hold about you and give you a copy;</li>
            <li>correct data that is wrong or incomplete — most of it you can edit yourself in Settings;</li>
            <li>delete your data — you can delete your account yourself in Settings, subject to the records we must keep (section 6);</li>
            <li>stop or limit processing, or withdraw a consent you gave (for example, analytics cookies); and</li>
            <li>object to processing based on our legitimate interests.</li>
          </ul>
          <p>
            Email <Email /> to make a request. We will reply within 30 days and may need to confirm your identity first.
            If you are not satisfied, you can complain to the <strong>Personal Data Protection Office</strong>{" "}of Uganda.
          </p>
        </Section>

        <Section n="10" title="Children">
          <p>
            The Platform is for people aged 18 and over. We do not knowingly collect data from children. If you believe a
            child has given us personal data, contact us and we will delete it.
          </p>
        </Section>

        <Section n="11" title="Changes to this policy">
          <p>
            We may update this policy from time to time. We will post the new version here and update the &ldquo;Last
            updated&rdquo; date, and tell you directly about significant changes.
          </p>
        </Section>

        <Section n="12" title="Contact">
          <p>
            Questions about privacy or your data: email us at <Email /> or visit{" "}
            <a href="https://marketiffytechnologies.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              marketiffytechnologies.com
            </a>
            . Sub-tree is operated by Marketiffy Technologies Limited.
          </p>
        </Section>
      </div>
    </div>
  )
}
