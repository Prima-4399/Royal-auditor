import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTable } from '@/components/ui/DataTable';
import type { Contract } from '@/types';
import { api } from '@/lib/api';
import { FileText, Percent, DollarSign, Globe, Layers, BarChart3, TrendingUp, Sparkles, X, Loader2, Shield, FileUp, Copy, Check } from 'lucide-react';

export function ContractsTab() {
  const [summaryDrawer, setSummaryDrawer] = useState<{
    open: boolean;
    contractId: string;
    text: string;
    loading: boolean;
  }>({ open: false, contractId: '', text: '', loading: false });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ingestSuccess, setIngestSuccess] = useState<{ contractId: string; contentId: string } | null>(null);
  const [copied, setCopied] = useState<'contract' | 'content' | null>(null);
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSummarize = async (contractId: string) => {
    abortRef.current = false;
    setSummaryDrawer({ open: true, contractId, text: '', loading: true });
    try {
      let accumulated = '';
      for await (const chunk of api.streamContractSummary(contractId)) {
        if (abortRef.current) break;
        accumulated += chunk;
        setSummaryDrawer(prev => ({ ...prev, text: accumulated }));
      }
    } catch (err) {
      setSummaryDrawer(prev => ({
        ...prev,
        text: prev.text || `Error: ${err instanceof Error ? err.message : 'Failed to summarize'}`,
      }));
    } finally {
      setSummaryDrawer(prev => ({ ...prev, loading: false }));
    }
  };

  const closeDrawer = () => {
    abortRef.current = true;
    setSummaryDrawer({ open: false, contractId: '', text: '', loading: false });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setIngestSuccess(null);
    setCopied(null);
    
    // Start progress animation
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + Math.floor(Math.random() * 15) : prev));
    }, 300);

    try {
      // Call backend with actual File object
      const res = await api.ingestContract(selectedFile);
      
      // Artificial delay for "AI extraction"
      await new Promise(r => setTimeout(r, 800));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        // Store both contract_id and content_id
        setIngestSuccess({
          contractId: res.contract_id,
          contentId: res.content_id
        });
        // Reset file input so same file can be uploaded again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Clear success after 6 seconds
        setTimeout(() => setIngestSuccess(null), 6000);
      }, 500);
    } catch (err) {
      console.error("Ingestion failed:", err);
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const handleCopyContractId = () => {
    if (ingestSuccess) {
      navigator.clipboard.writeText(ingestSuccess.contractId);
      setCopied('contract');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleCopyContentId = () => {
    if (ingestSuccess) {
      navigator.clipboard.writeText(ingestSuccess.contentId);
      setCopied('content');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const columns = [
    {
      key: 'contract_id',
      header: 'Contract ID',
      width: '120px',
      render: (row: Contract) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rg-bg-tertiary rounded">
            <FileText className="w-3.5 h-3.5 text-rg-text-muted" />
          </div>
          <span className="font-mono text-rg-text-secondary text-[13px]">{row.contract_id}</span>
        </div>
      ),
    },
    {
      key: 'content_id',
      header: 'Content ID',
      width: '120px',
      render: (row: Contract) => (
        <span className="font-mono text-rg-text-primary font-semibold">{row.content_id}</span>
      ),
    },
    {
      key: 'studio',
      header: 'Studio',
      width: '140px',
      render: (row: Contract) => (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-rg-text-muted" />
          <span className="text-rg-text-primary">{row.studio}</span>
        </div>
      ),
    },
    {
      key: 'royalty_rate',
      header: 'Royalty %',
      width: '100px',
      render: (row: Contract) => (
        <div className="flex items-center gap-2">
          <div className="p-1 bg-rg-gold/10 rounded">
            <Percent className="w-3.5 h-3.5 text-rg-gold" />
          </div>
          <span className="font-mono text-rg-gold font-semibold">{row.royalty_rate}%</span>
        </div>
      ),
    },
    {
      key: 'rate_per_play',
      header: 'Rate/Play',
      width: '100px',
      render: (row: Contract) => (
        <div className="flex items-center gap-2">
          <div className="p-1 bg-rg-gold/10 rounded">
            <DollarSign className="w-3.5 h-3.5 text-rg-gold" />
          </div>
          <span className="font-mono text-rg-gold font-semibold">${row.rate_per_play}</span>
        </div>
      ),
    },
    {
      key: 'territory',
      header: 'Territory',
      width: '100px',
      render: (row: Contract) => (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-rg-text-muted" />
          <span className="text-rg-text-secondary">{row.territory}</span>
        </div>
      ),
    },
    {
      key: 'tier_threshold',
      header: 'Tier Threshold',
      width: '120px',
      render: (row: Contract) => (
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-cyan-300 text-[12px]">{Number(row.tier_threshold).toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'tier_rate',
      header: 'Tier Rate',
      width: '100px',
      render: (row: Contract) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-cyan-300 font-semibold">${row.tier_rate}</span>
        </div>
      ),
    },
    {
      key: 'min_guarantee',
      header: 'Min Guarantee',
      width: '130px',
      render: (row: Contract) => (
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-mono text-rose-300 font-semibold">${Number(row.min_guarantee).toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: '_actions',
      header: '',
      width: '120px',
      render: (row: Contract) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSummarize(row.contract_id);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-400/40 rounded-lg text-violet-300 hover:text-violet-200 text-[12px] font-medium transition-all group"
        >
          <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
          Summarize
        </button>
      ),
    },
  ];

  const fetchData = useCallback(async (page: number, search?: string) => {
    const res = await api.getContracts(page, search);
    return res as any;
  }, []);

  const handleDownload = useCallback((search: string) => {
    return api.downloadContractsCSV(search);
  }, []);

  return (
    <>
      <DataTable<Contract>
        columns={columns}
        fetchData={fetchData}
        onDownload={handleDownload}
        rowsPerPage={50}
        searchable={true}
        title="License Contracts"
        subtitle="Manage and review all active royalty agreements"
        emptyTitle="No Contracts Loaded"
        emptyDescription="Upload license PDFs using the 'Ingest License PDF' button above or run an audit to view contract data."
        emptyIcon="data"
        headerActions={
          <div className="flex items-center gap-2">
            {isUploading ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-rg-gold/10 border border-rg-gold/30 rounded-rg-md min-w-[240px]">
                <Loader2 className="w-4 h-4 text-rg-gold animate-spin" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-rg-gold font-bold uppercase tracking-tighter">AI Ingesting...</span>
                    <span className="text-[10px] text-rg-gold font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="h-1 bg-rg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-rg-gold" 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : ingestSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 px-5 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-rg-md text-emerald-400"
              >
                <div className="p-2 bg-emerald-500/20 rounded-full">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold leading-tight mb-2">✅ Ingestion Complete</div>
                  <div className="space-y-2">
                    {/* Contract ID */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-emerald-300/70 font-semibold uppercase tracking-wider">Contract:</span>
                      <span className="text-[10px] font-mono bg-black/30 px-2.5 py-1 rounded text-emerald-200 flex-1">
                        {ingestSuccess.contractId}
                      </span>
                      <button
                        onClick={handleCopyContractId}
                        className="p-1.5 hover:bg-emerald-500/20 rounded transition-colors flex-shrink-0"
                        title="Copy contract ID"
                      >
                        {copied === 'contract' ? (
                          <Check className="w-4 h-4 text-emerald-300" />
                        ) : (
                          <Copy className="w-4 h-4 text-emerald-300/60 hover:text-emerald-300" />
                        )}
                      </button>
                    </div>
                    {/* Content ID */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-emerald-300/70 font-semibold uppercase tracking-wider">Content:</span>
                      <span className="text-[10px] font-mono bg-black/30 px-2.5 py-1 rounded text-emerald-200 flex-1">
                        {ingestSuccess.contentId}
                      </span>
                      <button
                        onClick={handleCopyContentId}
                        className="p-1.5 hover:bg-emerald-500/20 rounded transition-colors flex-shrink-0"
                        title="Copy content ID"
                      >
                        {copied === 'content' ? (
                          <Check className="w-4 h-4 text-emerald-300" />
                        ) : (
                          <Copy className="w-4 h-4 text-emerald-300/60 hover:text-emerald-300" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-gold text-rg-bg-deep rounded-rg-md px-5 py-2.5 flex items-center gap-2 group font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <div className="relative">
                    <FileUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-rg-success rounded-full animate-pulse" />
                  </div>
                  <span>Ingest License PDF</span>
                  <span className="text-[10px] bg-rg-bg-deep/40 px-1.5 py-0.5 rounded ml-1 text-rg-gold opacity-80">AI</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* AI Summary Drawer */}
      <AnimatePresence>
        {summaryDrawer.open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-rg-bg-deep/80 backdrop-blur-sm z-40"
              onClick={closeDrawer}
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
                <div className="flex items-center justify-between p-6 border-b border-rg-border-default bg-gradient-to-r from-violet-500/5 to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-500/20 rounded-xl">
                      <Sparkles className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase text-rg-text-muted tracking-wider font-semibold">
                        AI Contract Summary
                      </p>
                      <p className="text-lg font-bold text-rg-text-primary font-mono">
                        {summaryDrawer.contractId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="p-2 text-rg-text-muted hover:text-rg-text-primary hover:bg-white/5 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                  <div className="space-y-4">
                    {/* Status badge */}
                    <div className="flex items-center gap-2 mb-4">
                      {summaryDrawer.loading ? (
                        <>
                          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                          <span className="text-[12px] uppercase tracking-wider text-violet-400 font-semibold">
                            Analyzing contract...
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[12px] uppercase tracking-wider text-emerald-400 font-semibold">
                            Analysis Complete
                          </span>
                        </>
                      )}
                    </div>

                    {/* AI Summary Text */}
                    <div className="glass-card rounded-xl p-5 border border-violet-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="text-[12px] text-violet-300 font-semibold uppercase tracking-wider">
                          Executive Summary
                        </span>
                      </div>
                      <p className="text-[14px] text-rg-text-secondary leading-relaxed whitespace-pre-wrap">
                        {summaryDrawer.text || (
                          <span className="text-rg-text-muted italic">Generating summary...</span>
                        )}
                        {summaryDrawer.loading && (
                          <span className="inline-block w-2 h-4 bg-violet-400/60 ml-0.5 animate-pulse rounded-sm" />
                        )}
                      </p>
                    </div>

                    {/* Powered by badge */}
                    <div className="flex items-center gap-2 text-rg-text-muted text-[11px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-rg-gold" />
                      Powered by Llama 3.3 70B via Groq
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
