import { getApiBase } from './getApiBase';

const getBaseURL = () => {
  return getApiBase();
};

const BASE = getBaseURL();

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export interface LeakageSummaryResponse {
  kpi: {
    total_contracts: number;
    total_leakage: number;
    total_violations: number;
    accuracy: number;
  };
  by_studio: Array<{ studio: string; total_leakage: number; count: number }>;
  by_content: Array<{ content_id: string; total_leakage: number }>;
  over_under: Array<{ violation: string; count: number; total_amount: number }>;
  by_type: Array<{ violation_type: string; count: number; total_amount: number }>;
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
}

export interface ContractDetail {
  contract: Record<string, unknown>;
  audit: Record<string, unknown> | null;
  violation: Record<string, unknown> | null;
  total_plays: number;
}

export interface AuditSSEEvent {
  step: number;
  total: number;
  agent: string;
  action: string;
  detail: string;
  status: 'running' | 'complete' | 'done';
  total_leakage?: number;
  total_violations?: number;
  total_audited?: number;
  elapsed_seconds?: number;
  records_processed?: number;
}

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    console.log(`[API] Request: ${url}`);
    const res = await fetch(url, options);
    
    if (!res.ok) {
      console.error(`[API] HTTP ${res.status} ${res.statusText} from ${url}`);
      // Try to get error details from response
      let errorDetail = '';
      try {
        const text = await res.text();
        errorDetail = text.substring(0, 200);
      } catch {}
      throw new Error(`API error: ${res.status} ${res.statusText}${errorDetail ? ' - ' + errorDetail : ''}`);
    }
    
    const data = await res.json();
    console.log(`[API] Response OK: ${url}`);
    return data;
  } catch (error) {
    console.error(`[API] Fetch failed at ${url}:`, error);
    throw error;
  }
}

export const api = {
  getSystemStatus: () =>
    safeFetch<{ status: string; has_demo_data: boolean; counts?: Record<string, number>; message?: string }>(`${BASE}/system/status`),

  getContracts: (page = 1, search = '') =>
    safeFetch<PaginatedResponse<Record<string, unknown>>>(`${BASE}/contracts?page=${page}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  getLogs: (page = 1, search = '') =>
    safeFetch<PaginatedResponse<Record<string, unknown>>>(`${BASE}/logs?page=${page}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  getPayments: (page = 1, search = '') =>
    safeFetch<PaginatedResponse<Record<string, unknown>>>(`${BASE}/payments?page=${page}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  getAuditResults: (page = 1, limit = 50, search = '') =>
    safeFetch<PaginatedResponse<Record<string, unknown>>>(`${BASE}/audit/results?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  getViolations: (page = 1, limit = 50, search = '') =>
    safeFetch<PaginatedResponse<Record<string, unknown>>>(`${BASE}/violations?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  getConnectors: () =>
    safeFetch<{ connectors: any[] }>(`${BASE}/connectors/status`),

  getAuditProof: (id: string) =>
    safeFetch<any>(`${BASE}/audit/proof/${id}`),

  syncConnectors: () =>
    safeFetch<{ connectors: any[] }>(`${BASE}/connectors/sync`, { method: 'POST' }),

  syncStripePayments: () =>
    safeFetch<any>(`${BASE}/payments/sync/stripe`, { method: 'POST' }),

  ingestContract: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return safeFetch<any>(`${BASE}/contracts/ingest`, {
      method: 'POST',
      body: formData,
    });
  },

  getLeakageSummary: () =>
    safeFetch<LeakageSummaryResponse>(`${BASE}/leakage-summary`),

  getAgents: () =>
    safeFetch<{ agents: AgentDefinition[] }>(`${BASE}/agents`),

  getContractDetail: (id: string) =>
    safeFetch<ContractDetail>(`${BASE}/contract/${id}`),

  // SSE stream for audit run
  runAudit: () => new EventSource(`${BASE}/audit/run`),

  // SSE stream for live monitor with real-time audit records
  streamLiveAudit: () => new EventSource(`${BASE}/audit/stream`),

  // POST /data/reset — re-seeds SQLite from CSV files
  resetData: () => safeFetch<{ status: string; message: string }>(`${BASE}/data/reset`, { method: 'POST' }),

  // Full System CSV Downloads
  downloadContractsCSV: (search = '') => {
    window.location.href = `${BASE}/contracts/csv${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  },

  downloadLogsCSV: (search = '') => {
    window.location.href = `${BASE}/logs/csv${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  },

  downloadPaymentsCSV: (search = '') => {
    window.location.href = `${BASE}/payments/csv${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  },

  downloadViolationsCSV: (search = '') => {
    window.location.href = `${BASE}/violations/csv${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  },

  downloadAuditCSV: (search = '') => {
    window.location.href = `${BASE}/audit/log/csv${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  },

  // POST streaming for NL explain
  streamExplain: async function* (question: string) {
    const res = await fetch(`${BASE}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error(`Explain error: ${res.status} ${res.statusText}`);
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No readable stream');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(raw);
        } catch {
          continue; // skip truly malformed lines only
        }
        // Handle signals OUTSIDE the parse try-catch so they propagate
        if (parsed.done) return;
        if (parsed.error) throw new Error(String(parsed.error));
        if (parsed.text) yield parsed.text as string;
      }
    }
  },

  // LLM Contract Summarizer
  streamContractSummary: async function* (contractId: string) {
    const res = await fetch(`${BASE}/contract/${contractId}/summarize`);
    if (!res.ok) throw new Error(`Summarize error: ${res.status} ${res.statusText}`);
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No readable stream');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(raw);
        } catch {
          continue;
        }
        if (parsed.done) return;
        if (parsed.error) throw new Error(String(parsed.error));
        if (parsed.text) yield parsed.text as string;
      }
    }
  },

  // Notifications & Settings
  getNotifications: () =>
    safeFetch<{ notifications: any[] }>(`${BASE}/notifications`),

  toggleConnector: (id: string) =>
    safeFetch<any>(`${BASE}/connectors/toggle/${id}`, { method: 'POST' }),

  updateConfig: (config: any) =>
    safeFetch<any>(`${BASE}/api/config/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }),

  getConfig: () =>
    safeFetch<any>(`${BASE}/api/config`),

  // Blockchain Governance
  getBlockchainStatus: () =>
    safeFetch<{ connected: boolean; network: string; status: string; contract_address: string }>(`${BASE}/blockchain/status`),

  getBlockchainValidators: () =>
    safeFetch<{ total_validators: number; active_validators: any[] }>(`${BASE}/blockchain/validators`),

  verifyProofOnBlockchain: (auditId: string, proofHash: string) =>
    safeFetch<any>(`${BASE}/blockchain/verify/${auditId}?proof_hash=${encodeURIComponent(proofHash)}`, { method: 'POST' }),

  getBlockchainReceipt: (auditId: string) =>
    safeFetch<any>(`${BASE}/blockchain/receipt/${auditId}`),
};
