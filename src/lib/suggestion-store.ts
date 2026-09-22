/**
 * STEP 22 — AI-Sorted Suggestion & Feedback Box Store
 * 
 * STRICT ARCHITECTURAL INVARIANTS:
 * 1. Tenant Isolation: All suggestions enforce `school_id: 'school-apex-01'`.
 * 2. Anonymous By Default: Identity is scrubbed unless the submitter explicitly opts to reveal it.
 * 3. AI Categorization & Sentiment Engine: Auto-categorizes into Facilities, Academics, Bullying/Welfare, etc.
 * 4. Critical Welfare Escalation: Sensitive / welfare / harm triggers immediately bypass standard review
 *    and flag the Designated Safeguarding Lead (DSL) contact.
 * 5. Data Privacy: Internal admin notes are strictly confidential; submitters only see high-level status.
 */

import {
  SuggestionRecord,
  SuggestionCategory,
  SuggestionUrgency,
  SuggestionSentiment,
  SuggestionStatus,
  Role,
} from '../types';
import { enqueueOfflineAction } from './offline-queue';

const SUGGESTIONS_STORAGE_KEY = 'sms_suggestions_records_v1';
const DEFAULT_SCHOOL_ID = 'school-apex-01';

// Crisis / Welfare detection trigger terms
const WELFARE_TRIGGERS = [
  'kill myself', 'hurt myself', 'suicide', 'depressed', 'abuse', 'beating', 'molest',
  'weapon', 'knife', 'assault', 'touching me', 'forced me', 'bullying', 'bullied',
  'crying every day', 'scared of', 'threatened', 'starving', 'bruise', 'violence',
  'extortion', 'harass', 'extort'
];

const FACILITIES_TRIGGERS = [
  'toilet', 'bathroom', 'restroom', 'water', 'tap', 'ac', 'air conditioner',
  'fan', 'light', 'generator', 'projector', 'desk', 'chair', 'laboratory',
  'sink', 'roof', 'leak', 'blackboard', 'whiteboard', 'door', 'window'
];

const FOOD_TRIGGERS = [
  'canteen', 'cafeteria', 'food', 'lunch', 'rice', 'meal', 'portion',
  'stale', 'snack', 'drink', 'spoil', 'water dispenser', 'cook'
];

const ACADEMICS_TRIGGERS = [
  'exam', 'test', 'assignment', 'teacher', 'homework', 'syllabus', 'notes',
  'curriculum', 'textbook', 'library', 'lesson', 'grading', 'biology', 'math'
];

const FEES_TRIGGERS = [
  'fee', 'payment', 'tuition', 'receipt', 'bank transfer', 'bursar',
  'invoice', 'portal charge', 'clearance', 'cost'
];

/**
 * Smart AI & Heuristic Classification Engine
 */
export function classifySuggestionText(title: string, content: string): {
  category: SuggestionCategory;
  urgency: SuggestionUrgency;
  sentiment: SuggestionSentiment;
  sentimentScore: number;
  aiTags: string[];
  isWelfareEscalated: boolean;
  escalatedTo?: string;
} {
  const combined = `${title} ${content}`.toLowerCase();

  // 1. Check Welfare / Safety first (CRITICAL BYPASS)
  const isWelfare = WELFARE_TRIGGERS.some((kw) => combined.includes(kw));
  if (isWelfare) {
    return {
      category: 'BULLYING_WELFARE',
      urgency: 'CRITICAL_WELFARE',
      sentiment: 'DISTRESSED',
      sentimentScore: -0.92,
      aiTags: ['Welfare-Bypass', 'Safeguarding-Flag', 'Urgent-Intervention'],
      isWelfareEscalated: true,
      escalatedTo: 'Designated Safeguarding Lead (Dr. Kunle Adeleke: +234 803 123 4567) & Guidance Counselor',
    };
  }

  // 2. Category Detection
  let category: SuggestionCategory = 'GENERAL';
  const aiTags: string[] = [];

  if (FACILITIES_TRIGGERS.some((kw) => combined.includes(kw))) {
    category = 'FACILITIES';
    aiTags.push('Campus-Infrastructure');
  } else if (FOOD_TRIGGERS.some((kw) => combined.includes(kw))) {
    category = 'FOOD_CAFETERIA';
    aiTags.push('Catering & Hygiene');
  } else if (ACADEMICS_TRIGGERS.some((kw) => combined.includes(kw))) {
    category = 'ACADEMICS';
    aiTags.push('Curriculum & Pedagogy');
  } else if (FEES_TRIGGERS.some((kw) => combined.includes(kw))) {
    category = 'FEES_BILLING';
    aiTags.push('Finance & Billing');
  } else {
    category = 'GENERAL';
    aiTags.push('Student Life');
  }

  // 3. Sentiment & Urgency Analysis
  const positiveWords = ['great', 'thank', 'love', 'appreciate', 'excellent', 'helpful', 'praise', 'wonderful', 'congratulations', 'good'];
  const negativeWords = ['terrible', 'broken', 'disappointed', 'unacceptable', 'bad', 'dirty', 'late', 'hot', 'smelly', 'poor', 'frustrated', 'complaint'];
  const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'danger', 'hazard', 'safety', 'sparking', 'exposed wire'];

  const posCount = positiveWords.filter((w) => combined.includes(w)).length;
  const negCount = negativeWords.filter((w) => combined.includes(w)).length;
  const isUrgent = urgentWords.some((w) => combined.includes(w));

  let sentiment: SuggestionSentiment = 'NEUTRAL';
  let sentimentScore = 0.0;

  if (posCount > negCount) {
    sentiment = 'POSITIVE';
    sentimentScore = 0.65;
    aiTags.push('Commendation');
  } else if (negCount > posCount) {
    sentiment = 'NEGATIVE';
    sentimentScore = -0.55;
    aiTags.push('Improvement-Need');
  } else {
    sentiment = 'NEUTRAL';
    sentimentScore = 0.05;
  }

  const urgency: SuggestionUrgency = isUrgent ? 'URGENT' : (negCount >= 2 ? 'NORMAL' : 'LOW');
  if (isUrgent) aiTags.push('Priority-Attention');

  return {
    category,
    urgency,
    sentiment,
    sentimentScore,
    aiTags,
    isWelfareEscalated: false,
  };
}

