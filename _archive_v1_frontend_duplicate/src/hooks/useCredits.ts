'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useCredits() {
  const { credits, user } = useAuth();
  const [isDeducting, setIsDeducting] = useState(false);

  const hasEnoughCredits = (cost: number = 1) => credits >= cost;

  return { credits, hasEnoughCredits, isDeducting, setIsDeducting, user };
}
