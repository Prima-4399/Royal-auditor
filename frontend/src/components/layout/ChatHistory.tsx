import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, Copy, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';

export interface ChatHistoryItem {
  id: string;
  query: string;
  response: string;
  timestamp: number;
}

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChatHistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
}

export function ChatHistory({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onClearHistory,
}: ChatHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyQuery = (id: string, query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Clickable backdrop to close - full screen, positioned below search area */}
          <div
            onClick={() => onClose()}
            className="fixed z-40 pointer-events-auto"
            style={{
              top: '72px',
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: 'calc(100vh - 72px)',
            }}
          />

          {/* Dropdown Container - positioned below the search bar */}
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.95,
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <div className="glass-card dropdown-panel rounded-rg-lg shadow-rg-lg border border-rg-border-default overflow-hidden flex flex-col max-h-96">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-rg-border-default bg-gradient-gold/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rg-gold" />
                  <span className="text-[11px] uppercase text-rg-gold tracking-wider font-semibold">
                    History
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {history.length > 0 && (
                    <button
                      onClick={onClearHistory}
                      className="p-1 hover:bg-rg-bg-tertiary rounded transition-colors"
                      title="Clear all history"
                    >
                      <Trash2 className="w-3 h-3 text-rg-text-muted hover:text-rg-gold" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-rg-gold/10 rounded transition-colors"
                    title="Close history"
                  >
                    <X className="w-3 h-3 text-rg-text-muted hover:text-rg-gold" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto custom-scrollbar flex-1">
                {history.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[12px] text-rg-text-muted">
                      No history yet
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-rg-border-default">
                    {history.map((item) => (
                      <motion.button
                        key={item.id}
                        className="w-full px-4 py-3 hover:bg-rg-bg-tertiary/50 transition-colors text-left group focus:outline-none focus:bg-rg-bg-tertiary/50"
                        whileHover={{ paddingLeft: '18px' }}
                        onClick={() => {
                          onSelectQuery(item.query);
                          onClose();
                        }}
                      >
                        {/* Query Text */}
                        <p className="text-[12px] font-mono text-rg-text-primary mb-1 group-hover:text-rg-gold transition-colors line-clamp-1">
                          {item.query}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-rg-text-muted">
                            {formatTime(item.timestamp)}
                          </span>

                          {/* Copy Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyQuery(item.id, item.query);
                            }}
                            className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy query"
                          >
                            {copiedId === item.id ? (
                              <CheckCircle2 className="w-3 h-3 text-rg-gold" />
                            ) : (
                              <Copy className="w-3 h-3 text-rg-text-muted hover:text-rg-gold" />
                            )}
                          </button>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