export const INITIAL_SUGGESTIONS: SuggestionRecord[] = [
  {
    id: 'sug-001',
    school_id: DEFAULT_SCHOOL_ID,
    trackingCode: 'SUG-2024-101',
    title: 'Science Lab 2 Exhaust Fans Broken & Strong Chemical Smell',
    content: 'During chemistry experiments on Wednesday, the fume hood in Senior Lab 2 failed to extract acidic vapor. Several students felt dizzy. Please inspect the exhaust fans urgently.',
    isAnonymous: true,
    category: 'FACILITIES',
    urgency: 'URGENT',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.65,
    aiTags: ['Campus-Infrastructure', 'Priority-Attention', 'Lab-Safety'],
    isWelfareEscalated: false,
    status: 'IN_PROGRESS',
    adminFeedback: 'Maintenance team dispatched on Thursday morning. The exhaust blower motor capacitor was replaced; verified airflow on Friday.',
    internalAdminNotes: 'Mr. Patrick confirmed replacement from spare stores. Invoice pending with Bursar (₦35,000).',
    submittedAt: '2024-11-13T10:15:00Z',
    updatedAt: '2024-11-14T16:00:00Z',
  },
  {
    id: 'sug-002',
    school_id: DEFAULT_SCHOOL_ID,
    trackingCode: 'SUG-2024-102',
    title: 'Extortion and intimidation behind the sports pavilion',
    content: 'Some older students are bullying younger JSS 1 boys behind the sports pavilion after basketball practice, extorting their pocket money and threatening violence if they tell anyone.',
    isAnonymous: true,
    category: 'BULLYING_WELFARE',
    urgency: 'CRITICAL_WELFARE',
    sentiment: 'DISTRESSED',
    sentimentScore: -0.95,
    aiTags: ['Welfare-Bypass', 'Safeguarding-Flag', 'Urgent-Intervention'],
    isWelfareEscalated: true,
    escalatedTo: 'Designated Safeguarding Lead (Dr. Kunle Adeleke: +234 803 123 4567) & Guidance Counselor',
    status: 'UNDER_REVIEW',
    adminFeedback: 'The Safeguarding Office has taken immediate action. Increased security patrol cameras and prefect monitoring have been stationed at the pavilion.',
    internalAdminNotes: 'Vice Principal Pastoral met with Sports Master. Duty roster adjusted. Dean will interview potential witnesses discreetly.',
    submittedAt: '2024-11-18T14:30:00Z',
    updatedAt: '2024-11-18T15:00:00Z',
  },
  {
    id: 'sug-003',
    school_id: DEFAULT_SCHOOL_ID,
    trackingCode: 'SUG-2024-103',
    title: 'Loving the new Robotics and Coding Club syllabus!',
    content: 'Just wanted to appreciate the school management for introducing Python and Arduino in the ICT curriculum this term. The hands-on projects have made a huge difference to our engagement.',
    isAnonymous: false,
    submitterId: 'std-1',
    submitterName: 'Chinedu Adeleke',
    submitterRole: 'STUDENT',
    submitterEmail: 'chinedu.adeleke@student.apexacademy.edu',
    category: 'ACADEMICS',
    urgency: 'LOW',
    sentiment: 'POSITIVE',
    sentimentScore: 0.85,
    aiTags: ['Curriculum & Pedagogy', 'Commendation', 'STEM'],
    isWelfareEscalated: false,
    status: 'ACTIONED',
    adminFeedback: 'Thank you Chinedu! The Academic Council is thrilled by student enthusiasm and is planning a STEM Exhibition for second term.',
    internalAdminNotes: 'Forwarded commendation to Ms. Ngozi Nwosu (ICT Department).',
    submittedAt: '2024-11-05T09:00:00Z',
    updatedAt: '2024-11-06T11:20:00Z',
  },
  {
    id: 'sug-004',
    school_id: DEFAULT_SCHOOL_ID,
    trackingCode: 'SUG-2024-104',
    title: 'Cafeteria lunch queue too slow during second break',
    content: 'The second break is only 30 minutes and students in JSS 2 spend up to 20 minutes standing in line. Could we open a second serving counter for pre-packed jollof rice?',
    isAnonymous: false,
    submitterId: 'user-7',
    submitterName: 'Dr. Kunle Adeleke',
    submitterRole: 'PARENT',
    submitterEmail: 'kunle.adeleke@example.com',
    category: 'FOOD_CAFETERIA',
    urgency: 'NORMAL',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.45,
    aiTags: ['Catering & Hygiene', 'Improvement-Need'],
    isWelfareEscalated: false,
    status: 'RECEIVED',
    adminFeedback: 'Received. Food Services committee is reviewing counter staffing for the upcoming term.',
    internalAdminNotes: 'Catering vendor contract up for review in December.',
    submittedAt: '2024-11-22T12:00:00Z',
    updatedAt: '2024-11-22T12:00:00Z',
  },
];

