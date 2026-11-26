import React, { useState } from 'react';
import { X, Users, Trophy, Send, Check, Copy } from 'lucide-react';
import type { LeaderboardEntry, Participant, RoomMessage } from '../hooks/useRealtimeCollab';

interface CollabDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'connecting' | 'connected' | 'disconnected';
  displayName: string;
  roomId: string;
  syncEnabled: boolean;
  onToggleSync: (next: boolean) => void;
  participants: Participant[];
  messages: RoomMessage[];
  leaderboard: LeaderboardEntry[];
  onJoinRoom: (roomId: string, name?: string) => void;
  onRenameUser: (name: string) => void;
  onSendMessage: (text: string) => void;
}

export function CollabDrawer({
  isOpen,
  onClose,
  status,
  displayName,
  roomId,
  syncEnabled,
  onToggleSync,
  participants,
  messages,
  leaderboard,
  onJoinRoom,
  onRenameUser,
  onSendMessage,
}: CollabDrawerProps) {
  const [activeTab, setActiveTab] = useState<'room' | 'leaderboard'>('room');
  const [nameInput, setNameInput] = useState(displayName);
  const [roomInput, setRoomInput] = useState(roomId);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoinRoom(roomInput, nameInput);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      // Clipboard blocked in restricted frame
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/60">
      <div
        role="dialog"
        aria-label="Live Collaboration and Leaderboard"
        className="w-full max-w-md h-full bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-emerald-50/60 dark:bg-[#0F1522]">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Live Room &amp; Leaderboard
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {status === 'connected' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
              <span>
                {status === 'connected'
                  ? `Connected · Room ${roomId}`
                  : status === 'connecting'
                    ? 'Connecting to room...'
                    : 'Reconnecting...'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close collaboration panel"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('room')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'room'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Collab Room ({participants.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Leaderboard ({leaderboard.length})
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        {activeTab === 'room' ? (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            <form onSubmit={handleRoomSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="collab-name" className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Your Name
                  </label>
                  <input
                    id="collab-name"
                    type="text"
                    maxLength={24}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={() => onRenameUser(nameInput)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label htmlFor="collab-room" className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Room Code
                  </label>
                  <input
                    id="collab-room"
                    type="text"
                    maxLength={24}
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-[#FFD43B] dark:text-[#0B0F17] dark:hover:bg-[#FFE066] transition-colors cursor-pointer"
                >
                  Join / Switch Room
                </button>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied' : 'Invite'}
                </button>
              </div>
            </form>

            {/* Live Sync Toggle */}
            <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17]">
              <div>
                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Sync Editor in Real Time
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Broadcasts code changes to everyone in room {roomId}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleSync(!syncEnabled)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  syncEnabled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                    : 'bg-slate-200 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                {syncEnabled ? 'On' : 'Off'}
              </button>
            </div>

            {/* Active Participants */}
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 mb-2">
                Active Participants ({participants.length})
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Notes / Chat */}
            <div className="flex-1 flex flex-col min-h-[180px] rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] overflow-hidden">
              <div className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-transparent">
                Room Discussion
              </div>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2 text-xs">
                {messages.length === 0 ? (
                  <p className="text-slate-500">
                    Share a Python hint, question, or observation with others in {roomId}.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="leading-relaxed">
                      <span className="font-semibold text-emerald-700 dark:text-[#7CC4FF]">
                        {m.senderName}:{' '}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">{m.text}</span>
                    </div>
                  ))
                )}
              </div>
              <form
                onSubmit={handleChatSubmit}
                className="flex items-center gap-2 p-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent"
              >
                <input
                  type="text"
                  maxLength={300}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Write a note to the room..."
                  className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Scores update in real time as learners complete Practice quizzes, fix syntax bugs, and finish lessons.
            </p>

            {leaderboard.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#0B0F17] p-6 text-center">
                <Trophy className="w-6 h-6 text-emerald-600 dark:text-slate-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  No scores recorded yet
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Complete the Practice quiz or apply syntax fixes to claim the top spot.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] overflow-hidden">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-emerald-50/60 dark:bg-[#0F1522]">
                      <th className="py-2.5 px-3 font-semibold">#</th>
                      <th className="py-2.5 px-3 font-semibold">Learner</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Quiz</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Fixes</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className="border-b last:border-b-0 border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200"
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium truncate max-w-[130px]">{entry.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          {entry.quizScore}/{entry.quizTotal}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          {entry.syntaxFixed}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-[#FFD43B]">
                          {entry.totalPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
