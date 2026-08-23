import React from "react"
import { Link, useLocation } from "react-router-dom"
import { useNews } from "@/context/NewsContext"
import { motion } from "motion/react"
import { 
  ShieldAlert, 
  Copyright, 
  CheckCircle2, 
  FileText, 
  Scale, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight,
  ExternalLink,
  ShieldCheck
} from "lucide-react"

// Navigation tabs config for Legal & Compliance
const LEGAL_NAV = [
  { path: "/disclaimer", label: "Disclaimer", icon: ShieldAlert },
  { path: "/copyright-policy", label: "Copyright Policy", icon: Copyright },
  { path: "/corrections-policy", label: "Corrections Policy", icon: CheckCircle2 },
  { path: "/editorial-policy", label: "Editorial Policy", icon: FileText },
  { path: "/terms-and-conditions", label: "Terms & Conditions", icon: Scale },
  { path: "/privacy-policy", label: "Privacy Policy", icon: Lock },
]

// Reusable Layout Wrapper for Legal Pages
function LegalWrapper({ 
  title, 
  lastUpdated, 
  children 
}: { 
  title: string; 
  lastUpdated?: string; 
  children: React.ReactNode 
}) {
  const location = useLocation()
  const { siteSettings } = useNews()

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8 max-w-7xl space-y-8 font-sans"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg border border-zinc-700/50">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-600/20 text-red-400 border border-red-500/30">
            <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
            Legal & Compliance Guidelines
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {title}
          </h1>
          <p className="text-zinc-300 text-xs sm:text-sm">
            Official compliance document for <strong className="text-white">{siteSettings.siteName || "Damoh Daily News Network"}</strong>.
          </p>
          {lastUpdated && (
            <p className="text-[11px] text-zinc-400 pt-1">
              Last Updated: <span className="text-zinc-200 font-medium">{lastUpdated}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Side Navigation Menu */}
        <aside className="lg:col-span-3 space-y-2">
          <div className="sticky top-36 bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-3 pt-1">
              Legal Documents
            </h2>
            <nav className="space-y-1">
              {LEGAL_NAV.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-red-600 text-white shadow-sm font-bold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0" />}
                  </Link>
                )
              })}
            </nav>

            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-2 text-zinc-500">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">Have questions?</p>
              <p className="text-[11px] leading-relaxed">
                Contact our editorial compliance desk at:
              </p>
              {siteSettings.contactEmail ? (
                <a 
                  href={`mailto:${siteSettings.contactEmail}`}
                  className="text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-1.5 break-all text-[11px]"
                >
                  <Mail className="h-3 w-3 shrink-0" /> {siteSettings.contactEmail}
                </a>
              ) : (
                <Link 
                  to="/contact"
                  className="text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-1.5 text-[11px]"
                >
                  <Mail className="h-3 w-3 shrink-0" /> Contact Editorial Desk
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* Main Document Content */}
        <main className="lg:col-span-9 bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-10 border border-zinc-200 dark:border-zinc-800 shadow-sm text-zinc-800 dark:text-zinc-200 leading-relaxed text-sm space-y-6">
          {children}

          {/* Footer Contact Callout */}
          <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 p-6 sm:p-8 rounded-b-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Need further clarification or wish to submit a report?</h4>
              <p className="text-xs text-zinc-500">
                You can reach out directly to our editorial team via our dedicated contact portal.
              </p>
            </div>
            <Link
              to="/contact"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shrink-0 inline-flex items-center gap-2 transition-colors"
            >
              Contact Us <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </main>
      </div>
    </motion.div>
  )
}

