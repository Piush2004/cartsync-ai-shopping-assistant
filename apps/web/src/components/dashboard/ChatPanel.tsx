"use client";

import { useState } from "react";
import { conversationApi, ConversationResponse } from "@/lib/conversation";

export default function ChatPanel({ token }: { token: string }) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<ConversationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async (question: string) => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const data = await conversationApi.chat(token, question);
      setResponse(data);
    } catch (e) {
      console.error(e);
      setResponse({ answer: "I'm sorry, I'm having trouble connecting to my reasoning engines right now." });
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="bg-bg-card border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center">
          <span className="mr-2">✨</span> AI Stylist
        </h2>
      </div>
      
      <div className="p-6 flex-1 flex flex-col bg-gray-50">
        {response ? (
          <div className="mb-6 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-sm text-text-primary">{response.answer}</p>
            {response.sources && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-text-muted">
                  Sources: {response.sources.join(", ")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
            <p className="text-sm text-text-secondary italic">I am CartSync's AI Stylist. How can I help you today?</p>
          </div>
        )}
        
        <div className="mt-auto">
          <div className="mb-4">
            <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Examples</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => askQuestion("What size should I buy?")} className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50">What size should I buy?</button>
              <button onClick={() => askQuestion("Show Nike shirts")} className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50">Show Nike shirts</button>
              <button onClick={() => askQuestion("I want oversized clothes")} className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50">I want oversized clothes</button>
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askQuestion(input)}
              placeholder="Ask me anything..."
              className="w-full rounded-lg border border-border py-3 pl-4 pr-12 text-sm focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue shadow-sm"
              disabled={loading}
            />
            <button 
              onClick={() => askQuestion(input)}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 rounded-md bg-accent-blue p-1.5 text-white disabled:bg-bg-hover disabled:text-text-muted hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
