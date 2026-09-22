import React, { useState } from 'react';
import {
  X,
  Tag,
  Plus,
  Percent,
  Check,
  CheckCircle2,
  Calendar,
  Users,
  Briefcase,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  FeeDiscountRule,
  StudentFeeAccount,
  AppliedDiscount,
} from '../../types';
import {
  getAvailableDiscountRules,
  toggleDiscountRule,
  addDiscountRule,
  applyDiscountsToStudentAccount,
} from '../../lib/fee-store';
import { formatNaira } from '../../lib/currency';

interface DiscountWaiverEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAccount?: StudentFeeAccount | null;
  onAccountUpdated?: (updated: StudentFeeAccount) => void;
}

export default function DiscountWaiverEngineModal({
  isOpen,
  onClose,
  targetAccount,
  onAccountUpdated,
}: DiscountWaiverEngineModalProps) {
  const [rules, setRules] = useState<FeeDiscountRule[]>(() => getAvailableDiscountRules());
  const [activeTab, setActiveTab] = useState<'RULES' | 'APPLY_STUDENT'>(
    targetAccount ? 'APPLY_STUDENT' : 'RULES'
  );

  // Student specific application state
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>(() => {
    return targetAccount?.appliedDiscounts?.map((d) => d.ruleId) || [];
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Custom rule creation state
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<FeeDiscountRule['type']>('CUSTOM');
  const [newCalculationType, setNewCalculationType] = useState<FeeDiscountRule['calculationType']>('PERCENTAGE');
  const [newValue, setNewValue] = useState(10);
  const [newDescription, setNewDescription] = useState('');

  if (!isOpen) return null;

  const handleToggleRuleActive = (ruleId: string) => {
    const updated = toggleDiscountRule(ruleId);
    setRules(updated);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || newValue <= 0) return;

    const newRule: FeeDiscountRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      type: newRuleType,
      calculationType: newCalculationType,
      value: Number(newValue),
      description: newDescription.trim() || `${newRuleName} concession`,
      isActive: true,
    };

    const updated = addDiscountRule(newRule);
    setRules(updated);
    setShowAddRule(false);
    setNewRuleName('');
    setNewDescription('');
  };

  const handleToggleStudentRule = (ruleId: string) => {
    setSelectedRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  // Compute live preview if applying to a student
  const studentGross = targetAccount ? (targetAccount.grossBilled || targetAccount.totalBilled) : 0;
  const computedDiscounts: AppliedDiscount[] = selectedRuleIds.map((ruleId) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return null;

    let amountSaved = 0;
    if (rule.calculationType === 'PERCENTAGE') {
      amountSaved = Math.round((studentGross * rule.value) / 100);
    } else {
      amountSaved = Math.min(rule.value, studentGross);
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      discountType: rule.type,
      amountSaved,
      appliedAt: new Date().toISOString(),
      notes: `Applied rule: ${rule.name}`,
    };
  }).filter(Boolean) as AppliedDiscount[];

  const totalSavings = computedDiscounts.reduce((sum, d) => sum + d.amountSaved, 0);
  const projectedNetBilled = Math.max(0, studentGross - totalSavings);

  const handleSaveStudentDiscounts = () => {
    if (!targetAccount) return;
    const res = applyDiscountsToStudentAccount(targetAccount.studentId, computedDiscounts);
    if (res.success && res.account) {
      setSaveSuccess(true);
      onAccountUpdated?.(res.account);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    }
  };

  const getRuleIcon = (type: FeeDiscountRule['type']) => {
    switch (type) {
      case 'SIBLING':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'EARLY_PAYMENT':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'STAFF_CHILD':
        return <Briefcase className="w-4 h-4 text-amber-600" />;
      case 'MERIT_SCHOLARSHIP':
        return <Award className="w-4 h-4 text-purple-600" />;
      default:
        return <Tag className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Discount & Waiver Engine</h2>
              <p className="text-xs text-slate-500">
                Rule-based tuition concessions, sibling allowances, and staff-child waivers
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('RULES')}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'RULES'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Configured Concession Rules ({rules.length})
          </button>
          {targetAccount && (
            <button
              onClick={() => setActiveTab('APPLY_STUDENT')}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === 'APPLY_STUDENT'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Assign to: {targetAccount.studentName}
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'RULES' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active School Discount Rules</h3>
                  <p className="text-xs text-slate-500">
                    Toggle automatic eligibility rules or add custom academic waivers
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRule(!showAddRule)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddRule ? 'Cancel' : 'New Rule'}</span>
                </button>
              </div>

              {/* Add New Rule Drawer */}
              {showAddRule && (
                <form
                  onSubmit={handleCreateRule}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Create Concession Rule
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Rule Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sports Champion 25% Waiver"
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Category
                      </label>
                      <select
                        value={newRuleType}
                        onChange={(e) => setNewRuleType(e.target.value as any)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="SIBLING">Sibling Discount</option>
                        <option value="EARLY_PAYMENT">Early-Payment Discount</option>
                        <option value="STAFF_CHILD">Staff-Child Concession</option>
                        <option value="MERIT_SCHOLARSHIP">Merit Scholarship</option>
                        <option value="CUSTOM">Custom Bursary Concession</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Calculation Type
                      </label>
                      <select
                        value={newCalculationType}
                        onChange={(e) => setNewCalculationType(e.target.value as any)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED_AMOUNT">Fixed Lump Sum (₦)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Value ({newCalculationType === 'PERCENTAGE' ? '%' : '₦'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newValue}
                        onChange={(e) => setNewValue(Number(e.target.value))}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Description / Eligibility Criteria
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Applicable to students representing school in state athletics"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRule(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                      Save Rule
                    </button>
                  </div>
                </form>
              )}

              {/* Rules List */}
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                      rule.isActive
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 mt-0.5">
                        {getRuleIcon(rule.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{rule.name}</h4>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                            {rule.calculationType === 'PERCENTAGE'
                              ? `${rule.value}% Off`
                              : `${formatNaira(rule.value)} Waiver`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{rule.description}</p>
                        {rule.earlyPaymentCutoffDate && (
                          <div className="mt-1 text-xs text-emerald-700 flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Cutoff: {rule.earlyPaymentCutoffDate}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleRuleActive(rule.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                        rule.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'APPLY_STUDENT' && targetAccount && (
            <div className="space-y-5">
              {/* Student Summary Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Target Student
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {targetAccount.studentName}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {targetAccount.admissionNumber} • {targetAccount.classLevel} ({targetAccount.classArm})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Gross Term Billing</div>
                  <div className="text-base font-bold text-slate-900">
                    {formatNaira(studentGross)}
                  </div>
                </div>
              </div>

              {/* Select rules to apply */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Select Concessions to Apply
                </div>
                {rules
                  .filter((r) => r.isActive)
                  .map((rule) => {
                    const isSelected = selectedRuleIds.includes(rule.id);
                    const estimatedSavings =
                      rule.calculationType === 'PERCENTAGE'
                        ? Math.round((studentGross * rule.value) / 100)
                        : Math.min(rule.value, studentGross);

                    return (
                      <div
                        key={rule.id}
                        onClick={() => handleToggleStudentRule(rule.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{rule.name}</div>
                            <div className="text-xs text-slate-500">{rule.description}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-700">
                            -{formatNaira(estimatedSavings)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {rule.calculationType === 'PERCENTAGE' ? `${rule.value}%` : 'Flat'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Concession Impact Calculation */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Gross Tuition & Levies</span>
                  <span>{formatNaira(studentGross)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span>Total Concession / Waivers</span>
                  <span>-{formatNaira(totalSavings)}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-sm font-bold text-white">
                  <span>Net Term Billing</span>
                  <span>{formatNaira(projectedNetBilled)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Current Paid to Date</span>
                  <span>{formatNaira(targetAccount.totalPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
                  <span>Updated Outstanding Balance</span>
                  <span>{formatNaira(Math.max(0, projectedNetBilled - targetAccount.totalPaid))}</span>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Student fee account successfully updated with concessions.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Audited under School Bursary Concession By-Laws</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Close
            </button>
            {activeTab === 'APPLY_STUDENT' && targetAccount && (
              <button
                onClick={handleSaveStudentDiscounts}
                className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 shadow-sm transition"
              >
                Apply Concessions
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
