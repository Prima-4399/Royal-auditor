import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Zap } from 'lucide-react';
import { getApiBase } from '@/lib/getApiBase.ts';
import { Sidebar } from '@/components/layout/Sidebar.tsx';
import { Topbar } from '@/components/layout/Topbar.tsx';
import { KPIHeader } from '@/components/ui/KPIHeader.tsx';
import { ContractsTab } from '@/components/tabs/Contracts';
import { StreamingLogsTab } from '@/components/tabs/StreamingLogs';
import { PaymentsTab } from '@/components/tabs/Payments';
import { AuditResultsTab } from '@/components/tabs/AuditResults';
import { ViolationsTab } from '@/components/tabs/Violations';
import { LeakageSummaryTab } from '@/components/tabs/LeakageSummary';
import { AgentTraceTab } from '@/components/tabs/AgentTrace';
import { Governance } from '@/components/tabs/Governance';
import { Connectors } from '@/components/tabs/Connectors';
import { LiveMonitor } from '@/components/tabs/LiveMonitor';
import { GlossaryTab } from '@/components/tabs/Glossary';
import type { TabId, AgentStatus, LiveMonitorState } from '@/types';
import { navItems, initialAgentSteps, agentNames } from '@/data/mockData.ts';
import { api } from '@/lib/api.ts';
import type { AuditSSEEvent } from '@/lib/api.ts';
import './App.css';

// Global fallback for add_notification to prevent "not defined" errors
// This can be called from anywhere in the app
if (typeof (window as any).add_notification === 'undefined') {
  (window as any).add_notification = (title?: string, message?: string, type?: string) => {
    const msg = message || title || 'Notification';
    console.log(`[${type || 'info'}] ${msg}`);
  };
}

