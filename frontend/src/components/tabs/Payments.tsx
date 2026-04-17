import { useCallback, useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import type { Payment } from '@/types';
import { api } from '@/lib/api';
import { CreditCard, FileText, Calendar, DollarSign, Zap, Check, AlertCircle } from 'lucide-react';

export function PaymentsTab() {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stripeConnectorStatus, setStripeConnectorStatus] = useState<any>(null);

  // Fetch Stripe connector status on mount
  useEffect(() => {
    const fetchConnectorStatus = async () => {
      const res = await api.getConnectors();
      const stripeConnector = res.connectors.find((c: any) => c.id === 'stripe');
      setStripeConnectorStatus(stripeConnector);
    };
    fetchConnectorStatus();
  }, []);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      const result = await api.syncStripePayments();
      setSyncStatus(result);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const columns = [
    {
      key: 'payment_id',
      header: 'Payment ID',
      width: '120px',
      render: (row: Payment) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rg-gold/10 rounded">
            <CreditCard className="w-3.5 h-3.5 text-rg-gold" />
          </div>
          <span className="font-mono text-rg-text-secondary text-[12px]">{row.payment_id}</span>
        </div>
      ),
    },
    {
      key: 'contract_id',
      header: 'Contract ID',
      width: '120px',
      render: (row: Payment) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rg-text-muted" />
          <span className="font-mono text-rg-text-secondary text-[12px]">{row.contract_id}</span>
        </div>
      ),
    },
    {
      key: 'content_id',
      header: 'Content ID',
      width: '120px',
      render: (row: Payment) => (
        <span className="font-mono text-rg-text-primary font-semibold">{row.content_id}</span>
      ),
    },
    {
      key: 'amount_paid',
      header: 'Amount Paid',
      width: '140px',
      render: (row: Payment) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rg-gold/10 rounded">
            <DollarSign className="w-4 h-4 text-rg-gold" />
          </div>
          <span className="font-mono text-rg-gold font-bold text-[15px]">
            {formatCurrency(row.amount_paid)}
          </span>
        </div>
      ),
    },
    {
      key: 'payment_date',
      header: 'Payment Date',
      width: '140px',
      render: (row: Payment) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rg-text-muted" />
          <span className="font-mono text-rg-text-secondary text-[12px]">{row.payment_date}</span>
        </div>
      ),
    },
  ];

  const fetchData = useCallback(async (page: number, search?: string) => {
    const res = await api.getPayments(page, search);
    return res as any;
  }, []);

  const handleDownload = useCallback((search: string) => {
    return api.downloadPaymentsCSV(search);
  }, []);

  return (
    <div className="space-y-4">
      {/* Stripe Integration Status Card */}
      <div className="bg-rg-surface rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-rg-text-primary">Stripe Payment Sync</h3>
              <p className="text-sm text-rg-text-secondary">
                {stripeConnectorStatus ? (
                  <>
                    Status: <span className="text-green-400 font-medium">Connected</span> •{' '}
                    {stripeConnectorStatus.last_sync && (
                      <>Last synced: {formatDate(stripeConnectorStatus.last_sync)}</>
                    )}
                  </>
                ) : (
                  'Loading connector status...'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-rg-md font-bold uppercase tracking-wider transition-all ${
              isSyncing
                ? 'bg-rg-border text-rg-text-muted cursor-not-allowed opacity-50'
                : 'bg-gradient-gold text-rg-bg-deep hover:scale-[1.03] active:scale-[0.98]'
            }`}
          >
            {isSyncing ? (
              <>
                <span className="inline-block animate-spin">⚙</span>
                Syncing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Sync Payments
              </>
            )}
          </button>
        </div>

        {/* Sync Result */}
        {syncStatus && (
          <div className={`mt-3 p-3 rounded-lg border ${
            syncStatus.status === 'success' 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-start gap-2">
              {syncStatus.status === 'success' ? (
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-sm">
                <p className={syncStatus.status === 'success' ? 'text-green-300' : 'text-red-300'}>
                  {syncStatus.message}
                </p>
                {syncStatus.mode && (
                  <p className="text-xs text-rg-text-secondary mt-1">
                    Mode: <span className="bg-rg-surface px-1.5 py-0.5 rounded text-blue-300">{syncStatus.mode}</span>
                  </p>
                )}
                {syncStatus.inserted_payments && (
                  <p className="text-xs text-green-300 mt-1">
                    ✓ {syncStatus.inserted_payments} payments inserted
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <DataTable<any>
        title="Payment Ledger"
        subtitle="Financial records and studio reconciliation status"
        columns={columns}
        fetchData={fetchData}
        onDownload={handleDownload}
        emptyTitle="No Payment Data"
        emptyDescription="Payment records will appear after running an audit. Execute audits to analyze payment discrepancies."
        emptyIcon="data"
        searchable
        rowsPerPage={50}
      />
    </div>
  );
}
