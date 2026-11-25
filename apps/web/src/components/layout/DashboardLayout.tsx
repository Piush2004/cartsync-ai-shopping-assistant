import * as React from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { AuthGuard } from "./AuthGuard";

/**
 * App shell. The bar spans the whole window, the icon rail sits on the left,
 * and the page fills everything else (capped only on very large monitors so
 * lines of text don't run to the horizon). Pages must not add their own
 * max-width wrapper unless the content is a reading column.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <AuthGuard>
      <Navbar />
      <Sidebar />
      <main className="flex-1 min-w-0 w-full max-w-[1840px] mx-auto pt-24 px-4 sm:px-8 md:pl-[92px] xl:pl-[104px] xl:pr-12 2xl:pr-16 pb-24 md:pb-12">
        {children}
      </main>
      </AuthGuard>
    </div>
  );
}
