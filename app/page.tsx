import Link from "next/link";
import { ArrowRight, CreditCard, Globe, TrendingUp, RefreshCw, Shield, ChevronRight, Sparkles, Receipt, Bot } from "lucide-react";

const features = [
  {
    icon: CreditCard,
    title: "Connect any bank.",
    subtitle: "Capital One, Chase, Wells Fargo — 12,000+ institutions.",
    highlight: "Live sync",
    cta: "Link your first account",
    href: "/dashboard",
    color: "#0071c5",
  },
  {
    icon: Globe,
    title: "Unified dashboard.",
    subtitle: "See every account, every transaction, every dollar in one place.",
    highlight: "Real-time",
    cta: "View dashboard",
    href: "/dashboard",
    color: "#00aeef",
  },
  {
    icon: TrendingUp,
    title: "Track net worth.",
    subtitle: "Assets minus liabilities. Updated every time you open the app.",
    highlight: "$97.21",
    cta: "See your net worth",
    href: "/dashboard",
    color: "#0071c5",
  },
  {
    icon: RefreshCw,
    title: "Auto-categorize.",
    subtitle: "AI sorts your spending into groceries, bills, travel, and more.",
    highlight: "AI-powered",
    cta: "Explore categories",
    href: "/dashboard",
    color: "#00aeef",
  },
  {
    icon: Shield,
    title: "Bank-grade security.",
    subtitle: "256-bit encryption. Plaid-powered. Your credentials never touch our servers.",
    highlight: "SOC 2",
    cta: "Learn more",
    href: "#security",
    color: "#0071c5",
  },
  {
    icon: Sparkles,
    title: "Premium bookkeeping.",
    subtitle: "OCR receipts, recurring rules, revenue recognition, and GL categorization.",
    highlight: "New",
    cta: "Open books",
    href: "/dashboard",
    color: "#00aeef",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="size-7">
              <rect x="2" y="2" width="28" height="28" rx="6" fill="#0071c5" opacity="0.9" />
              <path d="M10 8 h12 v3 h-4.5 v13 h-3 v-13 h-4.5 z" fill="white" />
            </svg>
            <span className="text-sm font-semibold tracking-tight">Titan Finance</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-white/60 sm:flex">
            <Link href="#features" className="transition hover:text-white">Features</Link>
            <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
            <Link href="/compliance" className="transition hover:text-white">Compliance</Link>
            <Link href="/receipts" className="transition hover:text-white">Receipts</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Launch app
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <div className="absolute inset-0 titan-glow-bg" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80">
            <Sparkles className="size-3.5 text-[#00aeef]" />
            Premium bookkeeping, now in Titan
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Your money,{" "}
            <span className="titan-text-gradient">automatically understood.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/60 sm:text-lg">
            Automated bank feeds, AI categorization, receipt capture with OCR, recurring expense tracking, real-time burn rate and runway, and a conversational AI assistant.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0071c5] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005fa6] sm:w-auto"
            >
              Open Dashboard
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/receipts"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              <Receipt className="size-4" />
              Capture Receipt
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Everything in one place.</h2>
            <Link href="/dashboard" className="text-sm text-[#00aeef] hover:underline">
              View dashboard
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition hover:border-white/[0.12] hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${f.color}20` }}
                  >
                    <f.icon className="size-5" style={{ color: f.color }} />
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: `${f.color}20`, color: f.color }}
                  >
                    {f.highlight}
                  </span>
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-white/50">{f.subtitle}</p>
                <Link
                  href={f.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#00aeef] transition hover:gap-2"
                >
                  {f.cta}
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI assistant block */}
      <section className="border-t border-white/[0.06] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0071c5] to-[#00aeef] p-6 text-white sm:p-10">
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  <Bot className="size-3.5" />
                  Conversational AI
                </div>
                <h2 className="text-2xl font-bold sm:text-3xl">Ask your books anything.</h2>
                <p className="mt-2 text-sm text-white/80 sm:text-base">
                  “What changed in software expenses this quarter?” — Titan AI queries your transactions, GL accounts, recurring rules, and reconciliation status in real time.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0071c5] transition hover:bg-slate-50 lg:self-center"
              >
                Chat with Titan AI
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="absolute -right-10 -top-10 size-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 size-64 rounded-full bg-white/10 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-4 py-8 text-center text-xs text-white/40 sm:px-6">
        <p>© {new Date().getFullYear()} Titan Finance. Built for Claudius Taylor.</p>
      </footer>
    </div>
  );
}
