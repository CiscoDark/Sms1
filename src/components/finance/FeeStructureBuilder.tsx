import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Calendar,
  Layers,
  HelpCircle,
  Save,
  Tag,
  DollarSign,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  ClassLevel,
  ClassTermFeeStructure,
  FeeItem,
  FeeItemType,
  UserProfile,
} from '../../types';
import { formatNaira, parseNaira } from '../../lib/currency';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';

interface FeeStructureBuilderProps {
  levels: ClassLevel[];
  structures: ClassTermFeeStructure[];
  onSaveStructure: (structure: ClassTermFeeStructure) => void;
  currentUser: UserProfile;
  onLogAudit?: (action: string, details: string) => void;
}

const FEE_TYPE_CONFIG: Record<
  FeeItemType,
  { label: string; badgeVariant: 'primary' | 'success' | 'warning' | 'neutral' }
> = {
  TUITION: { label: 'Tuition & Academic', badgeVariant: 'primary' },
  PTA: { label: 'PTA Levy', badgeVariant: 'warning' },
  FEEDING: { label: 'Feeding / Lunch', badgeVariant: 'success' },
  TRANSPORT: { label: 'Transport / Bus', badgeVariant: 'neutral' },
  LAB_SCIENCE: { label: 'Science & ICT Lab', badgeVariant: 'primary' },
  EXAM_LEVY: { label: 'Official Exam Levy', badgeVariant: 'warning' },
  OTHER: { label: 'Auxiliary Levy', badgeVariant: 'neutral' },
};

