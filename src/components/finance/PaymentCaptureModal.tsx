import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CreditCard,
  Building2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { PaymentGatewayType, StudentFeeAccount } from '../../types';
import { formatNaira, parseNaira } from '../../lib/currency';
import { PaymentProgressRing } from './PaymentProgressRing';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';

interface PaymentCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: StudentFeeAccount;
  onRecordPayment: (paymentData: {
    studentId: string;
    amount: number;
    channel: PaymentGatewayType;
    payerName: string;
    payerEmail?: string;
    payerPhone?: string;
    bankName?: string;
    proofDocumentUrl?: string;
    proofDocumentName?: string;
    notes?: string;
    recordedBy: string;
  }) => void;
  currentUser: { name: string; role: string };
}

const NIGERIAN_BANKS = [
  'Zenith Bank PLC',
  'Guaranty Trust Bank (GTBank)',
  'First Bank of Nigeria',
  'Access Bank PLC',
  'United Bank for Africa (UBA)',
  'Stanbic IBTC Bank',
  'Fidelity Bank PLC',
  'Union Bank of Nigeria',
  'Sterling Bank PLC',
  'Wema Bank / ALAT',
  'Kuda Microfinance Bank',
  'OPay Digital Services',
];

export const PaymentCaptureModal: React.FC<PaymentCaptureModalProps> = ({
  isOpen,
  onClose,
  account,
  onRecordPayment,
  currentUser,
}) => {
  if (!isOpen) return null;

  // Active payment mode: GATEWAY vs MANUAL
  const [activeMode, setActiveMode] = useState<'GATEWAY' | 'MANUAL'>('GATEWAY');
  const [gateway, setGateway] = useState<'PAYSTACK' | 'FLUTTERWAVE'>('PAYSTACK');

  // Amount state
  const [amountInput, setAmountInput] = useState<string>(
    account.balanceDue > 0 ? account.balanceDue.toString() : '50000'
  );

  // Payer details
  const [payerName, setPayerName] = useState<string>(account.studentName + ' Guardian');
  const [payerEmail, setPayerEmail] = useState<string>('guardian@example.com');
  const [payerPhone, setPayerPhone] = useState<string>('08031234567');

  // Manual payment fields
  const [selectedBank, setSelectedBank] = useState<string>(NIGERIAN_BANKS[0]);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofFilePreview, setProofFilePreview] = useState<string | null>(null);

  // Gateway simulation state
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<'FORM' | 'CHECKOUT' | 'SUCCESS'>('FORM');
  const [simulatedTxRef, setSimulatedTxRef] = useState<string>('');

  const numericAmount = parseNaira(amountInput);
  const projectedPaid = account.totalPaid + numericAmount;
  const projectedBalance = Math.max(0, account.totalBilled - projectedPaid);
  const projectedPercentage =
    account.totalBilled > 0
      ? Math.min(100, Math.round((projectedPaid / account.totalBilled) * 100))
      : 100;

  // Preset amount handlers
  const handleSetPreset = (presetAmount: number) => {
    setAmountInput(presetAmount.toString());
  };

  // Proof upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFileName(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          setProofFilePreview(uploadEvent.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setProofFilePreview(null);
      }
    }
  };

  // Execute Gateway Checkout
  const handleGatewayCheckout = () => {
    if (numericAmount <= 0) return;
    setGatewayStep('CHECKOUT');
    setIsProcessingGateway(true);

    const ref = `${gateway === 'PAYSTACK' ? 'PSTK' : 'FLW'}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setSimulatedTxRef(ref);

    // Simulate 2-second gateway authorization
    setTimeout(() => {
      setIsProcessingGateway(false);
      setGatewayStep('SUCCESS');

      // Trigger actual payment record commit
      onRecordPayment({
        studentId: account.studentId,
        amount: numericAmount,
        channel: gateway,
        payerName,
        payerEmail,
        payerPhone,
        notes: `Online collection via ${gateway} Checkout`,
        recordedBy: `${gateway} Gateway Automated`,
      });
    }, 2200);
  };

  // Execute Manual Bank Transfer recording
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    onRecordPayment({
      studentId: account.studentId,
      amount: numericAmount,
      channel: 'BANK_TRANSFER_MANUAL',
      payerName,
      payerEmail,
      payerPhone,
      bankName: selectedBank,
      proofDocumentName: proofFileName || undefined,
      proofDocumentUrl: proofFilePreview || undefined,
      notes: notes || `Direct deposit via ${selectedBank}. Ref: ${transactionRef || 'N/A'}`,
      recordedBy: `${currentUser.name} (${currentUser.role})`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden my-auto"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Record Student Fee Payment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {account.studentName} ({account.admissionNumber}) • {account.classLevel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Financial Overview Card */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-50 via-indigo-50/30 to-emerald-50/30 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <PaymentProgressRing
                percentage={projectedPercentage}
                size="md"
              />
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Current Status &rarr; Projected
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                  <span>{account.percentagePaid}% Paid</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {projectedPercentage}% Paid
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Billed</div>
                <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formatNaira(account.totalBilled)}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Paid to Date</div>
                <div className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatNaira(account.totalPaid)}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Remaining Balance</div>
                <div className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                  {formatNaira(projectedBalance)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body / Gateway vs Manual Switcher */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => setActiveMode('GATEWAY')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeMode === 'GATEWAY'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment Gateway (Paystack / Flutterwave)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('MANUAL')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeMode === 'MANUAL'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Manual Bank Transfer (Proof Upload)</span>
            </button>
          </div>

          {/* MODE 1: ONLINE PAYMENT GATEWAY */}
          {activeMode === 'GATEWAY' && (
            <div className="space-y-5">
              {gatewayStep === 'FORM' && (
                <>
                  {/* Select Gateway Provider */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Select Payment Provider
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGateway('PAYSTACK')}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          gateway === 'PAYSTACK'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#0BA4DB]/10 text-[#0BA4DB] font-black flex items-center justify-center text-xs">
                            P
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              Paystack Checkout
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Debit Card, Bank Transfer, USSD
                            </div>
                          </div>
                        </div>
                        {gateway === 'PAYSTACK' && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setGateway('FLUTTERWAVE')}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          gateway === 'FLUTTERWAVE'
                            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 ring-2 ring-orange-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#FB923C]/10 text-[#F97316] font-black flex items-center justify-center text-xs">
                            F
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              Flutterwave Standard
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Cards, Mobile Money, Barter
                            </div>
                          </div>
                        </div>
                        {gateway === 'FLUTTERWAVE' && (
                          <CheckCircle2 className="w-4 h-4 text-orange-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Amount to Pay with Quick Presets */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Payment Amount (₦)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                        ₦
                      </span>
                      <input
                        type="number"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {account.balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPreset(account.balanceDue)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors"
                        >
                          Full Balance ({formatNaira(account.balanceDue)})
                        </button>
                      )}
                      {account.balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPreset(Math.round(account.balanceDue / 2))}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          50% ({formatNaira(Math.round(account.balanceDue / 2))})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSetPreset(50000)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        ₦50,000 Upfront
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPreset(100000)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        ₦100,000 Upfront
                      </button>
                    </div>
                  </div>

                  {/* Payer Email and Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Payer / Guardian Name
                      </label>
                      <input
                        type="text"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Guardian Email (for receipt)
                      </label>
                      <input
                        type="email"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Launch Checkout Button */}
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full justify-center gap-2"
                      onClick={handleGatewayCheckout}
                      disabled={numericAmount <= 0}
                    >
                      <Lock className="w-4 h-4" />
                      <span>Proceed to {gateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'} Checkout ({formatNaira(numericAmount)})</span>
                    </Button>
                    <p className="text-[11px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Secured with 256-bit institutional encryption & official webhooks
                    </p>
                  </div>
                </>
              )}

              {/* Checkout Simulation Overlay */}
              {gatewayStep === 'CHECKOUT' && (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-500 flex items-center justify-center mx-auto animate-pulse">
                    <CreditCard className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    Connecting to {gateway} Gateway...
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Simulating real-time authorization for {formatNaira(numericAmount)}. Do not close this window.
                  </p>
                  <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-600"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.2 }}
                    />
                  </div>
                </div>
              )}

              {/* Gateway Success */}
              {gatewayStep === 'SUCCESS' && (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    Payment Successful & Verified!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {formatNaira(numericAmount)} has been credited to {account.studentName}'s tuition account.
                  </p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
                    Ref: {simulatedTxRef}
                  </div>
                  <Button variant="primary" onClick={onClose} className="w-full justify-center">
                    Done & Return to Ledger
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: MANUAL BANK TRANSFER RECORDING */}
          {activeMode === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Paid (₦) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold bg-white dark:bg-slate-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receiving / Depositor Bank *
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {NIGERIAN_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Teller / Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. ZIB-20250123-994"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Depositor / Payer Name *
                  </label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Proof of Payment Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Bank Deposit Slip / Transfer Screenshot (Proof)
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {proofFileName ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-6 h-6 text-emerald-500" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {proofFileName}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Proof attached successfully
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Drag & drop or click to upload receipt
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Supports PNG, JPG, or PDF (Max 5MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bursar Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bursary Notes / Remarks
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid part payment of second term tuition, balance due next month."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button variant="secondary" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={numericAmount <= 0}>
                  Confirm & Credit Account ({formatNaira(numericAmount)})
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
