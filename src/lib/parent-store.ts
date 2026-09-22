/**
 * Parent Portal & Multi-Child Linking Store
 * 
 * Invariants:
 * - Tenant Isolation: Scoped by TENANT_SCHOOL_ID
 * - Admin-Only Linking: Parents cannot self-link; links are provisioned by registrar/admin.
 * - Multi-child aggregation: Aggregates fee balances across all linked wards while preserving per-child breakdown.
 */

import { ParentChildLink, Student, StudentFeeAccount } from '../types';
import { getAllStudentFeeAccounts } from './fee-store';
import { TENANT_SCHOOL_ID } from './class-timetable-store';
import { enqueueOfflineAction } from './offline-queue';

const STORAGE_KEY = `sms_parent_child_links_${TENANT_SCHOOL_ID}`;

// Pre-seeded authentic Nigerian family parent-child linkages
const INITIAL_PARENT_LINKS: ParentChildLink[] = [
  // Family 1: Dr. Kunle Adeleke (Parent)
  {
    id: 'link-adeleke-chinedu',
    parentId: 'user-7',
    parentName: 'Dr. Kunle Adeleke',
    parentEmail: 'kunle.adeleke@example.com',
    parentPhone: '+234 803 445 6789',
    relationship: 'FATHER',
    studentId: 'st-chinedu-adeleke',
    studentName: 'Chinedu Adeleke',
    admissionNumber: 'ADM-2024-001',
    classLevel: 'JSS 1',
    classArm: 'Gold',
    isEmergencyContact: true,
    hasFinancialResponsibility: true,
    linkedAt: '2024-09-08T10:00:00Z',
    linkedBy: 'Registrar Office (Dr. Evelyn Vance)',
  },
  {
    id: 'link-adeleke-zara',
    parentId: 'user-7',
    parentName: 'Dr. Kunle Adeleke',
    parentEmail: 'kunle.adeleke@example.com',
    parentPhone: '+234 803 445 6789',
    relationship: 'FATHER',
    studentId: 'st-zara-adeleke',
    studentName: 'Zara Adeleke',
    admissionNumber: 'ADM-2023-014',
    classLevel: 'JSS 3',
    classArm: 'Diamond',
    isEmergencyContact: true,
    hasFinancialResponsibility: true,
    linkedAt: '2024-09-08T10:05:00Z',
    linkedBy: 'Registrar Office (Dr. Evelyn Vance)',
  },

  // Family 2: Mrs. Folashade Alabi (Teacher + Parent role holder)
  {
    id: 'link-alabi-femi',
    parentId: 'user-6',
    parentName: 'Mrs. Folashade Alabi',
    parentEmail: 'folashade.alabi@apexacademy.edu',
    parentPhone: '+234 802 333 4455',
    relationship: 'MOTHER',
    studentId: 'st-femi-alabi',
    studentName: 'Femi Alabi',
    admissionNumber: 'ADM-2024-042',
    classLevel: 'SSS 1',
    classArm: 'Science (Diamond)',
    isEmergencyContact: true,
    hasFinancialResponsibility: true,
    linkedAt: '2024-09-05T09:30:00Z',
    linkedBy: 'Registrar Office (Dr. Evelyn Vance)',
  },
  {
    id: 'link-alabi-damilola',
    parentId: 'user-6',
    parentName: 'Mrs. Folashade Alabi',
    parentEmail: 'folashade.alabi@apexacademy.edu',
    parentPhone: '+234 802 333 4455',
    relationship: 'MOTHER',
    studentId: 'st-damilola-alabi',
    studentName: 'Damilola Alabi',
    admissionNumber: 'ADM-2023-088',
    classLevel: 'JSS 2',
    classArm: 'Gold',
    isEmergencyContact: true,
    hasFinancialResponsibility: true,
    linkedAt: '2024-09-05T09:35:00Z',
    linkedBy: 'Registrar Office (Dr. Evelyn Vance)',
  },

  // Family 3: Mr. David Okonjo (Teacher + Parent role holder)
  {
    id: 'link-okonjo-emeka',
    parentId: 'user-4',
    parentName: 'Mr. David Okonjo',
    parentEmail: 'david.okonjo@apexacademy.edu',
    parentPhone: '+234 803 555 6677',
    relationship: 'FATHER',
    studentId: 'st-emeka-okonjo',
    studentName: 'Emeka Okonjo',
    admissionNumber: 'ADM-2024-005',
    classLevel: 'JSS 1',
    classArm: 'Gold',
    isEmergencyContact: true,
    hasFinancialResponsibility: true,
    linkedAt: '2024-09-06T14:10:00Z',
    linkedBy: 'Registrar Office (Dr. Evelyn Vance)',
  },
  {
    id: 'link-okonjo-somto',
    parentId: 'user-4',
    parentName: 'Mr. David Okonjo',
    parentEmail: 'david.okonjo@apexacademy.edu',
    parentPhone: '+234 803 555 6677',
    relationship: 'FATHER',
    studentId: 'st-somto-okonjo',
    studentName: 'Somtochukwu Okonjo',
    admissionNumber: 'ADM-2023-022',
    classLevel: 'JSS 3',
    classArm: 'Gold',
    isEmergencyContact: true,
    hasFinancialResponsibility: true,
    linkedAt: '2024-09-06T14:15:00Z',
    linkedBy: 'Registrar Office (Dr. Evelyn Vance)',
  },
];

