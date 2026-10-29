"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Ruler,
  Sparkles,
  ShoppingBag,
  Clock,
  Settings,
  User,
  LogOut,
  Shirt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/track";
import { logoutAction } from "@/app/actions/auth";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/measurements", icon: Ruler, label: "Measurements" },
  { href: "/stylist", icon: Sparkles, label: "AI Stylist" },
  { href: "/products", icon: ShoppingBag, label: "Products" },
  { href: "/try-on", icon: Shirt, label: "Try-On" },
  { href: "/history", icon: Clock, label: "History" },
];

const bottomItems = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  const handleLogout = async () => {
    // The old version of this called fetch('/api/auth/session', { method:
    // 'DELETE' }) -- a Next.js API route that never existed anywhere in this
    // codebase. It 404'd silently, never cleared the httpOnly access_token
    // cookie (only logoutAction's server-side cookies().delete() can do
    // that), and the client-side redirect to /login just bounced the user
    // straight back to /dashboard via middleware, which still saw a cookie
    // present. Users could never actually sign out. logoutAction (the same
    // one login already sets the cookie via) deletes the cookie and redirects.
    trackEvent("logout", { timestamp: new Date().toISOString() });
    await logoutAction();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 256 : 64 }}
        onHoverStart={() => setIsExpanded(true)}
        onHoverEnd={() => setIsExpanded(false)}
        className="fixed top-0 left-0 h-screen z-40 bg-bg-secondary border-r border-border hidden md:flex flex-col py-24 px-2"
      >
        <nav className="flex-1 space-y-2 relative">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <div 
                key={item.href} 
                className="relative"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center h-10 px-3 rounded-lg transition-colors group z-10",
                    isActive ? "text-text-primary bg-bg-elevated" : "text-text-tertiary hover:text-text-primary hover:bg-bg-hover"
                  )}
                  style={{
                    boxShadow: isActive ? "0 0 15px rgba(59, 130, 246, 0.1)" : "none"
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-accent-blue"
                    />
                  )}
                  <Icon className={cn("w-5 h-5 min-w-5", isActive ? "text-accent-blue" : "")} />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
                
                {/* Tooltip for collapsed state */}
                <AnimatePresence>
                  {!isExpanded && hoveredItem === item.href && (
                    <motion.div
                      initial={{ opacity: 0, x: 10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 10, scale: 0.95 }}
                      className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-bg-elevated border border-border text-xs font-semibold rounded-md shadow-xl z-50 whitespace-nowrap"
                    >
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-bg-elevated border-l border-b border-border rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-border pt-4">
          {bottomItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <div 
                key={item.href} 
                className="relative"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center h-10 px-3 rounded-lg transition-colors group z-10",
                    isActive ? "text-text-primary bg-bg-elevated" : "text-text-tertiary hover:text-text-primary hover:bg-bg-hover"
                  )}
                >
                  <Icon className="w-5 h-5 min-w-5" />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

                <AnimatePresence>
                  {!isExpanded && hoveredItem === item.href && (
                    <motion.div
                      initial={{ opacity: 0, x: 10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 10, scale: 0.95 }}
                      className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-bg-elevated border border-border text-xs font-semibold rounded-md shadow-xl z-50 whitespace-nowrap"
                    >
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-bg-elevated border-l border-b border-border rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          
          {/* Logout Button */}
          <div 
            className="relative mt-2"
            onMouseEnter={() => setHoveredItem("logout")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <button
              onClick={handleLogout}
              className="w-full relative flex items-center h-10 px-3 rounded-lg transition-colors group z-10 text-text-tertiary hover:text-accent-rose hover:bg-accent-rose/10"
            >
              <LogOut className="w-5 h-5 min-w-5" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {!isExpanded && hoveredItem === "logout" && (
                <motion.div
                  initial={{ opacity: 0, x: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.95 }}
                  className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-bg-elevated border border-border text-xs font-semibold rounded-md shadow-xl z-50 whitespace-nowrap text-accent-rose"
                >
                  Logout
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-bg-elevated border-l border-b border-border rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-bg-secondary/80 backdrop-blur-md border-t border-border z-50 flex items-center justify-around px-2">
        {[items[0], items[1], items[2], items[3], bottomItems[1]].map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors relative",
                isActive ? "text-accent-blue" : "text-text-tertiary"
              )}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <motion.span 
                  layoutId="mobile-indicator"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-accent-blue" 
                />
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
