"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stylist", label: "Stylist" },
  { href: "/products", label: "Products" },
  { href: "/history", label: "History" },
  { href: "/measurements", label: "Measure" },
];

export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  
  const background = useTransform(
    scrollY,
    [0, 50],
    ["rgba(255, 255, 255, 0.4)", "rgba(255, 255, 255, 0.8)"]
  );
  
  const backdropFilter = useTransform(
    scrollY,
    [0, 50],
    ["blur(8px)", "blur(24px)"]
  );

  const borderOpacity = useTransform(
    scrollY,
    [0, 50],
    [0, 1]
  );

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ background, backdropFilter }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-5xl rounded-2xl h-14 px-6 flex items-center justify-between border border-border shadow-sm"
    >
      <motion.div style={{ opacity: borderOpacity }} className="absolute bottom-0 left-0 right-0 h-[1px] aurora-border rounded-b-2xl pointer-events-none" />
      
      <Link href="/dashboard" className="flex items-center gap-2 group relative z-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          whileHover={{ scale: 1.2, rotate: 0, transition: { duration: 0.2 } }}
        >
          <Sparkles className="w-5 h-5 text-accent-blue group-hover:text-accent-purple transition-colors" />
        </motion.div>
        <span className="font-bold text-lg tracking-tight text-text-primary">CartSync</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 relative z-10">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative text-sm font-medium transition-colors hover:text-text-primary h-14 flex items-center",
                isActive ? "text-text-primary" : "text-text-secondary"
              )}
            >
              {link.label}
              {isActive && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute bottom-[14px] left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-gradient-accent"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <Link href="/stylist" className="hidden sm:flex px-3 py-1 rounded-full border border-border bg-bg-elevated text-xs font-medium text-text-secondary items-center gap-2 group hover:border-accent-blue/50 hover:text-accent-blue transition-colors">
          <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
          AI Stylist Active
        </Link>
        <Link 
          href="/profile" 
          className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>
    </motion.nav>
  );
}
