import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlossaryTerm {
  id: string;
  term: string;
  category: 'Core Concepts' | 'Financial Terms' | 'System & Technical' | 'Data Entities' | 'Platform Features';
  definition: string;
  example?: string;
  relatedTerms?: string[];
}

const glossaryTerms: GlossaryTerm[] = [
  // === CORE CONCEPTS ===
  {
    id: 'violation',
    term: 'Violation',
    category: 'Core Concepts',
    definition: 'Any payment discrepancy or compliance breach detected during an audit. This includes underpayments, overpayments, expired license usage, and territory violations.',
    example: 'If a contract requires $50,000 but only $45,000 was paid, this is an underpayment violation.',
    relatedTerms: ['Underpayment', 'Overpayment', 'Leakage'],
  },
  {
    id: 'leakage',
    term: 'Leakage',
    category: 'Core Concepts',
    definition: 'The total financial loss resulting from violations. Calculated as: Expected Payment - Actual Payment. Represents money that should have been paid but wasn\'t.',
    example: 'Total leakage of $500,000 means creators and studios collectively lost $500,000 in payments.',
    relatedTerms: ['Violation', 'Underpayment', 'Liability'],
  },
  {
    id: 'audit',
    term: 'Audit',
    category: 'Core Concepts',
    definition: 'A systematic examination of contracts versus payments to identify violations and financial discrepancies. The platform runs audits automatically using an 8-agent AI pipeline.',
    example: 'Click "Run Audit" to execute a full pipeline that examines 1,000+ contracts against payment records.',
    relatedTerms: ['Agent Pipeline', 'Audit Result', 'Proof Hash'],
  },
  {
    id: 'agent-pipeline',
    term: 'Agent Pipeline',
    category: 'Core Concepts',
    definition: 'An 8-step autonomous AI workflow that orchestrates the entire audit process: Planner → Contract Reader → Usage → Royalty → Ledger → Audit → Violation → Reporter.',
    example: 'Each agent specializes in one step, passing results to the next agent in the chain.',
    relatedTerms: ['Agent Trace', 'Real-time Streaming'],
  },
  {
    id: 'governance',
    term: 'Governance',
    category: 'Core Concepts',
    definition: 'The blockchain verification layer that stores immutable audit proofs on-chain. Each audit generates a proof hash that can be verified for authenticity and finality.',
    example: 'After an audit completes, the results are hashed and stored on a blockchain validator for permanent record.',
    relatedTerms: ['Proof Hash', 'Governance Hash', 'Audit Trail'],
  },

  // === FINANCIAL TERMS ===
  {
    id: 'royalty',
    term: 'Royalty',
    category: 'Financial Terms',
    definition: 'The percentage or per-play rate owed to creators based on contract terms. Royalties are typically calculated as a percentage of revenue or a fixed amount per play.',
    example: 'A contract may specify a 15% royalty rate (15% of revenue goes to the creator) or $0.002 per play.',
    relatedTerms: ['Contract', 'Royalty Rate', 'Min Guarantee'],
  },
  {
    id: 'underpayment',
    term: 'Underpayment',
    category: 'Financial Terms',
    definition: 'When a studio pays less than the contractually required amount. This creates financial liability and is the primary source of leakage.',
    example: 'Contract requires $50,000 in royalties, but only $45,000 was paid → $5,000 underpayment (leakage).',
    relatedTerms: ['Violation', 'Leakage', 'Overpayment'],
  },
  {
    id: 'overpayment',
    term: 'Overpayment',
    category: 'Financial Terms',
    definition: 'When a studio pays more than the contractually required amount. While not financial loss, overpayments are flagged for accounting purposes and recovery opportunities.',
    example: 'Contract requires $50,000, but $55,000 was paid → $5,000 overpayment (money to recover).',
    relatedTerms: ['Violation', 'Underpayment'],
  },
  {
    id: 'min-guarantee',
    term: 'Min Guarantee',
    category: 'Financial Terms',
    definition: 'The minimum royalty amount owed to a creator regardless of actual play counts or performance. Acts as a floor payment.',
    example: 'A contract may guarantee a minimum of $5,000 per quarter, even if plays are low.',
    relatedTerms: ['Royalty', 'Contract', 'Tier Threshold'],
  },
  {
    id: 'tier-threshold',
    term: 'Tier Threshold',
    category: 'Financial Terms',
    definition: 'A play count threshold that triggers a higher royalty rate. Once exceeded, the royalty percentage increases to incentivize higher volumes.',
    example: 'Tier 1: 15% royalty on first 10,000 plays. Tier 2: 20% royalty on plays 10,001+.',
    relatedTerms: ['Royalty', 'Contract', 'Tiered Licensing'],
  },
  {
    id: 'territory',
    term: 'Territory',
    category: 'Financial Terms',
    definition: 'A geographic region where a license is valid and royalties apply. Different territories may have different royalty rates and terms.',
    example: 'A contract may specify: US: 15%, EU: 12%, APAC: 10% royalty rates.',
    relatedTerms: ['License', 'Contract', 'Territory Violation'],
  },
  {
    id: 'territory-violation',
    term: 'Territory Violation',
    category: 'Financial Terms',
    definition: 'When content is accessed or sold in a territory where the license has expired or does not apply. Results in unpaid royalties for unauthorized territory usage.',
    example: 'Content licensed only for US, but 10,000 plays occurred in EU without EU license being purchased.',
    relatedTerms: ['Violation', 'Territory', 'Expired License'],
  },

  // === SYSTEM & TECHNICAL ===
  {
    id: 'sse',
    term: 'SSE (Server-Sent Events)',
    category: 'System & Technical',
    definition: 'A real-time streaming technology that allows the backend to push data updates to the frontend without polling. Used for live audit progress and streaming results.',
    example: 'When "Run Audit" is clicked, SSE streams each agent\'s progress and live audit records.',
    relatedTerms: ['Live Monitor', 'Real-time Streaming', 'Agent Trace'],
  },
  {
    id: 'connector',
    term: 'Connector',
    category: 'System & Technical',
    definition: 'An integration point with external systems. Available connectors: Stripe (payments), ERP (enterprise systems), Banking (financial records), Blockchain (governance).',
    example: 'Stripe connector syncs payment data automatically; Blockchain connector stores audit proofs immutably.',
    relatedTerms: ['Sync', 'Integration', 'Governance'],
  },
  {
    id: 'sync',
    term: 'Sync',
    category: 'System & Technical',
    definition: 'The process of refreshing data from external connectors. Pulling the latest information from Stripe, ERP systems, banking data, or blockchain validators.',
    example: 'Click "Sync Stripe" to refresh payment data from Stripe\'s API with the latest payment records.',
    relatedTerms: ['Connector', 'Integration', 'Real-time'],
  },
  {
    id: 'proof-hash',
    term: 'Proof Hash',
    category: 'System & Technical',
    definition: 'A cryptographic fingerprint of an audit record. Used to verify the integrity and authenticity of audit results and store them on blockchain.',
    example: 'Proof hash "abc123def456..." uniquely identifies and validates an audit record.',
    relatedTerms: ['Governance Hash', 'Blockchain', 'Governance'],
  },
  {
    id: 'governance-hash',
    term: 'Governance Hash',
    category: 'System & Technical',
    definition: 'A blockchain-verified proof that confirms the finality and immutability of an audit record stored on-chain. Provides legal and audit trail certification.',
    example: 'Each completed audit receives a governance hash confirming it\'s permanently recorded on blockchain.',
    relatedTerms: ['Proof Hash', 'Governance', 'Blockchain Verification'],
  },
  {
    id: 'live-monitor',
    term: 'Live Monitor',
    category: 'System & Technical',
    definition: 'The real-time streaming audit engine that continuously evaluates plays against contracts. Shows processing speed, violations flagged, audit count, and system load.',
    example: 'Live Monitor displays: "1,234 audited, 56 violations, 1,200 records/sec, 45% CPU".',
    relatedTerms: ['SSE', 'Real-time Streaming', 'Agent Pipeline'],
  },
  {
    id: 'kpi',
    term: 'KPI (Key Performance Indicator)',
    category: 'System & Technical',
    definition: 'Critical metrics displayed in the header: Total Contracts, Violations Found, Total Leakage ($), and Accuracy (%). Refreshes in real-time during and after audits.',
    example: 'KPIs show: "1,000 Contracts | 567 Violations | $500K Leakage | 95% Accuracy".',
    relatedTerms: ['Leakage Summary', 'Dashboard', 'Real-time'],
  },
  {
    id: 'real-time-streaming',
    term: 'Real-Time Streaming',
    category: 'System & Technical',
    definition: 'The platform\'s ability to push live updates to the UI as data is being processed. Enables watching audits unfold in real-time without refresh.',
    example: 'Watch violation counts increment live as the Agent Pipeline processes each contract.',
    relatedTerms: ['SSE', 'Live Monitor', 'Agent Trace'],
  },

  // === DATA ENTITIES ===
  {
    id: 'contract',
    term: 'Contract',
    category: 'Data Entities',
    definition: 'A licensing agreement defining royalty rates, territories, dates, thresholds, and payment obligations between studios and creators for digital content.',
    example: 'A contract specifies: Movie X, 15% royalty rate, US/EU territories, $5K min guarantee, 10k play tier threshold.',
    relatedTerms: ['Royalty', 'Territory', 'Audit Result'],
  },
  {
    id: 'streaming-log',
    term: 'Streaming Log',
    category: 'Data Entities',
    definition: 'A record of content play activity. Each log captures: content ID, country, timestamp, play count, user type (Premium/Free), and device type (Mobile/Desktop/TV).',
    example: 'Log entry: Movie X played 1,500 times in US by Premium users on Mobile.',
    relatedTerms: ['Play Count', 'Usage Data', 'Audit'],
  },
  {
    id: 'payment',
    term: 'Payment',
    category: 'Data Entities',
    definition: 'A financial transaction record showing the amount paid to creators/studios, date, and associated contract. Used in audits to compare against expected royalties.',
    example: 'Payment: $45,000 paid on 2024-04-10 for Contract C0001.',
    relatedTerms: ['Contract', 'Violation', 'Audit Result'],
  },
  {
    id: 'audit-result',
    term: 'Audit Result',
    category: 'Data Entities',
    definition: 'The outcome of auditing a single content piece against its contracts and payments. Shows expected vs actual payment and any violations found.',
    example: 'Audit Result: Movie X expected $50K, actual $45K, violation: $5K underpayment.',
    relatedTerms: ['Violation', 'Audit', 'Proof Hash'],
  },
  {
    id: 'studio',
    term: 'Studio',
    category: 'Data Entities',
    definition: 'The entity responsible for making royalty payments to creators. Examples: Warner Bros, Universal, Sony. Tracked for payment and violation analysis.',
    example: 'Studio "Warner Bros" underpaid $100K across 5 violations.',
    relatedTerms: ['Creator', 'Contract', 'Payment'],
  },
  {
    id: 'creator',
    term: 'Creator',
    category: 'Data Entities',
    definition: 'The content owner entitled to royalties. Examples: Production companies, artists, directors. Receives royalty payments per contract terms.',
    example: 'Creator "Universal Music" entitled to 15% royalties on all streams.',
    relatedTerms: ['Studio', 'Contract', 'Royalty'],
  },

  // === PLATFORM FEATURES ===
  {
    id: 'contracts-tab',
    term: 'Contracts Tab',
    category: 'Platform Features',
    definition: 'Upload and manage licensing agreements. Supports PDF parsing and ML summarization. Primary input for the audit pipeline.',
    example: 'Upload Movie License PDFs → System extracts royalty rates, territories, dates automatically.',
    relatedTerms: ['Agent Pipeline', 'Contract', 'Audit'],
  },
  {
    id: 'streaming-logs-tab',
    term: 'Streaming Logs Tab',
    category: 'Platform Features',
    definition: 'View real-time play activity data by country, user type, and device. Source data for royalty calculations.',
    example: 'See 1.5M plays of Movie X: US (600k), EU (500k), APAC (400k).',
    relatedTerms: ['Streaming Log', 'Usage Data', 'Audit'],
  },
  {
    id: 'payments-tab',
    term: 'Payments Tab',
    category: 'Platform Features',
    definition: 'Track all payments made to creators/studios. Compare payment records against contracts to identify discrepancies.',
    example: 'View and sync payment data from Stripe, verify amounts match contracts.',
    relatedTerms: ['Payment', 'Violation', 'Sync'],
  },
  {
    id: 'audit-results-tab',
    term: 'Audit Results Tab',
    category: 'Platform Features',
    definition: 'Detailed audit pipeline output. Shows expected vs actual payments, violations, and proof hashes for each content piece audited.',
    example: 'Full audit report: 1,234 content pieces audited, 567 violations found, 95% accuracy.',
    relatedTerms: ['Audit Result', 'Violation', 'Governance'],
  },
  {
    id: 'violations-tab',
    term: 'Violations Tab',
    category: 'Platform Features',
    definition: 'Detailed violation records with types (underpayment, overpayment, expired, territory), amounts, and AI explanations via "Ask AI".',
    example: 'See each violation: type, studio, contract, expected vs paid, difference amount.',
    relatedTerms: ['Violation', 'AI Insights', 'Ask AI'],
  },
  {
    id: 'leakage-summary-tab',
    term: 'Leakage Summary Tab',
    category: 'Platform Features',
    definition: 'KPI dashboard with rich analytics. Shows total leakage, violation counts, breakdown by type/studio, trends over time.',
    example: 'Dashboard shows: $500K total leakage, 35% underpayments, 20% territory violations, 45% overpayments.',
    relatedTerms: ['KPI', 'Leakage', 'Analytics'],
  },
  {
    id: 'agent-trace-tab',
    term: 'Agent Trace Tab',
    category: 'Platform Features',
    definition: 'Real-time visualization of the 8-agent pipeline execution. Shows each agent\'s status (PENDING/RUNNING/COMPLETE), actions, and findings.',
    example: 'Watch: Planner → Contract Reader (active) → Usage → ... as audit executes.',
    relatedTerms: ['Agent Pipeline', 'Real-time Streaming', 'Live Monitor'],
  },
  {
    id: 'governance-tab',
    term: 'Governance Tab',
    category: 'Platform Features',
    definition: 'Blockchain verification layer. View audit proof hashes and governance hashes stored on-chain. Verify audit trail and immutability.',
    example: 'Verify audit "AUDIT-123" with governance hash "def456..." on blockchain validators.',
    relatedTerms: ['Governance', 'Proof Hash', 'Blockchain'],
  },
  {
    id: 'connectors-tab',
    term: 'Connectors Tab',
    category: 'Platform Features',
    definition: 'Manage enterprise integrations: Stripe (payments), ERP, Banking, Blockchain. Monitor connection status and sync data.',
    example: 'Connect Stripe, sync latest payments → integrates automatically into audit cycle.',
    relatedTerms: ['Connector', 'Sync', 'Integration'],
  },
  {
    id: 'live-monitor-tab',
    term: 'Live Monitor Tab',
    category: 'Platform Features',
    definition: 'Continuous real-time engine showing: audited count, violations flagged, processing speed (rec/sec), CPU load. Toggle engine on/off.',
    example: 'Monitor shows: processing 1,200 records/sec, found 45 violations/sec, 50% CPU usage.',
    relatedTerms: ['Live Monitor', 'Real-time Streaming', 'Agent Pipeline'],
  },
  {
    id: 'ask-ai',
    term: 'Ask AI',
    category: 'Platform Features',
    definition: 'Row-level AI-powered explanations. Click "Ask AI" on any record to get an AI-generated explanation of why a violation exists or what data means.',
    example: 'Click "Ask AI" on a $5K underpayment → AI explains contract terms vs payment.',
    relatedTerms: ['AI Insights', 'Violation', 'Chat Recommendations'],
  },
  {
    id: 'chat-history',
    term: 'Chat History',
    category: 'Platform Features',
    definition: 'Stores and displays previous queries and responses. Access by clicking the clock icon in the search bar. Persists across page refreshes.',
    example: 'Previous queries: "Top violations by studio", "Payment discrepancies Q1", auto-saved for later.',
    relatedTerms: ['Ask AI', 'Chat Recommendations'],
  },
  {
    id: 'chat-recommendations',
    term: 'Chat Recommendations',
    category: 'Platform Features',
    definition: 'Context-aware AI suggestions based on the currently active tab. Click search bar to see smart recommendation queries.',
    example: 'On Violations tab: "High-risk patterns", "Top studios by leakage".',
    relatedTerms: ['Ask AI', 'Chat History'],
  },
  {
    id: 'run-audit',
    term: 'Run Audit',
    category: 'Platform Features',
    definition: 'Initiates the complete 8-agent pipeline. Analyzes all contracts against payments and usage data in real-time. Updates KPIs as violations are found.',
    example: 'Click "Run Audit" → Watch Agent Trace execute → KPIs update live → Toast shows final results.',
    relatedTerms: ['Agent Pipeline', 'Audit', 'Agent Trace'],
  },
];

