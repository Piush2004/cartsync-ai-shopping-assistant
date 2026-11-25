"use client";

import * as React from "react";
import { getToken } from "@/app/actions/auth";

/** Sends visitors without a saved sign-in to /login. Replaces the old server middleware. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    getToken().then((token) => {
      if (!token) window.location.replace("/login");
      else setReady(true);
    });
  }, []);

  return ready ? <>{children}</> : null;
}
