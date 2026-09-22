import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Mail,
  Smartphone,
  Bell,
  Users,
  Award,
  Search,
  Plus,
  CheckCheck,
  Check,
  Clock,
  Paperclip,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  UserProfile,
  ClassLevel,
  Student,
  BroadcastMessageRecord,
  ChatThread,
  DirectChatMessage,
  Role,
} from '../../types';
import {
  getAllBroadcasts,
  getAllChatThreads,
  getChatMessages,
  sendChatMessage,
  getSystemNotifications,
} from '../../lib/messaging-store';
import { formatNaira } from '../../lib/currency';
import { BroadcastComposerModal } from './BroadcastComposerModal';
import { ClassCaptainsManagementModal } from '../class-captains/ClassCaptainsManagementModal';
import {
  getAllClassCaptains,
  postCaptainClassAnnouncement,
} from '../../lib/class-captain-store';

interface CommunicationsHubPageProps {
  currentUser: UserProfile;
  levels: ClassLevel[];
  allStudents: Student[];
  initialThreadId?: string;
}

type CommTab = 'BROADCASTS' | 'PARENT_TEACHER' | 'CAPTAIN_CHANNEL' | 'PUSH_NOTIFICATIONS';

export const CommunicationsHubPage: React.FC<CommunicationsHubPageProps> = ({
  currentUser,
  levels,
  allStudents,
  initialThreadId,
}) => {
  const [activeTab, setActiveTab] = useState<CommTab>('BROADCASTS');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isCaptainsModalOpen, setIsCaptainsModalOpen] = useState(false);

  // Broadcasts state
  const [broadcasts, setBroadcasts] = useState<BroadcastMessageRecord[]>(() => getAllBroadcasts());
  const refreshBroadcasts = () => setBroadcasts(getAllBroadcasts());

  // Chat threads state
  const [threads, setThreads] = useState<ChatThread[]>(() => getAllChatThreads());
  const [selectedThreadId, setSelectedThreadId] = useState<string>(() => {
    return initialThreadId || threads[0]?.id || '';
  });

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || threads[0];
  }, [threads, selectedThreadId]);

  // Messages in active thread
  const [messages, setMessages] = useState<DirectChatMessage[]>(() => {
    return activeThread ? getChatMessages(activeThread.id) : [];
  });

  // Re-sync messages when thread changes
  React.useEffect(() => {
    if (activeThread) {
      setMessages(getChatMessages(activeThread.id));
    }
  }, [activeThread?.id]);

  // New message text state
  const [newMessageText, setNewMessageText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeThread) return;

    // Determine recipient
    const otherParticipantId = activeThread.participantIds.find((id) => id !== currentUser.id) || activeThread.participantIds[0];
    const otherParticipantName = activeThread.participantNames[otherParticipantId] || 'Participant';
    const otherParticipantRole = activeThread.participantRoles[otherParticipantId] || 'TEACHER';

    const sent = sendChatMessage({
      threadId: activeThread.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId: otherParticipantId,
      recipientName: otherParticipantName,
      recipientRole: otherParticipantRole,
      content: newMessageText.trim(),
    });

    setMessages(getChatMessages(activeThread.id));
    setThreads(getAllChatThreads());
    setNewMessageText('');
  };

  // Class Captain Scoped Announcement form state (Step 20)
  const [captainAnnTitle, setCaptainAnnTitle] = useState('');
  const [captainAnnContent, setCaptainAnnContent] = useState('');
  const [captainAnnCategory, setCaptainAnnCategory] = useState<
    'ACADEMIC' | 'EVENT' | 'EXAM' | 'ADMINISTRATIVE' | 'EMERGENCY'
  >('ACADEMIC');
  const [captainAnnSuccess, setCaptainAnnSuccess] = useState<string | null>(null);

  const activeCaptain = useMemo(() => {
    const captains = getAllClassCaptains();
    return captains.find((c) => c.status === 'ACTIVE');
  }, []);

  const handlePostCaptainAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaptain || !captainAnnTitle.trim() || !captainAnnContent.trim()) return;

    postCaptainClassAnnouncement({
      captain: activeCaptain,
      title: captainAnnTitle.trim(),
      content: captainAnnContent.trim(),
      category: captainAnnCategory,
    });

    setCaptainAnnSuccess(`Class-scoped announcement posted for ${activeCaptain.classLevel} ${activeCaptain.classArm}!`);
    setCaptainAnnTitle('');
    setCaptainAnnContent('');
    setTimeout(() => setCaptainAnnSuccess(null), 4000);
  };

  // System push notifications
  const pushNotifications = useMemo(() => getSystemNotifications(), []);

  // Filter threads by tab
  const parentTeacherThreads = useMemo(
    () => threads.filter((t) => t.type === 'TEACHER_PARENT'),
    [threads]
  );
  const captainThreads = useMemo(
    () => threads.filter((t) => t.type === 'CAPTAIN_TEACHER'),
    [threads]
  );

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-xs">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                Communications & Messaging Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-semibold">
                Multi-Channel Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Broadcast circulars, two-way teacher-parent consultations, and peer captain channels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCaptainsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl border border-amber-200 dark:border-amber-800/60 transition"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Class Captains</span>
          </button>

          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Broadcast</span>
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('BROADCASTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'BROADCASTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Broadcasts & Circulars ({broadcasts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('PARENT_TEACHER');
            if (parentTeacherThreads[0]) setSelectedThreadId(parentTeacherThreads[0].id);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'PARENT_TEACHER'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teacher-Parent Threads ({parentTeacherThreads.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('CAPTAIN_CHANNEL');
            if (captainThreads[0]) setSelectedThreadId(captainThreads[0].id);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'CAPTAIN_CHANNEL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Captain-Teacher Channel & Scoped Posts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PUSH_NOTIFICATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'PUSH_NOTIFICATIONS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Push Notification Log</span>
        </button>
      </div>

      {/* 3. TAB 1: BROADCASTS & SMS ALERTS */}
      {activeTab === 'BROADCASTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Dispatched Broadcasts
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {broadcasts.length}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Across In-App, Email & SMS</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Total Parents Reached
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {broadcasts.reduce((sum, b) => sum + b.recipientCount, 0)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">100% verified delivery</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                SMS Tariff Guard Spend
              </span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {formatNaira(broadcasts.reduce((sum, b) => sum + (b.estimatedCostNaira || 0), 0))}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Controlled spend via Push-First policy</p>
            </div>
          </div>

          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px] uppercase">
                      {b.audienceScope.replace('_', ' ')}
                    </span>
                    {b.isHighPriorityAlert && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>High Priority Alert</span>
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(b.sentAt).toLocaleDateString()} at{' '}
                      {new Date(b.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Channel Badges */}
                  <div className="flex items-center gap-1.5">
                    {b.channels.map((ch) => (
                      <span
                        key={ch}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          ch === 'SMS'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : ch === 'EMAIL'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {ch.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {b.body}
                  </p>
                </div>

                {/* Delivery Stats and Cost Bar */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                  <div>
                    Dispatched by: <strong>{b.senderName}</strong> ({b.senderRole})
                  </div>

                  <div className="flex items-center gap-4">
                    <span>Recipients: <strong>{b.recipientCount}</strong></span>
                    {b.channels.includes('SMS') && (
                      <span>
                        Cost: <strong className="text-rose-600">{formatNaira(b.estimatedCostNaira || 0)}</strong> ({b.smsTotalSegments} segments)
                      </span>
                    )}
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Delivered</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB 2 & 3: TWO-WAY CHAT (Teacher-Parent or Captain-Teacher) */}
      {(activeTab === 'PARENT_TEACHER' || activeTab === 'CAPTAIN_CHANNEL') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Thread List Sidebar */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              {activeTab === 'PARENT_TEACHER' ? 'Teacher-Parent Conversations' : 'Class Captain Channels'}
            </h3>

            <div className="space-y-1.5">
              {(activeTab === 'PARENT_TEACHER' ? parentTeacherThreads : captainThreads).map((th) => {
                const isSelected = th.id === activeThread?.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setSelectedThreadId(th.id)}
                    className={`w-full p-3 rounded-xl text-left transition cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-800'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[200px]">
                        {th.studentName ? th.studentName : th.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(th.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {th.lastMessageSnippet}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                        {th.classLevel} {th.classArm}
                      </span>
                      {th.type === 'CAPTAIN_TEACHER' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold">
                          Captain Log
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Extra Section for Captain Channel: Post Scoped Announcement */}
            {activeTab === 'CAPTAIN_CHANNEL' && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Post Class-Scoped Reminder</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-snug">
                    Captains can publish announcements pinned strictly to their class arm (JSS 1 Gold).
                  </p>

                  {captainAnnSuccess && (
                    <div className="p-2 bg-emerald-100 text-emerald-800 text-[10px] rounded-lg">
                      {captainAnnSuccess}
                    </div>
                  )}

                  <form onSubmit={handlePostCaptainAnnouncement} className="space-y-2 pt-1">
                    <input
                      type="text"
                      placeholder="Title: e.g. Bring Math Compass"
                      value={captainAnnTitle}
                      onChange={(e) => setCaptainAnnTitle(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg text-xs"
                      required
                    />
                    <textarea
                      rows={2}
                      placeholder="Reminder message for classmates..."
                      value={captainAnnContent}
                      onChange={(e) => setCaptainAnnContent(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg text-xs"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                    >
                      Publish to JSS 1 Gold
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Active Conversation Chat Window */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[650px] overflow-hidden">
            {activeThread ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {activeThread.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Class: <strong>{activeThread.classLevel} {activeThread.classArm}</strong>
                      {activeThread.studentName && ` • Ward: ${activeThread.studentName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="hidden sm:inline">Encrypted Academic Channel</span>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg) => {
                    const isSelf = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-semibold">{msg.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold">
                            {msg.senderRole}
                          </span>
                        </div>

                        <div
                          className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isSelf
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>

                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isSelf && <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input Footer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => alert('File attachment: PDFs, rubrics, and certificates supported.')}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
                    title="Attach document"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type message to recipient..."
                    className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
                Select a conversation thread to view communications.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 4: SYSTEM PUSH NOTIFICATIONS */}
      {activeTab === 'PUSH_NOTIFICATIONS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Automated Real-Time Push Events Log
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            System notifications dispatched when report cards are frozen, invoices fall due, or attendance alerts trigger.
          </p>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pushNotifications.map((n) => (
              <div key={n.id} className="py-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast Composer Modal */}
      <BroadcastComposerModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        currentUser={currentUser}
        levels={levels}
        onBroadcastDispatched={refreshBroadcasts}
      />

      {/* Class Captains Management Modal */}
      <ClassCaptainsManagementModal
        isOpen={isCaptainsModalOpen}
        onClose={() => setIsCaptainsModalOpen(false)}
        students={allStudents}
        currentUser={currentUser}
      />
    </div>
  );
};
