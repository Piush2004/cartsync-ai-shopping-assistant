import * as React from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <Navbar />
      <Sidebar />
      <main className="flex-1 w-full max-w-7xl mx-auto md:ml-16 pt-24 px-4 sm:px-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
