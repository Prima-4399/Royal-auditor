import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Shield, Database, Layout, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function SettingsModal({ isOpen, onClose, onUpdate }: SettingsModalProps) {
  const [config, setConfig] = useState({
    app_name: 'RoyalGuard AI',
    version: '1.0.0',
    description: 'Digital License Royalty Auditor',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getConfig()
        .then(res => setConfig(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateConfig(config);
      setSuccess(true);
      onUpdate();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-rg-bg-deep/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg glass-card rounded-rg-lg shadow-rg-lg overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-rg-border-default flex items-center justify-between bg-rg-bg-tertiary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rg-gold/10 rounded-md">
                  <Shield className="w-5 h-5 text-rg-gold" />
                </div>
                <h2 className="text-lg font-bold text-rg-text-primary uppercase tracking-widest">Platform Settings</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-rg-bg-card rounded-md transition-colors text-rg-text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 text-rg-gold animate-spin" />
                  <p className="text-[12px] text-rg-text-muted uppercase tracking-widest">Loading Configuration...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Layout className="w-4 h-4 text-rg-gold" />
                       <span className="text-[11px] uppercase font-bold text-rg-text-muted tracking-widest">Branding</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-mono text-rg-text-secondary uppercase">App Name</label>
                      <input 
                        type="text" 
                        value={config.app_name}
                        onChange={e => setConfig({...config, app_name: e.target.value})}
                        className="w-full bg-rg-bg-tertiary border border-rg-border-default rounded-rg-md p-3 text-[14px] text-rg-text-primary focus:outline-none focus:border-rg-gold/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Database className="w-4 h-4 text-rg-gold" />
                       <span className="text-[11px] uppercase font-bold text-rg-text-muted tracking-widest">System</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[12px] font-mono text-rg-text-secondary uppercase">Version</label>
                        <input 
                          type="text" 
                          value={config.version}
                          onChange={e => setConfig({...config, version: e.target.value})}
                          className="w-full bg-rg-bg-tertiary border border-rg-border-default rounded-rg-md p-3 text-[13px] text-rg-text-primary focus:outline-none focus:border-rg-gold/50"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                         <button 
                           onClick={() => window.location.reload()}
                           className="flex items-center justify-center gap-2 px-4 py-3 bg-rg-bg-card border border-rg-border-default rounded-rg-md text-[11px] text-rg-text-secondary uppercase font-bold hover:border-rg-gold/50 hover:text-rg-gold transition-all"
                         >
                           <RefreshCw className="w-3.5 h-3.5" /> Force Refresh
                         </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-mono text-rg-text-secondary uppercase">Platform Description</label>
                    <textarea 
                      value={config.description}
                      onChange={e => setConfig({...config, description: e.target.value})}
                      className="w-full bg-rg-bg-tertiary border border-rg-border-default rounded-rg-md p-3 text-[13px] text-rg-text-primary focus:outline-none focus:border-rg-gold/50 h-24"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-rg-border-default flex items-center justify-between">
               <span className="text-[10px] text-rg-text-muted uppercase">Platform Managed locally by SQLite</span>
               <button 
                onClick={handleSave}
                disabled={saving || loading || success}
                className="flex items-center gap-3 px-8 py-3 bg-gradient-gold text-rg-bg-deep rounded-rg-md text-[13px] font-bold uppercase disabled:opacity-50 transition-all hover:scale-[1.03] active:scale-[0.98]"
               >
                 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                 {saving ? 'Saving...' : success ? 'Settings Saved' : 'Save Changes'}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
