import { useCallback } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { ViolationBadge } from '@/components/ui/ViolationBadge';
import type { Violation } from '@/types';
import { api } from '@/lib/api';
import { AlertTriangle, FileText, Building2, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ViolationsTabProps {
  onAskAI?: (query: string) => void;
}

export function ViolationsTab({ onAskAI }: ViolationsTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleAskAIForRow = (e: React.MouseEvent, row: Violation) => {
    e.stopPropagation();
    const r = row as unknown as Record<string, unknown>;
    const expected = Number(r.expected ?? 0);
    const paid = Number(r.paid ?? 0);
    const diff = Number(r.difference ?? 0);
    const query = [
      `Analyze this contract violation: Violation ID ${r.violation_id}, Contract ${r.contract_id}, Content ${r.content_id}, Studio ${r.studio}.`,
      `Violation type: ${r.violation_type}.`,
      `Expected royalty: ${formatCurrency(expected)}.`,
      `Actual paid: ${formatCurrency(paid)}.`,
      `Shortfall: ${formatCurrency(Math.abs(diff))} ${diff > 0 ? '(underpaid)' : '(overpaid)'}`,
      `Territory: ${r.territory ?? 'Unknown'}.`,
      `Explain the EXACT contract clause that was violated, why the payment diverged from the expected amount, and the specific recovery action ${r.studio} must take to settle the ${formatCurrency(Math.abs(diff))} discrepancy.`,
    ].join(' ');
    onAskAI?.(query);
  };

  const columns = [
    {
      key: 'violation_id',
      header: 'Violation ID',
      width: '110px',
      render: (row: Violation) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rose-500/10 rounded">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="font-mono text-rg-text-secondary text-[12px]">{row.violation_id}</span>
        </div>
      ),
    },
    {
      key: 'contract_id',
      header: 'Contract',
      width: '100px',
      render: (row: Violation) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rg-text-muted" />
          <span className="font-mono text-rg-text-secondary text-[12px]">{row.contract_id}</span>
        </div>
      ),
    },
    {
      key: 'content_id',
      header: 'Content ID',
      width: '100px',
      render: (row: Violation) => (
        <span className="font-mono text-rg-text-primary font-semibold">{row.content_id}</span>
      ),
    },
    {
      key: 'studio',
      header: 'Studio',
      width: '130px',
      render: (row: Violation) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-rg-text-muted" />
          <span className="text-rg-text-primary">{row.studio}</span>
        </div>
      ),
    },
    {
      key: 'violation_type',
      header: 'Type',
      width: '150px',
      render: (row: Violation) => <ViolationBadge type={row.violation_type} />,
    },
    {
      key: 'expected',
      header: 'Expected',
      width: '110px',
      render: (row: Violation) => (
        <span className="font-mono text-rg-text-primary font-semibold">{formatCurrency(row.expected)}</span>
      ),
    },
    {
      key: 'paid',
      header: 'Paid',
      width: '110px',
      render: (row: Violation) => (
        <span className="font-mono text-rg-text-primary font-semibold">{formatCurrency(row.paid)}</span>
      ),
    },
    {
      key: 'difference',
      header: 'Difference',
      width: '110px',
      render: (row: Violation) => (
        <span
          className={`font-mono font-bold ${
            row.difference > 0
              ? 'text-amber-400'
              : row.difference < 0
              ? 'text-blue-400'
              : 'text-emerald-400'
          }`}
        >
          {row.difference > 0 ? '+' : ''}
          {formatCurrency(row.difference)}
        </span>
      ),
    },
    {
      key: 'proof_hash',
      header: 'Governance',
      width: '140px',
      render: (row: Violation) => (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-rg-success/5 border border-rg-success/20 rounded text-[10px] font-mono text-rg-success max-w-[120px]">
          <span className="truncate">{row.proof_hash || '0xDE...AD'}</span>
        </div>
      ),
    },
    {
      key: 'territory',
      header: 'Territory',
      width: '120px',
      render: (row: Violation) => (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-rg-text-muted" />
          <span className="text-rg-text-secondary text-[12px]">{row.territory}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'AI Actions',
      width: '140px',
      render: (row: Violation) => (
        <div className="flex items-center gap-2">
          {onAskAI && (
            <>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  const query = `DRAFT RECOVERY LETTER for Violation ${row.violation_id}. Studio: ${row.studio}. Expected: ${formatCurrency(row.expected)}, Paid: ${formatCurrency(row.paid)}. The letter must be firm, cite the contract ${row.contract_id}, and demand the shortfall of ${formatCurrency(Math.abs(row.difference))} be paid within 14 days to avoid further legal escalation. Use a formal legal tone.`;
                  onAskAI(query);
                }}
                title="AI Legal Office: Draft Recovery Letter"
                className="p-2 bg-rose-500/5 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 transition-all"
              >
                <FileText className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 184, 0, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleAskAIForRow(e, row)}
                title="AI Forensic Analysis"
                className="p-2 bg-rg-gold/5 hover:bg-rg-gold/20 border border-rg-gold/20 rounded-lg text-rg-gold transition-all"
              >
                <Sparkles className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </div>
      ),
    },
  ];

  const fetchData = useCallback(async (page: number, search?: string) => {
    const res = await api.getViolations(page, 50, search);
    return res as any;
  }, []);

  const handleDownload = useCallback((search: string) => {
    return api.downloadViolationsCSV(search);
  }, []);

  return (
    <DataTable<any>
      title="Revenue Protection Index"
      subtitle="Identified contract breaches and recoverable leakage"
      columns={columns}
      fetchData={fetchData}
      onDownload={handleDownload}
      emptyTitle="No Violations Detected"
      emptyDescription="Run an audit to analyze contracts and detect payment violations. Click 'RUN AUDIT' to get started."
      emptyIcon="violations"
      searchable
      rowsPerPage={50}
    />
  );
}
