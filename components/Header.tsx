'use client';

import { PlaidLinkButton } from '@/components/plaid/PlaidLinkButton';
import { useEffect } from 'react';

export function Header() {
  useEffect(() => {
    const userId = localStorage.getItem('titan_user_id');
    if (!userId) return;
    fetch('/api/plaid/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.added > 0) {
          window.location.reload();
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            {/* TITAN LOGO - Geometric T in shield */}
            <div className="w-8 h-8 rounded-xl bg-[#0071c5] flex items-center justify-center shadow-lg shadow-[#0071c5]/25">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.9"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-[-0.03em] text-white">Titan</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm font-medium text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0071c5]"></span>
              Home
            </a>
            <a href="#accounts" className="text-sm text-[#888888] hover:text-white transition-colors">Accounts</a>
            <a href="#transactions" className="text-sm text-[#888888] hover:text-white transition-colors">Transactions</a>
            <a href="#budget" className="text-sm text-[#888888] hover:text-white transition-colors">Budget</a>
          </nav>

          <PlaidLinkButton />
        </div>
      </div>
    </header>
  );
}