export function getAllParentChildLinks(): ParentChildLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PARENT_LINKS));
      return INITIAL_PARENT_LINKS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load parent child links:', err);
    return INITIAL_PARENT_LINKS;
  }
}

export function saveParentChildLinks(links: ParentChildLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch (err) {
    console.error('Failed to persist parent child links:', err);
  }
}

export function getLinksForParent(parentId: string): ParentChildLink[] {
  const all = getAllParentChildLinks();
  return all.filter((l) => l.parentId === parentId);
}

export function linkChildToParent(
  data: Omit<ParentChildLink, 'id' | 'linkedAt'>
): ParentChildLink {
  const current = getAllParentChildLinks();
  
  // Guard against duplicate linking
  const existing = current.find(
    (l) => l.parentId === data.parentId && l.studentId === data.studentId
  );
  if (existing) {
    return existing;
  }

  const newLink: ParentChildLink = {
    ...data,
    id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    linkedAt: new Date().toISOString(),
  };

  const updated = [newLink, ...current];
  saveParentChildLinks(updated);

  enqueueOfflineAction(
    '/api/parents/link-child',
    'POST',
    newLink,
    `Linked ${data.studentName} to parent ${data.parentName} (${data.relationship})`
  );

  return newLink;
}

export function unlinkChildFromParent(linkId: string, performedBy: string): void {
  const current = getAllParentChildLinks();
  const target = current.find((l) => l.id === linkId);
  const updated = current.filter((l) => l.id !== linkId);
  saveParentChildLinks(updated);

  if (target) {
    enqueueOfflineAction(
      '/api/parents/unlink-child',
      'DELETE',
      { linkId, parentId: target.parentId, studentId: target.studentId, performedBy },
      `Unlinked ${target.studentName} from parent ${target.parentName}`
    );
  }
}

export interface FamilyFeeSummary {
  totalBilled: number;
  totalPaid: number;
  totalBalanceDue: number;
  overallPercentagePaid: number;
  clearedCount: number;
  partialCount: number;
  unpaidCount: number;
  accounts: StudentFeeAccount[];
}

export function getCombinedFamilyFeeSummary(
  studentIds: string[],
  allStudents?: Student[]
): FamilyFeeSummary {
  const feeAccounts = getAllStudentFeeAccounts();
  const matchedAccounts: StudentFeeAccount[] = [];

  studentIds.forEach((id) => {
    let acc = feeAccounts.find((f) => f.studentId === id);
    if (!acc && allStudents) {
      const st = allStudents.find((s) => s.id === id);
      if (st) {
        // Synthesize standard fee account for the linked student
        acc = {
          id: `fee-${st.id}-auto`,
          schoolId: TENANT_SCHOOL_ID,
          studentId: st.id,
          studentName: `${st.firstName} ${st.lastName}`,
          admissionNumber: st.admissionNumber,
          classLevel: st.classLevel,
          classArm: st.classArm,
          sessionYear: '2024/2025',
          termName: 'Third Term',
          totalBilled: 185000,
          grossBilled: 185000,
          totalPaid: 120000,
          balanceDue: 65000,
          status: 'PARTIAL',
          percentagePaid: 65,
          payments: [
            {
              id: `pay-${st.id}-init`,
              transactionReference: `FLW-2025-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
              studentId: st.id,
              amount: 120000,
              paymentDate: '2025-01-18',
              channel: 'FLUTTERWAVE',
              status: 'SUCCESS',
              payerName: st.guardianName || 'Guardian',
              notes: 'Term commencement tuition installment',
              recordedBy: 'Flutterwave Gateway Automated',
              recordedAt: '2025-01-18T11:00:00Z',
            },
          ],
          feeItems: [
            { id: 'item-1', name: 'Tuition Fee', type: 'TUITION', amount: 120000, isCompulsory: true },
            { id: 'item-2', name: 'ICT & STEM Portal', type: 'OTHER', amount: 25000, isCompulsory: true },
            { id: 'item-3', name: 'Science Laboratory', type: 'LAB_SCIENCE', amount: 20000, isCompulsory: true },
            { id: 'item-4', name: 'Health & First Aid', type: 'OTHER', amount: 20000, isCompulsory: true },
          ],
          discountAmount: 0,
          appliedDiscounts: [],
        };
      }
    }
    if (acc) {
      matchedAccounts.push(acc);
    }
  });

  const totalBilled = matchedAccounts.reduce((sum, a) => sum + (a.totalBilled || 0), 0);
  const totalPaid = matchedAccounts.reduce((sum, a) => sum + (a.totalPaid || 0), 0);
  const totalBalanceDue = Math.max(0, totalBilled - totalPaid);
  const overallPercentagePaid =
    totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 100;

  const clearedCount = matchedAccounts.filter((a) => a.status === 'CLEARED').length;
  const partialCount = matchedAccounts.filter((a) => a.status === 'PARTIAL').length;
  const unpaidCount = matchedAccounts.filter((a) => a.status === 'UNPAID').length;

  return {
    totalBilled,
    totalPaid,
    totalBalanceDue,
    overallPercentagePaid,
    clearedCount,
    partialCount,
    unpaidCount,
    accounts: matchedAccounts,
  };
}
