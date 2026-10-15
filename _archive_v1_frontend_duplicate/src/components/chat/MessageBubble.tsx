'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/features/ProductCard';
import SizingPanel from '@/components/features/SizingPanel';

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    products?: any[];
    sizing?: any;
  };
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const isUser = message.role === 'user';

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
          isUser
            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/20'
            : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/20'
        }`}
      >
        {isUser ? (
          user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="User"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-[11px]">{getInitials()}</span>
          )
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Bubble */}
        <div
          className={`
            px-4 py-3 text-sm leading-relaxed break-words
            ${
              isUser
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-violet-500/10'
                : 'backdrop-blur-xl bg-white/[0.06] border border-white/[0.08] text-[#f5f5f7] rounded-2xl rounded-bl-md'
            }
          `}
        >
          {message.content}
        </div>

        {/* Products Grid */}
        {!isUser && message.products && message.products.length > 0 && (
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2 pt-1">
              {message.products.map((product: any, idx: number) => (
                <ProductCard
                  key={product.id || idx}
                  product={product}
                  onTryOn={() => {}}
                  onGetSize={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sizing Panel */}
        {!isUser && message.sizing && (
          <div className="w-full max-w-sm">
            <SizingPanel result={message.sizing} isLoading={false} />
          </div>
        )}

        {/* Timestamp */}
        <span
          className={`text-[11px] text-zinc-500 px-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