export function GlossaryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when tab or category changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [selectedCategory, showOverview]);

  const categories = Array.from(new Set(glossaryTerms.map(t => t.category)));

  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter(term => {
      const matchesSearch =
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (term.example?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesCategory = !selectedCategory || term.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const toggleTerm = (id: string) => {
    const newExpanded = new Set(expandedTerms);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTerms(newExpanded);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Core Concepts': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Financial Terms': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'System & Technical': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Data Entities': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Platform Features': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    };
    return colors[category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-shrink-0 pb-6 border-b border-rg-border-default"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-gold/20">
            <BookOpen className="w-5 h-5 text-rg-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-rg-text-primary">Platform Glossary</h2>
            <p className="text-sm text-rg-text-secondary mt-1">
              Clear definitions of key terms used across RoyalGuard AI
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {!showOverview && (
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rg-text-tertiary" />
            <input
              type="text"
              placeholder="Search terms, definitions, examples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-rg-bg-tertiary border border-rg-border-default text-rg-text-primary placeholder-rg-text-tertiary focus:outline-none focus:ring-2 focus:ring-rg-gold/50 transition-all"
            />
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <motion.button
            onClick={() => {
              setShowOverview(true);
              setSelectedCategory(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showOverview
                ? 'bg-rg-gold text-rg-bg-deep'
                : 'bg-rg-bg-tertiary text-rg-text-secondary hover:bg-rg-bg-elevated'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Platform Overview
          </motion.button>
          <motion.button
            onClick={() => {
              setShowOverview(false);
              setSelectedCategory(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !showOverview && selectedCategory === null
                ? 'bg-rg-gold text-rg-bg-deep'
                : 'bg-rg-bg-tertiary text-rg-text-secondary hover:bg-rg-bg-elevated'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All Terms
          </motion.button>
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => {
                setShowOverview(false);
                setSelectedCategory(category);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                !showOverview && selectedCategory === category
                  ? getCategoryColor(category)
                  : 'bg-rg-bg-tertiary text-rg-text-secondary hover:bg-rg-bg-elevated border-rg-border-default'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Terms List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-6">
        {showOverview ? (
          // Platform Overview Section
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pr-4"
          >
            {/* Welcome Section */}
            <div className="rounded-lg border border-rg-border-default bg-gradient-to-br from-rg-gold/5 to-transparent p-8">
              <h2 className="text-3xl font-bold text-rg-gold mb-3">RoyalGuard AI</h2>
              <p className="text-rg-text-secondary leading-relaxed text-base">
                An autonomous audit and compliance engine designed to detect financial leakage, contractual violations, and compliance risks in the digital content licensing industry. Automatically audits royalty payments across thousands of content licenses using advanced multi-agent AI orchestration.
              </p>
            </div>

            {/* Core Mission */}
            <div className="rounded-lg border border-rg-border-default p-8">
              <h3 className="text-xl font-semibold text-rg-text-primary mb-6">Core Mission</h3>
              <div className="space-y-3 text-sm text-rg-text-secondary">
                <div className="flex items-start gap-4">
                  <div className="w-1 h-1 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">Automatic Auditing</span> - Continuously audit contracts against payments</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1 h-1 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">Violation Detection</span> - Identify underpayments, overpayments, and compliance breaches</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1 h-1 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">Financial Analysis</span> - Calculate leakage and quantify financial losses</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1 h-1 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">Real-Time Monitoring</span> - Live streaming audit engine with continuous processing</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1 h-1 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">Blockchain Verification</span> - Immutable audit proofs stored on-chain for verification</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1 h-1 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">AI-Powered Insights</span> - 8-agent pipeline for comprehensive analysis and reasoning</span>
                </div>
              </div>
            </div>

            {/* Complete Workflow */}
            <div className="rounded-lg border border-rg-border-default p-8">
              <h3 className="text-xl font-semibold text-rg-text-primary mb-8">Complete Workflow</h3>
              <div className="space-y-6">
                <div className="space-y-6">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rg-gold/20 flex items-center justify-center text-rg-gold font-bold text-lg">1</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-rg-text-primary mb-2 text-base">Upload Contracts</h4>
                      <p className="text-sm text-rg-text-secondary leading-relaxed">Upload PDF licensing agreements or ingest via API. System automatically extracts royalty rates, territories, dates, and tier thresholds using machine learning.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rg-gold/20 flex items-center justify-center text-rg-gold font-bold text-lg">2</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-rg-text-primary mb-2 text-base">Ingest Streaming Data</h4>
                      <p className="text-sm text-rg-text-secondary leading-relaxed">System receives play activity data. Each log captures content ID, country, play counts, user type (Premium/Free), and device type (Mobile/Desktop/TV).</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rg-gold/20 flex items-center justify-center text-rg-gold font-bold text-lg">3</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-rg-text-primary mb-2 text-base">Sync Payments</h4>
                      <p className="text-sm text-rg-text-secondary leading-relaxed">Connect to Stripe, ERP, banking systems. Sync payment records. Platform reconciles payments against expected royalties based on contract terms.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rg-gold/20 flex items-center justify-center text-rg-gold font-bold text-lg">4</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-rg-text-primary mb-2 text-base">Execute Audit Pipeline</h4>
                      <p className="text-sm text-rg-text-secondary leading-relaxed mb-3">Click "Run Audit" to execute the 8-agent pipeline. Watch in real-time as agents execute sequentially:</p>
                      <div className="pl-4 space-y-1.5 text-xs text-rg-text-secondary font-medium">
                        <div>1. Planner Agent - Orchestrates and coordinates workflow</div>
                        <div>2. Contract Reader - Extracts terms and royalty rates</div>
                        <div>3. Usage Agent - Aggregates play counts by territory</div>
                        <div>4. Royalty Agent - Calculates expected payments</div>
                        <div>5. Ledger Agent - Reconciles expected vs actual</div>
                        <div>6. Audit Agent - Identifies discrepancies</div>
                        <div>7. Violation Agent - Classifies violation types</div>
                        <div>8. Reporter Agent - Generates summary and recommendations</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rg-gold/20 flex items-center justify-center text-rg-gold font-bold text-lg">5</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-rg-text-primary mb-2 text-base">Review Results</h4>
                      <p className="text-sm text-rg-text-secondary leading-relaxed">KPIs update live during execution. View violations, leakage totals, and audit results. Use "Ask AI" for explanations on any record.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rg-gold/20 flex items-center justify-center text-rg-gold font-bold text-lg">6</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-rg-text-primary mb-2 text-base">Verify on Blockchain</h4>
                      <p className="text-sm text-rg-text-secondary leading-relaxed">Audit results are hashed and stored on blockchain validators. Use Governance tab to verify proof hashes for authenticity and immutability.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Tabs Explained */}
            <div className="rounded-lg border border-rg-border-default p-8">
              <h3 className="text-xl font-semibold text-rg-text-primary mb-8">Navigation Tabs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Contracts</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">Upload and manage licensing agreements. Source data for audit execution.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Streaming Logs</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">View play activity data by country, user type, and device type.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Payments</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">Track and manage all payment records. Sync from Stripe, ERP, and banking systems.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Audit Results</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">Complete pipeline output. Shows expected vs actual payment for each content piece.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Violations</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">Detailed violation records with types and amounts. Click "Ask AI" for explanations.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Leakage Summary</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">KPI dashboard with charts and comprehensive financial analytics.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Agent Trace</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">Real-time visualization of 8-agent pipeline execution and progress.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Governance</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">Blockchain verification layer. View and verify immutable audit proofs.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Connectors</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">Enterprise integrations with Stripe, ERP, Banking, and Blockchain systems.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Live Monitor</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">Real-time engine statistics including audited count, violations, and performance metrics.</p>
                </div>
                <div className="p-4 rounded-lg bg-rg-bg-tertiary/50 border border-rg-border-default hover:border-rg-gold/50 transition-all">
                  <p className="font-semibold text-rg-gold mb-2">Chat Features</p>
                  <p className="text-xs text-rg-text-secondary leading-relaxed">AI-powered search, query history, and smart recommendations by context.</p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="rounded-lg border border-rg-border-default p-8">
              <h3 className="text-xl font-semibold text-rg-text-primary mb-6">Platform Capabilities</h3>
              <div className="space-y-4 text-sm text-rg-text-secondary">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">Real-Time Streaming</span> - Server-Sent Events (SSE) enable live progress updates during audits without refresh</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">8-Agent AI Pipeline</span> - Multi-stage orchestrated workflow for comprehensive and deep analysis</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">Rich Analytics</span> - Interactive KPIs, charts, trend analysis, and visualization</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">Enterprise Connectors</span> - Stripe, ERP, Banking, Blockchain integrations</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">Blockchain Governance</span> - Immutable audit proofs stored on-chain with verification</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-rg-gold mt-2 flex-shrink-0" />
                  <span><span className="font-semibold text-rg-text-primary">AI-Powered Insights</span> - "Ask AI" button on any row for instant explanations</span>
                </div>
              </div>
            </div>

            {/* Getting Started */}
            <div className="rounded-lg border border-rg-border-default p-8 bg-gradient-to-br from-rg-gold/5 to-transparent">
              <h3 className="text-xl font-semibold text-rg-gold mb-6">Getting Started</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-rg-gold min-w-fit">Step 1:</span>
                  <span className="text-rg-text-secondary">Start by uploading contracts or using sample data provided</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-rg-gold min-w-fit">Step 2:</span>
                  <span className="text-rg-text-secondary">Click "LOAD DATA" to ingest streaming logs and payment records</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-rg-gold min-w-fit">Step 3:</span>
                  <span className="text-rg-text-secondary">Click "RUN AUDIT" to execute the full 8-agent pipeline</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-rg-gold min-w-fit">Step 4:</span>
                  <span className="text-rg-text-secondary">Watch Agent Trace to monitor real-time pipeline progress</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-rg-gold min-w-fit">Step 5:</span>
                  <span className="text-rg-text-secondary">View Live Monitor for continuous audit engine statistics</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-rg-gold min-w-fit">Step 6:</span>
                  <span className="text-rg-text-secondary">Use Chat History (clock icon) to re-run previous queries</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-rg-gold min-w-fit">Step 7:</span>
                  <span className="text-rg-text-secondary">Click "Ask AI" on any record for AI-powered explanations</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-rg-gold min-w-fit">Step 8:</span>
                  <span className="text-rg-text-secondary">Check Governance tab to verify blockchain audit proofs</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : filteredTerms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-64 text-center"
          >
            <BookOpen className="w-12 h-12 text-rg-text-tertiary mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-rg-text-secondary mb-2">No terms found</h3>
            <p className="text-sm text-rg-text-tertiary">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3 pr-4">
            {filteredTerms.map((term, index) => (
              <motion.div
                key={term.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border border-rg-border-default hover:border-rg-gold/50 transition-all"
              >
                <motion.button
                  onClick={() => toggleTerm(term.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-rg-bg-tertiary/50 transition-colors text-left"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-rg-text-primary">
                        {term.term}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(term.category)}`}>
                        {term.category}
                      </span>
                    </div>
                    <p className="text-sm text-rg-text-secondary line-clamp-1">
                      {term.definition}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedTerms.has(term.id) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 ml-4"
                  >
                    <ChevronDown className="w-5 h-5 text-rg-text-tertiary" />
                  </motion.div>
                </motion.button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedTerms.has(term.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 border-t border-rg-border-default bg-rg-bg-tertiary/30 space-y-3">
                        {/* Full Definition */}
                        <div>
                          <h4 className="text-xs uppercase font-semibold text-rg-text-secondary mb-1 tracking-wider">
                            Definition
                          </h4>
                          <p className="text-sm text-rg-text-primary leading-relaxed">
                            {term.definition}
                          </p>
                        </div>

                        {/* Example */}
                        {term.example && (
                          <div>
                            <h4 className="text-xs uppercase font-semibold text-rg-text-secondary mb-1 tracking-wider">
                              Example
                            </h4>
                            <div className="p-2.5 rounded bg-rg-bg-deep border border-rg-border-default">
                              <p className="text-sm text-rg-text-primary font-mono">
                                {term.example}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Related Terms */}
                        {term.relatedTerms && term.relatedTerms.length > 0 && (
                          <div>
                            <h4 className="text-xs uppercase font-semibold text-rg-text-secondary mb-2 tracking-wider">
                              Related Terms
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {term.relatedTerms.map((relatedTerm) => (
                                <motion.button
                                  key={relatedTerm}
                                  onClick={() => {
                                    const foundTerm = glossaryTerms.find(
                                      (t) =>
                                        t.term.toLowerCase() === relatedTerm.toLowerCase()
                                    );
                                    if (foundTerm) {
                                      setSearchTerm(relatedTerm);
                                      if (!expandedTerms.has(foundTerm.id)) {
                                        toggleTerm(foundTerm.id);
                                      }
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-md bg-rg-gold/10 hover:bg-rg-gold/20 text-xs text-rg-gold font-medium border border-rg-gold/30 transition-all"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {relatedTerm}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-shrink-0 py-4 px-4 border-t border-rg-border-default bg-rg-bg-tertiary/30 rounded-lg text-sm text-rg-text-secondary"
      >
        <p>
          {showOverview ? (
            <span><span className="font-semibold text-rg-gold">Platform Overview</span> - Complete workflow guide</span>
          ) : (
            <>
              <span className="font-semibold text-rg-text-primary">{filteredTerms.length}</span> terms
              {selectedCategory && ` in "${selectedCategory}"`}
              {searchTerm && ` matching "${searchTerm}"`}
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