export const FeeStructureBuilder: React.FC<FeeStructureBuilderProps> = ({
  levels,
  structures,
  onSaveStructure,
  currentUser,
  onLogAudit,
}) => {
  // Selected class level & term
  const [selectedLevelId, setSelectedLevelId] = useState<string>(levels[0]?.id || 'level-jss-1');
  const [sessionYear, setSessionYear] = useState<string>('2024/2025');
  const [termName, setTermName] = useState<string>('Third Term');

  const selectedLevel = levels.find((l) => l.id === selectedLevelId) || levels[0];

  // Find structure for selected level & term
  const activeStructure = structures.find(
    (s) =>
      s.classLevelId === selectedLevelId &&
      s.sessionYear === sessionYear &&
      s.termName.toLowerCase() === termName.toLowerCase()
  );

  // Local draft items
  const [items, setItems] = useState<FeeItem[]>(() => {
    return activeStructure ? activeStructure.items : [];
  });
  const [dueDate, setDueDate] = useState<string>(activeStructure?.dueDate || '2025-05-15');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Synchronize items when selected level changes
  React.useEffect(() => {
    if (activeStructure) {
      setItems(activeStructure.items);
      setDueDate(activeStructure.dueDate);
    } else {
      setItems([]);
    }
    setSaveSuccess(false);
  }, [selectedLevelId, sessionYear, termName, activeStructure]);

  // Form for adding a new itemized fee
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<FeeItemType>('TUITION');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemCompulsory, setNewItemCompulsory] = useState(true);
  const [newItemDesc, setNewItemDesc] = useState('');

  // Clone Modal
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneTargetLevelIds, setCloneTargetLevelIds] = useState<string[]>([]);

  // Calculated total amount
  const totalAmount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const compulsoryTotal = items
    .filter((it) => it.isCompulsory)
    .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  // Add Item handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const amt = parseNaira(newItemAmount);
    if (amt <= 0) return;

    const newItem: FeeItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newItemName.trim(),
      type: newItemType,
      amount: amt,
      isCompulsory: newItemCompulsory,
      description: newItemDesc.trim(),
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemAmount('');
    setNewItemDesc('');
    setIsAddingItem(false);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update Item Amount inline
  const handleAmountChange = (id: string, newAmt: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, amount: Math.max(0, newAmt) } : it))
    );
  };

  // Save current structure
  const handleSave = () => {
    const struct: ClassTermFeeStructure = {
      id:
        activeStructure?.id ||
        `fee-struct-${selectedLevel.id}-${sessionYear.replace('/', '-')}-${termName.replace(' ', '')}`,
      schoolId: 'school-apex-001',
      sessionYear,
      termName,
      classLevelId: selectedLevel.id,
      classLevelName: selectedLevel.name,
      items,
      totalAmount,
      dueDate,
      createdAt: activeStructure?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveStructure(struct);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    onLogAudit?.(
      'FEE_STRUCTURE_UPDATED',
      `Updated fee structure for ${selectedLevel.name} (${termName} ${sessionYear}): Total ${formatNaira(totalAmount)}`
    );
  };

  // Clone Structure to other levels
  const handleExecuteClone = () => {
    cloneTargetLevelIds.forEach((targetLvlId) => {
      const targetLvl = levels.find((l) => l.id === targetLvlId);
      if (!targetLvl) return;

      const clonedStruct: ClassTermFeeStructure = {
        id: `fee-struct-${targetLvl.id}-${sessionYear.replace('/', '-')}-${termName.replace(' ', '')}`,
        schoolId: 'school-apex-001',
        sessionYear,
        termName,
        classLevelId: targetLvl.id,
        classLevelName: targetLvl.name,
        items: [...items],
        totalAmount,
        dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSaveStructure(clonedStruct);
    });

    setIsCloneModalOpen(false);
    setCloneTargetLevelIds([]);
    onLogAudit?.(
      'FEE_STRUCTURE_CLONED',
      `Cloned ${selectedLevel.name} fee structure to ${cloneTargetLevelIds.length} classes`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Session, Term, Class Level Selector */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Class Term Fee Structure Builder</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure itemized tuition, PTA, feeding, and transport fees per academic level.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Session Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-slate-400">Session:</span>
              <select
                value={sessionYear}
                onChange={(e) => setSessionYear(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
              >
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
              </select>
            </div>

            {/* Term Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-slate-400">Term:</span>
              <select
                value={termName}
                onChange={(e) => setTermName(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            {/* Clone Button */}
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsCloneModalOpen(true)}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone to Classes</span>
            </Button>
          </div>
        </div>

        {/* Level Badges Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] uppercase font-bold text-slate-400 shrink-0 mr-1">
            Target Level:
          </span>
          {levels.map((lvl) => {
            const isSelected = lvl.id === selectedLevelId;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevelId(lvl.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {lvl.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Structure Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Header Summary */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-800/30">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {selectedLevel?.name} Fee Schedule
              </h3>
              <Badge variant="primary" size="sm">
                {items.length} Itemized Fees
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforced for all students enrolled in {selectedLevel?.name} ({termName} {sessionYear})
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Compulsory Total</div>
              <div className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">
                {formatNaira(compulsoryTotal)}
              </div>
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                Total Standard Billed
              </div>
              <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {formatNaira(totalAmount)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                className="gap-2"
                onClick={handleSave}
              >
                <Save className="w-4 h-4" />
                <span>Save Structure</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Due Date Row */}
        <div className="px-6 py-3 bg-amber-50/50 dark:bg-amber-950/20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">Payment Deadline / Due Date:</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
            />
          </div>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved successfully!</span>
            </motion.div>
          )}
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 w-12">#</th>
                <th className="p-4">Fee Item & Scope</th>
                <th className="p-4">Category</th>
                <th className="p-4">Requirement</th>
                <th className="p-4 text-right">Amount (₦)</th>
                <th className="p-4 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => {
                const typeCfg = FEE_TYPE_CONFIG[item.type] || FEE_TYPE_CONFIG.OTHER;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={typeCfg.badgeVariant} size="sm">
                        {typeCfg.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {item.isCompulsory ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Optional (Add-on)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 font-mono">₦</span>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            handleAmountChange(item.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-24 text-right font-mono font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete fee item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No fee items defined yet for this class. Click "Add Fee Item" below to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Item Trigger / Form */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          {!isAddingItem ? (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => setIsAddingItem(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Fee Item</span>
            </Button>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddItem}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  Add Itemized Fee Line
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Fee Item Name *
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Cambridge Checkpoint Exam"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Category *
                  </label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as FeeItemType)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="TUITION">Tuition & Instruction</option>
                    <option value="PTA">PTA Development Levy</option>
                    <option value="FEEDING">Feeding / Lunch Program</option>
                    <option value="TRANSPORT">School Bus Transport</option>
                    <option value="LAB_SCIENCE">Science & ICT Lab</option>
                    <option value="EXAM_LEVY">National/State Exam Levy</option>
                    <option value="OTHER">Auxiliary Levy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Description / Scope
                  </label>
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="e.g. Mandatory for all term candidates"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="compulsoryToggle"
                    checked={newItemCompulsory}
                    onChange={(e) => setNewItemCompulsory(e.target.checked)}
                    className="w-4 h-4 rounded-md text-indigo-600"
                  />
                  <label
                    htmlFor="compulsoryToggle"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Compulsory for all enrolled students
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Item
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>

      {/* Clone Modal */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Clone Fee Structure to Other Classes
            </h3>
            <p className="text-xs text-slate-500">
              Duplicate the {selectedLevel?.name} fee schedule ({formatNaira(totalAmount)}) across other class levels for {termName}.
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {levels
                .filter((lvl) => lvl.id !== selectedLevelId)
                .map((lvl) => {
                  const checked = cloneTargetLevelIds.includes(lvl.id);
                  return (
                    <label
                      key={lvl.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCloneTargetLevelIds((prev) => [...prev, lvl.id]);
                          } else {
                            setCloneTargetLevelIds((prev) =>
                              prev.filter((id) => id !== lvl.id)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded-md text-indigo-600"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {lvl.name}
                      </span>
                    </label>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCloneModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteClone}
                disabled={cloneTargetLevelIds.length === 0}
              >
                Clone to {cloneTargetLevelIds.length} Classes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
