import { 
  Shield, 
  FileText, 
  Play, 
  DollarSign, 
  Search, 
  AlertTriangle, 
  BarChart3, 
  Activity,
  ChevronRight,
  ShieldCheck,
  Database,
  Zap,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { TabId } from '@/types';
import { navItems } from '@/data/mockData.ts';

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Play,
  DollarSign,
  Search,
  AlertTriangle,
  BarChart3,
  Activity,
  ShieldCheck,
  Database,
  Zap,
  BookOpen,
};

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  agentStatuses: Array<{ name: string; status: 'PENDING' | 'RUNNING' | 'COMPLETE' }>;
  version?: string;
  appName?: string;
}

export function Sidebar({ activeTab, onTabChange, agentStatuses, version, appName }: SidebarProps) {
  const completedCount = agentStatuses.filter(s => s.status === 'COMPLETE').length;
  const progress = (completedCount / agentStatuses.length) * 100;

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-[280px] h-screen flex flex-col fixed left-0 top-0 z-50"
    >
      {/* Titan: Multi-layer Glass Background */}
      <div className="absolute inset-0 glass-sidebar" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-6 border-b border-rg-border-default">
          <motion.div 
            className="flex items-center gap-4"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* Animated Logo */}
            <div className="relative">
              <motion.div 
                className="absolute inset-0 bg-rg-gold/30 blur-xl rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative w-12 h-12 rounded-rg-md bg-gradient-gold flex items-center justify-center shadow-rg-gold">
                <Shield className="w-6 h-6 text-rg-bg-deep" strokeWidth={2.5} />
              </div>
            </div>
            
            <div>
              <h1 className="text-[18px] font-bold text-rg-text-primary tracking-tight">
                {appName || 'RoyalGuard'}
              </h1>
              <p className="text-[11px] text-rg-gold font-semibold tracking-[0.2em] uppercase">
                AI Auditor
              </p>
            </div>
          </motion.div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="mb-4 px-2">
            <p className="text-[10px] uppercase text-rg-text-muted tracking-[0.25em] font-semibold">
              Navigation
            </p>
          </div>
          
          <nav className="space-y-1.5">
            {navItems.map((item, index) => {
              const Icon = iconMap[item.icon];
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
                  onClick={() => onTabChange(item.id)}
                  className={`sidebar-item w-full flex items-center gap-3 px-4 py-3.5 rounded-rg-md text-left transition-all duration-300 group ${
                    isActive
                      ? 'bg-rg-gold-dim text-rg-gold'
                      : 'text-rg-text-secondary hover:bg-rg-bg-tertiary hover:text-rg-text-primary'
                  }`}
                >
                  {/* Icon Container */}
                  <div className={`relative p-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-rg-gold/20' 
                      : 'bg-rg-bg-tertiary group-hover:bg-rg-bg-elevated'
                  }`}>
                    <Icon className={`w-4 h-4 transition-all duration-300 ${
                      isActive ? 'text-rg-gold' : 'text-rg-text-tertiary group-hover:text-rg-text-secondary'
                    }`} />
                    
                    {/* Active Indicator Dot */}
                    {isActive && (
                      <motion.span 
                        layoutId="activeIndicator"
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rg-gold rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[14px] font-medium flex-1 transition-colors ${
                    isActive ? 'text-rg-gold' : ''
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Chevron for active */}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-rg-gold" />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Agent Pipeline Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <p className="text-[10px] uppercase text-rg-text-muted tracking-[0.25em] font-semibold">
                Agent Pipeline
              </p>
              <span className="text-[10px] font-mono text-rg-gold">
                {Math.round(progress)}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mx-2 mb-4 h-1 bg-rg-bg-tertiary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            
            {/* Agent List */}
            <div className="space-y-2 px-2">
              {agentStatuses.map((agent, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 + 0.4 }}
                  className="flex items-center gap-3 group"
                >
                  {/* Status Dot */}
                  <div className={`relative w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    agent.status === 'COMPLETE'
                      ? 'bg-rg-success'
                      : agent.status === 'RUNNING'
                      ? 'bg-rg-gold status-pulse'
                      : 'bg-rg-text-muted'
                  }`} />
                  
                  {/* Agent Name */}
                  <span className={`text-[12px] transition-colors duration-300 ${
                    agent.status === 'COMPLETE' 
                      ? 'text-rg-text-secondary' 
                      : agent.status === 'RUNNING'
                      ? 'text-rg-gold font-medium'
                      : 'text-rg-text-muted'
                  }`}>
                    {agent.name}
                  </span>
                  
                  {/* Status Icon */}
                  {agent.status === 'RUNNING' && (
                    <motion.span 
                      className="ml-auto text-[10px] text-rg-gold"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ●●●
                    </motion.span>
                  )}
                  {agent.status === 'COMPLETE' && (
                    <span className="ml-auto text-rg-success">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-rg-border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rg-success status-pulse" />
              <span className="text-[11px] text-rg-text-tertiary">System Online</span>
            </div>
            <span className="text-[11px] font-mono text-rg-text-muted">v{version || '1.0.0'}</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
