import React, { useState } from 'react';
import {
  Wand2,
  Building2,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { ClassLevel, ClassArm, SchoolNomenclature, EducationCategory } from '../../types';
import {
  HIERARCHY_PRESETS,
  ARM_NAMING_PRESETS,
  HierarchyTemplate,
} from '../../lib/class-structure-store';
import { FACULTY_MEMBERS } from '../../data/mockData';
import { Modal, Button, Input, Badge, Card } from '../../design-system';

export interface HierarchyBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLevels: ClassLevel[];
  nomenclature: SchoolNomenclature;
  onApplyHierarchy: (newLevels: ClassLevel[], isAdditiveMerge: boolean) => void;
}

export const HierarchyBuilderModal: React.FC<HierarchyBuilderModalProps> = ({
  isOpen,
  onClose,
  existingLevels,
  nomenclature,
  onApplyHierarchy,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('nigerian-secondary');
  const [customLevelCount, setCustomLevelCount] = useState<number>(6);
  const [levelPrefix, setLevelPrefix] = useState<string>('Grade');
  const [codePrefix, setCodePrefix] = useState<string>('GR');
  const [armsPerLevel, setArmsPerLevel] = useState<number>(3);
  const [selectedArmScheme, setSelectedArmScheme] = useState<string>('precious-stones');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isAdditiveMerge, setIsAdditiveMerge] = useState<boolean>(true);

  // Check if existing levels contain actively enrolled students
  const totalEnrolledStudents = existingLevels.reduce(
    (sum, l) => sum + l.arms.reduce((asum, a) => asum + a.enrolledCount, 0),
    0
  );

  const activePreset = HIERARCHY_PRESETS.find((p) => p.id === selectedPresetId) || HIERARCHY_PRESETS[0];

  const handleApply = () => {
    const armScheme = ARM_NAMING_PRESETS.find((s) => s.id === selectedArmScheme) || ARM_NAMING_PRESETS[0];
    let generatedLevels: ClassLevel[] = [];

    if (!isCustomMode) {
      // Build from selected preset
      generatedLevels = activePreset.levels.map((lvl, lIdx) => {
        const levelId = `lvl-${activePreset.id}-${lIdx + 1}-${Date.now()}`;
        const arms: ClassArm[] = [];
        for (let i = 0; i < armsPerLevel; i++) {
          const armName = armScheme.arms[i] || `Stream ${i + 1}`;
          const teacher = FACULTY_MEMBERS[(lIdx * armsPerLevel + i) % FACULTY_MEMBERS.length] || FACULTY_MEMBERS[0];
          arms.push({
            id: `arm-${levelId}-${i + 1}`,
            levelId,
            name: armName,
            code: `${lvl.code}-${armName.charAt(0).toUpperCase()}`,
            roomNumber: `Block ${lvl.category.startsWith('JSS') || lvl.category === 'PRIMARY' ? 'A' : 'B'} - Rm ${100 + i + 1}`,
            teacherId: teacher.id,
            teacherName: teacher.name,
            teacherEmail: teacher.email,
            capacity: 35,
            enrolledCount: 0,
            status: 'ACTIVE',
            maleCount: 0,
            femaleCount: 0,
            averageGrade: 'Pending',
            attendanceRate: 100,
          });
        }

        return {
          id: levelId,
          name: lvl.name,
          code: lvl.code,
          category: lvl.category,
          order: isAdditiveMerge ? existingLevels.length + lIdx + 1 : lIdx + 1,
          description: lvl.description,
          arms,
        };
      });
    } else {
      // Build from custom quantity
      for (let lIdx = 1; lIdx <= customLevelCount; lIdx++) {
        const levelId = `lvl-custom-${lIdx}-${Date.now()}`;
        const levelName = `${levelPrefix} ${lIdx}`;
        const lCode = `${codePrefix}${lIdx}`;
        const arms: ClassArm[] = [];

        for (let i = 0; i < armsPerLevel; i++) {
          const armName = armScheme.arms[i] || `Stream ${i + 1}`;
          const teacher = FACULTY_MEMBERS[(lIdx * armsPerLevel + i) % FACULTY_MEMBERS.length] || FACULTY_MEMBERS[0];
          arms.push({
            id: `arm-${levelId}-${i + 1}`,
            levelId,
            name: armName,
            code: `${lCode}-${armName.charAt(0).toUpperCase()}`,
            roomNumber: `Wing C - Rm ${200 + i + 1}`,
            teacherId: teacher.id,
            teacherName: teacher.name,
            teacherEmail: teacher.email,
            capacity: 35,
            enrolledCount: 0,
            status: 'ACTIVE',
            maleCount: 0,
            femaleCount: 0,
            averageGrade: 'Pending',
            attendanceRate: 100,
          });
        }

        const category: EducationCategory =
          lIdx <= Math.ceil(customLevelCount / 2) ? 'JUNIOR_SECONDARY' : 'SENIOR_SECONDARY';

        generatedLevels.push({
          id: levelId,
          name: levelName,
          code: lCode,
          category,
          order: isAdditiveMerge ? existingLevels.length + lIdx : lIdx,
          description: `Custom configured ${nomenclature.levelTermSingular} ${lIdx}`,
          arms,
        });
      }
    }

    onApplyHierarchy(generatedLevels, isAdditiveMerge);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              Class Hierarchy & Level Builder
            </div>
            <div className="text-xs font-normal text-slate-500 dark:text-slate-400">
              Instantly configure the number of {nomenclature.levelTermPlural.toLowerCase()} and {nomenclature.armTermPlural.toLowerCase()} per level.
            </div>
          </div>
        </div>
      }
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Non-destructive safety: Existing student records will never be lost.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isAdditiveMerge ? 'Add Levels to Structure' : 'Apply New Hierarchy'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-200">
        {/* Enrolled Student Non-Destructive Protection Notice */}
        {totalEnrolledStudents > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-200">
                System Invariant Active: Non-Destructive Protection
              </div>
              <div className="text-amber-700 dark:text-amber-300">
                You have <strong>{totalEnrolledStudents} actively enrolled students</strong> in the system. New levels will be added additively to preserve all existing class rosters and historical records.
              </div>
            </div>
          </div>
        )}

        {/* Builder Mode Selector */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-medium">
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer ${
              !isCustomMode
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Educational System Presets
          </button>
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer ${
              isCustomMode
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Custom Level Count & Hierarchy
          </button>
        </div>

        {!isCustomMode ? (
          /* Preset Selector */
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Educational Tier Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HIERARCHY_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700/70 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {preset.name}
                      </span>
                      <Badge variant={isSelected ? 'primary' : 'neutral'} size="sm">
                        {preset.levels.length} Levels
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {preset.description}
                    </p>
                    <div className="pt-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                      {preset.levels.map((l) => l.code).join(' → ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Custom Level Count Form */
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Configure Custom Level Structure
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label={`Number of ${nomenclature.levelTermPlural} (1 - 14)`}
                type="number"
                min={1}
                max={14}
                value={customLevelCount}
                onChange={(e) => setCustomLevelCount(Math.max(1, Math.min(14, parseInt(e.target.value, 10) || 1)))}
              />
              <Input
                label="Prefix Label"
                value={levelPrefix}
                onChange={(e) => setLevelPrefix(e.target.value)}
                placeholder="e.g. Grade, Form, Year, Primary"
              />
              <Input
                label="Code Prefix"
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value)}
                placeholder="e.g. G, Y, P"
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Preview sequence: {Array.from({ length: customLevelCount }, (_, i) => `${codePrefix}${i + 1}`).join(', ')}
            </div>
          </div>
        )}

        {/* Arm / Sub-category Settings */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" />
              {nomenclature.armTermPlural} (Streams) Configuration per {nomenclature.levelTermSingular}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Fully renameable anytime
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                Streams per Level (1 - 6)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setArmsPerLevel(num)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      armsPerLevel === num
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                Default Stream Naming Scheme
              </label>
              <select
                value={selectedArmScheme}
                onChange={(e) => setSelectedArmScheme(e.target.value)}
                className="w-full rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-2 min-h-[38px] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                {ARM_NAMING_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheme Preview */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-slate-400 text-[11px]">Generated streams per level:</span>
            {ARM_NAMING_PRESETS.find((s) => s.id === selectedArmScheme)
              ?.arms.slice(0, armsPerLevel)
              .map((armName) => (
                <Badge key={armName} variant="neutral" size="sm">
                  {armName}
                </Badge>
              ))}
          </div>
        </div>

        {/* Additive merge vs Restructure selector */}
        {totalEnrolledStudents === 0 && existingLevels.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <input
              type="checkbox"
              id="additive-toggle"
              checked={isAdditiveMerge}
              onChange={(e) => setIsAdditiveMerge(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="additive-toggle" className="text-slate-700 dark:text-slate-300 cursor-pointer">
              <strong>Additive Mode:</strong> Keep existing {existingLevels.length} levels and append newly configured levels to the bottom.
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
};
