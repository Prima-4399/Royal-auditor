import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, Bell, Copy, CheckCircle2, Clock, Sun, Moon } from 'lucide-react';
import { api } from '@/lib/api';
import { NotificationPopover } from './NotificationPopover';
import { ChatHistory, type ChatHistoryItem } from './ChatHistory';
import { ChatRecommendations } from './ChatRecommendations';
import { useTheme } from '@/contexts/ThemeContext';

/* ── Theme Toggle Button ── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="relative p-2.5 rounded-rg-md transition-all duration-300 text-rg-text-muted hover:text-rg-gold hover:bg-rg-gold/10"
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Moon className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sun className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

interface TopbarProps {
  activeTabLabel: string;
  onLoadData: () => void;
  onRunAudit: () => void;
  isLoadingData: boolean;
  isRunningAudit: boolean;
  loadProgress: { step: string; progress: number } | null;
  externalQuery?: string | null;
  onExternalQueryHandled?: () => void;
}

export function Topbar({
  activeTabLabel,
  onLoadData,
  onRunAudit,
  isLoadingData,
  isRunningAudit,
  loadProgress,
  externalQuery,
  onExternalQueryHandled,
}: TopbarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close chat history & recommendations when clicking outside the search area
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsHistoryOpen(false);
        setIsRecommendationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem('rg-chat-history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setChatHistory(parsed);
          }
        }
      } catch (err) {
        console.error('[ChatHistory] Failed to load from localStorage:', err);
      }
    };
    
    // Use setTimeout to ensure DOM is ready
    loadHistory();
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    try {
      if (chatHistory.length > 0) {
        localStorage.setItem('rg-chat-history', JSON.stringify(chatHistory));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        console.warn('[ChatHistory] localStorage quota exceeded, clearing old entries');
        try {
          localStorage.setItem('rg-chat-history', JSON.stringify(chatHistory.slice(0, 10)));
        } catch (e) {
          console.error('[ChatHistory] Failed to save even with reduced history:', e);
        }
      } else {
        console.error('[ChatHistory] Failed to save to localStorage:', err);
      }
    }
  }, [chatHistory]);

  // Close overlays on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHistoryOpen(false);
        setIsRecommendationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);


  // Copy text to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Add to chat history
  const addToHistory = useCallback((query: string, response: string) => {
    const newItem: ChatHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      query,
      response,
      timestamp: Date.now(),
    };
    
    // Keep only the latest 20 queries
    setChatHistory((prev) => [newItem, ...prev].slice(0, 20));
  }, []);

  // Clear all chat history
  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    localStorage.removeItem('rg-chat-history');
  }, []);

  // Core streaming function — shared by manual submit and external (row-level) triggers
  const submitQuery = async (q: string) => {
    if (!q || isTyping) return;

    setShowResponse(true);
    setIsTyping(true);
    setDisplayedText('');
    abortRef.current = false;

    try {
      let accumulated = '';
      for await (const token of api.streamExplain(q)) {
        if (abortRef.current) break;
        accumulated += token;
        setDisplayedText(accumulated);
      }
      
      // Save to history only after response is complete
      if (accumulated && !abortRef.current) {
        addToHistory(q, accumulated);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setDisplayedText(`Error: ${errorMsg}`);
    } finally {
      setIsTyping(false);
    }
  };

  // Close dropdowns when response appears
  useEffect(() => {
    if (showResponse) {
      setIsHistoryOpen(false);
      setIsRecommendationsOpen(false);
    }
  }, [showResponse]);

  // Auto-submit when a tab row triggers an AI query programmatically
  useEffect(() => {
    if (externalQuery && !isTyping) {
      setSearchValue(externalQuery);
      onExternalQueryHandled?.();
      setTimeout(() => submitQuery(externalQuery), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery]);

  const handleSubmit = () => {
    submitQuery(searchValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleInputFocus = () => {
    if (!showResponse && searchValue === '') {
      setIsHistoryOpen(false);
      setIsRecommendationsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    // Close both dropdowns when user starts typing
    setIsHistoryOpen(false);
    setIsRecommendationsOpen(false);
  };

  const handleHistoryClick = () => {
    setIsRecommendationsOpen(false);
    setIsHistoryOpen(!isHistoryOpen);
  };

  const closeResponse = () => {
    abortRef.current = true;
    setShowResponse(false);
    setDisplayedText('');
    setSearchValue('');
    setIsTyping(false);
    setIsHistoryOpen(false);
    setIsRecommendationsOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="h-[72px] flex items-center px-6 border-b border-rg-border-default bg-rg-bg-primary/50 backdrop-blur-xl sticky top-0 z-40"
    >
      {/* Left - Tab Name */}
      <div className="w-[240px]">
        <motion.span
          key={activeTabLabel}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[12px] text-rg-text-muted uppercase tracking-[0.2em] font-semibold"
        >
          {activeTabLabel}
        </motion.span>
      </div>

      {/* Center - Search Input with Dropdowns */}
      <div ref={searchContainerRef} className="flex-1 flex flex-col justify-center max-w-2xl relative">
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-gold rounded-rg-lg opacity-0 group-focus-within:opacity-30 blur transition-opacity duration-300" />

          <div className="relative flex items-center">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rg-gold/60" />
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder="Ask about any violation..."
              className="w-full bg-rg-bg-card border border-rg-border-default rounded-rg-lg pl-12 pr-24 py-3 text-[14px] font-mono text-rg-text-primary placeholder:text-rg-text-muted focus:outline-none focus:border-rg-gold/50 transition-all duration-300"
            />

            {/* History & Keyboard Shortcut */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleHistoryClick}
                className={`p-1.5 rounded transition-colors ${
                  isHistoryOpen
                    ? 'text-rg-gold bg-rg-gold/10'
                    : 'text-rg-text-muted hover:text-rg-gold hover:bg-rg-bg-tertiary'
                }`}
                title="Chat history"
              >
                <Clock className="w-4 h-4" />
              </motion.button>

              <kbd className="px-2 py-0.5 text-[10px] text-rg-text-muted bg-rg-bg-tertiary rounded border border-rg-border-default">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Chat History Dropdown */}
          <ChatHistory
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            history={chatHistory}
            onSelectQuery={(query) => {
              setIsHistoryOpen(false);
              setIsRecommendationsOpen(false);
              setSearchValue(query);
              setTimeout(() => submitQuery(query), 50);
            }}
            onClearHistory={clearChatHistory}
          />

          {/* Chat Recommendations Dropdown */}
          <ChatRecommendations
            isOpen={isRecommendationsOpen}
            activeTab={activeTabLabel}
            onClose={() => setIsRecommendationsOpen(false)}
            onSelectQuery={(query) => {
              setIsHistoryOpen(false);
              setIsRecommendationsOpen(false);
              setSearchValue(query);
              setTimeout(() => submitQuery(query), 50);
            }}
          />

          {/* NL Query Response Panel */}
          <AnimatePresence>
            {showResponse && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+12px)] left-0 right-0 z-50"
              >
              <div className="glass-card rounded-rg-lg overflow-hidden shadow-rg-lg">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-rg-border-default bg-gradient-gold/5">
                  <Sparkles className="w-4 h-4 text-rg-gold" />
                  <span className="text-[11px] uppercase text-rg-gold tracking-wider font-semibold">
                    AI Analysis
                  </span>
                  <div className="flex-1" />
                  
                  {/* Copy Button */}
                  <motion.button
                    onClick={handleCopy}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1.5 hover:bg-rg-gold/10 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copyFeedback ? (
                      <CheckCircle2 className="w-4 h-4 text-rg-gold animate-pulse" />
                    ) : (
                      <Copy className="w-4 h-4 text-rg-text-muted hover:text-rg-gold" />
                    )}
                  </motion.button>

                  <button
                    onClick={closeResponse}
                    className="p-1.5 hover:bg-rg-bg-tertiary rounded-lg transition-colors ml-1"
                  >
                    <X className="w-4 h-4 text-rg-text-muted" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {displayedText ? (
                    <div className="space-y-4">
                      {displayedText.split('\n').map(line => line.trim()).filter(Boolean).map((line, idx) => {
                        // Force strip any markdown bolding symbols and clean up
                        const cleanText = line.replace(/\*\*/g, '');
                        
                        // Handle potential merged numbered items (e.g., "6. Text 7. More Text")
                        // This regex looks for digits followed by a period after a space
                        const hasMergedNumber = /(?<!^)\s+(\d+\.)\s+/.test(cleanText);
                        
                        if (hasMergedNumber) {
                          // Split merged line into sub-lines: "6. Text", "7. More Text"
                          const segments = cleanText.split(/\s+(?=\d+\.)/).filter(Boolean);
                          return (
                            <div key={idx} className="space-y-2 mb-2">
                              {segments.map((seg, sIdx) => {
                                const numMatch = seg.match(/^\d+/);
                                const number = numMatch ? numMatch[0] + '.' : '';
                                const content = seg.replace(/^\d+[\s.)\-]\s*/, '').trim();
                                return (
                                  <div key={sIdx} className="flex gap-3 text-[14px] font-mono leading-relaxed items-start">
                                    <span className="font-bold text-rg-gold min-w-[24px] shrink-0 font-mono">
                                      {number}
                                    </span>
                                    <span className="text-rg-text-primary font-mono flex-1">
                                      {content}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        // Questions/important lines get gold color
                        if (cleanText.endsWith('?')) {
                          return (
                            <p key={idx} className="text-[15px] font-mono font-medium text-rg-gold leading-relaxed mb-2">
                              {cleanText}
                            </p>
                          );
                        }
                        
                        // Standard Numbered items (at start of line)
                        if (/^\d+[\s.)\-]/.test(cleanText)) {
                          const numMatch = cleanText.match(/^\d+/);
                          const number = numMatch ? numMatch[0] + '.' : '';
                          const content = cleanText.replace(/^\d+[\s.)\-]\s*/, '').trim();
                          
                          return (
                            <div key={idx} className="flex gap-3 text-[14px] font-mono leading-relaxed mb-2 items-start">
                              <span className="font-bold text-rg-gold min-w-[24px] shrink-0 font-mono">
                                {number}
                              </span>
                              <span className="text-rg-text-primary font-mono flex-1">
                                {content}
                              </span>
                            </div>
                          );
                        }
                        
                        // Regular paragraphs
                        return (
                          <p key={idx} className="text-[14px] text-rg-text-primary font-mono leading-relaxed mb-3 max-w-[90%]">
                            {cleanText}
                          </p>
                        );
                      })}
                      
                      {isTyping && (
                        <motion.span
                          className="inline-block w-2 h-4 bg-rg-gold ml-1"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-rg-border-default bg-rg-bg-tertiary/50">
                  <span className="text-[10px] text-rg-text-muted">
                    Generated by RoyalGuard AI • Powered by LLM
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load Data Progress */}
        <AnimatePresence>
          {isLoadingData && loadProgress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[calc(100%+12px)] left-0 right-0 z-50"
            >
              <div className="glass-card rounded-rg-lg overflow-hidden shadow-rg-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-rg-gold animate-spin" />
                      <span className="text-[13px] text-rg-text-secondary">{loadProgress.step}</span>
                    </div>
                    <span className="text-[14px] font-mono text-rg-gold font-semibold">
                      {loadProgress.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-rg-bg-tertiary rounded-full overflow-hidden progress-bar-glow">
                    <motion.div
                      className="h-full bg-gradient-gold rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${loadProgress.progress}%` }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3 ml-auto pl-4 flex-shrink-0">
        {/* Load Data Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLoadData}
          disabled={isLoadingData || isRunningAudit}
          className="px-5 py-2.5 bg-rg-bg-card border border-rg-border-default rounded-rg-md text-[12px] uppercase tracking-wider font-semibold text-rg-text-secondary hover:border-rg-border-highlight hover:text-rg-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isLoadingData ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading
            </span>
          ) : (
            'Load Data'
          )}
        </motion.button>

        {/* Run Audit Button */}
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255, 184, 0, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onRunAudit}
          disabled={isLoadingData || isRunningAudit}
          className="px-5 py-2.5 bg-gradient-gold text-rg-bg-deep rounded-rg-md text-[12px] uppercase tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shine-effect"
        >
          {isRunningAudit ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Running
            </span>
          ) : (
            'Run Audit'
          )}
        </motion.button>

        {/* Divider */}
        <div className="w-px h-8 bg-rg-border-default mx-2" />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Icon Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2.5 rounded-rg-md transition-all duration-300 ${
              isNotificationsOpen 
                ? 'text-rg-gold bg-rg-gold/10' 
                : 'text-rg-text-muted hover:text-rg-text-primary hover:bg-rg-bg-card'
            }`}
          >
            <Bell className="w-5 h-5" />
          </motion.button>
          
          <NotificationPopover 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)} 
          />
        </div>

        {/* User Avatar */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-9 h-9 rounded-rg-md bg-gradient-gold flex items-center justify-center cursor-pointer"
        >
          <span className="text-rg-bg-deep font-bold text-sm">RG</span>
        </motion.div>
      </div>
    </motion.header>
  );
}
