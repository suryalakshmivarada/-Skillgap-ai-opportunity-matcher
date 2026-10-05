import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glow' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantStyles = {
    default: 'glass-panel rounded-2xl shadow-xl',
    interactive: 'glass-panel-interactive rounded-2xl shadow-xl cursor-pointer',
    glow: 'glass-panel glass-card-glow rounded-2xl shadow-2xl',
    subtle: 'bg-slate-900/40 border border-slate-800/80 rounded-2xl'
  };

  return (
    <div
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
