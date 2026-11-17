import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  RotateCcw, 
  Package, 
  AlertTriangle, 
  Clock, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Zap,
  Activity,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { useForgeflowStore } from '../../store/useForgeflowStore';
import { ROLE_CONFIGS, OperatorRole } from '../../auth/permissions';
import { 
  askShopfloorCopilot, 
  CopilotResponse, 
  AiMode 
} from '../../api/forgeAiService';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'FORGE_AI';
  text: string;
  timestamp: string;
  meta?: {
    mode: AiMode;
    latencyMs: number;
    offlineReason?: string;
  };
  suggestedActions?: { label: string; targetPath?: string; actionKey?: string }[];
}

const QUICK_PROMPTS = [
  {
    icon: Package,
    label: 'Which SKUs are below safety buffer?',
    prompt: 'Which SKUs are below safety buffer?'
  },
  {
    icon: AlertTriangle,
    label: 'Summarize open Quality RMAs',
    prompt: 'Summarize open Quality RMAs'
  },
  {
    icon: Clock,
    label: 'Generate current shift handover brief',
    prompt: 'Generate current shift handover brief'
  },
  {
    icon: Layers,
    label: 'Identify work order bottlenecks',
    prompt: 'Identify work order bottlenecks'
  }
];

export const ForgeAiCopilotDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isAiCopilotOpen, 
    setAiCopilotOpen, 
    operator,
    setLogMovementOpen,
    setNewQualityRmaOpen
  } = useForgeflowStore();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMode, setLastMode] = useState<AiMode>('OFFLINE_HEURISTIC_FALLBACK');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const roleConfig = ROLE_CONFIGS[operator?.role as OperatorRole];

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'FORGE_AI',
          text: `### 🤖 Welcome to ForgeAI Shopfloor Copilot\n\n` +
            `Standing by to assist **${operator?.name || 'Plant Supervisor'}** (${roleConfig?.displayName || operator?.role || 'Operations'}).\n\n` +
            `I continuously monitor live telemetry, production work orders, raw steel inventory buffers, and quality discrepancy RMAs.\n\n` +
            `* Ask natural language questions about floor operations.\n` +
            `* Tap one of the **quick prompt chips** below to test real-time intelligence.\n` +
            `* Dual-mode architecture automatically switches between **Gemini Cloud AI** and **Air-Gapped Deterministic Heuristic Engine**.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          meta: {
            mode: 'OFFLINE_HEURISTIC_FALLBACK',
            latencyMs: 12
          }
        }
      ]);
    }
  }, [operator, roleConfig]);

  // Focus input when opened & handle Escape key
  useEffect(() => {
    if (isAiCopilotOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAiCopilotOpen) {
        setAiCopilotOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiCopilotOpen, setAiCopilotOpen]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isAiCopilotOpen) return null;

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response: CopilotResponse = await askShopfloorCopilot(text);
      setLastMode(response.meta.mode);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'FORGE_AI',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: response.meta,
        suggestedActions: response.suggestedActions
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'FORGE_AI',
        text: `Unable to complete analysis. System status: Standby.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: {
          mode: 'OFFLINE_HEURISTIC_FALLBACK',
          latencyMs: 0
        }
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; targetPath?: string; actionKey?: string }) => {
    if (action.actionKey === 'LOG_INWARD') {
      setLogMovementOpen(true);
      navigate('/inventory');
      setAiCopilotOpen(false);
      return;
    }
    if (action.actionKey === 'NEW_RMA') {
      setNewQualityRmaOpen(true);
      navigate('/quality-returns');
      setAiCopilotOpen(false);
      return;
    }
    if (action.targetPath) {
      navigate(action.targetPath);
      setAiCopilotOpen(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'FORGE_AI',
        text: `### 🤖 Conversation Reset\n\nForgeAI Copilot memory cleared. Ready for your next shopfloor query, **${operator?.name || 'Supervisor'}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: {
          mode: lastMode,
          latencyMs: 8
        }
      }
    ]);
  };

  // Helper to render markdown bullets & headings cleanly
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={i} className="h-2" />;
      }

      // H3 Heading ###
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={i} className="text-xs sm:text-sm font-bold text-foreground mt-2 mb-1 flex items-center gap-1.5 font-mono">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }

      // Bullet points * or -
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const content = trimmed.substring(2);
        return (
          <div key={i} className="flex items-start gap-2 my-1 text-xs text-foreground/90 leading-relaxed pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span>{renderInlineFormatting(content)}</span>
          </div>
        );
      }

      // Numbered lists e.g. 1. 2.
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={i} className="flex items-start gap-2 my-1 text-xs text-foreground/90 leading-relaxed pl-1">
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1 rounded shrink-0">
              {numMatch[1]}
            </span>
            <span>{renderInlineFormatting(numMatch[2])}</span>
          </div>
        );
      }

      // Regular paragraph
      return (
        <p key={i} className="text-xs text-foreground/90 leading-relaxed my-1">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    });
  };

  // Parse **bold** within strings
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Frosted Translucent Backdrop Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setAiCopilotOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside 
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] max-w-full bg-card/95 dark:bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-label="ForgeAI Shopfloor Copilot"
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-primary to-cyan-500 p-0.5 shadow-sm">
              <div className="w-full h-full bg-card rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-foreground tracking-tight flex items-center gap-1.5 font-mono">
                  FORGE<span className="text-primary font-sans font-bold">AI</span> COPILOT
                </h3>
                {/* Engine Mode Pill */}
                {lastMode === 'LIVE_AI' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Gemini Live
                  </span>
                ) : (
                  <span 
                    title="Air-gapped deterministic heuristic analyzer active"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                  >
                    <Cpu className="w-3 h-3" />
                    Demo Heuristic Mode
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                Autonomous MOM / MES Intelligence Layer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={resetChat}
              title="Reset conversation"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAiCopilotOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Role & Context Ribbon */}
        <div className="px-4 py-2 bg-muted/20 border-b border-border/60 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-foreground font-semibold truncate">{operator?.name}</span>
            <span className="text-muted-foreground text-[10px] truncate">({roleConfig?.displayName || operator?.role})</span>
          </div>
          <span className="text-cyan-600 dark:text-cyan-400 text-[10px] font-bold shrink-0">
            Shift-A Floor Sync
          </span>
        </div>

        {/* Quick Prompts Carousel / Grid */}
        <div className="p-3 bg-muted/15 border-b border-border/50">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Suggested Operational Inquiries:
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map((qp, idx) => {
              const Icon = qp.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(qp.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-2 p-2 rounded-xl bg-card hover:bg-muted border border-border/80 hover:border-primary/50 text-left transition-all active:scale-98 group shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] text-foreground font-medium line-clamp-2 leading-tight">
                    {qp.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-card/60">
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <div 
                key={msg.id}
                className={`flex gap-2.5 max-w-[92%] sm:max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                  isUser 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'bg-gradient-to-tr from-amber-500/20 via-primary/20 to-cyan-500/20 text-primary border border-border'
                }`}>
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4 text-primary" />}
                </div>

                {/* Message Body */}
                <div className={`flex flex-col space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl p-3.5 text-xs shadow-2xs ${
                    isUser 
                      ? 'bg-primary text-primary-foreground rounded-tr-none font-medium' 
                      : 'bg-muted/60 dark:bg-muted/40 border border-border/80 text-foreground rounded-tl-none backdrop-blur-sm'
                  }`}>
                    {isUser ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}

                    {/* Quick Action Navigation Buttons */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleActionClick(act)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background hover:bg-card border border-border text-[11px] font-mono font-semibold text-primary hover:text-primary transition-all active:scale-95 shadow-2xs"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata & Timestamp */}
                  <div className="flex items-center gap-2 px-1 text-[10px] font-mono text-muted-foreground">
                    <span>{msg.timestamp}</span>
                    {msg.meta && (
                      <>
                        <span>•</span>
                        <span className={`font-semibold ${msg.meta.mode === 'LIVE_AI' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {msg.meta.mode === 'LIVE_AI' ? 'Gemini 2.5 Flash' : 'Heuristic Engine'}
                        </span>
                        <span>•</span>
                        <span>{msg.meta.latencyMs}ms</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="flex gap-2.5 max-w-[85%] mr-auto animate-fade-in">
              <div className="w-7 h-7 rounded-xl bg-primary/20 text-primary border border-border flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-none p-3.5 bg-muted/60 border border-border/80 text-xs w-64 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground font-mono text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Synthesizing plant context...</span>
                </div>
                <div className="h-2.5 bg-muted rounded animate-pulse w-5/6" />
                <div className="h-2.5 bg-muted rounded animate-pulse w-full" />
                <div className="h-2.5 bg-muted rounded animate-pulse w-3/4" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar Form */}
        <div className="p-3.5 border-t border-border bg-muted/40">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask ForgeAI about stock, RMAs, work orders, bottlenecks..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isLoading}
                className="w-full pl-3.5 pr-3 py-2.5 text-xs bg-card border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20 transition-all active:scale-95 shrink-0"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] font-mono text-muted-foreground">
            <span>Press Enter to analyze</span>
            <span>ForgeAI v2.0 • Autonomous Manufacturing Core</span>
          </div>
        </div>
      </aside>
    </>
  );
};
