import { motion } from 'framer-motion';
import type { ViolationType } from '@/types';

interface ViolationBadgeProps {
  type: ViolationType;
}

const badgeConfig: Record<ViolationType, {
  gradient: string;
  text: string;
  icon: string;
  glow: string;
}> = {
  UNDERPAYMENT: {
    gradient: 'from-amber-500/20 to-orange-500/10',
    text: 'text-amber-400',
    icon: '↓',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  },
  OVERPAYMENT: {
    gradient: 'from-blue-500/20 to-cyan-500/10',
    text: 'text-blue-400',
    icon: '↑',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  },
  EXPIRED_LICENSE: {
    gradient: 'from-rose-500/20 to-pink-500/10',
    text: 'text-rose-400',
    icon: '✕',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  },
  TERRITORY_VIOLATION: {
    gradient: 'from-orange-500/20 to-amber-500/10',
    text: 'text-orange-400',
    icon: '⚠',
    glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
  },
  NONE: {
    gradient: 'from-emerald-500/20 to-green-500/10',
    text: 'text-emerald-400',
    icon: '✓',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  },
};

export function ViolationBadge({ type }: ViolationBadgeProps) {
  const config = badgeConfig[type];
  
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-rg-md bg-gradient-to-r ${config.gradient} ${config.text} ${config.glow} border border-white/5`}
    >
      <span className="text-[12px]">{config.icon}</span>
      {type.replace('_', ' ')}
    </motion.span>
  );
}
