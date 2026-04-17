import { useState, useEffect } from 'react';
import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import type { LeakageSummaryResponse } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { TrendingDown, BarChart3, PieChart, Activity, Zap, Loader2, WifiOff } from 'lucide-react';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface LeakageSummaryTabProps {
  onRunAudit?: () => void;
}

export function LeakageSummaryTab({ onRunAudit }: LeakageSummaryTabProps) {
  const [data, setData] = useState<LeakageSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getLeakageSummary();
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError('Backend offline — start uvicorn on port 8000');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-rg-gold animate-spin" />
          <span className="text-[12px] text-rg-text-muted uppercase tracking-wider">Loading charts...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="leakage"
        title="No Leakage Data Available"
        description="Run an audit to analyze financial discrepancies and view leakage breakdowns by studio, content, and violation type. Click 'RUN AUDIT' to start."
      />
    );
  }

  // Transform API data for charts
  const studioData = data.by_studio.map(s => ({
    studio: s.studio,
    amount: s.total_leakage,
  }));

  const contentData = data.by_content.map(c => ({
    content_id: c.content_id,
    amount: c.total_leakage,
  }));

  // Single grouped bar — both values side-by-side
  const ovEntry = data.over_under.find(ou => ou.violation === 'OVERPAYMENT');
  const unEntry = data.over_under.find(ou => ou.violation === 'UNDERPAYMENT');
  const overUnderData = [
    {
      category: 'Payment Breakdown',
      overpayment: ovEntry?.total_amount ?? 0,
      underpayment: unEntry?.total_amount ?? 0,
    },
  ];

  const typeData = data.by_type.map(t => ({
    type: t.violation_type,
    count: t.count,
  }));

  return (
    <div className="h-full overflow-auto p-8 custom-scrollbar">
      {/* Header */}
      <motion.div className="mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Leakage Analytics
            </h2>
            <p className="text-sm text-slate-400 mt-1">Real-time audit intelligence and financial discrepancies</p>
          </div>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        className="grid grid-cols-2 gap-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {/* Leakage by Studio - Enhanced Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(251, 146, 60, 0.2)' }}
          className="group relative overflow-hidden rounded-2xl p-7 border border-amber-500/30 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-amber-500/20">
              <div className="p-3 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-lg border border-amber-500/50 group-hover:border-amber-400/70 transition-colors">
                <BarChart3 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-200 uppercase tracking-widest">Leakage by Studio</h3>
                <p className="text-xs text-amber-400/60 mt-0.5">Total impact across all studios</p>
              </div>
            </div>
            <div style={{ height: '320px' }}>
              <Bar
                data={{
                  labels: studioData.map(s => s.studio),
                  datasets: [
                    {
                      label: 'Leakage Amount',
                      data: studioData.map(s => s.amount),
                      backgroundColor: [
                        'rgba(251, 146, 60, 0.9)',
                        'rgba(249, 115, 22, 0.85)',
                        'rgba(234, 88, 12, 0.8)',
                        'rgba(194, 65, 12, 0.75)',
                        'rgba(153, 52, 10, 0.7)',
                      ],
                      borderColor: [
                        'rgb(251, 146, 60)',
                        'rgb(249, 115, 22)',
                        'rgb(234, 88, 12)',
                        'rgb(194, 65, 12)',
                        'rgb(153, 52, 10)',
                      ],
                      borderWidth: 0,
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y' as const,
                  responsive: true,
                  maintainAspectRatio: false,
                  devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
                  animation: { duration: 750 },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(10, 15, 30, 0.99)',
                      titleColor: '#FEF3C7',
                      bodyColor: '#F8FAFC',
                      padding: 16,
                      borderColor: '#FBBF24',
                      borderWidth: 3,
                      cornerRadius: 10,
                      titleFont: { weight: 800, size: 15, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 },
                      bodyFont: { weight: 700, size: 14, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.4 },
                      callbacks: {
                        label: (context: any) => `$${(context.parsed.x ?? 0).toLocaleString()}`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { drawBorder: false, color: 'rgba(251, 146, 60, 0.1)', lineWidth: 1 },
                      ticks: { color: '#F1F5F9', font: { size: 16, weight: 700, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 } },
                    },
                    y: { grid: { display: false }, ticks: { color: '#F1F5F9', font: { size: 16, weight: 700, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 } } },
                  },
                } as ChartOptions<'bar'>}
              />
            </div>
          </div>
        </motion.div>

        {/* Top 10 Content by Leakage - Enhanced Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(59, 130, 246, 0.2)' }}
          className="group relative overflow-hidden rounded-2xl p-7 border border-blue-500/30 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-blue-500/20">
              <div className="p-3 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-lg border border-blue-500/50 group-hover:border-blue-400/70 transition-colors">
                <TrendingDown className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-200 uppercase tracking-widest">Top 10 Content</h3>
                <p className="text-xs text-blue-400/60 mt-0.5">Problem assets by leakage amount</p>
              </div>
            </div>
            <div style={{ height: '320px' }}>
              <Bar
                data={{
                  labels: contentData.map(c => c.content_id),
                  datasets: [
                    {
                      label: 'Leakage Amount',
                      data: contentData.map(c => c.amount),
                      backgroundColor: 'rgba(59, 130, 246, 0.9)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 0,
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y' as const,
                  responsive: true,
                  maintainAspectRatio: false,
                  devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
                  animation: { duration: 750 },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(10, 15, 30, 0.99)',
                      titleColor: '#93C5FD',
                      bodyColor: '#F8FAFC',
                      padding: 16,
                      borderColor: '#60A5FA',
                      borderWidth: 3,
                      cornerRadius: 10,
                      titleFont: { weight: 800, size: 15, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 },
                      bodyFont: { weight: 700, size: 14, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.4 },
                      callbacks: {
                        label: (context: any) => `$${(context.parsed.x ?? 0).toLocaleString()}`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { drawBorder: false, color: 'rgba(59, 130, 246, 0.1)', lineWidth: 1 },
                      ticks: { color: '#F1F5F9', font: { size: 16, weight: 700, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 } },
                    },
                    y: { grid: { display: false }, ticks: { color: '#F1F5F9', font: { size: 16, weight: 700, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 } } },
                  },
                } as ChartOptions<'bar'>}
              />
            </div>
          </div>
        </motion.div>

        {/* Violations by Type - Enhanced Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(249, 115, 22, 0.2)' }}
          className="group relative overflow-hidden rounded-2xl p-7 border border-orange-500/30 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-orange-500/20">
              <div className="p-3 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-lg border border-orange-500/50 group-hover:border-orange-400/70 transition-colors">
                <PieChart className="w-5 h-5 text-orange-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-orange-200 uppercase tracking-widest">Violation Distribution</h3>
                <p className="text-xs text-orange-400/60 mt-0.5">Breakdown by violation type</p>
              </div>
            </div>
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pie
                data={{
                  labels: typeData.map(t => t.type.replace(/_/g, ' ')),
                  datasets: [
                    {
                      data: typeData.map(t => t.count),
                      backgroundColor: [
                        'rgba(245, 158, 11, 0.85)',
                        'rgba(59, 130, 246, 0.85)',
                        'rgba(249, 115, 22, 0.85)',
                        'rgba(239, 68, 68, 0.85)',
                      ],
                      borderColor: [
                        'rgb(245, 158, 11)',
                        'rgb(59, 130, 246)',
                        'rgb(249, 115, 22)',
                        'rgb(239, 68, 68)',
                      ],
                      borderWidth: 3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
                  animation: { duration: 750 },
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: {
                        color: '#F1F5F9',
                        font: { size: 15, weight: 700, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 },
                        padding: 24,
                        usePointStyle: true,
                        pointStyle: 'circle',
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(10, 15, 30, 0.99)',
                      titleColor: '#FEF3C7',
                      bodyColor: '#F8FAFC',
                      padding: 16,
                      borderColor: '#FBBF24',
                      borderWidth: 3,
                      cornerRadius: 10,
                      titleFont: { weight: 800, size: 15, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 },
                      bodyFont: { weight: 700, size: 14, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.4 },
                    },
                  },
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Overpayment vs Underpayment - Enhanced Doughnut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)' }}
          className="group relative overflow-hidden rounded-2xl p-7 border border-emerald-500/30 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-emerald-500/20">
              <div className="p-3 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-lg border border-emerald-500/50 group-hover:border-emerald-400/70 transition-colors">
                <Activity className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-200 uppercase tracking-widest">Payment Comparison</h3>
                <p className="text-xs text-emerald-400/60 mt-0.5">Over vs underpayment analysis</p>
              </div>
            </div>
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut
                data={{
                  labels: ['Overpayment', 'Underpayment'],
                  datasets: [
                    {
                      data: [overUnderData[0]?.overpayment || 0, overUnderData[0]?.underpayment || 0],
                      backgroundColor: [
                        'rgba(6, 182, 212, 0.85)',
                        'rgba(239, 68, 68, 0.85)',
                      ],
                      borderColor: [
                        'rgb(6, 182, 212)',
                        'rgb(239, 68, 68)',
                      ],
                      borderWidth: 3,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
                  animation: { duration: 750 },
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: {
                        color: '#F1F5F9',
                        font: { size: 15, weight: 700, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 },
                        padding: 24,
                        usePointStyle: true,
                        pointStyle: 'circle',
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(10, 15, 30, 0.99)',
                      titleColor: '#6EE7B7',
                      bodyColor: '#F8FAFC',
                      padding: 16,
                      borderColor: '#2DD4BF',
                      borderWidth: 3,
                      cornerRadius: 10,
                      titleFont: { weight: 800, size: 15, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.2 },
                      bodyFont: { weight: 700, size: 14, family: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif", lineHeight: 1.4 },
                      callbacks: {
                        label: (context: any) => `$${(context.parsed ?? 0).toLocaleString()}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
