import { ReactNode } from 'react';

interface TitanCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'none' | 'blue' | 'blue-strong' | 'inner';
  variant?: 'default' | 'gradient' | 'surface';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function TitanCard({
  children,
  className = '',
  glow = 'none',
  variant = 'default',
  padding = 'md',
}: TitanCardProps) {
  const glowClasses = {
    none: '',
    blue: 'titan-glow',
    'blue-strong': 'titan-glow-strong',
    inner: 'titan-glow-inner',
  };

  const variantClasses = {
    default: 'bg-[#0a0a0a] border border-white/[0.08]',
    gradient: 'titan-glow-bg bg-[#0a0a0a] border border-white/[0.08]',
    surface: 'titan-surface',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`rounded-[24px] ${variantClasses[variant]} ${glowClasses[glow]} ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

interface TitanTabProps {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}

export function TitanTab({ active, children, onClick }: TitanTabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium tracking-[-0.01em] transition-all ${
        active
          ? 'bg-[#0071c5] text-white'
          : 'text-[#888888] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

interface TitanButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'outline';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function TitanButton({ children, variant = 'primary', onClick, className = '', disabled }: TitanButtonProps) {
  const variants = {
    primary: 'bg-[#0071c5] text-white hover:bg-[#005a9e]',
    ghost: 'bg-transparent text-white hover:bg-white/[0.08] border border-white/[0.08]',
    outline: 'bg-transparent text-white border border-white/20 hover:bg-white/[0.05]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium tracking-[-0.01em] transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
