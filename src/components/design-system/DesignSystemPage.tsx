import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Eye,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Input,
  Modal,
  Drawer,
  ProgressRing,
  CountUp,
  Skeleton,
  EmptyState,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '../../design-system';
import { InlineEditableLabel } from '../InlineEditableLabel';

export const DesignSystemPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editableValue, setEditableValue] = useState('Senior Secondary Class 3 (Science)');
  const [sampleInput, setSampleInput] = useState('Horizon Academy Lagos');
  const [sampleErrorInput, setSampleErrorInput] = useState('Invalid code');

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            SMS Design System Component Library
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Standardized UI component primitives, motion tokens, typography, and states for the School Management System.
        </p>
      </div>

      {/* 1. Buttons */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Button Variants & Sizes
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm">
            Primary Small
          </Button>
          <Button variant="primary" size="md">
            Primary Medium
          </Button>
          <Button variant="primary" size="lg">
            Primary Large
          </Button>
          <Button variant="secondary" size="md">
            Secondary
          </Button>
          <Button variant="outline" size="md">
            Outline
          </Button>
          <Button variant="ghost" size="md">
            Ghost
          </Button>
          <Button variant="danger" size="md">
            Danger Action
          </Button>
          <Button variant="primary" size="md" isLoading>
            Loading
          </Button>
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            With Icon
          </Button>
        </div>
      </Card>

      {/* 2. Badges */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Status Badges
        </h3>
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="success" hasDot>
            Active Term
          </Badge>
          <Badge variant="warning" hasDot>
            Pending Review
          </Badge>
          <Badge variant="info" hasDot>
            Scheduled
          </Badge>
          <Badge variant="danger" hasDot>
            Overdue Fee
          </Badge>
          <Badge variant="primary" hasDot>
            Super Admin
          </Badge>
          <Badge variant="neutral">Archived (2023)</Badge>
        </div>
      </Card>

      {/* 3. Progress Rings & Animated Counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Progress Rings
          </h3>
          <div className="flex items-center gap-6">
            <div className="text-center space-y-1">
              <ProgressRing percentage={88} size={64} strokeWidth={5} color="primary" />
              <div className="text-xs text-slate-500">Enrollment</div>
            </div>
            <div className="text-center space-y-1">
              <ProgressRing percentage={100} size={64} strokeWidth={5} color="success" />
              <div className="text-xs text-slate-500">Attendance</div>
            </div>
            <div className="text-center space-y-1">
              <ProgressRing percentage={65} size={64} strokeWidth={5} color="warning" />
              <div className="text-xs text-slate-500">Fee Clearance</div>
            </div>
            <div className="text-center space-y-1">
              <ProgressRing percentage={25} size={64} strokeWidth={5} color="danger" />
              <div className="text-xs text-slate-500">Vacancy</div>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Animated Counters (CountUp)
          </h3>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                <CountUp end={1240} duration={1200} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Students</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                <CountUp end={98.4} decimals={1} suffix="%" duration={1000} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Pass Rate</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                <CountUp end={42} duration={800} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Classrooms</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Form Inputs & Inline Editable Label */}
      <Card className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Form Controls & In-Place Editing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Campus Name"
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
            helperText="Official school charter name"
          />
          <Input
            label="Registration Code"
            value={sampleErrorInput}
            onChange={(e) => setSampleErrorInput(e.target.value)}
            error="Format must be SCH-YYYY-XXX"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Inline Editable Label (Click or hover to edit in-place):
          </div>
          <div className="flex items-center gap-3">
            <InlineEditableLabel
              value={editableValue}
              onSave={(val) => setEditableValue(val)}
              className="text-base font-bold text-indigo-600 dark:text-indigo-400"
            />
          </div>
        </div>
      </Card>

      {/* 5. Modals & Drawers */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Overlays & Dialogs
        </h3>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>
            Open Sample Modal
          </Button>
          <Button variant="outline" size="md" onClick={() => setDrawerOpen(true)}>
            Open Sample Drawer
          </Button>
        </div>
      </Card>

      {/* 6. Skeletons */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Loading Skeletons
        </h3>
        <div className="space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rectangular" height={36} />
          <div className="flex items-center gap-3 pt-2">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="space-y-1 flex-1">
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="80%" />
            </div>
          </div>
        </div>
      </Card>

      {/* Sample Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Design System Modal Demonstration"
        description="Accessible modal component with motion enter/exit transitions."
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Dismiss
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          This modal dialog supports ESC key dismissal, click-outside-to-close, background scrolling lock,
          and seamless dark mode theming.
        </p>
      </Modal>

      {/* Sample Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Design System Drawer Demonstration"
        description="Slide-over drawer component with backdrop blur."
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>
              Close Panel
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Drawers are optimal for detailed class cohort inspections, student rosters, or deep property configuration
            without navigating away from context.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="font-semibold text-slate-900 dark:text-slate-100">Drawer Content Block</div>
            <p className="text-xs text-slate-500 mt-1">Scrollable body with fixed header and footer.</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