// 1. DISCLAIMER PAGE
export function Disclaimer() {
  const { siteSettings } = useNews()
  const siteName = siteSettings.siteName || "Damoh Daily News Network"
  const email = siteSettings.contactEmail || ""

  return (
    <LegalWrapper title="Disclaimer" lastUpdated="July 29, 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          1. General Information & News Accuracy
        </h2>
        <p>
          The information contained on <strong>{siteName}</strong> is published in good faith and for general informational and news reporting purposes only. We strive to publish accurate, verified, and well-researched news. However, {siteName} does not make any warranties about the completeness, reliability, and absolute accuracy of this information.
        </p>
        <p>
          Any action you take upon the information you find on this website is strictly at your own risk. {siteName} will not be liable for any losses or damages in connection with the use of our website.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          2. Factual Corrections & Updates
        </h2>
        <p>
          We are committed to maintaining the highest standards of accuracy. If any factual error, inaccuracy, or misleading statement is identified in our articles, it will be reviewed, corrected, or updated as soon as possible by our editorial team in accordance with our transparent Corrections Policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          3. Reporting Incorrect, Defamatory, or Copyrighted Content
        </h2>
        <p>
          If any person, group, or organization believes that any content published on {siteName} is incorrect, defamatory, inaccurate, or infringes upon any copyright or intellectual property rights, they are encouraged to contact us immediately:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li>Through our official <Link to="/contact" className="text-red-600 dark:text-red-400 font-semibold hover:underline">Contact Us</Link> portal.</li>
          <li>By emailing our editorial desk directly at <a href={`mailto:${email}`} className="text-red-600 dark:text-red-400 font-semibold hover:underline">{email}</a>.</li>
        </ul>
        <p>
          Upon receiving a formal complaint accompanied by valid documentation or verifiable evidence, our editorial board will thoroughly review the matter. If deemed necessary, we will edit, update, issue a clarification, or permanently remove the content.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          4. Opinions & Guest Columns
        </h2>
        <p>
          Opinions, views, and perspectives expressed in guest columns, opinion pieces, reader comments, or letters to the editor belong solely to their respective authors and do not necessarily reflect the official editorial stance or views of {siteName}, its publishers, or editorial staff.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          5. External Links Disclaimer
        </h2>
        <p>
          From our website, you can visit other websites by following hyperlinks to external sites. While we strive to provide only quality links to useful and ethical websites, we have no control over the content and nature of these sites. The inclusion of any external links does not imply a recommendation or endorse all the views expressed within them.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          6. Reservation of Legal Rights
        </h2>
        <p>
          Publishing this disclaimer, making content adjustments, or taking corrective measures does not constitute an admission of liability, nor does it waive any legal rights, statutory protections, or remedies available to {siteName} under applicable laws.
        </p>
      </section>
    </LegalWrapper>
  )
}

// 2. COPYRIGHT POLICY PAGE
export function CopyrightPolicy() {
  const { siteSettings } = useNews()
  const siteName = siteSettings.siteName || "Damoh Daily News Network"
  const email = siteSettings.contactEmail || ""

  return (
    <LegalWrapper title="Copyright Policy" lastUpdated="July 29, 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          1. Ownership of Content
        </h2>
        <p>
          All original content published on <strong>{siteName}</strong>—including but not limited to news articles, investigative reports, photographs, graphics, logos, video clips, audio snippets, and design elements—is the exclusive intellectual property of {siteName} and is protected under applicable national copyright laws and international treaties, unless explicitly stated otherwise.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          2. Restrictions on Use & Distribution
        </h2>
        <p>
          Unauthorized reproduction, copying, republication, redistribution, syndication, or commercial exploitation of any material from {siteName} in whole or in part without prior written authorization from the editor is strictly prohibited.
        </p>
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2 text-amber-900 dark:text-amber-200 text-xs">
          <p className="font-bold">Permitted Fair Use:</p>
          <p>
            Short excerpts or brief quotes from our articles may be cited for non-commercial educational, news reporting, or academic review purposes, provided that clear, visible credit is attributed to <strong>{siteName}</strong> along with a direct hyperlink back to the original source article.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          3. Submitting Copyright Inquiries & Complaints
        </h2>
        <p>
          If you believe that any material available on {siteName} infringes upon your copyright or intellectual property rights, please send a written infringement notice containing the following details:
        </p>
        <ol className="list-decimal pl-6 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>The exact URL link of the material on our website that you claim is infringing.</li>
          <li>Your contact information (full name, phone number, physical address, and official email).</li>
          <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner.</li>
        </ol>
        <p>
          Please submit copyright notices directly via our <Link to="/contact" className="text-red-600 dark:text-red-400 font-semibold hover:underline">Contact Page</Link>{email ? <> or email us at <a href={`mailto:${email}`} className="text-red-600 dark:text-red-400 font-semibold hover:underline">{email}</a></> : null}.
        </p>
      </section>
    </LegalWrapper>
  )
}