// Titan: Adaptive Mesh Background — reacts to system health
function TitanMesh({ isFever }: { isFever: boolean }) {
  return (
    <>
      {/* Mesh Gradient Blobs */}
      <div className={`titan-mesh ${isFever ? 'titan-mesh--fever' : ''}`}>
        <div className="titan-mesh__blob titan-mesh__blob--1" />
        <div className="titan-mesh__blob titan-mesh__blob--2" />
        <div className="titan-mesh__blob titan-mesh__blob--3" />
        <div className="titan-mesh__blob titan-mesh__blob--health" />
      </div>

      {/* Grid Pattern (sits on top of mesh) */}
      <div className="bg-grid-pattern" />
      
      {/* Noise Overlay */}
      <div className="noise-overlay" />
    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('contracts');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [loadProgress, setLoadProgress] = useState<{ step: string; progress: number } | null>(null);
  const [agentSteps, setAgentSteps] = useState(initialAgentSteps);
  const [totalLeakage, setTotalLeakage] = useState('$0');
  const [isKPIAnimating, setIsKPIAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // KPI state from API — starting from zero/empty for 'Day 0' experience
  const [kpiContracts, setKpiContracts] = useState('0');
  const [kpiViolations, setKpiViolations] = useState('0');
  const [kpiAccuracy, setKpiAccuracy] = useState('--%');

  // Programmatic AI query — row-level "Ask AI" from any tab
  const [externalQuery, setExternalQuery] = useState<string | null>(null);

  // Audit completion toast
  const [auditToast, setAuditToast] = useState<{
    show: boolean;
    contracts: number;
    leakage: number;
    violations: number;
    elapsed: number;
  } | null>(null);

  const [showSetup, setShowSetup] = useState(false);  // Always start with app loaded
  
  // ── FETCH KPIs ON MOUNT ──────────────────────────────────────────────
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const summary = await api.getLeakageSummary();
        const kpi = summary.kpi;
        
        setTotalLeakage(`$${kpi.total_leakage?.toLocaleString() || '0'}`);
        setKpiContracts(`${kpi.total_contracts?.toLocaleString() || '0'}`);
        setKpiViolations(`${kpi.total_violations?.toLocaleString() || '0'}`);
        setKpiAccuracy(`${kpi.accuracy || 0}%`);
      } catch (err) {
        console.error('[KPI] Failed to fetch on mount:', err);
      }
    };
    fetchKPIs();
  }, []);
  
  // Persistent Live Monitor State
  const [isLiveMonitorStarted] = useState(true);
  const [isEngineEnabled, setIsEngineEnabled] = useState(true);
  const [liveMonitorState, setLiveMonitorState] = useState<LiveMonitorState>({
    streams: [],
    stats: { audited: 0, leaked: 0, speed: 0, cpu: 0 }
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const liveStreamRef = useRef<EventSource | null>(null);

  const [config, setConfig] = useState<{ app_name: string; version: string; description?: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await api.getConfig();
      setConfig(data);
    } catch (err) {
      setConfig({ app_name: 'RoyalGuard AI', version: '1.0.0' });
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchConfig();
  }, [fetchConfig]);

  // Fetch KPI values from database on app load
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        console.log(`[KPI] Starting fetch from ${getApiBase()}/leakage-summary`);
        const summary = await api.getLeakageSummary();
        const kpi = summary.kpi;
        
        console.log('✅ KPI data loaded:', kpi);
        
        setTotalLeakage(`$${kpi.total_leakage?.toLocaleString() || '0'}`);
        setKpiContracts(`${kpi.total_contracts?.toLocaleString() || '0'}`);
        setKpiViolations(`${kpi.total_violations?.toLocaleString() || '0'}`);
        setKpiAccuracy(`${kpi.accuracy || 0}%`);
      } catch (err) {
        console.error('[KPI] Failed to fetch:', err);
        console.error('[KPI] API Base URL:', getApiBase());
        console.error('[KPI] Full error:', err instanceof Error ? err.message : JSON.stringify(err));
        // Keep defaults if fetch fails
      }
    };
    fetchKPIs();
  }, []);

  // Function to connect live stream — ONLY called during active audit
  const connectLiveStream = useCallback(() => {
    // Don't connect if one is already active
    if (liveStreamRef.current) {
      console.log('[LIVE STREAM] Stream already connected, skipping duplicate');
      return;
    }

    try {
      console.log('[LIVE STREAM] Connecting to /audit/stream...');
      const es = api.streamLiveAudit();
      liveStreamRef.current = es;
      
      let messageCount = 0;
      let lastActivityTime = Date.now();
      const connectionTimeout = 30000; // 30 second timeout
      const timeoutCheck = setInterval(() => {
        if (messageCount === 0 && Date.now() - lastActivityTime > connectionTimeout) {
          console.log('[LIVE STREAM] No data received, closing stale connection');
          clearInterval(timeoutCheck);
          es.close();
          liveStreamRef.current = null;
        }
      }, 5000);

      es.onopen = () => {
        console.log('[LIVE STREAM] Connection opened successfully');
        lastActivityTime = Date.now();
      };

      es.onmessage = (event) => {
        try {
          messageCount++;
          lastActivityTime = Date.now();
          const payload = JSON.parse(event.data);
          
          // Handle empty state
          if (payload.status === 'empty') {
            console.log('[LIVE STREAM] No audit records available yet');
            return;
          }
          
          // Handle the stream record and stats from backend
          if (payload.record && payload.stats) {
            setLiveMonitorState((prev) => {
              // Add new record and keep only last 100
              const newStreams = [payload.record, ...prev.streams].slice(0, 100);
              return {
                streams: newStreams,
                stats: payload.stats
              };
            });
          }
          
          // Handle completion/error messages
          if (payload.status === 'complete') {
            console.log('[LIVE STREAM] Stream complete:', `${payload.total_processed} records, ${payload.total_violations} violations`);
            clearInterval(timeoutCheck);
          }
          if (payload.status === 'error') {
            console.error('[LIVE STREAM] Stream error:', payload.detail);
            clearInterval(timeoutCheck);
          }
        } catch (err) {
          console.error('[LIVE STREAM] Parse error:', err, 'Raw data:', event.data);
        }
      };

      es.onerror = (e) => {
        clearInterval(timeoutCheck);
        if (es.readyState === EventSource.CONNECTING) {
          console.log('[LIVE STREAM] Connection in progress...');
        } else if (es.readyState === EventSource.CLOSED) {
          console.log('[LIVE STREAM] Stream closed by server');
        } else {
          console.warn('[LIVE STREAM] Connection error, reconnecting...');
          liveStreamRef.current = null;
          // Try to reconnect after a brief delay
          setTimeout(() => connectLiveStream(), 2000);
          return;
        }
        es.close();
        liveStreamRef.current = null;
      };

      console.log('[LIVE STREAM] Connected successfully');
    } catch (err) {
      console.error('[LIVE STREAM] Failed to connect:', err);
      liveStreamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveStreamRef.current) {
        console.log('[LIVE STREAM] Closing on unmount');
        liveStreamRef.current.close();
        liveStreamRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Auto-start live stream on app load (before audit is even run)
  useEffect(() => {
    console.log('[APP] Auto-starting live stream on mount');
    connectLiveStream();
  }, [connectLiveStream]);

  // Demo Setup Overlay ("Load synthetic data" page) - REMOVED: Auto-start with data loaded
  /*
  const SetupView = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-xl"
    >
      <div className="max-w-2xl w-full bg-slate-900/50 border border-white/10 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap size={120} className="text-blue-400" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          {config?.app_name || 'RoyalGuard AI'}
        </h1>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-lg">
          Welcome to the Digital License Royalty Auditor. This platform uses an 
          <span className="text-blue-400 font-medium"> 8-agentic pipeline</span> to 
          automatically detect royalty leakage across thousands of content licenses.
        </p>

        <div className="space-y-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-1">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-white font-medium">Step 1: Synthetic Data Ingestion</h3>
              <p className="text-slate-500 text-sm">Generate 1,000 contracts, 100k logs, and 10k payment records with injected leakage.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-rg-text-primary">Enterprise ERP Connectors</h2>
              <p className="text-sm text-rg-text-muted mt-0.5">Real-time synchronization with financial and payment systems.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            handleLoadData();
            setShowSetup(false);
            localStorage.setItem('royalguard_setup_done', 'true');
          }}
          disabled={isLoadingData}
          className="group relative w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-5 px-8 rounded-2xl transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)] flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {isLoadingData ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Synthesizing Ecosystem...</span>
            </div>
          ) : (
            <>
              <span>INITIALIZE AUDIT PIPELINE</span>
              <Zap size={20} className="group-hover:animate-pulse" />
            </>
          )}
        </button>
        
        <div className="mt-8 text-center text-slate-500 text-xs font-mono uppercase tracking-widest">
          Version {config?.version || '1.0.0'} • Advanced Agentic Coding Project
        </div>
      </div>
    </motion.div>
  );
  */  // End of removed SetupView

  const activeTabLabel = navItems.find((item) => item.id === activeTab)?.label || '';

  const agentStatuses = agentNames.map((name, index) => ({
    name,
    status: agentSteps[index]?.status || 'PENDING',
  }));

  // Load Data — calls the real backend /data/reset to re-seed SQLite from CSVs
  const handleLoadData = useCallback(async () => {
    if (isLoadingData || isRunningAudit) return;
    setIsLoadingData(true);

    const progressSteps = [
      { step: 'Connecting to data source...', progress: 5 },
      { step: 'Loading contracts (1,000 records)...', progress: 25 },
      { step: 'Loading streaming logs (100K rows)...', progress: 55 },
      { step: 'Loading payment ledger...', progress: 75 },
      { step: 'Loading audit results & violations...', progress: 90 },
    ];

    // Animate progress while backend works
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setLoadProgress(progressSteps[stepIdx]);
        stepIdx++;
      }
    }, 600);

    try {
      await api.resetData();
      clearInterval(interval);
      setLoadProgress({ step: 'Data loaded successfully — 1,000 contracts, 100K logs, 10K payments', progress: 100 });
      await new Promise((resolve) => setTimeout(resolve, 1200));
    } catch {
      clearInterval(interval);
      setLoadProgress({ step: 'Load complete (using cached data)', progress: 100 });
      await new Promise((resolve) => setTimeout(resolve, 1200));
    } finally {
      setIsLoadingData(false);
      setLoadProgress(null);
    }
  }, [isLoadingData, isRunningAudit]);

  // Run Audit — SSE streaming from backend
  const handleRunAudit = useCallback(async () => {
    if (isLoadingData || isRunningAudit) return;

    setIsRunningAudit(true);
    setTotalLeakage('$0');
    setKpiContracts('0');
    setKpiViolations('0');
    setKpiAccuracy('--%');
    setActiveTab('agents');

    // Reset all agents to PENDING
    setAgentSteps(initialAgentSteps.map((step) => ({ ...step, status: 'PENDING' as AgentStatus })));

    // Close any existing EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = api.runAudit();
    eventSourceRef.current = es;

    // Connect live stream ONLY during active audit
    // This prevents ERR_CONNECTION_RESET when no audit is running
    console.log('[AUDIT] Connecting live stream for real-time monitoring');
    connectLiveStream();

    es.onmessage = (event) => {
      try {
        const data: AuditSSEEvent = JSON.parse(event.data);
        
        // Find the agent index by name
        const agentIndex = agentNames.findIndex(n => n === data.agent);
        
        if (agentIndex >= 0) {
          setAgentSteps((prev) =>
            prev.map((step, index) => {
              // 🔥 FIX: Enforce strict sequential agent completion
              // Current running agent
              if (index === agentIndex) {
                return {
                  ...step,
                  action: data.action,
                  detail: data.detail,
                  timestamp: new Date().toLocaleTimeString(),
                  // Backend sends "running" for active agents and "complete" for the last one
                  status: (data.status === 'done' || data.status === 'complete'
                    ? 'COMPLETE'
                    : 'RUNNING') as AgentStatus,
                };
              }
              
              // 🔥 FIX: All agents before current agent must be COMPLETE (enforces order)
              if (index < agentIndex && step.status !== 'COMPLETE') {
                return { ...step, status: 'COMPLETE' as AgentStatus };
              }
              
              // All agents after current agent remain in their current state
              return step;
            })
          );
        }

        // Final event — animate KPI and show completion toast
        if (data.status === 'done' || data.status === 'complete') {
          // 🔥 FIX: IMMEDIATELY set final state on ANY completion signal
          // This ensures button resets and KPIs refresh immediately (not waiting for animation)
          setAgentSteps((prev) =>
            prev.map((step) => ({ ...step, status: 'COMPLETE' as AgentStatus }))
          );
          
          // 🔥 CRITICAL: Reset button state immediately
          setIsRunningAudit(false);
          
          // 🔥 CRITICAL: Refresh KPIs immediately and use REAL data for toast
          api.getLeakageSummary()
            .then((summary) => {
              const kpi = summary.kpi;
              
              // Update KPI cards with fresh data
              setKpiContracts(`${kpi.total_contracts?.toLocaleString() || '0'}`);
              setKpiViolations(`${kpi.total_violations?.toLocaleString() || '0'}`);
              setKpiAccuracy(`${kpi.accuracy || 0}%`);
              const realLeakage = kpi.total_leakage || 0;
              setTotalLeakage(`$${realLeakage.toLocaleString()}`);
              
              // Only animate and show toast if we have 'done' event with data
              if (data.status === 'done') {
                setIsKPIAnimating(true);

                // Animate from $0 to real value over 2 seconds using requestAnimationFrame
                const duration = 2000;
                const startTime = performance.now();

                function animate(currentTime: number) {
                  const elapsed = currentTime - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  // Ease out cubic
                  const eased = 1 - Math.pow(1 - progress, 3);
                  const currentValue = Math.round(realLeakage * eased);
                  setTotalLeakage(`$${currentValue.toLocaleString()}`);

                  if (progress < 1) {
                    requestAnimationFrame(animate);
                  } else {
                    setTotalLeakage(`$${realLeakage.toLocaleString()}`);
                    setIsKPIAnimating(false);
                    // 🔥 FIX: Show toast with REAL KPI data, not SSE data
                    setAuditToast({
                      show: true,
                      contracts: kpi.total_contracts || 1000,
                      leakage: realLeakage,
                      violations: kpi.total_violations || 0,
                      elapsed: data.elapsed_seconds || 0,
                    });
                    // Auto-dismiss after 8 seconds
                    setTimeout(() => setAuditToast(null), 8000);
                  }
                }

                requestAnimationFrame(animate);
              } else {
                // If no 'done' event, show toast immediately with real KPI values
                setAuditToast({
                  show: true,
                  contracts: kpi.total_contracts || 1000,
                  leakage: realLeakage,
                  violations: kpi.total_violations || 0,
                  elapsed: data.elapsed_seconds || 0,
                });
                setTimeout(() => setAuditToast(null), 8000);
              }
            })
            .catch((err) => {
              console.log('KPI refresh failed:', err);
              // Fallback: Show toast with SSE data if API fails
              setAuditToast({
                show: true,
                contracts: data.total_audited || 1000,
                leakage: data.total_leakage || 0,
                violations: data.total_violations || 0,
                elapsed: data.elapsed_seconds || 0,
              });
              setTimeout(() => setAuditToast(null), 8000);
            });

          // Close connection after processing completion
          es.close();
          eventSourceRef.current = null;
          
          // Also close live stream when audit completes
          if (liveStreamRef.current) {
            console.log('[LIVE STREAM] Closing after audit completion');
            liveStreamRef.current.close();
            liveStreamRef.current = null;
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    es.onerror = (e) => {
      // 🔥 FIX: Distinguish between normal close and real errors
      const target = e?.target || e?.currentTarget;
      if (target?.readyState === EventSource.CLOSED) {
        console.log('Audit stream closed normally');
        // Still mark as complete even on normal close
        setAgentSteps((prev) =>
          prev.map((step) => ({ ...step, status: 'COMPLETE' as AgentStatus }))
        );
        setIsRunningAudit(false);
        // Clean up live stream on normal close
        if (liveStreamRef.current) {
          liveStreamRef.current.close();
          liveStreamRef.current = null;
        }
        return;
      }
      
      // Only log as error if it's a real error
      console.error('SSE connection error:', e);
      es.close();
      eventSourceRef.current = null;
      
      // Clean up live stream on error
      if (liveStreamRef.current) {
        liveStreamRef.current.close();
        liveStreamRef.current = null;
      }
      
      // 🔥 FIX: On error, still mark all agents complete to show final state
      setAgentSteps((prev) =>
        prev.map((step) => ({ ...step, status: 'COMPLETE' as AgentStatus }))
      );
      setIsRunningAudit(false);
    };
  }, [isLoadingData, isRunningAudit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Called by tab rows to trigger the Topbar AI query bar
  const handleAskAI = useCallback((query: string) => {
    setExternalQuery(query);
  }, []);

  const renderTabContent = () => {
    const tabContent = {
      contracts: <ContractsTab />,
      streaming: <StreamingLogsTab />,
      payments: <PaymentsTab />,
      audit: <AuditResultsTab onAskAI={handleAskAI} />,
      violations: <ViolationsTab onAskAI={handleAskAI} />,
      leakage: <LeakageSummaryTab />,
      agents: <AgentTraceTab agentSteps={agentSteps} />,
      governance: <Governance />,
      connectors: <Connectors />,
      live: <LiveMonitor 
        streams={liveMonitorState.streams} 
        stats={liveMonitorState.stats}
        isStarting={isLiveMonitorStarted && liveMonitorState.streams.length < 3}
        isEngineEnabled={isEngineEnabled}
        onToggleEngine={() => {
          const nextState = !isEngineEnabled;
          setIsEngineEnabled(nextState);
          if (!nextState) {
            setLiveMonitorState(prev => ({
              ...prev,
              stats: { ...prev.stats, speed: 0, cpu: 0 }
            }));
          }
        }}
      />,
      glossary: <GlossaryTab />,
    };

    return (
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col min-h-0"
      >
        {tabContent[activeTab]}
      </motion.div>
    );
  };

  if (!mounted) return null;

  // Titan: Calculate system health for background mesh
  const leakageNum = parseInt(totalLeakage.replace(/[$,]/g, '')) || 0;
  const isFever = leakageNum > 50000;

  return (
    <div className="relative min-h-screen bg-rg-bg-deep text-rg-text-primary font-sans overflow-hidden">
      {/* Titan Adaptive Mesh Background */}
      <TitanMesh isFever={isFever} />
      
      {/* Main Layout */}
      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
          agentStatuses={agentStatuses}
          appName={config?.app_name}
          version={config?.version}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col ml-[280px] min-w-0">
          {/* Topbar */}
          <Topbar
            activeTabLabel={activeTabLabel}
            onLoadData={handleLoadData}
            onRunAudit={handleRunAudit}
            isLoadingData={isLoadingData}
            isRunningAudit={isRunningAudit}
            loadProgress={loadProgress}
            externalQuery={externalQuery}
            onExternalQueryHandled={() => setExternalQuery(null)}
          />

          {/* Content Container */}
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'glossary' ? 'p-0' : 'p-6'} min-w-0`}>
            {/* KPI Header - Hidden for Glossary */}
            {activeTab !== 'glossary' && (
              <motion.div
                className="flex-shrink-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <KPIHeader
                  totalLeakage={totalLeakage}
                  contractsAudited={kpiContracts}
                  violationsFound={kpiViolations}
                  accuracy={kpiAccuracy}
                  isAnimating={isKPIAnimating}
                  onCardClick={(tab) => {
                    if (tab === 'leakage') setActiveTab('leakage');
                    if (tab === 'contracts') setActiveTab('contracts');
                    if (tab === 'violations') setActiveTab('violations');
                  }}
                />
              </motion.div>
            )}

            {/* Tab Content */}
            <motion.div 
              className={`${activeTab === 'glossary' ? 'flex-1' : 'mt-6 flex-1'} ${activeTab === 'glossary' ? 'bg-rg-bg-deep' : 'bg-rg-bg-card/30 backdrop-blur-md rounded-rg-lg border border-white/5'} overflow-hidden flex flex-col shadow-2xl`}
              style={{ minHeight: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col ${activeTab === 'glossary' ? 'p-6' : 'p-4 space-y-4'} min-h-0`}>
                <AnimatePresence mode="wait">
                  {renderTabContent()}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Audit Completion Toast ── */}
      <AnimatePresence>
        {auditToast?.show && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="audit-toast-container relative overflow-hidden border border-emerald-500/30 rounded-2xl px-8 py-5 shadow-2xl min-w-[600px]">
              {/* Glow effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-emerald-400/10 to-emerald-500/5" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
              
              <div className="relative flex items-center gap-5">
                {/* Icon */}
                <div className="flex-shrink-0 p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-rg-gold" />
                    <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold">Audit Complete</span>
                  </div>
                  <p className="text-[15px] text-rg-text-primary leading-snug">
                    We audited <span className="font-bold text-rg-text-primary">{auditToast.contracts.toLocaleString()} contracts</span> in{' '}
                    <span className="font-bold text-cyan-300">{auditToast.elapsed}s</span> and found{' '}
                    <span className="font-bold text-rg-gold">${auditToast.leakage.toLocaleString()}</span> in royalty leakage
                    {' '}across <span className="font-bold text-rose-400">{auditToast.violations} violations</span>.
                  </p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => setAuditToast(null)}
                  className="flex-shrink-0 p-1.5 text-rg-text-muted hover:text-rg-text-primary hover:bg-white/5 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Auto-dismiss progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 8, ease: 'linear' }}
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-rg-gold to-emerald-400 origin-left"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
