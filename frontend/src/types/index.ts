export interface Contract {
  contract_id: string;
  content_id: string;
  studio: string;
  royalty_rate: number;
  rate_per_play: number;
  territory: string;
  start_date: string;
  end_date: string;
  tier_threshold: number;
  tier_rate: number;
  min_guarantee: number;
}

export interface StreamingLog {
  play_id: string;
  content_id: string;
  timestamp: string;
  country: string;
  plays: number;
  user_type: string;
  device: string;
}

export interface Payment {
  payment_id: string;
  contract_id: string;
  content_id: string;
  amount_paid: number;
  payment_date: string;
}

export type ViolationType = 'UNDERPAYMENT' | 'OVERPAYMENT' | 'EXPIRED_LICENSE' | 'TERRITORY_VIOLATION' | 'NONE';

export interface AuditResult {
  audit_id: string;
  content_id: string;
  studio: string;
  expected_payment: number;
  actual_payment: number;
  difference: number;
  violation: ViolationType;
  timestamp: string;
  proof_hash?: string;
}

export interface Violation {
  violation_id: string;
  contract_id: string;
  content_id: string;
  studio: string;
  violation_type: ViolationType;
  expected: number;
  paid: number;
  difference: number;
  territory: string;
  proof_hash?: string;
}

export interface Connector {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'active';
  last_sync: string | null;
}

export interface AuditProof {
  certificate_id: string;
  status: string;
  timestamp: string;
  governance_hash: string;
  validator: string;
  details: AuditResult;
}

export interface StreamRecord {
  id: string;
  content: string;
  country: string;
  status: 'AUDITED' | 'VIOLATION' | 'CLEAN';
  timestamp: string;
}

export interface LiveMonitorState {
  streams: StreamRecord[];
  stats: {
    audited: number;
    leaked: number;
    speed: number;
    cpu: number;
  };
}

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETE';

export interface AgentStep {
  id: number;
  name: string;
  action: string;
  detail: string;
  status: AgentStatus;
}

export type TabId = 'contracts' | 'streaming' | 'payments' | 'audit' | 'violations' | 'leakage' | 'agents' | 'governance' | 'connectors' | 'live' | 'glossary';

export interface NavItem {
  id: TabId;
  label: string;
  icon: string;
}

export interface LeakageByStudio {
  studio: string;
  amount: number;
}

export interface ViolationsByType {
  type: string;
  count: number;
  color: string;
}

export interface OverpaymentUnderpayment {
  category: string;
  overpayment: number;
  underpayment: number;
}

export interface TopContentLeakage {
  content_id: string;
  amount: number;
}
