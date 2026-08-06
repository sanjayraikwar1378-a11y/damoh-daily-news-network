import React, { useEffect } from "react"
import { Link } from "react-router-dom"
import { useNews } from "@/context/NewsContext"
import { motion } from "motion/react"
import { 
  Building2, 
  Target, 
  Eye, 
  ShieldCheck, 
  CheckCircle2, 
  Scale, 
  FileCheck2, 
  Users, 
  Newspaper, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  ExternalLink, 
  AlertTriangle, 
  Vote, 
  Landmark, 
  ShieldAlert, 
  GraduationCap, 
  Activity, 
  Briefcase, 
  TrendingUp, 
  Sprout, 
  Trophy, 
  Sparkles, 
  CalendarDays,
  HeartHandshake
} from "lucide-react"

export function AboutUs() {
  const { siteSettings } = useNews()
  const siteName = siteSettings.siteName || "Damoh Daily News"
  const phone = siteSettings.contactPhone || "+91 94251 56789"
  const whatsapp = siteSettings.whatsappNumber || "+91 94251 56789"
  const email = siteSettings.contactEmail || "editor@damohdaily.com"
  const address = siteSettings.contactAddress || "Damoh, Madhya Pradesh - 470661, India"

  // Update document title for SEO & Google News compliance
  useEffect(() => {
    document.title = `About Us - ${siteName} | Founder, Mission & Editorial Independence`
    return () => {
      document.title = siteName
    }
  }, [siteName])

  const coverageAreas = [
    { title: "Politics", description: "State & district electoral affairs, policy updates, and legislative governance.", icon: Vote, color: "text-blue-500 bg-blue-500/10" },
    { title: "Administration", description: "District collectorate, municipal civic updates, and government schemes.", icon: Landmark, color: "text-amber-500 bg-amber-500/10" },
    { title: "Crime & Law", description: "Police updates, court proceedings, law enforcement, and public safety.", icon: ShieldAlert, color: "text-red-500 bg-red-500/10" },
    { title: "Education", description: "Schools, colleges, competitive exams, board results, and academic alerts.", icon: GraduationCap, color: "text-indigo-500 bg-indigo-500/10" },
    { title: "Health", description: "Public health infrastructure, hospital updates, and medical advisories.", icon: Activity, color: "text-emerald-500 bg-emerald-500/10" },
    { title: "Employment", description: "Sarkari naukri, local job openings, recruitment rallies, and career news.", icon: Briefcase, color: "text-purple-500 bg-purple-500/10" },
    { title: "Business & Market", description: "Local grain market (Mandi) rates, gold/silver prices, and local commerce.", icon: TrendingUp, color: "text-teal-500 bg-teal-500/10" },
    { title: "Agriculture", description: "Farmer issues, crop advisories, monsoon reports, and rural development.", icon: Sprout, color: "text-green-500 bg-green-500/10" },
    { title: "Sports", description: "District sports tournaments, local athletes, cricket, and youth achievements.", icon: Trophy, color: "text-orange-500 bg-orange-500/10" },
    { title: "Culture & Heritage", description: "Historical landmarks, Kundalpur, Nohleshwar, festivals, and local traditions.", icon: Sparkles, color: "text-pink-500 bg-pink-500/10" },
    { title: "Local Events", description: "Community gatherings, fairs, civic events, and daily local updates.", icon: CalendarDays, color: "text-cyan-500 bg-cyan-500/10" },
  ]

  const coreValues = [
    { title: "Accuracy", description: "Rigorous fact-checking, official document verification, and primary source cross-examination before publishing.", icon: CheckCircle2 },
    { title: "Fairness", description: "Providing a balanced narrative, giving all parties involved an equal opportunity to present their side of the story.", icon: Scale },
    { title: "Transparency", description: "Open corrections policy, clear disclosure of ownership, and distinct separation of news reporting from opinion content.", icon: FileCheck2 },
    { title: "Public Interest", description: "Prioritizing stories that matter to citizens, holding authority accountable, and highlighting grassroots civic issues.", icon: Users },
    { title: "Responsible Journalism", description: "Adhering strictly to ethical reporting standards, respecting individual privacy, and avoiding sensationalism.", icon: ShieldCheck },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="container mx-auto px-4 py-8 max-w-7xl space-y-12 font-sans text-zinc-900 dark:text-zinc-100"
    >
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-red-950 text-white rounded-3xl p-6 sm:p-12 border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-red-600/20 text-red-400 border border-red-500/30 uppercase tracking-widest">
            <Building2 className="h-4 w-4 text-red-500" />
            Official Organization Overview
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            About <span className="text-red-500">{siteName}</span>
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-normal">
            <strong>{siteName}</strong> is a leading independent digital news platform operating out of Damoh, Madhya Pradesh, India. Dedicated to fast, authentic, and hyper-local reporting, we deliver accurate news directly to the citizens of Damoh district and the wider Madhya Pradesh region.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/50">
              <MapPin className="h-4 w-4 text-red-400" /> Damoh, Madhya Pradesh, India
            </span>
            <span className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/50">
              <Newspaper className="h-4 w-4 text-red-400" /> Digital News Platform
            </span>
          </div>
        </div>
      </section>

      {/* 2 & 3. OUR MISSION & OUR VISION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Mission */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
            Our Mission
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
            Our mission is to serve the public interest by providing timely, verified, and objective news coverage. We empower the local citizens of Damoh with reliable information regarding administration, governance, civic infrastructure, education, and community developments, ensuring every voice in our society is heard.
          </p>
        </div>

        {/* Vision */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Eye className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
            Our Vision
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
            Our vision is to build the most trusted, transparent, and technology-driven digital news ecosystem in the Bundelkhand region and Madhya Pradesh. We aspire to set high benchmarks in ethical journalism while remaining easily accessible across modern digital devices and platforms.
          </p>
        </div>
      </section>

      {/* 4. OUR VALUES */}
      <section className="space-y-6">
        <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-red-600" /> Our Core Values
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            The foundational principles that guide every story, report, and editorial choice at {siteName}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreValues.map((val) => {
            const Icon = val.icon
            return (
              <div 
                key={val.title}
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 hover:border-red-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {val.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {val.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. WHAT WE COVER */}
      <section className="space-y-6">
        <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Newspaper className="h-7 w-7 text-red-600" /> What We Cover
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Comprehensive beat reporting designed to keep the community informed on all critical fronts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {coverageAreas.map((area) => {
            const Icon = area.icon
            return (
              <div 
                key={area.title}
                className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${area.color} shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {area.title}
                  </h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
                  {area.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 6 & 7. FOUNDER & EDITOR & EDITORIAL INDEPENDENCE */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Founder Bio */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xl shrink-0">
              SR
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                Sanjay Raikwar
              </h2>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">
                Founder & Editor, Damoh Daily News
              </p>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                District Bureau, Dainik Keshariya Hindustan
              </p>
            </div>
          </div>

          <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-3">
            <p className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50 font-medium text-zinc-900 dark:text-zinc-100 italic">
              "Sanjay Raikwar is the Founder & Editor of Damoh Daily News. He is also associated with Dainik Keshariya Hindustan as District Bureau and is actively engaged in local journalism."
            </p>
            <p>
              With extensive experience in field journalism, local news gathering, and media operations in Damoh district, Sanjay Raikwar leads the editorial vision and daily publication standards of Damoh Daily News.
            </p>
          </div>
        </div>

        {/* Editorial Independence Disclaimer */}
        <div className="lg:col-span-6 bg-amber-50/70 dark:bg-amber-950/20 p-6 sm:p-8 rounded-2xl border border-amber-300/70 dark:border-amber-900/40 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-200 dark:border-amber-900/50 pb-4">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Editorial Independence Disclaimer
              </h2>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                Official Institutional Clarification
              </p>
            </div>
          </div>

          <div className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 space-y-3">
            <p className="font-semibold text-zinc-900 dark:text-amber-100 bg-white/80 dark:bg-zinc-900/80 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50">
              "Damoh Daily News is a completely independent digital news platform. Its ownership, management, and editorial decisions are entirely independent. The Founder has a personal professional association with Dainik Keshariya Hindustan as District Bureau. Both organizations operate independently and neither owns, controls, manages, nor is editorially responsible for the other."
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs">
              This distinction ensures complete transparency for our readers, regulatory authorities, and industry partners regarding our editorial governance and corporate identity.
            </p>
          </div>
        </div>
      </section>

      {/* 8. EDITORIAL STANDARDS */}
      <section className="bg-white dark:bg-zinc-900 p-6 sm:p-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Award className="h-7 w-7 text-red-600" /> Editorial Standards & Guidelines
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            How we maintain journalistic integrity, accuracy, and public trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Fact-Checking & Source Verification
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Every news story published on our platform undergoes verification against primary official sources, press releases, or direct interviews with responsible authorities. Anonymous sources are used sparingly and only when necessary for public safety or whistleblower protection.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-500" /> Transparent Corrections Policy
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              In the event of a factual error or misstatement, our editorial team promptly issues a correction. Major updates are explicitly documented at the foot of the affected article to ensure complete historical transparency for our readership.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-500" /> Ethical Journalism & Privacy
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We respect individual privacy rights and adhere strictly to legal guidelines concerning crime victim anonymity, juvenile identity protection, and court reporting regulations across India.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Scale className="h-5 w-5 text-amber-500" /> Non-Partisan Reporting
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              We maintain strict political neutrality. {siteName} is not affiliated with any political party, religious organization, or commercial lobbying group.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-4 text-xs font-semibold">
          <Link to="/editorial-policy" className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">
            Read Full Editorial Policy &rarr;
          </Link>
          <Link to="/corrections-policy" className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">
            Read Full Corrections Policy &rarr;
          </Link>
        </div>
      </section>

      {/* 10. WHY READERS TRUST US */}
      <section className="bg-gradient-to-r from-red-900 via-zinc-900 to-zinc-950 text-white p-6 sm:p-10 rounded-2xl border border-red-900/50 shadow-lg space-y-6">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-red-500/20 text-red-300 border border-red-500/30">
            <HeartHandshake className="h-4 w-4 text-red-400" />
            Community Benchmark
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Why Readers Trust Us
          </h2>
          <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
            {siteName} combines deep local presence with digital accessibility to provide citizens with reliable news they can depend on every single day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <div className="text-2xl font-black text-red-400">100%</div>
            <div className="text-xs font-bold text-white">Hyper-Local Focus</div>
            <p className="text-[11px] text-zinc-400">Dedicated exclusively to Damoh & MP updates.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <div className="text-2xl font-black text-red-400">Fast & Verified</div>
            <div className="text-xs font-bold text-white">Swift Verification</div>
            <p className="text-[11px] text-zinc-400">Real-time reporting backed by factual checks.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <div className="text-2xl font-black text-red-400">24 / 7</div>
            <div className="text-xs font-bold text-white">Digital Access</div>
            <p className="text-[11px] text-zinc-400">Seamless mobile & desktop accessibility.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <div className="text-2xl font-black text-red-400">Ethics First</div>
            <div className="text-xs font-bold text-white">Transparent Ownership</div>
            <p className="text-[11px] text-zinc-400">Clear disclosures and professional ethics.</p>
          </div>
        </div>
      </section>

      {/* 9. CONTACT INFORMATION */}
      <section className="bg-white dark:bg-zinc-900 p-6 sm:p-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Phone className="h-7 w-7 text-red-600" /> Contact Editorial Desk
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Reach out to our newsroom for press releases, news tips, corrections, or general inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-2 border border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
              <Phone className="h-4 w-4" /> Editorial Phone
            </div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white">
              {phone}
            </p>
            <p className="text-[11px] text-zinc-500">Mon - Sat: 9:00 AM - 8:00 PM</p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-2 border border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <MessageSquare className="h-4 w-4" /> WhatsApp Helpline
            </div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white">
              {whatsapp}
            </p>
            <p className="text-[11px] text-zinc-500">Send news tips & photos directly</p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-2 border border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
              <Mail className="h-4 w-4" /> Official Email
            </div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
              {email}
            </p>
            <p className="text-[11px] text-zinc-500">For press releases & inquiries</p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-2 border border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <MapPin className="h-4 w-4" /> Newsroom Address
            </div>
            <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
              {address}
            </p>
            <p className="text-[11px] text-zinc-500">Damoh, Madhya Pradesh, India</p>
          </div>
        </div>

        <div className="pt-2 text-center sm:text-left">
          <Link
            to="/contact"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            Visit Detailed Contact Page <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </motion.div>
  )
}
