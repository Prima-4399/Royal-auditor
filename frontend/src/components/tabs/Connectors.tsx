import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Link, RefreshCw, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import type { Connector } from '@/types';

export function Connectors() {
  const [loading, setLoading] = useState(true);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      const response = await api.getConnectors();
      setConnectors(response.connectors);
    } catch (error) {
      console.error('Failed to load connectors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await api.toggleConnector(id);
      setConnectors(prev => prev.map(c => c.id === id ? response.connector : c));
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const [isSynced, setIsSynced] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsSynced(false);
    try {
      const response = await api.syncConnectors();
      setConnectors(response.connectors);
      setIsSynced(true);
      setTimeout(() => setIsSynced(false), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-rg-text-primary">Enterprise ERP Connectors</h2>
          <p className="text-sm text-rg-text-muted mt-0.5">Real-time synchronization with financial and payment systems.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`btn-primary rounded-full px-4 py-2 flex items-center gap-2 
transition-all duration-500 
${isSynced
              ? 'bg-emerald-500 border border-emerald-400 shadow-lg shadow-emerald-500/20'
              : 'bg-yellow-400 hover:bg-yellow-500 shadow-md'
            }`}
        >
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : isSynced ? (
            <CheckCircle2 className="w-4 h-4 ml-1" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isRefreshing ? 'Syncing...' : isSynced ? 'Synced' : 'Sync All Systems'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-rg-bg-tertiary animate-pulse rounded-rg-md" />
          ))
        ) : (
          connectors.map((connector) => (
            <motion.div
              key={connector.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border border-rg-border-default hover:border-rg-gold/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-rg-sm ${connector.status === 'connected' || connector.status === 'active'
                    ? 'bg-rg-gold/10 text-rg-gold'
                    : 'bg-rg-text-muted/10 text-rg-text-muted'
                    }`}>
                    {connector.id === 'blockchain' ? <Link className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-rg-text-primary">{connector.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {connector.status === 'connected' || connector.status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-rg-success" />
                          <span className="text-xs text-rg-success font-medium uppercase">Active Connection</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rg-text-muted" />
                          <span className="text-xs text-rg-text-muted font-medium uppercase">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(connector.id)}
                    className={`px-3 py-1.5 rounded-rg-sm text-[10px] font-bold uppercase transition-all ${connector.status === 'connected' || connector.status === 'active'
                      ? 'bg-rg-bg-tertiary text-rg-text-muted hover:text-rg-error hover:bg-rg-error/10 border border-rg-border-default'
                      : 'bg-rg-gold text-rg-bg-deep hover:bg-rg-gold-bright'
                      }`}
                  >
                    {connector.status === 'connected' || connector.status === 'active' ? 'Disconnect' : 'Connect'}
                  </button>
                  <button className="p-2 text-rg-text-tertiary hover:text-rg-gold transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] text-rg-text-muted uppercase font-bold tracking-tighter">Last Successful Sync</p>
                    <p className="text-sm font-mono text-rg-text-secondary">
                      {connector.last_sync ? new Date(connector.last_sync).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  {connector.status === 'connected' && (
                    <div className="text-[10px] bg-rg-success/10 text-rg-success px-2 py-0.5 rounded-full font-bold">
                      SECURE
                    </div>
                  )}
                </div>

                <div className="h-1.5 w-full bg-rg-bg-tertiary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-rg-gold"
                    initial={{ width: 0 }}
                    animate={{ width: connector.status === 'disconnected' ? '0%' : '100%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-rg-text-tertiary italic">
                  <AlertCircle className="w-3 h-3" />
                  {connector.id === 'blockchain'
                    ? "Submitting state proofs to layer-2..."
                    : `Encrypted TLS 1.3 tunnel established with ${connector.id.toUpperCase()} Gateway.`}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Connection Logic Map Visual */}
      <div className="glass-card p-10 bg-gradient-to-br from-rg-bg-secondary to-rg-bg-deep border border-rg-border-default mt-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rg-gold/5 blur-[100px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-rg-gold/10 flex items-center justify-center border border-rg-gold/30">
            <Link className="w-8 h-8 text-rg-gold" />
          </div>
          <h3 className="text-xl font-bold text-rg-text-primary underline decoration-rg-gold/30 underline-offset-8">Integration Architecture</h3>
          <p className="text-rg-text-secondary leading-relaxed">
            RoyalGuard uses an <span className="text-rg-gold">event-driven bridge</span> to eliminate manual data ingestion.
            By connecting directly to your ERP, the Audit Agents can verify payments as they clear,
            providing real-time revenue protection instead of post-facto reporting.
          </p>
          <div className="flex items-center gap-8 pt-4">
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-mono text-rg-gold">0.02ms</div>
              <div className="text-[10px] text-rg-text-muted uppercase">Latency</div>
            </div>
            <div className="w-[1px] h-8 bg-rg-border-default" />
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-mono text-rg-gold">AES-256</div>
              <div className="text-[10px] text-rg-text-muted uppercase">Encryption</div>
            </div>
            <div className="w-[1px] h-8 bg-rg-border-default" />
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-mono text-rg-gold">99.99%</div>
              <div className="text-[10px] text-rg-text-muted uppercase">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
