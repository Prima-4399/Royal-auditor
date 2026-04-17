import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, MapPin, Calendar, AlertTriangle, CheckCircle2, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { ViolationBadge } from './ViolationBadge';
import type { ContractDetail } from '@/lib/api';
import type { ViolationType } from '@/types';

interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contractDetail: ContractDetail | null;
  loading?: boolean;
}

export function SlideOverDrawer({ isOpen, onClose, contractDetail, loading }: SlideOverDrawerProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getRuleExplanation = (violation: string) => {
    switch (violation) {
      case 'UNDERPAYMENT':
        return 'The actual payment was less than the expected royalty amount based on the contracted rate per play and total play count. This violates §3.2 Base Rate Application which requires the correct rate to be applied to all qualifying plays.';
      case 'OVERPAYMENT':
        return 'The actual payment exceeded the expected royalty amount. While this benefits the content owner, it indicates a calculation error in the payment system that should be corrected for future payments.';
      case 'EXPIRED_LICENSE':
        return 'Content was streamed after the contract end date without a valid license extension. This violates §7.1 License Term which prohibits distribution beyond the agreed license period.';
      case 'TERRITORY_VIOLATION':
        return 'Content was streamed in territories not covered by the license agreement. This violates §4.3 Territory Restrictions which limits distribution to specified geographic regions.';
      default:
        return 'No violation detected. Payment matches expected royalty amount based on contract terms and usage data.';
    }
  };

  const getViolationIcon = (violation: string) => {
    switch (violation) {
      case 'UNDERPAYMENT':
      case 'EXPIRED_LICENSE':
      case 'TERRITORY_VIOLATION':
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case 'OVERPAYMENT':
        return <AlertTriangle className="w-6 h-6 text-blue-400" />;
      default:
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
    }
  };

  // Extract data from ContractDetail
  const contract = contractDetail?.contract;
  const audit = contractDetail?.audit;
  const violation = contractDetail?.violation;

  const contractId = String(contract?.contract_id || '');
  const contentId = String(contract?.content_id || audit?.content_id || '');
  const studio = String(contract?.studio || audit?.studio || '');
  const territory = String(contract?.territory || '');
  const startDate = String(contract?.start_date || '');
  const endDate = String(contract?.end_date || '');
  const royaltyRate = String(contract?.royalty_rate || '');
  const ratePerPlay = String(contract?.rate_per_play || '');
  const expectedPayment = Number(audit?.expected_payment || 0);
  const actualPayment = Number(audit?.actual_payment || 0);
  const difference = Number(audit?.difference || 0);
  const violationType = String(audit?.violation || violation?.violation_type || 'NONE') as ViolationType;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-rg-bg-deep/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[520px] z-50"
          >
            <div className="h-full glass-card border-l border-rg-border-default overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-rg-border-default bg-gradient-to-r from-rg-gold/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rg-gold/20 rounded-rg-lg">
                    <FileText className="w-6 h-6 text-rg-gold" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-rg-text-muted tracking-wider font-semibold">
                      Contract Details
                    </p>
                    <h2 className="font-mono text-2xl text-rg-text-primary font-bold">
                      {contractId || 'Loading...'}
                    </h2>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-rg-text-muted hover:text-rg-text-primary hover:bg-rg-bg-tertiary rounded-rg-md transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 text-rg-text-muted hover:text-rg-text-primary hover:bg-rg-bg-tertiary rounded-rg-md transition-all"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-rg-gold animate-spin" />
                      <span className="text-[12px] text-rg-text-muted uppercase tracking-wider">Loading details...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Content Info Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="glass-card rounded-rg-lg p-4 border border-rg-border-default hover:border-rg-border-highlight transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-rg-text-muted" />
                          <p className="text-[11px] uppercase text-rg-text-muted tracking-wider font-semibold">Content ID</p>
                        </div>
                        <p className="font-mono text-lg text-rg-text-primary font-semibold">{contentId}</p>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="glass-card rounded-rg-lg p-4 border border-rg-border-default hover:border-rg-border-highlight transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-rg-text-muted" />
                          <p className="text-[11px] uppercase text-rg-text-muted tracking-wider font-semibold">Studio</p>
                        </div>
                        <p className="text-lg text-rg-text-primary font-semibold">{studio}</p>
                      </motion.div>
                    </div>

                    {/* Contract Terms */}
                    <div className="glass-card rounded-rg-lg p-5 border border-rg-border-default">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-4 h-4 text-rg-text-muted" />
                        <p className="text-[11px] uppercase text-rg-text-muted tracking-wider font-semibold">
                          Contract Terms
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-rg-bg-tertiary/50 rounded-rg-md">
                          <p className="text-[12px] text-rg-text-muted mb-1">Royalty Rate</p>
                          <p className="text-sm text-rg-gold font-semibold font-mono">{royaltyRate}</p>
                        </div>
                        <div className="p-3 bg-rg-bg-tertiary/50 rounded-rg-md">
                          <p className="text-[12px] text-rg-text-muted mb-1">Rate/Play</p>
                          <p className="text-sm text-rg-gold font-semibold font-mono">{ratePerPlay}</p>
                        </div>
                        <div className="p-3 bg-rg-bg-tertiary/50 rounded-rg-md">
                          <p className="text-[12px] text-rg-text-muted mb-1">Territory</p>
                          <p className="text-sm text-rg-text-primary font-semibold">{territory}</p>
                        </div>
                        <div className="p-3 bg-rg-bg-tertiary/50 rounded-rg-md">
                          <p className="text-[12px] text-rg-text-muted mb-1">Contract Period</p>
                          <p className="text-sm text-rg-text-primary font-semibold">{startDate} to {endDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Comparison */}
                    <div className="glass-card rounded-rg-lg p-5 border border-rg-border-default">
                      <p className="text-[11px] uppercase text-rg-text-muted tracking-wider font-semibold mb-4">
                        Payment Comparison
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-rg-bg-tertiary/50 rounded-rg-md">
                          <p className="text-[12px] text-rg-text-muted mb-1">Expected Payment</p>
                          <p className="font-mono text-2xl text-rg-text-primary font-bold">
                            {formatCurrency(expectedPayment)}
                          </p>
                        </div>
                        <div className={`p-4 rounded-rg-md ${
                          actualPayment < expectedPayment 
                            ? 'bg-rose-500/10' 
                            : actualPayment > expectedPayment 
                            ? 'bg-blue-500/10'
                            : 'bg-rg-bg-tertiary/50'
                        }`}>
                          <p className="text-[12px] text-rg-text-muted mb-1">Actual Payment</p>
                          <p className={`font-mono text-2xl font-bold ${
                            actualPayment < expectedPayment 
                              ? 'text-rose-400' 
                              : actualPayment > expectedPayment 
                              ? 'text-blue-400' 
                              : 'text-rg-text-primary'
                          }`}>
                            {formatCurrency(actualPayment)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Difference Card */}
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className={`rounded-rg-lg p-5 border ${
                        difference > 0 
                          ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/5 border-amber-500/30' 
                          : difference < 0 
                          ? 'bg-gradient-to-br from-blue-500/15 to-cyan-500/5 border-blue-500/30'
                          : 'bg-gradient-to-br from-emerald-500/15 to-green-500/5 border-emerald-500/30'
                      }`}
                    >
                      <p className="text-[11px] uppercase text-rg-text-muted tracking-wider font-semibold mb-2">
                        Difference
                      </p>
                      <p className={`font-mono text-5xl font-bold ${
                        difference > 0 
                          ? 'text-amber-400' 
                          : difference < 0 
                          ? 'text-blue-400'
                          : 'text-emerald-400'
                      }`}>
                        {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                      </p>
                    </motion.div>

                    {/* Violation Type */}
                    <div className="glass-card rounded-rg-lg p-5 border border-rg-border-default">
                      <div className="flex items-center gap-3 mb-4">
                        {getViolationIcon(violationType)}
                        <p className="text-[11px] uppercase text-rg-text-muted tracking-wider font-semibold">
                          Violation Type
                        </p>
                      </div>
                      <ViolationBadge type={violationType} />
                    </div>

                    {/* Rule Violated */}
                    <div className="glass-card rounded-rg-lg p-5 border border-rg-border-default">
                      <p className="text-[11px] uppercase text-rg-text-muted tracking-wider font-semibold mb-3">
                        Rule Violated
                      </p>
                      <p className="text-[14px] text-rg-text-secondary leading-relaxed">
                        {getRuleExplanation(violationType)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 border-t border-rg-border-default bg-rg-bg-tertiary/30 flex items-center justify-between">
                <span className="text-[11px] text-rg-text-muted">
                  Last updated: {new Date().toLocaleString()}
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-rg-bg-card border border-rg-border-default rounded-rg-md text-[12px] text-rg-text-secondary hover:border-rg-border-highlight hover:text-rg-text-primary transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Full Report
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
