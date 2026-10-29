"use client";

import { authApi } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { staggerContainer, fadeInUp } from '@/lib/motion';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      await authApi.register({ email, password });
      router.push('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to register.");
      setLoading(false);
    }
  }

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="w-full"
    >
      <motion.div variants={fadeInUp} className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">Create your account</h2>
        <p className="mt-2 text-sm text-text-secondary">Start your personalized fashion journey</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            Get Started
          </Button>
        </motion.div>
      </form>
      
      <motion.p variants={fadeInUp} className="mt-8 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-accent-blue hover:text-accent-purple transition-colors">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
