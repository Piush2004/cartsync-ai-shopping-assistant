"use client";

import { useState, useRef, useEffect } from "react";
import { GlowCard } from "@/components/ui/GlowCard";
import { Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiClient } from "@/lib/client";
import { toast } from "sonner";

export function StylistPanel({ token }: { token: string }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSparkling, setIsSparkling] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "Welcome! I'm your CartSync AI Stylist. I can help you with sizing, products, and style recommendations." }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const triggerSparkle = () => {
    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 1000);
  };

  const askQuestion = async (question: string) => {
    if (!question.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    
    try {
      const data = await apiClient<any>("/conversation/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ question })
      });
      
      triggerSparkle();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to connect to the reasoning engines.");
      setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I'm having trouble connecting to my reasoning engines right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "What size should I buy?",
    "Show Nike shirts",
    "I want oversized clothes"
  ];

  // Wave typing indicator animation
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: [0, -5, 0], transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" as const } }
  };

  return (
    <GlowCard className="flex flex-col h-[500px] p-0 border-accent-blue/30 overflow-hidden relative group/panel">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/10 rounded-full blur-[80px] pointer-events-none transition-all duration-1000" style={{ transform: isSparkling ? 'scale(1.5)' : 'scale(1)', opacity: isSparkling ? 0.3 : 0.1 }} />
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg-card/80 backdrop-blur-md z-10">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <motion.div
            animate={isSparkling ? { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className={`w-5 h-5 ${isSparkling ? 'text-accent-purple' : 'text-accent-blue'} transition-colors duration-300`} />
          </motion.div>
          AI Stylist
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-accent-emerald/10 border border-accent-emerald/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
          <span className="text-xs font-semibold text-accent-emerald">Live</span>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={msg.role === "user" ? { opacity: 0, x: 20, scale: 0.95 } : { opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-sm ${
                  msg.role === "user" 
                    ? "bg-gradient-accent text-white rounded-tr-sm" 
                    : "bg-bg-elevated/80 backdrop-blur-sm border border-border text-text-primary rounded-tl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.sources && (
                  <div className="mt-3 pt-3 border-t border-border-active/20">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
                      Sources: {msg.sources.join(" · ")}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div 
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-start"
            >
              <div className="bg-bg-elevated/80 backdrop-blur-sm border border-border p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
                <span className="text-xs text-text-muted font-medium">AI is thinking</span>
                <div className="flex gap-1 pt-1">
                  <motion.div variants={dotVariants} initial="initial" animate="animate" className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
                  <motion.div variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.15 }} className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
                  <motion.div variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.3 }} className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-6 pt-2 bg-gradient-to-t from-bg-card via-bg-card to-transparent z-10">
        <AnimatePresence>
          {messages.length === 1 && (
            <motion.div 
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 10 }}
              variants={staggerContainer}
              className="mb-4"
            >
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((text, i) => (
                  <motion.button 
                    key={i}
                    variants={staggerItem}
                    whileHover={{ y: -2, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                    onClick={() => askQuestion(text)} 
                    className="text-xs font-medium bg-bg-elevated border border-border text-text-secondary rounded-full px-4 py-2 transition-colors hover:text-text-primary"
                  >
                    {text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative flex items-center group">
          <div className="absolute inset-0 bg-gradient-accent opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity rounded-2xl" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && askQuestion(input)}
            placeholder="Ask me anything..."
            className="relative w-full h-14 rounded-2xl border border-border bg-bg-elevated px-5 py-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-blue focus-visible:border-accent-blue transition-all z-10"
            disabled={loading}
          />
          <button 
            onClick={() => askQuestion(input)}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-accent-blue flex items-center justify-center text-white disabled:bg-bg-hover disabled:text-text-muted hover:bg-accent-blue/90 transition-colors z-20 group/btn"
          >
            <Send className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </GlowCard>
  );
}
