'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Camera, Shirt, Ruler, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const sidebarItems = [
  { href: '/dashboard', label: 'AI Chat', icon: MessageSquare },
  { href: '/studio', label: 'Virtual Try-On', icon: Camera },
  { href: '/dashboard/wardrobe', label: 'My Wardrobe', icon: Shirt },
  { href: '/dashboard/sizing', label: 'Size Profile', icon: Ruler },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const sidebarVariants = {
  expanded: { width: 260 },
  collapsed: { width: 72 },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, type: 'spring' as const, stiffness: 200 },
  }),
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30 glass-strong border-r border-white/[0.06]"
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </motion.button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {sidebarItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200 group
                    ${isActive
                      ? 'bg-accent/20 text-accent-light border border-accent/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <div className={`flex-shrink-0 ${
                    isActive ? 'text-accent-light' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                    <Icon size={20} />
                  </div>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-light"
                    />
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Section at Bottom */}
      {user && !isCollapsed && (
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
