import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface ChatRecommendationsProps {
  isOpen: boolean;
  activeTab: string;
  onSelectQuery: (query: string) => void;
  onClose: () => void;
}

const TAB_RECOMMENDATIONS: Record<string, string[]> = {
  violations: [
    'What are the top 5 violations by impact?',
    'Show me high-risk violation patterns',
    'Which contracts have repeated violations?',
    'What is the violation detection accuracy?',
    'Compare violation severity across regions',
  ],
  leakage: [
    'What is causing the most financial leakage?',
    'Show me underpayment patterns',
    'Which contracts are leaking the most?',
    'How can we reduce leakage?',
    'What is the estimated recovery potential?',
  ],
  contracts: [
    'Summarize active contracts by status',
    'Which contracts need attention?',
    'Show contract compliance status',
    'What are the contract terms?',
    'Highlight critical contract dates',
  ],
  payments: [
    'What payment discrepancies exist?',
    'Show me overdue payments',
    'Analyze payment patterns',
    'Which payments are at risk?',
    'Show payment reconciliation issues',
  ],
  audit_results: [
    'What were the last audit findings?',
    'Show me audit trends over time',
    'Which areas need re-auditing?',
    'Summarize audit effectiveness',
    'What are the audit next steps?',
  ],
  governance: [
    'What is our compliance status?',
    'Show governance metrics',
    'What risks need mitigation?',
    'Audit the blockchain verification',
    'Review governance policies',
  ],
  live_monitor: [
    'What is the real-time violation rate?',
    'Show active monitoring status',
    'How many contracts are processing?',
    'What is the system health?',
    'Show monitoring performance metrics',
  ],
  default: [
    'What is the overall system health?',
    'Show me critical findings',
    'Analyze all violations and leakage',
    'What are the priority actions?',
    'Give me an executive summary',
  ],
};

export function ChatRecommendations({
  isOpen,
  activeTab,
  onSelectQuery,
  onClose,
}: ChatRecommendationsProps) {
  const tabKey = activeTab.toLowerCase().replace('-', '_');
  const recommendations = TAB_RECOMMENDATIONS[tabKey] || TAB_RECOMMENDATIONS.default;

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
            <div className="glass-card dropdown-panel rounded-rg-lg shadow-rg-lg border border-rg-border-default overflow-hidden flex flex-col max-h-80">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-rg-border-default bg-gradient-gold/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rg-gold" />
                  <span className="text-[11px] uppercase text-rg-gold tracking-wider font-semibold">
                    Suggestions
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-rg-gold/10 rounded transition-colors"
                  title="Close suggestions"
                >
                  <X className="w-3 h-3 text-rg-text-muted hover:text-rg-gold" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto custom-scrollbar flex-1">
                <div className="divide-y divide-rg-border-default">
                  {recommendations.map((rec, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => {
                        onSelectQuery(rec);
                        onClose();
                      }}
                      whileHover={{ paddingLeft: '18px' }}
                      className="w-full text-left px-4 py-2.5 hover:bg-rg-gold/10 transition-all duration-150 focus:outline-none focus:bg-rg-gold/10"
                    >
                      <p className="text-[12px] font-mono text-rg-text-primary hover:text-rg-gold transition-colors line-clamp-2">
                        {rec}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
