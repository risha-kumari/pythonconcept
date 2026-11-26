import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  RotateCcw,
  MessageSquare,
  Code2,
  Zap,
  AlertCircle,
  Square,
  Copy,
  Check,
  ArrowUpRight,
  Globe,
  ExternalLink,
} from 'lucide-react';

export type ChatbotRole = 'tutor' | 'debugger' | 'quizmaster';

interface GroundingSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  streaming?: boolean;
  sources?: GroundingSource[];
}

function isSafeWebUrl(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface CodeBuddyChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  syntaxSummary: string;
  onApplyCode?: (snippet: string) => void;
}

const ROLE_OPTIONS: { id: ChatbotRole; label: string; hint: string }[] = [
  {
    id: 'tutor',
    label: 'Python Tutor',
    hint: 'Explains logic, variables, and loops step by step in plain English.',
  },
  {
    id: 'debugger',
    label: 'Syntax Coach',
    hint: 'Spots missing colons, indentation issues, quotes, and typos fast.',
  },
  {
    id: 'quizmaster',
    label: 'Practice Coach',
    hint: 'Asks quick check-in questions and gives hints before answers.',
  },
];

const STARTER_PROMPTS: Record<ChatbotRole, string[]> = {
  tutor: [
    'Explain my current Python code line by line',
    'How does if / elif / else decide which branch runs?',
    'What is the difference between = and == in Python?',
  ],
  debugger: [
    'Check my current code for syntax or logic mistakes',
    'Why do I get an indentation error after an if statement?',
    'How do I fix a missing colon or unclosed quote?',
  ],
  quizmaster: [
    'Quiz me on True, False, and, or, and not',
    'Give me a small if-else puzzle to predict the output',
    'Ask me a question about Python for loops',
  ],
};

