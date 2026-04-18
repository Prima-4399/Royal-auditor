import { useState, useCallback } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { ViolationBadge } from '@/components/ui/ViolationBadge';
import { SlideOverDrawer } from '@/components/ui/SlideOverDrawer';
import type { AuditResult } from '@/types';
import { api } from '@/lib/api';
import type { ContractDetail } from '@/lib/api';
import { Search, FileText, Building2, ArrowUpRight, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';

interface AuditResultsTabProps {
  onAskAI?: (query: string) => void;
}

export function AuditResultsTab({ onAskAI }: AuditResultsTabProps) {
  const [selectedDetail, setSelectedDetail] = useState<ContractDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleRowClick = async (row: AuditResult) => {
    const r = row as unknown as Record<string, unknown>;
    const contractId = r.contract_id as string;
    if (!contractId) return;
    setDrawerLoading(true);
    setIsDrawerOpen(true);
    try {
      const detail = await api.getContractDetail(contractId);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('Failed to load contract detail:', err);
      setIsDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleAskAIForRow = (e: React.MouseEvent, row: AuditResult) => {
    e.stopPropagation();
    const r = row as unknown as Record<string, unknown>;
    const expected = Number(r.expected_payment ?? 0);
    const actual = Number(r.actual_payment ?? 0);
    const diff = Number(r.difference ?? 0);
    const query = [
      `Analyze this specific audit record: Audit ID ${r.audit_id}, Content ${r.content_id}, Studio ${r.studio}.`,
      `Expected payment: ${formatCurrency(expected)}.`,
      `Actual payment received: ${formatCurrency(actual)}.`,
      `Discrepancy: ${formatCurrency(Math.abs(diff))} ${diff > 0 ? '(studio underpaid — money owed)' : '(studio overpaid — excess paid)'}`,
      `Violation classification: ${r.violation ?? 'NONE'}.`,
      `Explain EXACTLY why this specific violation occurred, what contract clause was breached, and the precise steps needed to recover the ${formatCurrency(Math.abs(diff))} discrepancy from ${r.studio}.`,
    ].join(' ');
    onAskAI?.(query);
  };


  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const summary = await api.getLeakageSummary();
      const violationsRes = await api.getViolations(1);
      const topViolations = violationsRes.data.slice(0, 20);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RoyalGuard AI — Audit Report', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 33, { align: 'center' });

      doc.setDrawColor(200);
      doc.line(15, 38, pageWidth - 15, 38);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('KPI Summary', 15, 48);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const kpi = summary.kpi;
      doc.text(`Total Leakage: $${kpi.total_leakage.toLocaleString()}`, 15, 58);
      doc.text(`Contracts Audited: ${kpi.total_contracts.toLocaleString()}`, 15, 66);
      doc.text(`Violations Found: ${kpi.total_violations}`, 15, 74);
      doc.text(`Accuracy: ${kpi.accuracy}%`, 15, 82);

      doc.line(15, 88, pageWidth - 15, 88);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 20 Violations', 15, 98);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const headers = ['Content ID', 'Type', 'Expected', 'Paid', 'Difference'];
      const colX = [15, 55, 105, 140, 170];
      headers.forEach((h, i) => doc.text(h, colX[i], 108));

      doc.setDrawColor(180);
      doc.line(15, 111, pageWidth - 15, 111);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      let y = 117;
      topViolations.forEach((v: Record<string, unknown>) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(String(v.content_id || ''), colX[0], y);
        doc.text(String(v.violation_type || ''), colX[1], y);
        doc.text(`$${Number(v.expected || 0).toLocaleString()}`, colX[2], y);
        doc.text(`$${Number(v.paid || 0).toLocaleString()}`, colX[3], y);
        doc.text(`$${Number(v.difference || 0).toLocaleString()}`, colX[4], y);
        y += 8;
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Generated by RoyalGuard AI v1.0', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save('royalguard-audit-report.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      key: 'audit_id',
      header: 'Audit ID',
      width: '110px',
      render: (row: AuditResult) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rg-gold/10 rounded">
            <Search className="w-3.5 h-3.5 text-rg-gold" />
          </div>
          <span className="font-mono text-rg-text-secondary text-[12px]">{row.audit_id}</span>
        </div>
      ),
    },
    {
      key: 'content_id',
      header: 'Content ID',
      width: '120px',
      render: (row: AuditResult) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rg-text-muted" />
          <span className="font-mono text-rg-text-primary font-semibold">{row.content_id}</span>
        </div>
      ),
    },
    {
      key: 'studio',
      header: 'Studio',
      width: '150px',
      render: (row: AuditResult) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-rg-text-muted" />
          <span className="text-rg-text-primary">{row.studio}</span>
        </div>
      ),
    },
    {
      key: 'expected_payment',
      header: 'Expected',
      width: '130px',
      render: (row: AuditResult) => (
        <span className="font-mono text-rg-text-primary font-semibold">{formatCurrency(row.expected_payment)}</span>
      ),
    },
    {
      key: 'actual_payment',
      header: 'Actual',
      width: '130px',
      render: (row: AuditResult) => (
        <span className="font-mono text-rg-text-primary font-semibold">{formatCurrency(row.actual_payment)}</span>
      ),
    },
    {
      key: 'difference',
      header: 'Difference',
      width: '130px',
      render: (row: AuditResult) => (
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
      key: 'violation',
      header: 'Violation',
      width: '160px',
      render: (row: AuditResult) => <ViolationBadge type={row.violation} />,
    },
    {
      key: 'proof_hash',
      header: 'Governance',
      width: '140px',
      render: (row: AuditResult) => (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-rg-success/5 border border-rg-success/20 rounded text-[10px] font-mono text-rg-success max-w-[120px]">
          <span className="truncate">{row.proof_hash || '0xDE...AD'}</span>
        </div>
      ),
    },
    {
      key: 'timestamp',
      header: 'Audit Time',
      width: '180px',
      render: (row: AuditResult) => (
        <span className="text-rg-text-muted text-[11px] font-mono">
          {new Date(row.timestamp).toLocaleDateString()} {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      width: '80px',
      render: (row: AuditResult) => (
        <div className="flex items-center justify-center gap-2">
          {onAskAI && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleAskAIForRow(e, row)}
              title="Explain with AI"
              className="p-1.5 bg-rg-gold/10 hover:bg-rg-gold/20 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-rg-gold" />
            </motion.button>
          )}
          <ArrowUpRight className="w-4 h-4 text-rg-text-muted" />
        </div>
      ),
    },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-rg-bg-card border border-rg-border-default rounded-rg-md text-[12px] text-rg-text-secondary hover:border-rg-border-highlight hover:text-rg-text-primary disabled:opacity-50 transition-all"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        Export PDF
      </motion.button>
    </div>
  );

  const fetchData = useCallback(async (page: number, search?: string) => {
    const res = await api.getAuditResults(page, 50, search);
    return res as any;
  }, []);

  const handleDownload = useCallback((search: string) => {
    return api.downloadAuditCSV(search);
  }, []);

  return (
    <>
      <DataTable<any>
        title="RoyalGuard Intelligence Audit"
        subtitle="Cryptographically verified discrepancy analysis"
        columns={columns}
        fetchData={fetchData}
        onDownload={handleDownload}
        emptyTitle="No Audit Data Yet"
        emptyDescription="Run an audit to analyze contracts and detect payment discrepancies. Click 'RUN AUDIT' in the top-right to get started."
        emptyIcon="audit"
        searchable
        rowsPerPage={50}
        onRowClick={handleRowClick}
        headerActions={headerActions}
      />
      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        contractDetail={selectedDetail}
        loading={drawerLoading}
      />
    </>
  );
}
