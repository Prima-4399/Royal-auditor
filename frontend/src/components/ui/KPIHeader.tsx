import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTilt } from '@/hooks/useTilt';

interface KPICardProps {
  label: string;
  value: string;
  color: 'gold' | 'cyan' | 'rose' | 'success';
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  isAnimating?: boolean;
  delay?: number;
  onClick?: () => void;
}

const colorConfig = {
  gold: {
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    text: 'text-amber-400',
    glow: 'hover:shadow-[0_0_50px_rgba(245,158,11,0.15)]',
    iconBg: 'bg-amber-500/15',
    accentLine: 'from-amber-500 to-orange-500',
  },
  cyan: {
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    text: 'text-cyan-400',
    glow: 'hover:shadow-[0_0_50px_rgba(6,182,212,0.15)]',
    iconBg: 'bg-cyan-500/15',
    accentLine: 'from-cyan-500 to-blue-500',
  },
  rose: {
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    text: 'text-rose-400',
    glow: 'hover:shadow-[0_0_50px_rgba(244,63,94,0.15)]',
    iconBg: 'bg-rose-500/15',
    accentLine: 'from-rose-500 to-pink-500',
  },
  success: {
    gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    text: 'text-emerald-400',
    glow: 'hover:shadow-[0_0_50px_rgba(16,185,129,0.15)]',
    iconBg: 'bg-emerald-500/15',
    accentLine: 'from-emerald-500 to-green-500',
  },
};

function KPICard({ label, value, color, icon, trend, isAnimating, delay = 0 }: KPICardProps) {
  const config = colorConfig[color];
  const { ref, tiltStyle, handlers } = useTilt(4);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        ref={ref}
        style={tiltStyle}
        {...handlers}
        className={`tilt-card relative overflow-hidden rounded-rg-lg border ${config.border} ${config.glow} glass-card-kpi group cursor-pointer`}
      >
        {/* 3D Reflection Layer */}
        <div className="tilt-card__reflection" />

        {/* Colored Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-60`} />
        
        {/* Shine Effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-shine opacity-0 group-hover:opacity-100"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        
        {/* Content */}
        <div className="relative z-10 p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-rg-md ${config.iconBg} backdrop-blur-sm`}>
              {icon}
            </div>
            
          {trend && value !== '0' && value !== '$0' && value !== '--%' && (
              <div className={`flex items-center gap-1 text-[11px] font-medium ${
                trend.positive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {trend.positive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {trend.value}
              </div>
            )}
          </div>
          
          {/* Label */}
          <p className="text-[11px] uppercase tracking-[0.15em] text-rg-text-muted font-semibold mb-2">
            {label}
          </p>
          
          {/* Value */}
          <motion.p
            className={`font-mono text-[36px] font-bold ${config.text} tracking-tight`}
            animate={isAnimating ? { 
              opacity: [1, 0.7, 1],
              scale: [1, 1.02, 1]
            } : {}}
            transition={{ duration: 0.5, repeat: isAnimating ? Infinity : 0 }}
          >
            {value}
          </motion.p>
        </div>
        
        {/* Bottom Accent Line — gradient bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${config.accentLine} opacity-60`} />
      </div>
    </motion.div>
  );
}

interface KPIHeaderProps {
  totalLeakage: string;
  contractsAudited: string;
  violationsFound: string;
  accuracy: string;
  isAnimating?: boolean;
  onCardClick?: (tab: 'leakage' | 'contracts' | 'violations' | 'accuracy') => void;
}

export function KPIHeader({
  totalLeakage,
  contractsAudited,
  violationsFound,
  accuracy,
  isAnimating = false,
  onCardClick,
}: KPIHeaderProps) {
  const cards = [
    {
      id: 'leakage' as const,
      label: 'Total Leakage',
      value: totalLeakage,
      color: 'gold' as const,
      icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'contracts' as const,
      label: 'Contracts Audited',
      value: contractsAudited,
      color: 'cyan' as const,
      icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'violations' as const,
      label: 'Violations Found',
      value: violationsFound,
      color: 'rose' as const,
      icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
    },
    {
      id: 'accuracy' as const,
      label: 'Accuracy Rate',
      value: accuracy,
      color: 'success' as const,
      icon: <TrendingDown className="w-5 h-5 text-emerald-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-5">
      {cards.map((card, index) => (
        <KPICard
          key={card.label}
          {...card}
          isAnimating={isAnimating && index === 0}
          delay={index * 0.1}
          onClick={() => onCardClick?.(card.id)}
        />
      ))}
    </div>
  );
}
