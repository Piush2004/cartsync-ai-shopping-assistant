"use client";

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent } from './track';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={null}>
      <AnalyticsTracker />
      {children}
    </React.Suspense>
  );
}

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (pathname) {
      trackEvent('page_view', {
        path: pathname,
        search: searchParams?.toString() || ''
      });
    }
  }, [pathname, searchParams]);

  return null;
}
