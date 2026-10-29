"use client";

import { loginAction } from '@/app/actions/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { staggerContainer, fadeInUp } from '@/lib/motion';
import { useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');
    const res = await loginAction(formData);
    if (res?.error) {
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="w-full"
    >
      <motion.div variants={fadeInUp} className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">Welcome back</h2>
        <p className="mt-2 text-sm text-text-secondary">Sign in to your CartSync account</p>
      </motion.div>

      <form action={handleSubmit} className="space-y-6">
        {error && (
          <motion.div variants={fadeInUp} className="p-3 text-sm text-accent-rose bg-accent-rose/10 border border-accent-rose/20 rounded-xl">
            {error}
          </motion.div>
        )}
        
        <motion.div variants={fadeInUp} className="space-y-5">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            icon={<Mail className="w-5 h-5" />}
            required
            placeholder="you@example.com"
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            icon={<Lock className="w-5 h-5" />}
            required
            placeholder="••••••••"
          />
        </motion.div>

        <motion.div variants={fadeInUp} className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            Sign in
          </Button>
        </motion.div>
      </form>
      
      <motion.p variants={fadeInUp} className="mt-8 text-center text-sm text-text-muted">
        Don't have an account?{' '}
        <Link href="/register" className="font-medium text-accent-blue hover:text-accent-purple transition-colors">
          Create one
        </Link>
      </motion.p>
    </motion.div>
  );
}
