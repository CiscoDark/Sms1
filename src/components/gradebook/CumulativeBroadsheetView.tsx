import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Printer,
  Search,
  Filter,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  CumulativeStudentSubjectRecord,
  GradingConfiguration,
  ClassLevel,
  ClassArm,
} from '../../types';
import { Button, Card, Badge, Input } from '../../design-system';

interface CumulativeBroadsheetViewProps {
  cumulativeRecords: CumulativeStudentSubjectRecord[];
  config: GradingConfiguration;
  level: ClassLevel | null;
  arm: ClassArm | null;
  subjectName: string;
  sessionYear: string;
}

export const CumulativeBroadsheetView: React.FC<CumulativeBroadsheetViewProps> = ({
  cumulativeRecords,
  config,
  level,
  arm,
  subjectName,
  sessionYear,
}) => {
  const [search, setSearch] = useState('');
  const [filterDecision, setFilterDecision] = useState<'ALL' | 'PROMOTED' | 'TRIAL' | 'REPEAT'>('ALL');

  const t1Weight = config.cumulativeTerm1Weight ?? 20;
  const t2Weight = config.cumulativeTerm2Weight ?? 30;
  const t3Weight = config.cumulativeTerm3Weight ?? 50;

  // Filtered list
  const filtered = useMemo(() => {
    return cumulativeRecords.filter((rec) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(q);
        const matchReg = rec.studentRegNumber.toLowerCase().includes(q);
        if (!matchName && !matchReg) return false;
      }

      if (filterDecision === 'PROMOTED') {
        return rec.promotionDecision === 'PROMOTED';
      }
      if (filterDecision === 'TRIAL') {
        return rec.promotionDecision === 'PROMOTED ON TRIAL';
      }
      if (filterDecision === 'REPEAT') {
        return rec.promotionDecision === 'REPEAT';
      }

      return true;
    });
  }, [cumulativeRecords, search, filterDecision]);

  // Statistics
  const stats = useMemo(() => {
    const total = cumulativeRecords.length;
    const promoted = cumulativeRecords.filter((r) => r.promotionDecision === 'PROMOTED').length;
    const trial = cumulativeRecords.filter((r) => r.promotionDecision === 'PROMOTED ON TRIAL').length;
    const repeat = cumulativeRecords.filter((r) => r.promotionDecision === 'REPEAT').length;
    const sum = cumulativeRecords.reduce((acc, r) => acc + (r.cumulativeTotalScore ?? 0), 0);
    const avg = total > 0 ? (sum / total).toFixed(1) : '0';
    const promotionRate = total > 0 ? Math.round(((promoted + trial) / total) * 100) : 0;
    return { total, promoted, trial, repeat, avg, promotionRate };
  }, [cumulativeRecords]);

  // Export CSV function
  const handleExportCSV = () => {
    const headers = [
      'Position',
      'Reg Number',
      'Student Name',
      'Gender',
      `Term 1 Score (${t1Weight}%)`,
      `Term 2 Score (${t2Weight}%)`,
      `Term 3 Score (${t3Weight}%)`,
      'Cumulative Score (100%)',
      'Cumulative Grade',
      'Remark',
      'GPA Point',
      'Promotion Decision',
    ];

    const rows = filtered.map((r) => [
      r.cumulativeRankInArm ? `${r.cumulativeRankInArm}` : '-',
      r.studentRegNumber,
      `"${r.studentName}"`,
      r.gender,
      r.term1TotalScore !== null ? `${r.term1TotalScore}% (${r.term1WeightedScore})` : 'N/A',
      r.term2TotalScore !== null ? `${r.term2TotalScore}% (${r.term2WeightedScore})` : 'N/A',
      r.term3TotalScore !== null ? `${r.term3TotalScore}% (${r.term3WeightedScore})` : 'N/A',
      r.cumulativeTotalScore !== null ? `${r.cumulativeTotalScore}%` : 'N/A',
      r.cumulativeGrade || 'N/A',
      `"${r.cumulativeRemark || ''}"`,
      r.cumulativeGpaPoint ?? 0,
      `"${r.promotionDecision}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Annual_Cumulative_Broadsheet_${level?.name || 'Class'}_${arm?.name || 'Arm'}_${subjectName}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Broadsheet Context Header */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
              Session {sessionYear} • 3rd Term Promotional Broadsheet
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
              {level?.name} - {arm?.name}
            </span>
          </div>
          <h3 className="text-lg font-black tracking-tight">
            {subjectName} — Annual Cumulative Composite Results
          </h3>
          <p className="text-xs text-slate-300">
            Statutory Nigerian Secondary Grading Formula:{' '}
            <strong className="text-indigo-300">First Term ({t1Weight}%)</strong> +{' '}
            <strong className="text-indigo-300">Second Term ({t2Weight}%)</strong> +{' '}
            <strong className="text-indigo-300">Third Term ({t3Weight}%)</strong> ={' '}
            <strong className="text-emerald-300">100% Annual Composite</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4 text-indigo-400" />}
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
          >
            Export Broadsheet CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Broadsheet
          </Button>
        </div>
      </div>

      {/* Real-time Promotional Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <Card className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Class Cohort
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-slate-100">
            {stats.total} Students
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Promotion Rate
          </span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {stats.promotionRate}%
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Promoted Clear (≥50%)
          </span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {stats.promoted}
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            On Trial (40-49%)
          </span>
          <span className="text-lg font-black text-amber-600 dark:text-amber-400">
            {stats.trial}
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Repeat Class (&lt;40%)
          </span>
          <span className="text-lg font-black text-rose-600 dark:text-rose-400">
            {stats.repeat}
          </span>
        </Card>

        <Card className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Annual Average
          </span>
          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
            {stats.avg}%
          </span>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="w-full sm:w-72">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or reg number..."
            leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Filter By Decision:</span>
          <button
            type="button"
            onClick={() => setFilterDecision('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterDecision === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All ({cumulativeRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterDecision('PROMOTED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterDecision === 'PROMOTED'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            Promoted ({stats.promoted})
          </button>
          <button
            type="button"
            onClick={() => setFilterDecision('TRIAL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterDecision === 'TRIAL'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
            }`}
          >
            On Trial ({stats.trial})
          </button>
          <button
            type="button"
            onClick={() => setFilterDecision('REPEAT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filterDecision === 'REPEAT'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
            }`}
          >
            Repeat ({stats.repeat})
          </button>
        </div>
      </div>

      {/* Cumulative Broadsheet Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                <th className="p-3 w-12 text-center">Rank</th>
                <th className="p-3 w-28">Reg No</th>
                <th className="p-3 min-w-[180px]">Student Full Name</th>
                <th className="p-3 w-14 text-center">Gender</th>
                <th className="p-3 w-28 text-center bg-blue-50/50 dark:bg-blue-950/20">
                  <span>1st Term</span>
                  <span className="block text-[10px] font-normal text-blue-600 dark:text-blue-400">
                    Wt: {t1Weight}%
                  </span>
                </th>
                <th className="p-3 w-28 text-center bg-indigo-50/50 dark:bg-indigo-950/20">
                  <span>2nd Term</span>
                  <span className="block text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                    Wt: {t2Weight}%
                  </span>
                </th>
                <th className="p-3 w-28 text-center bg-purple-50/50 dark:bg-purple-950/20">
                  <span>3rd Term</span>
                  <span className="block text-[10px] font-normal text-purple-600 dark:text-purple-400">
                    Wt: {t3Weight}%
                  </span>
                </th>
                <th className="p-3 w-24 text-center bg-emerald-50/50 dark:bg-emerald-950/20 font-black">
                  <span>Cumulative</span>
                  <span className="block text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                    100% Annual
                  </span>
                </th>
                <th className="p-3 w-16 text-center">Grade</th>
                <th className="p-3 min-w-[130px]">WAEC Remark</th>
                <th className="p-3 w-16 text-center">GPA</th>
                <th className="p-3 min-w-[140px] text-center">Annual Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 italic">
                    No student records found matching the current search query or filter.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const isA = record.cumulativeGrade?.startsWith('A');
                  const isB = record.cumulativeGrade?.startsWith('B');
                  const isC = record.cumulativeGrade?.startsWith('C');
                  const isPass = record.cumulativeGrade?.startsWith('D') || record.cumulativeGrade?.startsWith('E');

                  const gradeBadge = isA
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : isB
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    : isC
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    : isPass
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';

                  const decisionBadge =
                    record.promotionDecision === 'PROMOTED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : record.promotionDecision === 'PROMOTED ON TRIAL'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800';

                  const rankDisplay = record.cumulativeRankInArm
                    ? record.cumulativeRankInArm === 1
                      ? '1st 🥇'
                      : record.cumulativeRankInArm === 2
                      ? '2nd 🥈'
                      : record.cumulativeRankInArm === 3
                      ? '3rd 🥉'
                      : `${record.cumulativeRankInArm}th`
                    : '-';

                  return (
                    <tr
                      key={record.studentId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Rank in Arm */}
                      <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {rankDisplay}
                      </td>

                      {/* Reg No */}
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {record.studentRegNumber}
                      </td>

                      {/* Student Name */}
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {record.studentName}
                      </td>

                      {/* Gender */}
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            record.gender === 'M'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
                          }`}
                        >
                          {record.gender}
                        </span>
                      </td>

                      {/* 1st Term */}
                      <td className="p-3 text-center bg-blue-50/20 dark:bg-blue-950/10">
                        {record.term1TotalScore !== null ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {record.term1TotalScore}%
                            </span>
                            <span className="block text-[10px] font-mono text-blue-600 dark:text-blue-400">
                              +{record.term1WeightedScore} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 2nd Term */}
                      <td className="p-3 text-center bg-indigo-50/20 dark:bg-indigo-950/10">
                        {record.term2TotalScore !== null ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {record.term2TotalScore}%
                            </span>
                            <span className="block text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                              +{record.term2WeightedScore} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 3rd Term */}
                      <td className="p-3 text-center bg-purple-50/20 dark:bg-purple-950/10">
                        {record.term3TotalScore !== null ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {record.term3TotalScore}%
                            </span>
                            <span className="block text-[10px] font-mono text-purple-600 dark:text-purple-400">
                              +{record.term3WeightedScore} pts
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Annual Cumulative Score */}
                      <td className="p-3 text-center bg-emerald-50/30 dark:bg-emerald-950/20 font-black text-sm text-emerald-700 dark:text-emerald-300">
                        {record.cumulativeTotalScore !== null ? (
                          <span>{record.cumulativeTotalScore}%</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Grade (A1-F9) */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-black text-xs ${gradeBadge}`}>
                          {record.cumulativeGrade || '-'}
                        </span>
                      </td>

                      {/* Remark */}
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium text-xs">
                        {record.cumulativeRemark || '-'}
                      </td>

                      {/* GPA */}
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {record.cumulativeGpaPoint !== null ? record.cumulativeGpaPoint.toFixed(1) : '-'}
                      </td>

                      {/* Decision */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${decisionBadge}`}
                        >
                          {record.promotionDecision === 'PROMOTED' && (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {record.promotionDecision === 'PROMOTED ON TRIAL' && (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          {record.promotionDecision === 'REPEAT' && (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {record.promotionDecision}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