function CodeSnippetCard({
  code,
  onApplyCode,
}: {
  code: string;
  onApplyCode?: (snippet: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2 rounded-lg border border-emerald-200/80 dark:border-slate-700/80 bg-[#F8FAFC] dark:bg-[#0B0F17] overflow-hidden">
      <div className="flex items-center justify-between px-2.5 py-1 border-b border-emerald-100 dark:border-slate-800 bg-emerald-50/70 dark:bg-[#0F1522] text-[10px]">
        <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
          python
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onApplyCode && (
            <button
              type="button"
              onClick={() => onApplyCode(code)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-medium cursor-pointer"
            >
              Load in Editor
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <pre className="px-3 py-2 font-mono text-xs text-slate-900 dark:text-emerald-300 overflow-x-auto leading-5">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderFormattedMessage(
  text: string,
  onApplyCode?: (snippet: string) => void,
) {
  const segments = text.split(/(```[\s\S]*?```)/g);
  return segments.map((seg, idx) => {
    if (seg.startsWith('```') && seg.endsWith('```')) {
      const inner = seg.slice(3, -3).replace(/^(python|py)\n/i, '').trim();
      return <CodeSnippetCard key={idx} code={inner} onApplyCode={onApplyCode} />;
    }

    const lines = seg.split('\n');
    return (
      <div key={idx} className="space-y-1">
        {lines.map((line, lineIdx) => {
          const inlineParts = line.split(/(`[^`]+`)/g);
          return (
            <p key={lineIdx} className="leading-relaxed break-words">
              {inlineParts.map((part, pIdx) => {
                if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
                  return (
                    <code
                      key={pIdx}
                      className="px-1 py-0.5 rounded bg-emerald-50 dark:bg-slate-800 font-mono text-[12px] text-emerald-800 dark:text-emerald-300"
                    >
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return <React.Fragment key={pIdx}>{part}</React.Fragment>;
              })}
            </p>
          );
        })}
      </div>
    );
  });
}

export function CodeBuddyChat({
  isOpen,
  onClose,
  currentCode,
  syntaxSummary,
  onApplyCode,
}: CodeBuddyChatProps) {
  const [role, setRole] = useState<ChatbotRole>('tutor');
  const [fastMode, setFastMode] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [includeCode, setIncludeCode] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (!isOpen) return null;

  const activeRoleMeta = ROLE_OPTIONS.find((r) => r.id === role) ?? ROLE_OPTIONS[0];

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    );
  };

  const sendMessage = async (textOverride?: string) => {
    const trimmed = (textOverride ?? input).trim();
    if (!trimmed || isStreaming) return;

    setErrorMsg(null);
    if (!textOverride) {
      setInput('');
    }

    const userTurn: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const modelId = `m_${Date.now() + 1}`;
    const placeholderTurn: ChatMessage = {
      id: modelId,
      role: 'model',
      text: '',
      streaming: true,
    };

    const historySnapshot = messages
      .filter((m) => m.text.trim().length > 0)
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userTurn, placeholderTurn]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history: historySnapshot,
          role,
          fastMode,
          useSearch,
          codeContext: includeCode ? currentCode : '',
          syntaxSummary: includeCode ? syntaxSummary : '',
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || 'Could not reach CodeBuddy.');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Streaming is unavailable in this browser.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let finalSources: GroundingSource[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          const parsed = JSON.parse(jsonStr) as {
            chunk?: string;
            done?: boolean;
            error?: string;
            sources?: GroundingSource[];
          };

          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.chunk) {
            accumulated += parsed.chunk;
            setMessages((prev) =>
              prev.map((m) => (m.id === modelId ? { ...m, text: accumulated } : m)),
            );
          }
          if (Array.isArray(parsed.sources) && parsed.sources.length > 0) {
            finalSources = parsed.sources.filter((s) => isSafeWebUrl(s.uri));
          }
        }
      }

      setMessages((prev) =>
        prev
          .map((m) =>
            m.id === modelId
              ? { ...m, streaming: false, sources: finalSources.length > 0 ? finalSources : undefined }
              : m,
          )
          .filter((m) => m.id !== modelId || m.text.trim().length > 0),
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Network error. Please try again.';
      setErrorMsg(msg);
      setMessages((prev) => prev.filter((m) => m.id !== modelId || m.text.trim().length > 0));
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages([]);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="CodeBuddy AI Assistant"
        className="relative z-10 w-full max-w-md h-full bg-white dark:bg-[#0D131F] border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl"
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-sky-50 to-amber-50 dark:from-[#0F1522] dark:to-[#131B2E] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                CodeBuddy
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                {activeRoleMeta.label} · {useSearch ? 'Google Search Grounded' : fastMode ? 'Instant Mode' : 'Balanced Mode'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              title="Start new conversation"
              aria-label="Start new conversation"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close CodeBuddy"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Role & Options Bar */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] space-y-2">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
            {ROLE_OPTIONS.map((opt) => {
              const active = role === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id)}
                  className={`py-1.5 px-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setIncludeCode((v) => !v)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                includeCode
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-400'
              }`}
            >
              <Code2 className="w-3 h-3" />
              {includeCode ? 'Code Context' : 'Code Off'}
            </button>

            <button
              type="button"
              onClick={() => setUseSearch((v) => !v)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                useSearch
                  ? 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-400'
              }`}
            >
              <Globe className="w-3 h-3" />
              {useSearch ? 'Web Search On' : 'Web Search Off'}
            </button>

            <button
              type="button"
              onClick={() => setFastMode((v) => !v)}
              disabled={useSearch}
              title={useSearch ? 'Web Search uses gemini-4-hydrogen' : 'Toggle fast model'}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                fastMode && !useSearch
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-400'
              }`}
            >
              <Zap className="w-3 h-3" />
              {fastMode && !useSearch ? 'Fast Mode' : 'Standard'}
            </button>
          </div>
        </div>

        {/* Scrollable Conversation Thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800 bg-emerald-50/60 dark:bg-[#111827] p-3.5">
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  CodeBuddy · {activeRoleMeta.label}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {activeRoleMeta.hint} Replies stream live—ask any Python question or pick a starter below.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Quick Starters
                </div>
                {STARTER_PROMPTS[role].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#111827] hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-slate-800/70 text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs sm:text-[13px] ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#111827] text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div
                    className={`text-[10px] font-semibold mb-1 ${
                      msg.role === 'user'
                        ? 'text-emerald-100'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {msg.role === 'user' ? 'You' : 'CodeBuddy'}
                  </div>
                  {msg.role === 'user' ? (
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  ) : msg.text ? (
                    <>
                      {renderFormattedMessage(msg.text, onApplyCode)}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/70">
                          <div className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 mb-1 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Sources (Google Search)
                          </div>
                          <div className="flex flex-col gap-1">
                            {msg.sources.slice(0, 5).map((src) => (
                              <a
                                key={src.uri}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-sky-700 dark:text-sky-300 hover:underline truncate"
                              >
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{src.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">Typing...</span>
                  )}
                </div>
              </div>
            ))
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 p-3 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="space-y-1">
                <div className="font-semibold">Unable to reply</div>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          <div ref={threadEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] flex items-end gap-2"
        >
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Ask CodeBuddy about Python syntax, loops, or your code..."
            aria-label="Message to CodeBuddy"
            className="flex-1 resize-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-400"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              aria-label="Stop generating"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message to CodeBuddy"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}
