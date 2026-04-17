import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, Info, X, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPopover({ isOpen, onClose }: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getNotifications()
        .then(res => setNotifications(res.notifications))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-400" />,
    info: <Info className="w-4 h-4 text-cyan-400" />,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full right-0 mt-3 w-80 z-50"
          >
            <div className="glass-card dropdown-panel rounded-rg-lg shadow-rg-lg overflow-hidden flex flex-col max-h-[480px]">
              {/* Header */}
              <div className="px-4 py-3 border-b border-rg-border-default flex items-center justify-between bg-rg-bg-tertiary/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rg-gold" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-rg-text-primary">Notifications</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-rg-bg-card rounded-md transition-colors">
                  <X className="w-3.5 h-3.5 text-rg-text-muted" />
                </button>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {loading && (
                  <div className="p-8 text-center">
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block w-5 h-5 border-2 border-rg-gold/30 border-t-rg-gold rounded-full"
                    />
                  </div>
                )}
                
                {!loading && notifications.length === 0 && (
                  <div className="p-8 text-center text-rg-text-muted text-[12px]">
                    No new notifications
                  </div>
                )}

                {!loading && notifications.map((n) => (
                  <div key={n.id} className="p-4 border-b border-rg-border-subtle hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className="flex gap-3">
                      <div className="mt-0.5">{icons[n.type]}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-[13px] font-semibold text-rg-text-primary">{n.title}</h4>
                          <span className="text-[10px] text-rg-text-muted font-mono">{n.time}</span>
                        </div>
                        <p className="text-[12px] text-rg-text-secondary leading-normal">{n.message}</p>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-rg-gold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-3 bg-rg-bg-tertiary/30 border-t border-rg-border-default text-center">
                <button className="text-[11px] text-rg-gold hover:text-rg-gold-bright font-bold uppercase tracking-widest transition-colors">
                  Mark all as read
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
