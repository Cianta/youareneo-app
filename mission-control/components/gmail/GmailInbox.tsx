'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Inbox, Mail, Star, AlertTriangle, Send, Archive,
  RefreshCw, Search, MoreHorizontal, ExternalLink,
  ChevronRight, Clock, Tag, Loader2, MailOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────
interface GmailMessage {
  id: string;
  threadId: string;
  date: string;
  sender: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  toRecipients: string[];
  labelIds: string[];
  body?: string;
}

interface GmailThread {
  id: string;
  messages: GmailMessage[];
  lastDate: string;
  subject: string;
  snippet: string;
  isUnread: boolean;
  isStarred: boolean;
  isImportant: boolean;
  labels: string[];
}

type FilterId = 'all' | 'inbox' | 'unread' | 'starred' | 'important' | 'sent';

const FILTERS: { id: FilterId; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox',     label: 'Inbox',     icon: Inbox },
  { id: 'unread',    label: 'Unread',    icon: MailOpen },
  { id: 'starred',   label: 'Starred',   icon: Star },
  { id: 'important', label: 'Important', icon: AlertTriangle },
  { id: 'sent',      label: 'Sent',      icon: Send },
  { id: 'all',       label: 'All Mail',  icon: Archive },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

function senderInitials(name: string): string {
  const parts = name.split(/[\s.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function senderColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    'bg-sky-600/70', 'bg-violet-600/70', 'bg-amber-600/70', 'bg-emerald-600/70',
    'bg-rose-600/70', 'bg-indigo-600/70', 'bg-teal-600/70', 'bg-orange-600/70',
  ];
  return colors[Math.abs(hash) % colors.length];
}

// ── Component ────────────────────────────────────────────────────────────────
export function GmailInbox() {
  const [threads, setThreads] = useState<GmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThread, setSelectedThread] = useState<GmailThread | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = useCallback(async (f: FilterId) => {
    try {
      const res = await fetch(`/api/gmail/threads?filter=${f}&limit=30`);
      const data = await res.json();
      if (data.ok) setThreads(data.threads);
    } catch { /* silently fail */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchThreads(filter);
  }, [filter, fetchThreads]);

  // Auto-poll for fresh emails every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreads(filter);
    }, 30000);
    return () => clearInterval(interval);
  }, [filter, fetchThreads]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchThreads(filter);
  };

  // Search filter (client-side on cached data)
  const visibleThreads = searchQuery
    ? threads.filter(t =>
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.messages[0]?.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.messages[0]?.senderEmail.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : threads;

  const unreadCount = threads.filter(t => t.isUnread).length;

  // ── Thread detail view ──────────────────────────────────────────────────
  if (selectedThread) {
    const msg = selectedThread.messages[0];
    return (
      <div className="h-full flex flex-col bg-surface/30 rounded-xl border border-border overflow-hidden">
        {/* Thread header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface/50 shrink-0">
          <button onClick={() => setSelectedThread(null)}
            className="p-1.5 rounded-lg text-anth-400 hover:text-forest-300 hover:bg-forest-800/30 transition-colors">
            <ChevronRight size={14} className="rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-forest-100 truncate">{selectedThread.subject}</p>
            <p className="text-[10px] text-anth-500">
              {msg.senderName} &lt;{msg.senderEmail}&gt; &middot; {timeAgo(msg.date)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {selectedThread.isImportant && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-900/30 border border-amber-700/30 text-amber-400">
                Important
              </span>
            )}
            <a href={`https://mail.google.com/mail/u/0/#inbox/${selectedThread.id}`}
              target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-anth-500 hover:text-forest-300 hover:bg-forest-800/30 transition-colors"
              title="Open in Gmail">
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-5">
          {selectedThread.messages.map(m => (
            <div key={m.id} className="mb-6 last:mb-0">
              <div className="flex items-start gap-3">
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0',
                  senderColor(m.senderEmail))}>
                  {senderInitials(m.senderName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-forest-100">{m.senderName}</span>
                    <span className="text-[10px] text-anth-500">{new Date(m.date).toLocaleString('de-DE')}</span>
                  </div>
                  <p className="text-[10px] text-anth-500 mb-3">to {m.toRecipients.join(', ')}</p>
                  <div className="text-sm text-anth-300 leading-relaxed bg-anth-900/30 rounded-xl p-4 border border-anth-700/20">
                    {m.body ?? m.snippet}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Inbox list view ─────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-surface/30 rounded-xl border border-border overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface/50 shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-anth-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search emails..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-anth-900/40 border border-anth-700/30 rounded-xl text-forest-100 placeholder:text-anth-600 focus:outline-none focus:border-forest-600/50 transition-colors"
          />
        </div>

        {/* Refresh */}
        <button onClick={handleRefresh} disabled={refreshing}
          className="p-2 rounded-lg text-anth-400 hover:text-forest-300 hover:bg-forest-800/30 disabled:opacity-50 transition-colors"
          title="Refresh emails">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {/* Gmail link */}
        <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer"
          className="p-2 rounded-lg text-anth-400 hover:text-sky-400 hover:bg-sky-900/20 transition-colors"
          title="Open Gmail in new tab">
          <ExternalLink size={13} />
        </a>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] text-anth-500">
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-sky-900/30 border border-sky-700/30 text-sky-400 font-medium">
              {unreadCount} unread
            </span>
          )}
          <span>{threads.length} threads</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar filters */}
        <div className="w-40 border-r border-border bg-anth-900/20 py-2 shrink-0">
          {FILTERS.map(f => {
            const Icon = f.icon;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors',
                  filter === f.id
                    ? 'text-forest-200 bg-forest-800/20 border-r-2 border-forest-500'
                    : 'text-anth-400 hover:text-anth-200 hover:bg-anth-800/30'
                )}>
                <Icon size={13} />
                <span>{f.label}</span>
                {f.id === 'unread' && unreadCount > 0 && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-sky-900/40 text-sky-400">{unreadCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={20} className="animate-spin text-forest-500" />
                <p className="text-xs text-anth-400">Loading emails...</p>
              </div>
            </div>
          ) : visibleThreads.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-center">
                <Mail size={24} className="text-anth-600" />
                <p className="text-sm text-anth-400">No emails found</p>
                <p className="text-xs text-anth-600">
                  {searchQuery ? 'Try a different search query' : 'This folder is empty'}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {visibleThreads.map(thread => {
                const msg = thread.messages[0];
                return (
                  <button key={thread.id} onClick={() => setSelectedThread(thread)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors group',
                      thread.isUnread
                        ? 'bg-forest-900/10 hover:bg-forest-900/20'
                        : 'hover:bg-anth-800/20'
                    )}>
                    {/* Avatar */}
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-0.5',
                      senderColor(msg.senderEmail))}>
                      {senderInitials(msg.senderName)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={cn('text-xs truncate',
                          thread.isUnread ? 'font-bold text-forest-100' : 'font-medium text-anth-300')}>
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-anth-500 shrink-0 flex items-center gap-1">
                          {thread.isImportant && <Tag size={9} className="text-amber-500" />}
                          <Clock size={9} />
                          {timeAgo(thread.lastDate)}
                        </span>
                      </div>
                      <p className={cn('text-xs truncate mt-0.5',
                        thread.isUnread ? 'font-semibold text-forest-200' : 'text-anth-300')}>
                        {thread.subject}
                      </p>
                      <p className="text-[11px] text-anth-500 truncate mt-0.5">
                        {thread.snippet}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {thread.isUnread && (
                      <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface/30 text-[10px] text-anth-500 shrink-0">
        <span>Connected: info@youareneo.com</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Gmail MCP Active
        </span>
      </div>
    </div>
  );
}
