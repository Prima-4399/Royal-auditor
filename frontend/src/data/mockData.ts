import type { AgentStep } from '@/types';

// ── Navigation items (structural UI constant — not data) ─────────────────
export const navItems = [
  { id: 'contracts' as const, label: 'Contracts', icon: 'FileText' },
  { id: 'streaming' as const, label: 'Streaming Logs', icon: 'Play' },
  { id: 'payments' as const, label: 'Payments', icon: 'DollarSign' },
  { id: 'audit' as const, label: 'Audit Results', icon: 'Search' },
  { id: 'violations' as const, label: 'Violations', icon: 'AlertTriangle' },
  { id: 'leakage' as const, label: 'Leakage Summary', icon: 'BarChart3' },
  { id: 'agents' as const, label: 'Agent Trace', icon: 'Activity' },
  { id: 'governance' as const, label: 'Governance', icon: 'ShieldCheck' },
  { id: 'connectors' as const, label: 'Connectors', icon: 'Database' },
  { id: 'live' as const, label: 'Live Monitor', icon: 'Zap' },
  { id: 'glossary' as const, label: 'Glossary', icon: 'BookOpen' },
];

// ── Agent names (structural constant matching backend agents) ────────────
export const agentNames = [
  'Planner Agent',
  'Contract Reader Agent',
  'Usage Agent',
  'Royalty Agent',
  'Ledger Agent',
  'Audit Agent',
  'Violation Agent',
  'Reporter Agent',
];

// ── Initial agent step state (pre-audit placeholders) ────────────────────
// These are the "Day 0" states shown before the audit pipeline runs.
// Once "Run Audit" is clicked, the SSE stream replaces every field with
// real values computed by the backend agents.
export const initialAgentSteps: AgentStep[] = [
  {
    id: 1,
    name: 'Planner Agent',
    action: 'Routes and orchestrates the full audit pipeline',
    detail: 'Waiting for pipeline to start…',
    status: 'PENDING',
  },
  {
    id: 2,
    name: 'Contract Reader Agent',
    action: 'Parses contract terms and royalty clauses',
    detail: 'Waiting for pipeline to start…',
    status: 'PENDING',
  },
  {
    id: 3,
    name: 'Usage Agent',
    action: 'Aggregates streaming play counts by territory',
    detail: 'Waiting for pipeline to start…',
    status: 'PENDING',
  },
  {
    id: 4,
    name: 'Royalty Agent',
    action: 'Calculates expected royalties per contract',
    detail: 'Waiting for pipeline to start…',
    status: 'PENDING',
  },
  {
    id: 5,
    name: 'Ledger Agent',
    action: 'Reconciles expected vs actual payments',
    detail: 'Waiting for pipeline to start…',
    status: 'PENDING',
  },
  {
    id: 6,
    name: 'Audit Agent',
    action: 'Identifies discrepancies and violations',
    detail: 'Waiting for pipeline to start…',
    status: 'PENDING',
  },
  {
    id: 7,
    name: 'Violation Agent',
    action: 'Classifies violation types and severity',
    detail: 'Waiting for pipeline to start…',
    status: 'PENDING',
  },
  {
    id: 8,
    name: 'Reporter Agent',
    action: 'Generates audit summary and recommendations',
    detail: 'Waiting for pipeline to start…',
    status: 'PENDING',
  },
];
