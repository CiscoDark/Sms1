import { Role, UserProfile } from '../types';

export type TabId =
  | 'dashboard'
  | 'admissions'
  | 'students'
  | 'sessions'
  | 'class-structure'
  | 'timetables'
  | 'teacher-timetable'
  | 'assessments'
  | 'gradebook'
  | 'student-portal'
  | 'parent-portal'
  | 'messages'
  | 'fees'
  | 'disciplinary'
  | 'suggestions'
  | 'payroll'
  | 'backup'
  | 'data-migration'
  | 'design-system';

export interface DemoAccountConfig {
  username: string;
  password: string;
  user: UserProfile;
  defaultTab: TabId;
  allowedTabs: TabId[];
  isSuperAdmin?: boolean; // When true, strictly hidden from public listings and ordinary persona selectors
}

export const DEMO_ACCOUNTS: DemoAccountConfig[] = [
  // 1. Super Admin Developer Account (sole owner & developer, completely hidden from visible UI)
  {
    username: 'admin',
    password: 'admin',
    isSuperAdmin: true,
    defaultTab: 'dashboard',
    allowedTabs: [
      'dashboard',
      'admissions',
      'students',
      'sessions',
      'class-structure',
      'timetables',
      'teacher-timetable',
      'assessments',
      'gradebook',
      'student-portal',
      'parent-portal',
      'messages',
      'fees',
      'disciplinary',
      'suggestions',
      'payroll',
      'backup',
      'data-migration',
      'design-system', // ONLY Super Admin has access
    ],
    user: {
      id: 'usr-admin-dev',
      username: 'admin',
      name: 'System Developer',
      email: 'admin@apexacademy.edu',
      role: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
      title: 'Platform Developer & Sole Owner',
      schoolId: 'school-apex-001',
    },
  },

  // 2. Principal Account (Executive leadership)
  {
    username: 'principal',
    password: 'principal',
    defaultTab: 'dashboard',
    allowedTabs: [
      'dashboard',
      'admissions',
      'students',
      'sessions',
      'class-structure',
      'timetables',
      'assessments',
      'gradebook',
      'fees',
      'disciplinary',
      'suggestions',
      'payroll',
      'backup',
      'data-migration',
      'messages',
    ],
    user: {
      id: 'usr-principal-01',
      username: 'principal',
      name: 'Prof. Marcus Adebayo',
      email: 'principal@apexacademy.edu',
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      title: 'Executive Principal',
      schoolId: 'school-apex-001',
    },
  },

  // 3. Academic Director Account (Academic structure & curriculum)
  {
    username: 'academic',
    password: 'academic',
    defaultTab: 'class-structure',
    allowedTabs: [
      'class-structure',
      'gradebook',
      'timetables',
      'admissions',
      'students',
      'assessments',
      'sessions',
      'disciplinary',
      'messages',
    ],
    user: {
      id: 'usr-academic-01',
      username: 'academic',
      name: 'Mrs. Claire Sterling',
      email: 'academic@apexacademy.edu',
      role: 'ACADEMIC_DIRECTOR',
      roles: ['ACADEMIC_DIRECTOR'],
      title: 'Dean of Academic Affairs',
      schoolId: 'school-apex-001',
    },
  },

  // 4. Bursar Account (Finance & payroll)
  {
    username: 'bursar',
    password: 'bursar',
    defaultTab: 'fees',
    allowedTabs: [
      'fees',
      'payroll',
      'students',
      'messages',
    ],
    user: {
      id: 'usr-bursar-01',
      username: 'bursar',
      name: 'Mrs. Fatima Bello',
      email: 'bursar@apexacademy.edu',
      role: 'BURSAR',
      roles: ['BURSAR'],
      title: 'Chief Financial Officer & Bursar',
      schoolId: 'school-apex-001',
    },
  },

  // 5. Teacher Account (Gradebook, attendance, classroom form)
  {
    username: 'teacher',
    password: 'teacher',
    defaultTab: 'gradebook',
    allowedTabs: [
      'gradebook',
      'teacher-timetable',
      'students',
      'assessments',
      'disciplinary',
      'messages',
    ],
    user: {
      id: 'usr-teacher-01',
      username: 'teacher',
      name: 'Mr. David Okonjo',
      email: 'teacher@apexacademy.edu',
      role: 'TEACHER',
      roles: ['TEACHER'],
      title: 'Mathematics Form Master (JSS 1 Gold)',
      assignedClassLevel: 'JSS 1',
      assignedClassArm: 'Gold',
      schoolId: 'school-apex-001',
    },
  },

  // 6. Parent Account (Parent portal, student progress, fee payments)
  {
    username: 'parent',
    password: 'parent',
    defaultTab: 'parent-portal',
    allowedTabs: [
      'parent-portal',
      'messages',
    ],
    user: {
      id: 'usr-parent-01',
      username: 'parent',
      name: 'Dr. Kunle Adeleke',
      email: 'parent@apexacademy.edu',
      role: 'PARENT',
      roles: ['PARENT'],
      title: 'Guardian of Zara & Chinedu Adeleke',
      phoneNumber: '+234 803 445 6789',
      linkedStudentIds: ['stu-001', 'stu-002'],
      schoolId: 'school-apex-001',
    },
  },

  // 7. Student / Class Captain Account (Student portal, suggestions, assignments)
  {
    username: 'student',
    password: 'student',
    defaultTab: 'student-portal',
    allowedTabs: [
      'student-portal',
      'suggestions',
      'messages',
    ],
    user: {
      id: 'usr-student-01',
      username: 'student',
      name: 'Kenechukwu Okafor',
      email: 'student@apexacademy.edu',
      role: 'STUDENT',
      roles: ['STUDENT', 'CLASS_CAPTAIN'],
      title: 'JSS 1 Gold Student & Class Captain',
      assignedClassLevel: 'JSS 1',
      assignedClassArm: 'Gold',
      schoolId: 'school-apex-001',
    },
  },
];

