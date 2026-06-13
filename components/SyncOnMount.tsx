'use client';

import { useEffect } from 'react';

export function SyncOnMount() {
  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('titan_user_id') : null;
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
      .catch(() => {
        // Silent fail on initial sync attempt
      });
  }, []);

  return null;
}
