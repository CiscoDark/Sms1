import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { PaymentReminderNotification, StudentFeeAccount } from '../../types';
import {
  getStoredPaymentReminders,
  dispatchPaymentReminder,
  getAllStudentFeeAccounts,
} from '../../lib/fee-store';
import { formatNaira } from '../../lib/currency';

interface PaymentRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAccount?: StudentFeeAccount | null;
}

export default function PaymentRemindersModal({
  isOpen,
  onClose,
  targetAccount,
}: PaymentRemindersModalProps) {
  const [reminders, setReminders] = useState<PaymentReminderNotification[]>(() =>
    getStoredPaymentReminders()
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    targetAccount?.studentId || ''
  );
  const [channel, setChannel] = useState<'EMAIL' | 'SMS' | 'MULTI_CHANNEL'>('MULTI_CHANNEL');
  const [stage, setStage] = useState<PaymentReminderNotification['triggerStage']>('MANUAL_DISPATCH');
  const [customNotes, setCustomNotes] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const accounts = getAllStudentFeeAccounts().filter((a) => a.balanceDue > 0);

  useEffect(() => {
    if (targetAccount) {
      setSelectedStudentId(targetAccount.studentId);
    } else if (accounts.length > 0 && !selectedStudentId) {
      setSelectedStudentId(accounts[0].studentId);
    }
  }, [targetAccount]);

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.studentId === selectedStudentId);

  const defaultSmsPreview = currentAccount
    ? `APEX ACADEMY NOTICE: Dear Parent, ${currentAccount.studentName} has outstanding term fees of ${formatNaira(currentAccount.balanceDue)}. Settle via paystack.com/pay/apex before Feb 15.`
    : '';

  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const notif = dispatchPaymentReminder({
      studentId: selectedStudentId,
      channel,
      stage,
      customMessage: customNotes.trim() || undefined,
    });

    if (notif) {
      setReminders([notif, ...getStoredPaymentReminders()]);
      setDispatchSuccess(true);
      setTimeout(() => {
        setDispatchSuccess(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Parent Payment Reminders</h2>
              <p className="text-xs text-slate-500">
                Automated multi-channel dispatch (Email &amp; SMS) via Bursary Notification Service
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          <form onSubmit={handleSendReminder} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Recipient Student Defaulter
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.studentId} value={acc.studentId}>
                      {acc.studentName} ({acc.classLevel}) — Owed: {formatNaira(acc.balanceDue)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Dispatch Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('MULTI_CHANNEL')}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                      channel === 'MULTI_CHANNEL'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Email + SMS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('EMAIL')}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                      channel === 'EMAIL'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('SMS')}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                      channel === 'SMS'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stage Trigger Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Automated Trigger Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white"
              >
                <option value="UPCOMING_14_DAYS">14 Days Before Due Date (Early Reminder)</option>
                <option value="UPCOMING_3_DAYS">3 Days Before Due Date (Urgent Alert)</option>
                <option value="ON_DUE_DATE">Due Date Settlement Reminder</option>
                <option value="OVERDUE_7_DAYS">7 Days Overdue (Grace Period Warning)</option>
                <option value="OVERDUE_14_DAYS">14 Days Overdue (Suspension Warning)</option>
                <option value="MANUAL_DISPATCH">Direct Bursary Manual Dispatch</option>
              </select>
            </div>

            {/* Live Message Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* SMS Preview Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-slate-700" />
                    SMS Preview (160 char)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600">GSM Standard</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed shadow-sm">
                  {defaultSmsPreview}
                </div>
              </div>

              {/* Email Preview Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-700" />
                    HTML Email Preview
                  </span>
                  <span className="text-[11px] font-mono text-blue-600">Encrypted</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 shadow-sm space-y-1">
                  <div className="font-bold text-slate-900">Apex Horizon Academy Bursary</div>
                  <div className="text-[11px] text-slate-500">
                    Subject: Payment Notice for {currentAccount?.studentName}
                  </div>
                  <div className="pt-1 text-[11px] text-slate-600">
                    Dear Parent, Outstanding: <strong>{formatNaira(currentAccount?.balanceDue || 0)}</strong>. Includes direct Paystack gateway settlement link.
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Custom Bursar Remarks (Optional Override)
              </label>
              <textarea
                rows={2}
                placeholder="Leave blank to use default automated template..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {dispatchSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Reminder successfully dispatched via telecom gateway.</span>
                </div>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Reminder</span>
              </button>
            </div>
          </form>

          {/* Audit History of Sent Reminders */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Reminder Dispatch Log ({reminders.length})
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {reminders.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No previous reminders recorded.
                </div>
              ) : (
                reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{rem.studentName}</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          ({rem.guardianName})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {rem.messageBody}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {rem.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(rem.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