export function getSuggestions(): SuggestionRecord[] {
  try {
    const raw = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(INITIAL_SUGGESTIONS));
      return INITIAL_SUGGESTIONS;
    }
    const parsed: SuggestionRecord[] = JSON.parse(raw);
    return parsed.filter((s) => !s.school_id || s.school_id === DEFAULT_SCHOOL_ID);
  } catch (err) {
    console.error('Failed to load suggestions:', err);
    return INITIAL_SUGGESTIONS;
  }
}

export function saveSuggestions(records: SuggestionRecord[]): void {
  try {
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save suggestions:', err);
  }
}

export function submitSuggestion(params: {
  title: string;
  content: string;
  isAnonymous: boolean;
  submitterId?: string;
  submitterName?: string;
  submitterRole?: Role;
  submitterEmail?: string;
}): SuggestionRecord {
  const classification = classifySuggestionText(params.title, params.content);
  const existing = getSuggestions();
  const trackingCode = `SUG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const newRecord: SuggestionRecord = {
    id: `sug-${Date.now()}`,
    school_id: DEFAULT_SCHOOL_ID,
    trackingCode,
    title: params.title.trim(),
    content: params.content.trim(),
    isAnonymous: params.isAnonymous,
    submitterId: params.isAnonymous ? undefined : params.submitterId,
    submitterName: params.isAnonymous ? undefined : params.submitterName,
    submitterRole: params.isAnonymous ? undefined : params.submitterRole,
    submitterEmail: params.isAnonymous ? undefined : params.submitterEmail,
    category: classification.category,
    urgency: classification.urgency,
    sentiment: classification.sentiment,
    sentimentScore: classification.sentimentScore,
    aiTags: classification.aiTags,
    isWelfareEscalated: classification.isWelfareEscalated,
    escalatedTo: classification.escalatedTo,
    status: 'RECEIVED',
    adminFeedback: 'Thank you for your feedback. Our administration is reviewing your submission.',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newRecord, ...existing];
  saveSuggestions(updated);

  enqueueOfflineAction('/api/suggestions', 'POST', newRecord, `Submitted suggestion ${trackingCode}`);

  return newRecord;
}

export function updateSuggestionAdminAction(
  id: string,
  params: {
    status?: SuggestionStatus;
    adminFeedback?: string;
    internalAdminNotes?: string;
    category?: SuggestionCategory;
  },
  adminName: string
): SuggestionRecord | null {
  const records = getSuggestions();
  const index = records.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const existing = records[index];
  const updatedRecord: SuggestionRecord = {
    ...existing,
    ...params,
    updatedAt: new Date().toISOString(),
  };

  records[index] = updatedRecord;
  saveSuggestions(records);

  enqueueOfflineAction(`/api/suggestions/${id}`, 'PATCH', updatedRecord, `Admin ${adminName} updated suggestion ${id}`);

  return updatedRecord;
}

export function getSuggestionsForSubmitter(emailOrId: string): SuggestionRecord[] {
  const all = getSuggestions();
  return all.filter((s) => !s.isAnonymous && (s.submitterEmail === emailOrId || s.submitterId === emailOrId));
}

export function lookupSuggestionByTrackingCode(trackingCode: string): SuggestionRecord | null {
  const all = getSuggestions();
  return all.find((s) => s.trackingCode.trim().toUpperCase() === trackingCode.trim().toUpperCase()) || null;
}
