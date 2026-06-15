"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CreditCard, Globe, TrendingUp, RefreshCw, Shield, ChevronRight, Sparkles, Receipt, Bot, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Compliance", href: "/compliance" },
  { label: "Receipts", href: "/receipts" },
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
];

const footerLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Compliance", href: "/compliance" },
  { label: "Receipts", href: "/receipts" },
  { label: "Settings", href: "/settings/accounts" },
];

const features = [
  {
    icon: CreditCard,
    title: "Connect any bank.",
    subtitle: "Capital One, Chase, Wells Fargo — 12,000+ institutions.",
    highlight: "Connected",
    cta: "Link your first account",
    href: "/dashboard",
    color: "#0071c5",
  },
  {
    icon: Globe,
    title: "Unified dashboard.",
    subtitle: "See every account, every transaction, every dollar in one place.",
    highlight: "Unified",
    cta: "View dashboard",
    href: "/dashboard",
    color: "#00aeef",
  },
  {
    icon: TrendingUp,
    title: "Track net worth.",
    subtitle: "Assets minus liabilities. Updated every time you open the app.",
    highlight: "Live",
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
    highlight: "Secure",
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

function scrollToAnchor(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (href.startsWith("#")) {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link href="#features" onClick={(e) => scrollToAnchor(e, "#features")} className="transition hover:text-white">Features</Link>
            <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
            <Link href="/compliance" className="transition hover:text-white">Compliance</Link>
            <Link href="/receipts" className="transition hover:text-white">Receipts</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Launch app
              <ArrowRight className="size-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 sm:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <nav className="border-t border-white/[0.06] bg-black/95 px-4 py-3 sm:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    scrollToAnchor(e, link.href);
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-lg px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0071c5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005fa6]"
              >
                Launch app
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </nav>
        )}
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
                  onClick={(e) => scrollToAnchor(e, f.href)}
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

      {/* Security / Trust */}
      <section id="security" className="border-t border-white/[0.06] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80">
              <Shield className="size-3.5 text-[#00aeef]" />
              Trust &amp; security
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Built to keep your money private.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60">
              We do not store bank credentials. Data is encrypted in transit and at rest. Authentication runs through Plaid. SOC 2 readiness is on our roadmap.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Bank-level encryption", body: "TLS 1.3 in transit and AES-256 at rest." },
              { title: "Plaid connection", body: "Credentials are handled by Plaid. We only read transaction data." },
              { title: "SOC 2 intent", body: "Controls and audit logging are being built toward SOC 2 readiness." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm"
              >
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-white/50">{item.body}</p>
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
      <footer className="border-t border-white/[0.06] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Titan Finance. Built for Claudius Taylor.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => scrollToAnchor(e, link.href)}
                className="text-xs text-white/50 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
