'use client';

import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
};

const variantClasses = {
  primary:
    'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border border-violet-500/30 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20',
  ghost:
    'bg-transparent text-zinc-400 border border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20',
  danger:
    'bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-500/30 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/20',
};

const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02, y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-300 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
}
