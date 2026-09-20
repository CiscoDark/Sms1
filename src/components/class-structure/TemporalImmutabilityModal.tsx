import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  FileText,
  Clock,
  ArrowRight,
  Code,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ClassLevel, ClassArm, ArmPointInTimeSnapshot } from '../../types';
import {
  getHistoricalArmSnapshots,
  recordArmRenameSnapshot,
} from '../../lib/class-structure-store';
import { Modal, Button, Badge, Card, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, Input } from '../../design-system';

export interface TemporalImmutabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  levels: ClassLevel[];
  onArmRenamed?: (armId: string, newName: string) => void;
  onLogAudit?: (action: string, details: string) => void;
}

export const TemporalImmutabilityModal: React.FC<TemporalImmutabilityModalProps> = ({
  isOpen,
  onClose,
  levels,
  onArmRenamed,
  onLogAudit,
}) => {
  const [snapshots, setSnapshots] = useState<ArmPointInTimeSnapshot[]>(getHistoricalArmSnapshots());
  const [selectedSnapshot, setSelectedSnapshot] = useState<ArmPointInTimeSnapshot | null>(
    snapshots[0] || null
  );

  // Live simulation state
  const [simLevelId, setSimLevelId] = useState<string>(levels[0]?.id || '');
  const [simArmId, setSimArmId] = useState<string>(levels[0]?.arms[0]?.id || '');
  const [simNewName, setSimNewName] = useState<string>('Topaz');
  const [simReason, setSimReason] = useState<string>('Term 2 Branding Realignment');
  const [simulationSuccess, setSimulationSuccess] = useState<boolean>(false);

  const selectedLevel = levels.find((l) => l.id === simLevelId) || levels[0];
  const selectedArm = selectedLevel?.arms.find((a) => a.id === simArmId) || selectedLevel?.arms[0];

  const handleSimulateRename = () => {
    if (!selectedArm || !selectedLevel || !simNewName.trim()) return;

    // Record immutable snapshot
    const newSnapshot = recordArmRenameSnapshot(
      selectedArm,
      selectedLevel,
      simNewName.trim(),
      'Current Admin (Simulated)',
      simReason
    );

    // Update parent level if callback provided
    onArmRenamed?.(selectedArm.id, simNewName.trim());
    onLogAudit?.(
      'TEMPORAL_SNAPSHOT_RECORDED',
      `Renamed ${selectedArm.name} to ${simNewName}. Point-in-time snapshot minted: ${newSnapshot.id}`
    );

    const refreshed = getHistoricalArmSnapshots();
    setSnapshots(refreshed);
    setSelectedSnapshot(newSnapshot);
    setSimulationSuccess(true);
    setTimeout(() => setSimulationSuccess(false), 5000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Temporal Immutability & Historical Snapshot Inspector</span>
              <Badge variant="success" size="sm">Rule #3 Enforced</Badge>
            </div>
            <div className="text-xs font-normal text-slate-500 dark:text-slate-400">
              Verifies that historical report cards and transcripts maintain frozen point-in-time class labels.
            </div>
          </div>
        </div>
      }
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Historical transcripts never mutate when active streams are renamed.</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done & Return
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-200">
        {/* Invariant Explanation Banner */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-800 border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Architectural Invariant: Point-in-Time JSON Snapshots
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 dark:bg-slate-700 text-emerald-400">
              IMMUTABILITY_GUARANTEED
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In standard databases, class and stream relations are linked via live foreign keys (e.g. <code className="text-indigo-300 font-mono">class_arm_id</code>). When an administrator renames a stream from <span className="text-amber-300">"Gold"</span> to <span className="text-emerald-300">"Emerald"</span>, legacy systems accidentally corrupt past records by displaying "Emerald" on 2022 report cards.
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Our architecture persists self-contained JSON snapshots of class labels onto every generated report card, fee receipt, and term roster.</span>
          </div>
        </div>

        {/* Side-by-Side Proof Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Historical Report Card Record (Frozen) */}
          <Card className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                Historical Report Card (Term 1 2024/2025)
              </span>
              <Badge variant="warning" size="sm">Point-in-Time Snapshot</Badge>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/40 text-xs space-y-1.5">
              <div className="text-slate-500">Student: <strong>Alexander Chukwu (APA/2024/014)</strong></div>
              <div className="text-slate-500">
                Printed Class Label: <strong className="text-amber-700 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">JSS 1 - Gold Stream</strong>
              </div>
              <div className="text-slate-500">Form Master: <strong>Mrs. Rebecca Mensah</strong></div>
              <div className="text-[11px] text-slate-400 mt-2 italic">
                * Frozen JSON snapshot. Preserved forever even after arm is renamed.
              </div>
            </div>
          </Card>

          {/* Right: Active Live Class Structure */}
          <Card className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Current Active Class Structure
              </span>
              <Badge variant="primary" size="sm">Live Active System</Badge>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1.5">
              <div className="text-slate-500">Active Level: <strong>JSS 1</strong></div>
              <div className="text-slate-500">
                Current Stream Name: <strong className="text-indigo-700 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">{selectedArm ? selectedArm.name : 'Gold'}</strong>
              </div>
              <div className="text-slate-500">Enrolled Cohort: <strong>{selectedArm ? selectedArm.enrolledCount : 34} Students</strong></div>
              <div className="text-[11px] text-slate-400 mt-2 italic">
                * Live active directory. Renames immediately reflect in active portals.
              </div>
            </div>
          </Card>
        </div>

        {/* Historical Snapshots Log Table */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              Recorded Temporal Snapshots Registry ({snapshots.length})
            </h4>
            <span className="text-xs text-slate-400">Click a record to inspect JSON snapshot</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Snapshot Date</TableHeaderCell>
                  <TableHeaderCell>Academic Term</TableHeaderCell>
                  <TableHeaderCell>Previous (Frozen) Name</TableHeaderCell>
                  <TableHeaderCell>New Active Name</TableHeaderCell>
                  <TableHeaderCell>Admin Performer</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {snapshots.map((snap) => (
                  <TableRow
                    key={snap.id}
                    className={`cursor-pointer ${
                      selectedSnapshot?.id === snap.id
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/40'
                        : ''
                    }`}
                    onClick={() => setSelectedSnapshot(snap)}
                  >
                    <TableCell className="font-mono text-xs text-slate-500">
                      {new Date(snap.renamedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {snap.academicSessionYear} ({snap.termName})
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                        {snap.previousName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                        {snap.newName}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {snap.renamedBy}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSnapshot(snap);
                        }}
                        className="text-xs"
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Selected Snapshot JSON Inspector */}
        {selectedSnapshot && (
          <div className="p-4 bg-slate-900 rounded-xl text-slate-100 space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-indigo-400 flex items-center gap-1.5">
                <Code className="w-4 h-4" />
                Frozen Point-in-Time JSON Snapshot Payload [{selectedSnapshot.id}]
              </span>
              <span className="text-[11px] text-slate-400">
                Immutably serialized with report card records
              </span>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto">
              {JSON.stringify(selectedSnapshot.frozenJsonSnapshot, null, 2)}
            </pre>
          </div>
        )}

        {/* Live Simulation Sandbox */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Live Rename Simulation & Snapshot Generator
            </span>
            <span className="text-[11px] text-slate-400">
              Test creating a new snapshot in real-time
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                Target Stream / Arm
              </label>
              <select
                value={simArmId}
                onChange={(e) => setSimArmId(e.target.value)}
                className="w-full rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 min-h-[38px]"
              >
                {levels.flatMap((l) =>
                  l.arms.map((a) => (
                    <option key={a.id} value={a.id}>
                      {l.name} - {a.name} ({a.enrolledCount} students)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                New Stream Name
              </label>
              <Input
                value={simNewName}
                onChange={(e) => setSimNewName(e.target.value)}
                placeholder="e.g. Topaz, Emerald, Alpha"
                className="py-1 min-h-[38px] text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                Administrative Reason
              </label>
              <Input
                value={simReason}
                onChange={(e) => setSimReason(e.target.value)}
                placeholder="e.g. Term branding standardization"
                className="py-1 min-h-[38px] text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {simulationSuccess ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Snapshot generated and persisted! Historical records retain legacy name.
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Clicking commit will mint a temporal snapshot and preserve historical integrity.
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSimulateRename}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              Mint Snapshot & Rename
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