/**
 * Returns only non-Super-Admin demo accounts for public listing in the demo helper panel.
 * Strictly guarantees Super Admin is never exposed to testers.
 */
export function getPublicDemoAccounts(): Omit<DemoAccountConfig, 'password'>[] {
  return DEMO_ACCOUNTS
    .filter((acc) => !acc.isSuperAdmin)
    .map((acc) => ({
      username: acc.username,
      user: acc.user,
      defaultTab: acc.defaultTab,
      allowedTabs: acc.allowedTabs,
    }));
}

/**
 * Authenticates against hard-coded test credentials.
 * Supports username or email matching.
 */
export function authenticateDemoUser(
  usernameOrEmail: string,
  passwordAttempt: string
): DemoAccountConfig | null {
  const normalizedInput = usernameOrEmail.trim().toLowerCase();
  const normalizedPassword = passwordAttempt.trim();

  const found = DEMO_ACCOUNTS.find(
    (acc) =>
      (acc.username.toLowerCase() === normalizedInput ||
        acc.user.email.toLowerCase() === normalizedInput) &&
      acc.password === normalizedPassword
  );

  return found || null;
}

const AUTH_STORAGE_KEY = 'sms_demo_auth_user';

export function getStoredAuthUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function storeAuthUser(user: UserProfile): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to store auth user', e);
  }
}

export function clearAuthUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear auth user', e);
  }
}

/**
 * Returns default landing tab for a given role.
 */
export function getDefaultTabForRole(role: Role): TabId {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'dashboard';
    case 'PRINCIPAL':
      return 'dashboard';
    case 'ACADEMIC_DIRECTOR':
      return 'class-structure';
    case 'BURSAR':
      return 'fees';
    case 'TEACHER':
      return 'gradebook';
    case 'PARENT':
      return 'parent-portal';
    case 'STUDENT':
    case 'CLASS_CAPTAIN':
      return 'student-portal';
    default:
      return 'dashboard';
  }
}

/**
 * Returns allowed tabs for role.
 * Architectural rule: ONLY SUPER_ADMIN is permitted to access 'design-system'.
 */
export function getAllowedTabsForRole(role: Role): TabId[] {
  const account = DEMO_ACCOUNTS.find((acc) => acc.user.role === role);
  if (account) {
    return account.allowedTabs;
  }
  // Fallback safe default (NO design-system)
  return ['dashboard', 'students', 'messages'];
}

export function isTabAllowed(role: Role, tab: TabId): boolean {
  if (tab === 'design-system') {
    return role === 'SUPER_ADMIN';
  }
  const allowed = getAllowedTabsForRole(role);
  return allowed.includes(tab);
}
