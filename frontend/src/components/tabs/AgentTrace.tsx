import { motion } from 'framer-motion';
import type { AgentStep, AgentStatus } from '@/types';
import { Bot, CheckCircle2, Clock, Loader2, Sparkles } from 'lucide-react';

interface AgentTraceTabProps {
  agentSteps: AgentStep[];
}

function StatusBadge({ status }: { status: AgentStatus }) {
  const config: Record<AgentStatus, { bg: string; text: string; icon: React.ReactNode; animate?: boolean }> = {
    PENDING: {
      bg: 'bg-rg-text-muted/10',
      text: 'text-rg-text-muted',
      icon: <Clock className="w-3 h-3" />,
    },
    RUNNING: {
      bg: 'bg-rg-gold/15',
      text: 'text-rg-gold',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      animate: true,
    },
    COMPLETE: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
  };

  const style = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-rg-md ${style.bg} ${style.text} ${style.animate ? 'animate-pulse' : ''} border border-white/5`}
    >
      {style.icon}
      {status}
    </span>
  );
}

export function AgentTraceTab({ agentSteps }: AgentTraceTabProps) {
  const completedCount = agentSteps.filter(s => s.status === 'COMPLETE').length;
  const progress = (completedCount / agentSteps.length) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="h-full overflow-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rg-violet/10 rounded-rg-lg">
              <Sparkles className="w-5 h-5 text-rg-violet" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-rg-text-primary">Agent Pipeline Trace</h2>
              <p className="text-sm text-rg-text-muted mt-0.5">Real-time audit agent execution monitoring</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase text-rg-text-muted tracking-wider mb-1">Progress</p>
            <p className="font-mono text-3xl text-rg-gold font-bold">{Math.round(progress)}%</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-rg-bg-tertiary rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-rg-gold to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Agent Steps */}
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-[26px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-rg-gold via-rg-border-default to-rg-border-default rounded-full" />

        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {agentSteps.map((step) => (
            <motion.div
              key={step.id}
              variants={itemVariants}
              className="relative flex items-start gap-5"
            >
              {/* Step indicator */}
              <div className="relative z-10 flex-shrink-0">
                <motion.div 
                  className={`w-14 h-14 rounded-rg-xl flex items-center justify-center transition-all duration-300 border ${
                    step.status === 'RUNNING'
                      ? 'bg-rg-gold/15 border-rg-gold/40 shadow-rg-gold'
                      : step.status === 'COMPLETE'
                      ? 'bg-emerald-500/15 border-emerald-500/40'
                      : 'bg-rg-bg-card border-rg-border-default'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {step.status === 'COMPLETE' ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  ) : step.status === 'RUNNING' ? (
                    <Bot className="w-7 h-7 text-rg-gold animate-pulse" />
                  ) : (
                    <span className="font-mono text-xl text-rg-text-muted font-bold">
                      {String(step.id).padStart(2, '0')}
                    </span>
                  )}
                </motion.div>
              </div>

              {/* Card */}
              <motion.div 
                className={`flex-1 glass-card rounded-rg-lg p-4 border transition-all duration-300 ${
                  step.status === 'RUNNING'
                    ? 'border-rg-gold/40 shadow-rg-gold'
                    : step.status === 'COMPLETE'
                    ? 'border-emerald-500/30'
                    : 'border-rg-border-default hover:border-rg-border-highlight'
                }`}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[16px] font-bold text-rg-text-primary">
                        {step.name}
                      </h3>
                      <StatusBadge status={step.status} />
                    </div>
                    <p className="text-[14px] text-rg-text-secondary mb-1">
                      {step.action}
                    </p>
                    <p className="text-[12px] text-rg-text-muted">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
