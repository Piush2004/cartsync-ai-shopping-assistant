"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stylist", label: "Stylist" },
  { href: "/products", label: "Products" },
  { href: "/try-on", label: "Try-on" },
  { href: "/history", label: "History" },
  { href: "/measurements", label: "Measure" },
];

/** Full-width top bar: brand on the left, pages in the middle, actions on the right. */
export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();

  const background = useTransform(scrollY, [0, 40], ["rgba(255,255,255,0.55)", "rgba(255,255,255,0.88)"]);
  const backdropFilter = useTransform(scrollY, [0, 40], ["blur(8px)", "blur(22px)"]);

  return (
    <motion.header
      style={{ background, backdropFilter }}
      className="fixed top-0 inset-x-0 z-50 h-16 px-4 sm:px-8 xl:px-12 flex items-center gap-8 border-b border-border"
    >
      <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] rail-bar pointer-events-none" aria-hidden="true" />

      <Link href="/dashboard" className="flex items-center gap-2 group shrink-0 md:w-[40px] lg:w-auto">
        <Sparkles className="w-5 h-5 text-accent-blue group-hover:text-accent-purple transition-colors shrink-0" />
        <span className="font-bold text-lg tracking-tight text-text-primary hidden lg:inline" style={{ fontFamily: "var(--font-display)" }}>
          CartSync
        </span>
      </Link>

      <nav aria-label="Pages" className="hidden md:flex items-center gap-1 md:ml-12 lg:ml-6">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative px-4 h-16 flex items-center text-sm font-medium transition-colors hover:text-text-primary",
                isActive ? "text-text-primary" : "text-text-secondary"
              )}
            >
              {link.label}
              {isActive && (
                <motion.span
                  layoutId="navbar-indicator"
                  className="absolute bottom-0 left-3 right-3 h-[4px] rounded-t-full silk-accent"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/stylist"
          className="hidden sm:flex px-3.5 py-1.5 rounded-full border border-border bg-bg-card text-sm font-medium text-text-secondary items-center gap-2 hover:border-accent-blue/50 hover:text-accent-blue transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-accent-emerald" aria-hidden="true" />
          Ask the stylist
        </Link>
        <Link
          href="/try-on"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white silk-accent shadow-sm hover:brightness-110 transition"
        >
          <Shirt className="w-4 h-4" aria-hidden="true" />
          Try on a product
        </Link>
      </div>
    </motion.header>
  );
}