// 3. CORRECTIONS POLICY PAGE
export function CorrectionsPolicy() {
  const { siteSettings } = useNews()
  const siteName = siteSettings.siteName || "Damoh Daily News Network"
  const email = siteSettings.contactEmail || ""

  return (
    <LegalWrapper title="Corrections Policy" lastUpdated="July 29, 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          1. Commitment to Accuracy & Transparency
        </h2>
        <p>
          At <strong>{siteName}</strong>, accuracy is central to our journalistic ethics. While our reporting team strives for error-free coverage, mistakes can occasionally happen in fast-paced news environments. When errors occur, we are committed to correcting them quickly, transparently, and responsibly.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          2. How Readers Can Report Mistakes
        </h2>
        <p>
          We welcome feedback and error reports from our readers. If you spot a factual error, numerical misstatement, misspelled name, or misquote in any of our published stories, please bring it to our attention:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          {email ? (
            <li>Email our corrections desk at <a href={`mailto:${email}`} className="text-red-600 dark:text-red-400 font-semibold hover:underline">{email}</a>.</li>
          ) : null}
          <li>Submit a report via our official <Link to="/contact" className="text-red-600 dark:text-red-400 font-semibold hover:underline">Contact Us</Link> page.</li>
        </ul>
        <p>Please include the article headline, publication date, URL link, and specific details about the error.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          3. Verification & Correction Standards
        </h2>
        <p>
          Once an error report is received, our senior editorial desk investigates the claim against primary sources and official documents.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>Minor Corrections:</strong> Typos, grammatical errors, or spelling fixes that do not alter the facts of the story are corrected directly without a formal notice.
          </li>
          <li>
            <strong>Major Factual Corrections:</strong> When a significant factual error, date mistake, or name error is corrected, an <em>Editor's Note / Correction Notice</em> is appended to the bottom of the article detailing what was changed and when.
          </li>
        </ul>
      </section>
    </LegalWrapper>
  )
}

// 4. EDITORIAL POLICY PAGE
export function EditorialPolicy() {
  const { siteSettings } = useNews()
  const siteName = siteSettings.siteName || "Damoh Daily News Network"

  return (
    <LegalWrapper title="Editorial Policy" lastUpdated="July 29, 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          1. Core Values & Principles
        </h2>
        <p>
          <strong>{siteName}</strong> is dedicated to delivering independent, fair, unbiased, and public-interest journalism. Our reporters and editors adhere strictly to recognized global standards of professional journalism.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          2. Separation of News & Opinion
        </h2>
        <p>
          We maintain a strict boundary between factual news reporting, opinion pieces, and sponsored content:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>News Articles:</strong> Objective, fact-based reporting focused on verifiable events.</li>
          <li><strong>Opinion & Editorials:</strong> Clearly labeled as "Opinion", "Analysis", or "Column" to distinguish personal viewpoints from objective reporting.</li>
          <li><strong>Sponsored & Advertorial Content:</strong> Explicitly marked with "Sponsored", "Promotional", or "Advertisement" labels to ensure complete transparency.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          3. Zero Tolerance for Misinformation
        </h2>
        <p>
          We maintain zero tolerance for fake news, intentionally fabricated stories, sensationalized clickbait, or unverified rumors. All news items undergo multi-level editorial verification before publication.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          4. Conflict of Interest & Ethics
        </h2>
        <p>
          Our journalists operate independently of political, financial, or commercial pressure. We do not accept bribes, gifts, or financial favors in exchange for news coverage or favorable editorial treatment.
        </p>
      </section>
    </LegalWrapper>
  )
}

