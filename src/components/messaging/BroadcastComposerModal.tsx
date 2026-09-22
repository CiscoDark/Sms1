import React, { useState, useMemo } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  AlertTriangle,
  Info,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  Users,
  Sparkles,
} from 'lucide-react';
import { UserProfile, ClassLevel } from '../../types';
import {
  calculateSmsMetrics,
  saveBroadcast,
  SMS_COST_PER_SEGMENT_NAIRA,
} from '../../lib/messaging-store';
import { formatNaira } from '../../lib/currency';

interface BroadcastComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  levels: ClassLevel[];
  onBroadcastDispatched?: () => void;
}

export const BroadcastComposerModal: React.FC<BroadcastComposerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  levels,
  onBroadcastDispatched,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState<('SMS' | 'EMAIL' | 'IN_APP')[]>([
    'IN_APP',
    'EMAIL',
  ]);
  const [scope, setScope] = useState<'SCHOOL_WIDE' | 'CLASS_LEVEL' | 'CLASS_ARM'>('SCHOOL_WIDE');
  const [targetLevel, setTargetLevel] = useState<string>(levels[0]?.name || 'JSS 1');
  const [targetArm, setTargetArm] = useState<string>('Gold');
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [isConfirmingCost, setIsConfirmingCost] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Recipient estimation based on scope
  const recipientCount = useMemo(() => {
    if (scope === 'SCHOOL_WIDE') return 254; // Total enrolled cohort
    if (scope === 'CLASS_LEVEL') return 68; // ~2 arms
    return 34; // 1 arm
  }, [scope]);

  // Live SMS Cost Guard calculation
  const smsMetrics = useMemo(() => {
    return calculateSmsMetrics(body, recipientCount);
  }, [body, recipientCount]);

  if (!isOpen) return null;

  const toggleChannel = (ch: 'SMS' | 'EMAIL' | 'IN_APP') => {
    if (channels.includes(ch)) {
      if (channels.length === 1) return; // Keep at least one channel
      setChannels(channels.filter((c) => c !== ch));
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('Please enter both broadcast title and message body.');
      return;
    }

    // Trigger Cost Guard confirmation if SMS is selected with financial cost
    if (channels.includes('SMS') && smsMetrics.totalCostNaira > 0 && !isConfirmingCost) {
      setIsConfirmingCost(true);
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      saveBroadcast({
        title,
        body,
        channels,
        audienceScope: scope,
        targetLevel: scope !== 'SCHOOL_WIDE' ? targetLevel : undefined,
        targetArm: scope === 'CLASS_ARM' ? targetArm : undefined,
        recipientCount,
        smsCharacterCount: smsMetrics.charCount,
        smsSegmentsPerRecipient: smsMetrics.segmentsPerRecipient,
        smsTotalSegments: smsMetrics.totalSegments,
        estimatedCostNaira: channels.includes('SMS') ? smsMetrics.totalCostNaira : 0,
        isHighPriorityAlert: isHighPriority,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.title || currentUser.role,
      });

      setIsSending(false);
      onBroadcastDispatched?.();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Dispatch Broadcast & Parent Communications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-Channel Dispatch with Live GSM 7-bit / Unicode SMS Cost Guard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cost Guard Confirmation View */}
        {isConfirmingCost ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>SMS Cost Guard Confirmation Required</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 leading-relaxed">
                You have enabled cellular SMS dispatch. This broadcast will send{' '}
                <strong>{smsMetrics.totalSegments} SMS segments</strong> across{' '}
                <strong>{recipientCount} recipients</strong> at ₦{SMS_COST_PER_SEGMENT_NAIRA.toFixed(2)}/segment.
              </p>
              <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Total SMS Expenditure:
                </span>
                <span className="text-base font-black text-rose-600">
                  {formatNaira(smsMetrics.totalCostNaira)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingCost(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSending}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {isSending ? 'Dispatching...' : `Approve & Spend ${formatNaira(smsMetrics.totalCostNaira)}`}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Delivery Channels */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Select Dispatch Channels:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => toggleChannel('IN_APP')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                    channels.includes('IN_APP')
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs">In-App Push</span>
                  <span className="text-[10px] text-emerald-600 font-bold">FREE (₦0.00)</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleChannel('EMAIL')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                    channels.includes('EMAIL')
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-xs">Email Circular</span>
                  <span className="text-[10px] text-emerald-600 font-bold">FREE (₦0.00)</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleChannel('SMS')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                    channels.includes('SMS')
                      ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs">Cellular SMS</span>
                  <span className="text-[10px] text-rose-600 font-bold">₦4.00 / segment</span>
                </button>
              </div>
            </div>

            {/* Target Audience Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Audience Scope
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="SCHOOL_WIDE">Whole School ({254} Parents)</option>
                  <option value="CLASS_LEVEL">Specific Class Level (~68)</option>
                  <option value="CLASS_ARM">Specific Class Arm (~34)</option>
                </select>
              </div>

              {scope !== 'SCHOOL_WIDE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Level
                  </label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    {levels.map((l) => (
                      <option key={l.id} value={l.name}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scope === 'CLASS_ARM' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Arm
                  </label>
                  <select
                    value={targetArm}
                    onChange={(e) => setTargetArm(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Diamond">Diamond</option>
                    <option value="Gold">Gold</option>
                    <option value="Science (Diamond)">Science (Diamond)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Broadcast Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Subject / Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. End of Term Resumption Guidelines & PTA Date"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            {/* Message Body with live character counter */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Message Content *
                </label>
                <div className="text-[11px] font-mono text-slate-400">
                  {smsMetrics.charCount} characters
                </div>
              </div>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter message for parents..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            {/* LIVE SMS COST GUARD METRICS CARD */}
            {channels.includes('SMS') && (
              <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    <span>Live SMS Cost Guard Analysis</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      smsMetrics.isUnicode
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {smsMetrics.isUnicode ? 'UCS-2 Unicode (70 chars)' : 'GSM 7-bit (160 chars)'}
                  </span>
                </div>

                {smsMetrics.unicodeWarning && (
                  <div className="p-2.5 bg-amber-950/60 border border-amber-800 text-amber-300 text-xs rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{smsMetrics.unicodeWarning}</span>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-[10px] text-slate-400">Segments / Recipient</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {smsMetrics.segmentsPerRecipient}
                    </div>
                  </div>

                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-[10px] text-slate-400">Recipients</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {recipientCount}
                    </div>
                  </div>

                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-[10px] text-slate-400">Total Segments</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {smsMetrics.totalSegments}
                    </div>
                  </div>

                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <div className="text-[10px] text-rose-300">Estimated Cost</div>
                    <div className="text-base font-black text-rose-400 mt-0.5">
                      {formatNaira(smsMetrics.totalCostNaira)}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    Pro-tip: Send via Push Notification and Email first to eliminate cellular SMS tariff.
                  </span>
                </div>
              </div>
            )}

            {/* High Priority Emergency Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHighPriority}
                  onChange={(e) => setIsHighPriority(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <span>Mark as Urgent / Emergency Broadcast (Triggers Audio Alert)</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Send className="w-4 h-4" />
                <span>
                  Dispatch to {recipientCount} Recipients{' '}
                  {channels.includes('SMS') && `(${formatNaira(smsMetrics.totalCostNaira)})`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
