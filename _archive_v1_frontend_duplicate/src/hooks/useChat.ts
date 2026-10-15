'use client';

import { useState, useCallback } from 'react';
import { chatAPI } from '@/lib/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    url: string;
  }[];
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await chatAPI(content.trim(), sessionId);
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: (response as { message?: string })?.message || String(response),
          timestamp: new Date(),
          products: (response as { products?: ChatMessage['products'] })?.products,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sendMessage, clearMessages, isLoading, error, sessionId };
}