// 5. TERMS & CONDITIONS PAGE
export function TermsAndConditions() {
  const { siteSettings } = useNews()
  const siteName = siteSettings.siteName || "Damoh Daily News Network"

  return (
    <LegalWrapper title="Terms & Conditions" lastUpdated="July 29, 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing and using <strong>{siteName}</strong>, you agree to be bound by these Terms & Conditions and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using or accessing this website.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          2. User Conduct & Commenting Guidelines
        </h2>
        <p>
          Users participating in interactive sections, comment forms, or news tip submissions must refrain from posting content that is:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li>Defamatory, abusive, obscene, or hateful.</li>
          <li>Violative of any person's privacy or intellectual property rights.</li>
          <li>Commercial spam, unauthorized advertising, or phishing links.</li>
        </ul>
        <p>We reserve the right to moderate, edit, or delete non-compliant comments without prior notification.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          3. Limitation of Liability
        </h2>
        <p>
          In no event shall {siteName} or its owners be liable for any damages arising out of the use or inability to use the materials on our platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          4. Governing Law & Jurisdiction
        </h2>
        <p>
          These terms and conditions are governed by and construed in accordance with the laws of India, and any legal disputes shall be subject to the exclusive jurisdiction of the competent courts in Madhya Pradesh, India.
        </p>
      </section>
    </LegalWrapper>
  )
}

// 6. PRIVACY POLICY PAGE
export function PrivacyPolicy() {
  const { siteSettings } = useNews()
  const siteName = siteSettings.siteName || "Damoh Daily News Network"
  const email = siteSettings.contactEmail || ""

  return (
    <LegalWrapper title="Privacy Policy" lastUpdated="August 20, 2026">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          1. Information We Collect
        </h2>
        <p>
          At <strong>{siteName}</strong>, protecting your personal privacy is a top priority. When you interact with our website or submit information through our "Contact Us / Send News Tip" (संपर्क करें या समाचार टिप भेजें) form or comment forms, we may collect the following personal details:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Full Name (आपका नाम):</strong> Provided voluntarily to identify the sender or contributor.</li>
          <li><strong>Mobile Number (मोबाइल नंबर):</strong> Provided voluntarily so our editorial team can contact the sender for news verification or follow-up when necessary.</li>
          <li><strong>Email Address (ईमेल पता):</strong> Provided to send editorial replies, acknowledgments, or clarifications.</li>
          <li><strong>Message & News Tip Content (समाचार टिप / संदेश):</strong> Details, facts, suggestions, or media information submitted by the user.</li>
          <li><strong>Automated Data:</strong> Standard anonymous usage metrics, IP addresses, browser types, and device analytics to ensure optimal performance and platform security.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          2. How We Use Submitted Information
        </h2>
        <p>
          The information collected through contact forms and news tip submissions is strictly used for legitimate journalistic and administrative purposes:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <li><strong>Contacting the Sender:</strong> Reaching out to the sender when follow-up or clarification is necessary.</li>
          <li><strong>Verifying News or Information:</strong> Cross-checking facts, local sources, and authenticating news tips before publication.</li>
          <li><strong>Reviewing Submitted Content:</strong> Editorial evaluation of suggestions, press releases, or inquiries.</li>
          <li><strong>Website Administration & Moderation:</strong> Preventing malicious submissions, spam, or abuse, and maintaining editorial standards.</li>
        </ul>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          We respect user privacy and do not sell, rent, lease, or trade your personal contact details to third-party advertisers or commercial entities.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          3. Cookies & Analytics
        </h2>
        <p>
          We may use standard cookies and privacy-respecting analytics to analyze web traffic trends and optimize site speed and layout. You can adjust your browser settings to decline cookies at any time.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b pb-2 border-zinc-200 dark:border-zinc-800">
          4. Contacting Us Regarding Privacy
        </h2>
        <p>
          If you have questions regarding this Privacy Policy or wish to request data removal, please contact our editorial desk{email ? <> at <a href={`mailto:${email}`} className="text-red-600 dark:text-red-400 font-semibold hover:underline">{email}</a> or</> : null} via our <Link to="/contact" className="text-red-600 dark:text-red-400 font-semibold hover:underline">Contact Page</Link>.
        </p>
      </section>
    </LegalWrapper>
  )
}
