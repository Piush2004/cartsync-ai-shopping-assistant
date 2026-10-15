'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'card';
}

const variantClasses = {
  text: 'h-4 rounded-md',
  circle: 'rounded-full',
  card: 'h-40 rounded-2xl',
};

export default function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={`
        bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03]
        bg-[length:200%_100%]
        animate-shimmer
        ${variantClasses[variant]}
        ${className}
      `}
    />
  );
}
