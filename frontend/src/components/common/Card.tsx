import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'white' | 'lime' | 'forest' | 'muted';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'white',
  className = '',
  onClick,
  hoverable = false,
}) => {
  const variantStyles = {
    white: 'bg-white text-gray-900 border border-[#EDF0EB] shadow-card',
    lime: 'bg-gradient-to-br from-[#B4F04D] to-[#9EE834] text-[#0F291E] border border-[#95E028] shadow-hero relative overflow-hidden',
    forest: 'bg-[#0F291E] text-white border border-[#1A3828] shadow-card',
    muted: 'bg-[#F6F8F5] text-gray-900 border border-[#E7EBE4]',
  };

  const hoverStyles = hoverable ? 'card-hover-effect cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-[28px] p-6 transition-all ${variantStyles[variant]} ${hoverStyles} ${className}`}
    >
      {variant === 'lime' && (
        <div className="absolute -right-8 -top-8 w-44 h-44 opacity-20 pointer-events-none select-none text-[#0F291E]">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <path d="M100 0 C100 55.23 144.77 100 200 100 C144.77 100 100 144.77 100 200 C100 144.77 55.23 100 0 100 C55.23 100 100 55.23 100 0 Z" />
          </svg>
        </div>
      )}
      {children}
    </div>
  );
};
