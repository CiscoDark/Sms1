import React, { useState } from 'react';
import { Settings, Sparkles, CheckCircle2, Sliders, BookOpen, Layers } from 'lucide-react';
import { SchoolNomenclature } from '../../types';
import { Modal, Input, Button, Badge, Card } from '../../design-system';

export interface NomenclatureSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nomenclature: SchoolNomenclature;
  onSave: (updated: SchoolNomenclature) => void;
}

const LEVEL_PRESETS = [
  { singular: 'Class', plural: 'Classes' },
  { singular: 'Grade', plural: 'Grades' },
  { singular: 'Form', plural: 'Forms' },
  { singular: 'Year', plural: 'Years' },
  { singular: 'Level', plural: 'Levels' },
  { singular: 'Stage', plural: 'Stages' },
];

const ARM_PRESETS = [
  { singular: 'Arm', plural: 'Arms' },
  { singular: 'Stream', plural: 'Streams' },
  { singular: 'Section', plural: 'Sections' },
  { singular: 'House', plural: 'Houses' },
  { singular: 'Division', plural: 'Divisions' },
  { singular: 'Set', plural: 'Sets' },
];

export const NomenclatureSettingsModal: React.FC<NomenclatureSettingsModalProps> = ({
  isOpen,
  onClose,
  nomenclature,
  onSave,
}) => {
  const [formData, setFormData] = useState<SchoolNomenclature>({ ...nomenclature });

  const handleApplyPreset = (level: { singular: string; plural: string }, arm: { singular: string; plural: string }) => {
    setFormData((prev) => ({
      ...prev,
      levelTermSingular: level.singular,
      levelTermPlural: level.plural,
      armTermSingular: arm.singular,
      armTermPlural: arm.plural,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              School Hierarchy Nomenclature & Terminology
            </div>
            <div className="text-xs font-normal text-slate-500 dark:text-slate-400">
              Customize the institutional terms for class levels and streams to match your school system.
            </div>
          </div>
        </div>
      }
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Applies across timetables, fees, report cards, and student records</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Save Terminology
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-200">
        {/* Quick Style Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Common Educational Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset({ singular: 'Class', plural: 'Classes' }, { singular: 'Arm', plural: 'Arms' })}
              className="p-2.5 text-left rounded-xl border border-slate-200 dark:border-slate-700/70 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 transition-all text-xs cursor-pointer group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Nigerian Standard
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Class / Arm (e.g. JSS 1 Gold)</div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset({ singular: 'Grade', plural: 'Grades' }, { singular: 'Section', plural: 'Sections' })}
              className="p-2.5 text-left rounded-xl border border-slate-200 dark:border-slate-700/70 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 transition-all text-xs cursor-pointer group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                American System
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Grade / Section (e.g. Grade 9 A)</div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset({ singular: 'Year', plural: 'Years' }, { singular: 'Form', plural: 'Forms' })}
              className="p-2.5 text-left rounded-xl border border-slate-200 dark:border-slate-700/70 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 transition-all text-xs cursor-pointer group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                British Cambridge
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Year / Form (e.g. Year 8 Red)</div>
            </button>
          </div>
        </div>

        {/* Level Term Configuration */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              Primary Hierarchy Tier (Level / Grade)
            </span>
            <span className="text-[11px] text-slate-400">Represents the academic year tier</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Singular Term (e.g. Class, Grade, Form, Year)"
              value={formData.levelTermSingular}
              onChange={(e) => setFormData((prev) => ({ ...prev, levelTermSingular: e.target.value }))}
              placeholder="Class"
            />
            <Input
              label="Plural Term (e.g. Classes, Grades, Forms, Years)"
              value={formData.levelTermPlural}
              onChange={(e) => setFormData((prev) => ({ ...prev, levelTermPlural: e.target.value }))}
              placeholder="Classes"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400">Suggestions:</span>
            {LEVEL_PRESETS.map((p) => (
              <button
                key={p.singular}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    levelTermSingular: p.singular,
                    levelTermPlural: p.plural,
                  }))
                }
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  formData.levelTermSingular.toLowerCase() === p.singular.toLowerCase()
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p.singular}
              </button>
            ))}
          </div>
        </div>

        {/* Arm Term Configuration */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              Sub-Category Tier (Arm / Stream / Section / House)
            </span>
            <span className="text-[11px] text-slate-400">Represents parallel classroom streams</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Singular Term (e.g. Arm, Stream, Section, House)"
              value={formData.armTermSingular}
              onChange={(e) => setFormData((prev) => ({ ...prev, armTermSingular: e.target.value }))}
              placeholder="Arm"
            />
            <Input
              label="Plural Term (e.g. Arms, Streams, Sections, Houses)"
              value={formData.armTermPlural}
              onChange={(e) => setFormData((prev) => ({ ...prev, armTermPlural: e.target.value }))}
              placeholder="Arms"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400">Suggestions:</span>
            {ARM_PRESETS.map((p) => (
              <button
                key={p.singular}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    armTermSingular: p.singular,
                    armTermPlural: p.plural,
                  }))
                }
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  formData.armTermSingular.toLowerCase() === p.singular.toLowerCase()
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p.singular}
              </button>
            ))}
          </div>
        </div>

        {/* Live UI Preview Box */}
        <Card className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50 space-y-2">
          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
            <span>Live System Terminology Preview</span>
            <Badge variant="primary" size="sm">Dynamic Resolution</Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Buttons and headers across the application will dynamically render:
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 font-medium text-slate-800 dark:text-slate-200">
              "Add New {formData.levelTermSingular}"
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 font-medium text-slate-800 dark:text-slate-200">
              "Configure {formData.armTermSingular} (Diamond)"
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 font-medium text-slate-800 dark:text-slate-200">
              "{formData.levelTermSingular} Captain & Assistant"
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 font-medium text-slate-800 dark:text-slate-200">
              "All {formData.levelTermPlural} ({formData.armTermPlural})"
            </span>
          </div>
        </Card>
      </div>
    </Modal>
  );
};
