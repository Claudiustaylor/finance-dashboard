import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { ComplianceManager } from "@/components/compliance/ComplianceManager";

export const metadata = {
  title: "Compliance Center · Titan Finance",
  description: "Track business entity filings, deadlines, and state compliance requirements.",
};

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-[#08090a] text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090a]/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0071c5]" />
              <span className="text-sm font-semibold text-white">Compliance Center</span>
            </div>
          </div>
          <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors">Titan Home</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 p-8 rounded-3xl bg-gradient-to-br from-[#0071c5]/20 to-[#00aeef]/10 border border-white/[0.08] relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <p className="text-sm font-medium text-[#0071c5] uppercase tracking-wider">Business Compliance</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Never miss a filing deadline.</h1>
            <p className="mt-3 text-white/60">Track your LLCs, corporations, and entities across all 50 states. Get automatic deadline alerts and direct filing links to avoid penalties.</p>
          </div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#0071c5]/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        </div>

        <ComplianceManager />

        <footer className="mt-12 pt-8 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="w-4 h-4">
                <rect x="2" y="2" width="28" height="28" rx="6" fill="#0071c5" opacity="0.6" />
                <path d="M10 8 h12 v3 h-4.5 v13 h-3 v-13 h-4.5 z" fill="white" />
              </svg>
              <span className="text-xs text-white/30">Titan Compliance Center · Not legal advice. Verify all deadlines with your state.</span>
            </div>
            <Link href="/dashboard" className="text-xs text-white/30 hover:text-white/50 transition-colors">Back to Dashboard</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
