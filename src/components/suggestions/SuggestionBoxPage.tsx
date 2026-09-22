import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Inbox,
  Sparkles,
  ShieldAlert,
  Send,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  HeartHandshake,
  Building2,
  BookOpen,
  Utensils,
  CreditCard,
  MessageCircle,
  Lock,
  Eye,
  EyeOff,
  Tag,
  ArrowRight,
} from 'lucide-react';
import {
  SuggestionRecord,
  SuggestionCategory,
  SuggestionUrgency,
  SuggestionSentiment,
  SuggestionStatus,
  UserProfile,
} from '../../types';
import {
  getSuggestions,
  submitSuggestion,
  updateSuggestionAdminAction,
  classifySuggestionText,
  lookupSuggestionByTrackingCode,
} from '../../lib/suggestion-store';

interface SuggestionBoxPageProps {
  currentUser: UserProfile;
  onLogAudit: (action: string, details: string) => void;
}

export const SuggestionBoxPage: React.FC<SuggestionBoxPageProps> = ({
  currentUser,
  onLogAudit,
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionRecord[]>(() => getSuggestions());
  const [activeViewTab, setActiveViewTab] = useState<'submit' | 'my-tracked' | 'admin-kanban'>(
    ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR'].includes(currentUser.role) ? 'admin-kanban' : 'submit'
  );

  // Submitter Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState<SuggestionRecord | null>(null);

  // Tracking Code Lookup
  const [trackingLookupCode, setTrackingLookupCode] = useState('');
  const [lookedUpRecord, setLookedUpRecord] = useState<SuggestionRecord | null>(null);
  const [lookupError, setLookupError] = useState('');

  // Admin Kanban & Filter State
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('ALL');
  const [adminUrgencyFilter, setAdminUrgencyFilter] = useState<string>('ALL');
  const [adminSentimentFilter, setAdminSentimentFilter] = useState<string>('ALL');
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedRecordForAdmin, setSelectedRecordForAdmin] = useState<SuggestionRecord | null>(null);
  const [adminStatusDraft, setAdminStatusDraft] = useState<SuggestionStatus>('RECEIVED');
  const [adminPublicFeedbackDraft, setAdminPublicFeedbackDraft] = useState('');
  const [adminInternalNotesDraft, setAdminInternalNotesDraft] = useState('');

  const isAdmin = ['SUPER_ADMIN', 'PRINCIPAL', 'ACADEMIC_DIRECTOR'].includes(currentUser.role);

  // Live Classification Preview
  const liveClassification = useMemo(() => {
    if (!title.trim() && !content.trim()) return null;
    return classifySuggestionText(title, content);
  }, [title, content]);

  // Handle Submit
  const handleSubmitSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newRecord = submitSuggestion({
      title,
      content,
      isAnonymous,
      submitterId: currentUser.id,
      submitterName: currentUser.name,
      submitterRole: currentUser.role,
      submitterEmail: currentUser.email,
    });

    setSuggestions(getSuggestions());
    setLastSubmittedRecord(newRecord);
    setTitle('');
    setContent('');
    setIsAnonymous(true);

    onLogAudit(
      'SUGGESTION_SUBMITTED',
      `Submitted feedback ${newRecord.trackingCode} (${newRecord.category}, ${newRecord.urgency})`
    );
  };

  // Handle Tracking Lookup
  const handlePerformLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingLookupCode.trim()) return;
    const found = lookupSuggestionByTrackingCode(trackingLookupCode.trim());
    if (found) {
      setLookedUpRecord(found);
      setLookupError('');
    } else {
      setLookedUpRecord(null);
      setLookupError(`No suggestion found with reference code "${trackingLookupCode.trim()}".`);
    }
  };

  // Handle Admin Action Update
  const handleAdminUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAdmin) return;

    const updated = updateSuggestionAdminAction(
      selectedRecordForAdmin.id,
      {
        status: adminStatusDraft,
        adminFeedback: adminPublicFeedbackDraft.trim(),
        internalAdminNotes: adminInternalNotesDraft.trim(),
      },
      currentUser.name
    );

    if (updated) {
      setSuggestions(getSuggestions());
      setSelectedRecordForAdmin(null);
      onLogAudit(
        'SUGGESTION_ADMIN_UPDATED',
        `Admin ${currentUser.name} updated suggestion ${updated.trackingCode} to ${updated.status}`
      );
    }
  };

  const getCategoryIcon = (category: SuggestionCategory) => {
    switch (category) {
      case 'FACILITIES':
        return <Building2 className="w-3.5 h-3.5 text-blue-500" />;
      case 'ACADEMICS':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-500" />;
      case 'BULLYING_WELFARE':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
      case 'FOOD_CAFETERIA':
        return <Utensils className="w-3.5 h-3.5 text-amber-500" />;
      case 'FEES_BILLING':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-500" />;
      case 'GENERAL':
      default:
        return <MessageCircle className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getSentimentBadge = (sentiment: SuggestionSentiment) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'DISTRESSED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold';
      case 'NEGATIVE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'NEUTRAL':
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getUrgencyBadge = (urgency: SuggestionUrgency) => {
    switch (urgency) {
      case 'CRITICAL_WELFARE':
        return 'bg-rose-600 text-white animate-pulse';
      case 'URGENT':
        return 'bg-amber-500 text-white';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusStep = (status: SuggestionStatus) => {
    switch (status) {
      case 'RECEIVED':
        return 1;
      case 'UNDER_REVIEW':
        return 2;
      case 'IN_PROGRESS':
        return 3;
      case 'ACTIONED':
        return 4;
      default:
        return 1;
    }
  };

  // Filtered admin records
  const filteredAdminRecords = useMemo(() => {
    return suggestions.filter((s) => {
      if (adminCategoryFilter !== 'ALL' && s.category !== adminCategoryFilter) return false;
      if (adminUrgencyFilter !== 'ALL' && s.urgency !== adminUrgencyFilter) return false;
      if (adminSentimentFilter !== 'ALL' && s.sentiment !== adminSentimentFilter) return false;
      if (adminSearch.trim()) {
        const query = adminSearch.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(query);
        const matchContent = s.content.toLowerCase().includes(query);
        const matchCode = s.trackingCode.toLowerCase().includes(query);
        if (!matchTitle && !matchContent && !matchCode) return false;
      }
      return true;
    });
  }, [suggestions, adminCategoryFilter, adminUrgencyFilter, adminSentimentFilter, adminSearch]);

  const kanbanColumns: SuggestionStatus[] = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'ACTIONED'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold">AI-Sorted Suggestion & Feedback Box</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Anonymous By Default
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Instant Sentiment Engine
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Open to all school roles. Submissions are auto-categorized into Facilities, Academics, Bullying/Welfare, 
              Food, or Fees. Any welfare or distress signal immediately triggers the Designated Safeguarding Lead alert.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveViewTab('submit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeViewTab === 'submit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Submit Feedback
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab('my-tracked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeViewTab === 'my-tracked' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Track Reference
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveViewTab('admin-kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeViewTab === 'admin-kanban' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Admin Review ({suggestions.length})
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: SUBMIT FEEDBACK */}
      {activeViewTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-500" />
                <span>Submit Voice & Community Feedback</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Share constructive suggestions, safety hazards, catering requests, or campus improvements.
              </p>
            </div>

            <form onSubmit={handleSubmitSuggestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Lab 2 exhaust fan repair needed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Feedback Details *
                </label>
                <textarea
                  rows={5}
                  placeholder="Provide honest, detailed observations. Our AI system will categorize and prioritize for administrative follow-up..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Anonymous vs Identity Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAnonymous ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                        isAnonymous ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {isAnonymous ? <EyeOff className="w-3.5 h-3.5 text-indigo-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                      <span>{isAnonymous ? 'Anonymous Submission (Recommended)' : 'Reveal My Identity'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isAnonymous
                        ? 'Your name and email will be completely stripped. A private reference code will be generated for tracking.'
                        : `Submitting as ${currentUser.name} (${currentUser.role.replace('_', ' ')})`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={!title.trim() || !content.trim()}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Suggestion Box</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI Categorization Live Preview & Safety Guidelines */}
          <div className="space-y-4">
            {/* Live AI Classification Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Live AI Classification Engine</span>
              </div>

              {liveClassification ? (
                <div className="space-y-3 text-xs">
                  {liveClassification.isWelfareEscalated && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Safeguarding Priority Alert</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        This feedback contains sensitive welfare triggers. It will automatically bypass the regular review queue and directly notify the School Safeguarding Lead.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Predicted Category:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        {getCategoryIcon(liveClassification.category)}
                        <span>{liveClassification.category.replace(/_/g, ' ')}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Urgency Level:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getUrgencyBadge(liveClassification.urgency)}`}>
                        {liveClassification.urgency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Sentiment Score:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSentimentBadge(liveClassification.sentiment)}`}>
                        {liveClassification.sentiment} ({(liveClassification.sentimentScore * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1.5">AI Tags Detected:</span>
                    <div className="flex flex-wrap gap-1">
                      {liveClassification.aiTags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Type your suggestion above to see real-time AI category sorting and sentiment tagging.
                </p>
              )}
            </div>

            {/* Submission Confirmation Card */}
            {lastSubmittedRecord && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submission Received Successfully!</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Save your anonymous tracking reference code:
                </p>
                <div className="font-mono text-sm font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-center tracking-wider text-slate-900 dark:text-slate-100">
                  {lastSubmittedRecord.trackingCode}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTrackingLookupCode(lastSubmittedRecord.trackingCode);
                    setActiveViewTab('my-tracked');
                    setLookedUpRecord(lastSubmittedRecord);
                  }}
                  className="w-full text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline pt-1 cursor-pointer"
                >
                  Track progress now →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: TRACK SUGGESTION BY CODE */}
      {activeViewTab === 'my-tracked' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Track Suggestion Progress
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Check official administrative updates on your submission without compromising anonymity.
              </p>
            </div>

            <form onSubmit={handlePerformLookup} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Reference Code e.g. SUG-2024-101"
                value={trackingLookupCode}
                onChange={(e) => setTrackingLookupCode(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Track Status
              </button>
            </form>

            {lookupError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs">
                {lookupError}
              </div>
            )}
          </div>

          {lookedUpRecord && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="font-mono text-[11px] text-slate-400">{lookedUpRecord.trackingCode}</div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">{lookedUpRecord.title}</h4>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getUrgencyBadge(lookedUpRecord.urgency)}`}>
                  {lookedUpRecord.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Progress Stepper */}
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-3">Resolution Lifecycle</span>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold">
                  {[
                    { key: 'RECEIVED', label: '1. Received' },
                    { key: 'UNDER_REVIEW', label: '2. Under Review' },
                    { key: 'IN_PROGRESS', label: '3. In Action' },
                    { key: 'ACTIONED', label: '4. Actioned' },
                  ].map((step, idx) => {
                    const currentStep = getStatusStep(lookedUpRecord.status);
                    const isDone = currentStep >= idx + 1;
                    return (
                      <div
                        key={step.key}
                        className={`p-2 rounded-lg border transition-all ${
                          isDone
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        {step.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback from Admin */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                  Official Administrative Feedback:
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lookedUpRecord.adminFeedback || 'Your suggestion is in our administrative review queue.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Submitted: {new Date(lookedUpRecord.submittedAt).toLocaleDateString()}</span>
                <span>Category: {lookedUpRecord.category.replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ADMIN KANBAN & MANAGEMENT DASHBOARD */}
      {activeViewTab === 'admin-kanban' && isAdmin && (
        <div className="space-y-4">
          {/* Urgent / Sensitive Welfare Banner */}
          {suggestions.some((s) => s.isWelfareEscalated && s.status !== 'ACTIONED') && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm text-rose-700 dark:text-rose-300">
                  Priority Safeguarding Intervention Required
                </span>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  One or more submissions have been flagged for acute welfare / bullying / emotional distress.
                  Safeguarding contacts have been automatically alerted. Please review immediately.
                </p>
              </div>
            </div>
          )}

          {/* Admin Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search suggestions..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={adminCategoryFilter}
                onChange={(e) => setAdminCategoryFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Categories</option>
                <option value="FACILITIES">Facilities</option>
                <option value="ACADEMICS">Academics</option>
                <option value="BULLYING_WELFARE">Bullying & Welfare</option>
                <option value="FOOD_CAFETERIA">Food & Cafeteria</option>
                <option value="FEES_BILLING">Fees & Billing</option>
                <option value="GENERAL">General</option>
              </select>

              <select
                value={adminUrgencyFilter}
                onChange={(e) => setAdminUrgencyFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Urgencies</option>
                <option value="CRITICAL_WELFARE">Critical Welfare</option>
                <option value="URGENT">Urgent</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={adminSentimentFilter}
                onChange={(e) => setAdminSentimentFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Sentiments</option>
                <option value="POSITIVE">Positive</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="NEGATIVE">Negative</option>
                <option value="DISTRESSED">Distressed</option>
              </select>
            </div>
          </div>

          {/* Kanban Board Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kanbanColumns.map((colStatus) => {
              const colItems = filteredAdminRecords.filter((s) => s.status === colStatus);
              return (
                <div
                  key={colStatus}
                  className="bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px]"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {colStatus.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {colItems.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colItems.length === 0 ? (
                      <div className="h-32 flex items-center justify-center text-[11px] text-slate-400">
                        No submissions
                      </div>
                    ) : (
                      colItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedRecordForAdmin(item);
                            setAdminStatusDraft(item.status);
                            setAdminPublicFeedbackDraft(item.adminFeedback || '');
                            setAdminInternalNotesDraft(item.internalAdminNotes || '');
                          }}
                          className={`p-3.5 rounded-xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 ${
                            item.isWelfareEscalated
                              ? 'border-rose-400 dark:border-rose-800 bg-rose-50/30'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-mono text-[10px] text-slate-400">{item.trackingCode}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getUrgencyBadge(item.urgency)}`}>
                              {item.urgency}
                            </span>
                          </div>

                          <h5 className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                            {item.title}
                          </h5>

                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {item.content}
                          </p>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
                              {getCategoryIcon(item.category)}
                              <span>{item.category.replace(/_/g, ' ')}</span>
                            </span>

                            <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-medium ${getSentimentBadge(item.sentiment)}`}>
                              {item.sentiment}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Action Modal */}
      <AnimatePresence>
        {selectedRecordForAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{selectedRecordForAdmin.trackingCode}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getUrgencyBadge(selectedRecordForAdmin.urgency)}`}>
                      {selectedRecordForAdmin.urgency}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSentimentBadge(selectedRecordForAdmin.sentiment)}`}>
                      {selectedRecordForAdmin.sentiment}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                    {selectedRecordForAdmin.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecordForAdmin(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdminUpdateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                {selectedRecordForAdmin.isWelfareEscalated && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Safeguarding Escalation Route:</span>
                    </div>
                    <p className="text-[11px]">{selectedRecordForAdmin.escalatedTo}</p>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">Full Submission Text:</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    {selectedRecordForAdmin.content}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex justify-between">
                    <span>
                      Submitter: {selectedRecordForAdmin.isAnonymous ? 'Anonymous' : `${selectedRecordForAdmin.submitterName} (${selectedRecordForAdmin.submitterRole})`}
                    </span>
                    <span>{new Date(selectedRecordForAdmin.submittedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={adminStatusDraft}
                    onChange={(e) => setAdminStatusDraft(e.target.value as SuggestionStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="RECEIVED">Received</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="IN_PROGRESS">In Progress / Actioning</option>
                    <option value="ACTIONED">Actioned & Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Public Feedback for Submitter (Visible when tracking reference)
                  </label>
                  <textarea
                    rows={3}
                    value={adminPublicFeedbackDraft}
                    onChange={(e) => setAdminPublicFeedbackDraft(e.target.value)}
                    placeholder="e.g. Maintenance has addressed the issue. The new parts have been installed."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Confidential Internal Admin Notes (NOT visible to submitter)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={adminInternalNotesDraft}
                    onChange={(e) => setAdminInternalNotesDraft(e.target.value)}
                    placeholder="e.g. Assigned to Mr. Patrick. Replacement cost ₦35,000 pending approval."
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForAdmin(null)}
                    className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Save & Update Status
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
