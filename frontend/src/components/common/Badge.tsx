import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'forest' | 'neutral' | 'outline' | 'amber' | 'red' | 'blue';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles = {
    lime: 'bg-[#B4F04D] text-[#0F291E] font-semibold border border-[#9AE630]',
    forest: 'bg-[#0F291E] text-white font-medium border border-[#0F291E]',
    neutral: 'bg-[#F2F4F1] text-[#374151] font-medium border border-[#E5E7EB]',
    outline: 'bg-white text-[#111827] font-medium border border-[#D1D5DB]',
    amber: 'bg-[#FEF3C7] text-[#92400E] font-semibold border border-[#FDE68A]',
    red: 'bg-[#FEE2E2] text-[#991B1B] font-semibold border border-[#FECACA]',
    blue: 'bg-[#DBEAFE] text-[#1E40AF] font-semibold border border-[#BFDBFE]',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full',
    md: 'text-xs px-3 py-1 rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="inline-block text-[11px]">{icon}</span>}
      {children}
    </span>
  );
};
