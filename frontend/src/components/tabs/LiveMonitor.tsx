import { Network, Zap, Cpu, Server, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamRecord {
  id: string;
  content: string;
  country: string;
  status: 'AUDITED' | 'VIOLATION' | 'CLEAN';
  timestamp: string;
}

interface LiveMonitorProps {
  streams: StreamRecord[];
  stats: {
    audited: number;
    leaked: number;
    speed: number;
    cpu: number;
  };
  isStarting?: boolean;
  isEngineEnabled: boolean;
  onToggleEngine: () => void;
}

export function LiveMonitor({ streams, stats, isStarting, isEngineEnabled, onToggleEngine }: LiveMonitorProps) {
  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <div className="relative">
          <h2 className="text-lg font-semibold text-rg-text-primary tracking-tight">Real-time Stream Monitor</h2>
          <p className="text-sm text-rg-text-muted mt-0.5">High-frequency audit engine evaluating live traffic.</p>
          
          {isStarting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-1 -right-4 p-1 bg-rg-gold/20 text-rg-gold text-[8px] font-bold rounded animate-pulse border border-rg-gold/30"
            >
              INITIALIZING_ENGINE...
            </motion.div>
          )}


        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleEngine}
            className={`flex items-center gap-2 px-3 py-1 border rounded-full transition-all active:scale-[0.95] ${
              isEngineEnabled 
                ? 'bg-rg-success/10 border-rg-success/20 text-rg-success' 
                : 'bg-rg-error/10 border-rg-error/20 text-rg-error shadow-[0_0_10px_rgba(239,68,68,0.2)] font-bold'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              isEngineEnabled 
                ? 'bg-rg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                : 'bg-rg-error'
            }`} />
            <span className="text-[10px] font-mono uppercase tracking-tighter">
              {isEngineEnabled ? 'ENGINE_ONLINE' : 'ENGINE_OFFLINE'}
            </span>
          </button>
        </div>
      </div>

      {/* Real-time Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'Total Audited', val: stats.audited.toLocaleString(), icon: Network },
           { label: 'Violations Flagged', val: stats.leaked.toLocaleString(), icon: Zap, color: 'text-rg-error' },
           { label: 'Processing Speed', val: `${stats.speed} p/s`, icon: Cpu },
           { label: 'Engine Load', val: `${stats.cpu}%`, icon: Server },
         ].map((s, i) => (
           <div key={i} className="glass-card p-4 flex items-center justify-between">
             <div>
                <p className="text-[10px] text-rg-text-muted uppercase font-bold tracking-tight mb-1">{s.label}</p>
                <p className={`text-lg font-mono font-bold ${s.color || 'text-rg-text-primary'}`}>{s.val}</p>
             </div>
             <div className="p-2 rounded-lg bg-rg-bg-tertiary">
               <s.icon className={`w-4 h-4 ${s.color || 'text-rg-gold'}`} />
             </div>
           </div>
         ))}
      </div>

      {/* Scrolling Stream Feed */}
      <div className="flex-grow glass-card overflow-hidden flex flex-col relative min-h-[440px] border border-rg-border-default shadow-lg">
        
        <div className="p-4 border-b border-rg-border-default bg-rg-bg-tertiary flex items-center justify-between text-[11px] font-bold text-rg-text-muted uppercase tracking-[0.12em]">
          <div className="w-24">Stream ID</div>
          <div className="flex-1">Content Identifier</div>
          <div className="w-20">Territory</div>
          <div className="w-28 text-center">Status</div>
          <div className="w-20 text-right">Timestamp</div>
        </div>

        <div className="flex-1 overflow-hidden relative min-h-[400px] flex flex-col">
          {/* Scanning Line Animation (Repositioned below header) */}
          {isEngineEnabled && (
            <motion.div 
              className="absolute left-0 right-0 h-[1px] bg-rg-gold/40 z-20 shadow-[0_0_10px_rgba(255,204,41,0.3)]"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-rg-bg-deep to-transparent z-10 pointer-events-none" />
          
          {/* PulseWave Canvas-style Visualization */}
          {isEngineEnabled && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <svg className="w-full h-32" viewBox="0 0 1000 100" preserveAspectRatio="none">
                <motion.path
                  d="M0,50 Q25,40 50,50 T100,50 T150,50 T200,50 T250,50 T300,50 T350,50 T400,50 T450,50 T500,50 T550,50 T600,50 T650,50 T700,50 T750,50 T800,50 T850,50 T900,50 T950,50 T1000,50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-rg-gold"
                />
                <motion.path
                  id="pulse-wave-2"
                  d="M0,50 Q25,100 50,50 T100,50 T150,50 T200,50 T250,50 T300,50 T350,50 T400,50 T450,50 T500,50 T550,50 T600,50 T650,50 T700,50 T750,50 T800,50 T850,50 T900,50 T950,50 T1000,50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-rg-gold/50"
                  animate={{ 
                    x: [-50, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
              </svg>
            </div>
          )}

          <div className="p-4 space-y-1 overflow-y-auto custom-scrollbar flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {streams.map((log) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center text-[13px] py-1 border-b border-rg-border-default/30 group hover:bg-rg-gold/5 transition-colors relative z-10"
                >
                  <div className="w-24 font-mono text-rg-gold text-[11px]">{log.id}</div>
                  <div className="flex-1 font-medium text-rg-text-secondary group-hover:text-rg-text-primary transition-colors">{log.content}</div>
                  <div className="w-20 text-rg-text-tertiary">{log.country}</div>
                  <div className="w-28 flex justify-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'VIOLATION' 
                        ? 'bg-rg-error/20 text-rg-error border border-rg-error/30' 
                        : 'bg-rg-success/20 text-rg-success border border-rg-success/30'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="w-20 text-right font-mono text-rg-text-muted text-[11px]">{log.timestamp}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-rg-bg-deep to-transparent z-10 pointer-events-none" />
        </div>
      </div>

      <div className="glass-card p-4 bg-rg-bg-tertiary flex items-center justify-between border border-rg-border-default">
         <div className="flex items-center gap-3">
            <Server className="w-4 h-4 text-rg-gold" />
            <div className="flex flex-col">
              <p className="text-[10px] text-rg-text-muted font-bold uppercase tracking-widest">System Engine Status</p>
              <p className="text-xs text-rg-text-secondary">
                Engine Thread 01-04: <span className={isEngineEnabled ? "text-rg-success" : "text-rg-error"}>
                  {isEngineEnabled ? "ACTIVE" : "SUSPENDED"}
                </span> | 
                Throughput: <span className="text-rg-gold">
                  {!isEngineEnabled ? "OFFLINE" : "NORMAL_LOAD"}
                </span> | 
                Encryption: <span className="text-rg-text-primary">{isEngineEnabled ? "MTLS_TLS1.3" : "SECURED"}</span>
              </p>
            </div>
         </div>
         <div className="flex items-center gap-4">
           <button 
             onClick={() => {
               const data = JSON.stringify(streams, null, 2);
               const blob = new Blob([data], { type: 'application/json' });
               const url = URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = `live_stream_logs_${new Date().toISOString()}.json`;
               a.click();
             }}
             className="text-[10px] uppercase font-bold text-rg-gold flex items-center gap-1 hover:underline"
           >
              Export Current Logs
              <ArrowUpRight className="w-3 h-3" />
           </button>
         </div>
      </div>
    </div>
  );
}
