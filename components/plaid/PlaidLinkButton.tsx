'use client';

import { useState, useEffect } from 'react';

export function PlaidLinkButton() {
  const [ready, setReady] = useState(false);
  const [handler, setHandler] = useState<any>(null);

  useEffect(() => {
    let userId = localStorage.getItem('titan_user_id');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('titan_user_id', userId);
    }

    const loadPlaid = async () => {
      try {
        const res = await fetch('/api/plaid/link-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (!data.link_token) {
          console.error('No link token:', data);
          return;
        }

        const Plaid = (window as any).Plaid;
        if (!Plaid) {
          const script = document.createElement('script');
          script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
          script.async = true;
          script.onload = () => initHandler((window as any).Plaid, data.link_token, userId!);
          document.body.appendChild(script);
        } else {
          initHandler(Plaid, data.link_token, userId!);
        }
      } catch (err) {
        console.error('Failed to load Plaid:', err);
      }
    };

    loadPlaid();
  }, []);

  const initHandler = (Plaid: any, token: string, userId: string) => {
    const handler = Plaid.create({
      token,
      onSuccess: async (public_token: string) => {
        try {
          const res = await fetch('/api/plaid/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token, userId }),
          });
          const data = await res.json();
          if (data.success) {
            window.location.reload();
          } else {
            alert('Bank connection failed: ' + (data.error || 'Unknown error'));
          }
        } catch (err) {
          alert('Bank connection failed. Please try again.');
        }
      },
      onExit: (err: any) => {
        if (err) console.error('Plaid exit error:', err);
      },
    });
    setHandler(() => handler);
    setReady(true);
  };

  return (
    <button
      onClick={() => handler?.open()}
      disabled={!ready}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white text-sm font-medium tracking-[-0.01em] hover:bg-white/[0.05] transition-colors disabled:opacity-50"
    >
      Get Titan
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}
