import { Applicant, AdmissionStage, Student, ClassLevel, UserProfile } from '../../types';
import { enqueueOfflineAction } from '../offline-queue';
import { getStoredStudents, saveStudents, syncLevelArmEnrollments } from '../migration-store';

const STORAGE_KEY_APPLICANTS = 'sms_applicants';

// Realistic initial applicants for Apex Academy
export const INITIAL_APPLICANTS: Applicant[] = [
  // 1. APPLIED
  {
    id: 'app-101',
    applicationNumber: 'APP/2024/001',
    appliedDate: '2024-09-12',
    firstName: 'Toluwanimi',
    middleName: 'David',
    lastName: 'Adekunle',
    gender: 'M',
    dateOfBirth: '2012-04-15',
    residentialAddress: '14 Admiralty Way, Lekki Phase 1, Lagos',
    desiredLevel: 'JSS 1',
    desiredArmPreference: 'Gold',
    priorSchool: 'Corona Primary School, Gbagada',
    priorGradeAverage: '88% (Excellent in Sciences)',
    guardianName: 'Dr. Kunle Adekunle',
    guardianRelationship: 'Father',
    guardianPhone: '+2348033214567',
    guardianEmail: 'kunle.adekunle@healthgroup.ng',
    guardianOccupation: 'Consultant Neurosurgeon',
    stage: 'APPLIED',
    stageHistory: [
      {
        id: 'hist-101-1',
        stage: 'APPLIED',
        changedAt: '2024-09-12 09:30',
        changedBy: 'Public Admissions Portal',
        notes: 'Application form submitted online with birth certificate and grade 6 transcript.',
      },
    ],
  },
  {
    id: 'app-102',
    applicationNumber: 'APP/2024/002',
    appliedDate: '2024-09-14',
    firstName: 'Halimat',
    middleName: 'Bolanle',
    lastName: 'Suleiman',
    gender: 'F',
    dateOfBirth: '2011-08-22',
    residentialAddress: '8 Bishop Kale Close, Victoria Island, Lagos',
    desiredLevel: 'JSS 2',
    desiredArmPreference: 'Diamond',
    priorSchool: 'St. Saviour\'s School, Ikoyi',
    priorGradeAverage: '82% (Grade A in Mathematics)',
    guardianName: 'Mrs. Mariam Suleiman',
    guardianRelationship: 'Mother',
    guardianPhone: '+2348021987654',
    guardianEmail: 'm.suleiman@investmentpartners.com',
    guardianOccupation: 'Senior Portfolio Director',
    stage: 'APPLIED',
    stageHistory: [
      {
        id: 'hist-102-1',
        stage: 'APPLIED',
        changedAt: '2024-09-14 11:15',
        changedBy: 'Mrs. Claire Sterling (Admissions Desk)',
        notes: 'Transfer inquiry registered from St. Saviour\'s following family relocation.',
      },
    ],
  },
  {
    id: 'app-103',
    applicationNumber: 'APP/2024/003',
    appliedDate: '2024-09-15',
    firstName: 'Ifeoluwa',
    middleName: 'Samuel',
    lastName: 'Ajibade',
    gender: 'M',
    dateOfBirth: '2009-11-03',
    residentialAddress: '22 Bourdillon Road, Ikoyi, Lagos',
    desiredLevel: 'SSS 1',
    desiredArmPreference: 'Science',
    priorSchool: 'Grange Secondary School, Ikeja',
    priorGradeAverage: '89% (BECE Distinction in 8 subjects)',
    guardianName: 'Chief Segun Ajibade',
    guardianRelationship: 'Father',
    guardianPhone: '+2348145678901',
    guardianEmail: 's.ajibade@energyinfra.com',
    guardianOccupation: 'Managing Director, Infrastructure Ltd',
    stage: 'APPLIED',
    stageHistory: [
      {
        id: 'hist-103-1',
        stage: 'APPLIED',
        changedAt: '2024-09-15 14:00',
        changedBy: 'Public Admissions Portal',
        notes: 'Direct SSS 1 entry application with Junior WAEC / BECE distinction certificates attached.',
      },
    ],
  },

  // 2. UNDER REVIEW
  {
    id: 'app-201',
    applicationNumber: 'APP/2024/004',
    appliedDate: '2024-09-08',
    firstName: 'Chidubem',
    middleName: 'Arthur',
    lastName: 'Nwachukwu',
    gender: 'M',
    dateOfBirth: '2012-06-19',
    residentialAddress: '5 Cooper Road, Ikoyi, Lagos',
    desiredLevel: 'JSS 1',
    priorSchool: 'Greenwood House School, Parkview',
    priorGradeAverage: '85%',
    guardianName: 'Barr. Obinna Nwachukwu',
    guardianRelationship: 'Father',
    guardianPhone: '+2348039871122',
    guardianEmail: 'obinna@nwachukwupartners.com',
    guardianOccupation: 'Senior Advocate of Nigeria (SAN)',
    stage: 'UNDER_REVIEW',
    stageHistory: [
      {
        id: 'hist-201-1',
        stage: 'APPLIED',
        changedAt: '2024-09-08 10:20',
        changedBy: 'Public Admissions Portal',
        notes: 'Application registered.',
      },
      {
        id: 'hist-201-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-09-10 14:30',
        changedBy: 'Prof. Marcus Adebayo',
        notes: 'Primary school clearance verified. Scheduled for Batch A entrance assessment.',
      },
    ],
  },
  {
    id: 'app-202',
    applicationNumber: 'APP/2024/005',
    appliedDate: '2024-09-09',
    firstName: 'Zainab',
    middleName: 'Khadija',
    lastName: 'Danjuma',
    gender: 'F',
    dateOfBirth: '2010-02-14',
    residentialAddress: '19 Queens Drive, Ikoyi, Lagos',
    desiredLevel: 'JSS 3',
    priorSchool: 'British International School, Victoria Island',
    priorGradeAverage: '91%',
    guardianName: 'Alhaji Bashir Danjuma',
    guardianRelationship: 'Father',
    guardianPhone: '+2348023344556',
    guardianEmail: 'bashir.danjuma@logistics.ng',
    guardianOccupation: 'Aviation Logistics Executive',
    stage: 'UNDER_REVIEW',
    stageHistory: [
      {
        id: 'hist-202-1',
        stage: 'APPLIED',
        changedAt: '2024-09-09 11:00',
        changedBy: 'Admissions Office',
        notes: 'Application processed.',
      },
      {
        id: 'hist-202-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-09-11 09:15',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Transcripts in order. Reviewing capacity in JSS 3 arms.',
      },
    ],
  },
  {
    id: 'app-203',
    applicationNumber: 'APP/2024/006',
    appliedDate: '2024-09-11',
    firstName: 'Kareem',
    middleName: 'Opeyemi',
    lastName: 'Fashola',
    gender: 'M',
    dateOfBirth: '2008-09-30',
    residentialAddress: '31 Alexander Avenue, Ikoyi, Lagos',
    desiredLevel: 'SSS 2',
    desiredArmPreference: 'Arts & Humanities',
    priorSchool: 'Kings College, Lagos',
    priorGradeAverage: '79%',
    guardianName: 'Mrs. Folake Fashola',
    guardianRelationship: 'Mother',
    guardianPhone: '+2347065544332',
    guardianEmail: 'ffashola@creativeagency.ng',
    guardianOccupation: 'Brand Communications Director',
    stage: 'UNDER_REVIEW',
    stageHistory: [
      {
        id: 'hist-203-1',
        stage: 'APPLIED',
        changedAt: '2024-09-11 16:20',
        changedBy: 'Public Admissions Portal',
        notes: 'Application submitted.',
      },
      {
        id: 'hist-203-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-09-13 10:00',
        changedBy: 'Dr. Evelyn Vance',
        notes: 'Reviewing subject combinations for Arts stream.',
      },
    ],
  },

  // 3. ASSESSED / INTERVIEWED
  {
    id: 'app-301',
    applicationNumber: 'APP/2024/007',
    appliedDate: '2024-09-01',
    firstName: 'Morayo',
    middleName: 'Esther',
    lastName: 'Oyelaran',
    gender: 'F',
    dateOfBirth: '2012-01-18',
    residentialAddress: '7 Glover Road, Ikoyi, Lagos',
    desiredLevel: 'JSS 1',
    priorSchool: 'Meadow Hall School, Lekki',
    priorGradeAverage: '94%',
    guardianName: 'Engr. Dapo Oyelaran',
    guardianRelationship: 'Father',
    guardianPhone: '+2348035567890',
    guardianEmail: 'dapo.oyelaran@energy.com',
    guardianOccupation: 'Chief Technology Officer',
    stage: 'ASSESSED',
    assessmentScores: [
      { subject: 'Mathematics', score: 92, maxScore: 100 },
      { subject: 'English Language', score: 95, maxScore: 100 },
      { subject: 'General Science & Logic', score: 88, maxScore: 100 },
    ],
    totalAssessmentScore: 91.7,
    assessmentNotes: 'Exceptional verbal articulation and strong problem-solving skills in quantitative logic. Recommended for Accelerated Science track.',
    interviewerName: 'Mr. David Okonjo (Head of Mathematics)',
    assessmentDate: '2024-09-14',
    stageHistory: [
      {
        id: 'hist-301-1',
        stage: 'APPLIED',
        changedAt: '2024-09-01 08:30',
        changedBy: 'Public Admissions Portal',
        notes: 'Application created.',
      },
      {
        id: 'hist-301-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-09-03 11:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Passed initial screening.',
      },
      {
        id: 'hist-301-3',
        stage: 'ASSESSED',
        changedAt: '2024-09-14 13:45',
        changedBy: 'Mr. David Okonjo',
        notes: 'Completed entrance exam: 91.7% aggregate. Highly recommended for admission offer.',
      },
    ],
  },
  {
    id: 'app-302',
    applicationNumber: 'APP/2024/008',
    appliedDate: '2024-09-02',
    firstName: 'Folarin',
    middleName: 'Oluwatobi',
    lastName: 'Gbadamosi',
    gender: 'M',
    dateOfBirth: '2012-05-11',
    residentialAddress: '12 Lugard Avenue, Ikoyi, Lagos',
    desiredLevel: 'JSS 1',
    priorSchool: 'Children\'s International School, Lekki',
    priorGradeAverage: '86%',
    guardianName: 'Mrs. Bisi Gbadamosi',
    guardianRelationship: 'Mother',
    guardianPhone: '+2348187766554',
    guardianEmail: 'b.gbadamosi@lagoslegal.com',
    guardianOccupation: 'Commercial Arbitrator',
    stage: 'ASSESSED',
    assessmentScores: [
      { subject: 'Mathematics', score: 84, maxScore: 100 },
      { subject: 'English Language', score: 89, maxScore: 100 },
      { subject: 'General Science & Logic', score: 82, maxScore: 100 },
    ],
    totalAssessmentScore: 85.0,
    assessmentNotes: 'Candidate demonstrated disciplined study habits and keen interest in robotics and ICT clubs.',
    interviewerName: 'Ms. Ngozi Nwosu (Computer Science)',
    assessmentDate: '2024-09-14',
    stageHistory: [
      {
        id: 'hist-302-1',
        stage: 'APPLIED',
        changedAt: '2024-09-02 10:00',
        changedBy: 'Public Admissions Portal',
        notes: 'Application submitted.',
      },
      {
        id: 'hist-302-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-09-04 14:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Approved for testing.',
      },
      {
        id: 'hist-302-3',
        stage: 'ASSESSED',
        changedAt: '2024-09-14 14:30',
        changedBy: 'Ms. Ngozi Nwosu',
        notes: 'Assessment score 85%. Interview clear.',
      },
    ],
  },
  {
    id: 'app-303',
    applicationNumber: 'APP/2024/009',
    appliedDate: '2024-09-04',
    firstName: 'Chidinma',
    middleName: 'Pearl',
    lastName: 'Eke',
    gender: 'F',
    dateOfBirth: '2009-03-27',
    residentialAddress: '4 Turnbull Road, Ikoyi, Lagos',
    desiredLevel: 'SSS 1',
    desiredArmPreference: 'Commercial',
    priorSchool: 'Vivian Fowler Memorial College, Ikeja',
    priorGradeAverage: '87%',
    guardianName: 'Mr. Kenneth Eke',
    guardianRelationship: 'Father',
    guardianPhone: '+2349031122334',
    guardianEmail: 'keke@capitalholdings.ng',
    guardianOccupation: 'Investment Banker',
    stage: 'ASSESSED',
    assessmentScores: [
      { subject: 'Mathematics', score: 88, maxScore: 100 },
      { subject: 'English Language', score: 91, maxScore: 100 },
      { subject: 'Business & Accounting Aptitude', score: 86, maxScore: 100 },
    ],
    totalAssessmentScore: 88.3,
    assessmentNotes: 'Exemplary aptitude in commerce and analytical reasoning. Highly suitable for Commercial/Economics class arm.',
    interviewerName: 'Mrs. Aisha Mohammed (Economics)',
    assessmentDate: '2024-09-15',
    stageHistory: [
      {
        id: 'hist-303-1',
        stage: 'APPLIED',
        changedAt: '2024-09-04 09:10',
        changedBy: 'Public Admissions Portal',
        notes: 'Application registered.',
      },
      {
        id: 'hist-303-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-09-05 16:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'BECE transcripts verified.',
      },
      {
        id: 'hist-303-3',
        stage: 'ASSESSED',
        changedAt: '2024-09-15 15:00',
        changedBy: 'Mrs. Aisha Mohammed',
        notes: 'Scored 88.3% overall. Recommended for admission.',
      },
    ],
  },

  // 4. ADMITTED
  {
    id: 'app-401',
    applicationNumber: 'APP/2024/010',
    appliedDate: '2024-08-25',
    firstName: 'Babajide',
    middleName: 'Ayotunde',
    lastName: 'Tinubu',
    gender: 'M',
    dateOfBirth: '2012-03-08',
    residentialAddress: '9 Okotie Eboh Crescent, Ikoyi, Lagos',
    desiredLevel: 'JSS 1',
    desiredArmPreference: 'Gold',
    priorSchool: 'Lagoon School, Lekki',
    priorGradeAverage: '92%',
    guardianName: 'Engr. Wale Tinubu',
    guardianRelationship: 'Father',
    guardianPhone: '+2348029988776',
    guardianEmail: 'wale.tinubu@maritime.com',
    guardianOccupation: 'Marine Engineer & Logistics Exec',
    stage: 'ADMITTED',
    assessmentScores: [
      { subject: 'Mathematics', score: 90, maxScore: 100 },
      { subject: 'English Language', score: 94, maxScore: 100 },
      { subject: 'General Science', score: 89, maxScore: 100 },
    ],
    totalAssessmentScore: 91.0,
    assessmentNotes: 'Candidate admitted on merit. Provisional offer letter sent to parents. Awaiting arm assignment and enrollment confirmation.',
    interviewerName: 'Mrs. Claire Sterling',
    assessmentDate: '2024-09-05',
    stageHistory: [
      {
        id: 'hist-401-1',
        stage: 'APPLIED',
        changedAt: '2024-08-25 10:00',
        changedBy: 'Public Admissions Portal',
        notes: 'Application submitted.',
      },
      {
        id: 'hist-401-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-08-28 09:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Verified.',
      },
      {
        id: 'hist-401-3',
        stage: 'ASSESSED',
        changedAt: '2024-09-05 11:30',
        changedBy: 'Mr. David Okonjo',
        notes: 'Passed entrance assessment with 91%.',
      },
      {
        id: 'hist-401-4',
        stage: 'ADMITTED',
        changedAt: '2024-09-08 14:00',
        changedBy: 'Prof. Marcus Adebayo (Executive Principal)',
        notes: 'Official admission offer letter issued. Acceptance fee confirmed.',
      },
    ],
  },
  {
    id: 'app-402',
    applicationNumber: 'APP/2024/011',
    appliedDate: '2024-08-28',
    firstName: 'Maryam',
    middleName: 'Zahra',
    lastName: 'Attah',
    gender: 'F',
    dateOfBirth: '2012-07-29',
    residentialAddress: '17 Queen\'s Barracks Way, Lagos',
    desiredLevel: 'JSS 1',
    desiredArmPreference: 'Diamond',
    priorSchool: 'American International School, Lagos',
    priorGradeAverage: '90%',
    guardianName: 'Dr. Usman Attah',
    guardianRelationship: 'Father',
    guardianPhone: '+2348037766554',
    guardianEmail: 'usman.attah@unicef.org',
    guardianOccupation: 'Public Health Director, UN',
    stage: 'ADMITTED',
    assessmentScores: [
      { subject: 'Mathematics', score: 88, maxScore: 100 },
      { subject: 'English Language', score: 96, maxScore: 100 },
      { subject: 'General Science', score: 87, maxScore: 100 },
    ],
    totalAssessmentScore: 90.3,
    assessmentNotes: 'Candidate admitted. Excellent background in French and English. Assigned to Diamond stream upon enrollment.',
    interviewerName: 'Mrs. Rebecca Mensah',
    assessmentDate: '2024-09-06',
    stageHistory: [
      {
        id: 'hist-402-1',
        stage: 'APPLIED',
        changedAt: '2024-08-28 11:30',
        changedBy: 'Public Admissions Portal',
        notes: 'Application registered.',
      },
      {
        id: 'hist-402-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-08-30 10:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Document verification complete.',
      },
      {
        id: 'hist-402-3',
        stage: 'ASSESSED',
        changedAt: '2024-09-06 14:00',
        changedBy: 'Mrs. Rebecca Mensah',
        notes: 'Scored 90.3% in entrance exams.',
      },
      {
        id: 'hist-402-4',
        stage: 'ADMITTED',
        changedAt: '2024-09-09 16:30',
        changedBy: 'Dr. Evelyn Vance',
        notes: 'Formal admission granted.',
      },
    ],
  },
  {
    id: 'app-403',
    applicationNumber: 'APP/2024/012',
    appliedDate: '2024-08-29',
    firstName: 'Victor',
    middleName: 'Oluwadamilare',
    lastName: 'Bankole',
    gender: 'M',
    dateOfBirth: '2009-05-14',
    residentialAddress: '2 Cameron Road, Ikoyi, Lagos',
    desiredLevel: 'SSS 1',
    desiredArmPreference: 'Science',
    priorSchool: 'Loyola Jesuit College, Abuja',
    priorGradeAverage: '93%',
    guardianName: 'Mrs. Grace Bankole',
    guardianRelationship: 'Mother',
    guardianPhone: '+2348123344556',
    guardianEmail: 'gbankole@telecom.ng',
    guardianOccupation: 'Vice President, Enterprise Telecoms',
    stage: 'ADMITTED',
    assessmentScores: [
      { subject: 'Mathematics', score: 96, maxScore: 100 },
      { subject: 'English Language', score: 89, maxScore: 100 },
      { subject: 'Basic Science & Tech', score: 95, maxScore: 100 },
    ],
    totalAssessmentScore: 93.3,
    assessmentNotes: 'Top candidate in entrance cohort. Highest score in Mathematics and Physics Aptitude. Admitted into SSS 1 Science.',
    interviewerName: 'Mr. Kenneth Bruce (Physics)',
    assessmentDate: '2024-09-07',
    stageHistory: [
      {
        id: 'hist-403-1',
        stage: 'APPLIED',
        changedAt: '2024-08-29 09:40',
        changedBy: 'Public Admissions Portal',
        notes: 'Application lodged.',
      },
      {
        id: 'hist-403-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-09-01 12:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Passed screening.',
      },
      {
        id: 'hist-403-3',
        stage: 'ASSESSED',
        changedAt: '2024-09-07 10:30',
        changedBy: 'Mr. Kenneth Bruce',
        notes: '93.3% aggregate score.',
      },
      {
        id: 'hist-403-4',
        stage: 'ADMITTED',
        changedAt: '2024-09-10 11:00',
        changedBy: 'Prof. Marcus Adebayo',
        notes: 'Offer letter dispatched with merit commendation.',
      },
    ],
  },

  // 5. ENROLLED (Completed lifecycle)
  {
    id: 'app-501',
    applicationNumber: 'APP/2024/013',
    appliedDate: '2024-08-10',
    firstName: 'Kelechi',
    middleName: 'Bryan',
    lastName: 'Okoro',
    gender: 'M',
    dateOfBirth: '2012-02-19',
    residentialAddress: '24 Parkview Estate, Ikoyi, Lagos',
    desiredLevel: 'JSS 1',
    desiredArmPreference: 'Gold',
    priorSchool: 'St. Saviour\'s School, Ikoyi',
    priorGradeAverage: '91%',
    guardianName: 'Dr. Chike Okoro',
    guardianRelationship: 'Father',
    guardianPhone: '+2348028877665',
    guardianEmail: 'c.okoro@medcenter.org',
    guardianOccupation: 'Chief Medical Officer',
    stage: 'ENROLLED',
    assessmentScores: [
      { subject: 'Mathematics', score: 94, maxScore: 100 },
      { subject: 'English Language', score: 88, maxScore: 100 },
      { subject: 'General Science', score: 92, maxScore: 100 },
    ],
    totalAssessmentScore: 91.3,
    assessmentNotes: 'Candidate enrolled. All statutory documentation, medical clearance, and uniforms fulfilled.',
    interviewerName: 'Mr. David Okonjo',
    assessmentDate: '2024-08-20',
    assignedArm: 'Gold',
    assignedAdmissionNumber: 'APA/2024/261',
    enrolledDate: '2024-09-02',
    stageHistory: [
      {
        id: 'hist-501-1',
        stage: 'APPLIED',
        changedAt: '2024-08-10 10:00',
        changedBy: 'Public Admissions Portal',
        notes: 'Application registered.',
      },
      {
        id: 'hist-501-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-08-14 11:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Reviewed.',
      },
      {
        id: 'hist-501-3',
        stage: 'ASSESSED',
        changedAt: '2024-08-20 12:00',
        changedBy: 'Mr. David Okonjo',
        notes: 'Score: 91.3%.',
      },
      {
        id: 'hist-501-4',
        stage: 'ADMITTED',
        changedAt: '2024-08-24 15:00',
        changedBy: 'Dr. Evelyn Vance',
        notes: 'Admitted.',
      },
      {
        id: 'hist-501-5',
        stage: 'ENROLLED',
        changedAt: '2024-09-02 09:00',
        changedBy: 'Prof. Marcus Adebayo',
        notes: 'Enrolled to JSS 1 Gold. Assigned admission number APA/2024/261.',
      },
    ],
  },
  {
    id: 'app-502',
    applicationNumber: 'APP/2024/014',
    appliedDate: '2024-08-12',
    firstName: 'Fatima',
    middleName: 'Amina',
    lastName: 'Bala',
    gender: 'F',
    dateOfBirth: '2012-09-05',
    residentialAddress: '3 McDonald Road, Ikoyi, Lagos',
    desiredLevel: 'JSS 1',
    desiredArmPreference: 'Silver',
    priorSchool: 'Grange School, Ikeja',
    priorGradeAverage: '89%',
    guardianName: 'Hajiya Aishatu Bala',
    guardianRelationship: 'Mother',
    guardianPhone: '+2348031199887',
    guardianEmail: 'aishatu.bala@federalagric.gov.ng',
    guardianOccupation: 'Federal Director of Agriculture',
    stage: 'ENROLLED',
    assessmentScores: [
      { subject: 'Mathematics', score: 86, maxScore: 100 },
      { subject: 'English Language', score: 92, maxScore: 100 },
      { subject: 'General Science', score: 90, maxScore: 100 },
    ],
    totalAssessmentScore: 89.3,
    assessmentNotes: 'Candidate enrolled. Biometrics captured. Form Master notified.',
    interviewerName: 'Mrs. Claire Sterling',
    assessmentDate: '2024-08-22',
    assignedArm: 'Silver',
    assignedAdmissionNumber: 'APA/2024/262',
    enrolledDate: '2024-09-03',
    stageHistory: [
      {
        id: 'hist-502-1',
        stage: 'APPLIED',
        changedAt: '2024-08-12 14:00',
        changedBy: 'Public Admissions Portal',
        notes: 'Submitted.',
      },
      {
        id: 'hist-502-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-08-15 10:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Screened.',
      },
      {
        id: 'hist-502-3',
        stage: 'ASSESSED',
        changedAt: '2024-08-22 14:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: '89.3% aggregate.',
      },
      {
        id: 'hist-502-4',
        stage: 'ADMITTED',
        changedAt: '2024-08-26 11:30',
        changedBy: 'Prof. Marcus Adebayo',
        notes: 'Admitted.',
      },
      {
        id: 'hist-502-5',
        stage: 'ENROLLED',
        changedAt: '2024-09-03 10:15',
        changedBy: 'Dr. Evelyn Vance',
        notes: 'Enrolled to JSS 1 Silver. Assigned admission number APA/2024/262.',
      },
    ],
  },

  // 6. ARCHIVED: REJECTED (Preserved in archive, never deleted)
  {
    id: 'app-601',
    applicationNumber: 'APP/2024/015',
    appliedDate: '2024-08-18',
    firstName: 'Damian',
    middleName: 'Obi',
    lastName: 'Chukwuma',
    gender: 'M',
    dateOfBirth: '2012-10-01',
    residentialAddress: '45 Awolowo Road, Ikoyi, Lagos',
    desiredLevel: 'JSS 1',
    priorSchool: 'St. Jude Primary Academy, Surulere',
    priorGradeAverage: '52%',
    guardianName: 'Mr. Jude Chukwuma',
    guardianRelationship: 'Father',
    guardianPhone: '+2348054433221',
    guardianEmail: 'jude.c@logisticsmail.com',
    guardianOccupation: 'Freight Forwarder',
    stage: 'REJECTED',
    assessmentScores: [
      { subject: 'Mathematics', score: 42, maxScore: 100 },
      { subject: 'English Language', score: 48, maxScore: 100 },
      { subject: 'General Science', score: 45, maxScore: 100 },
    ],
    totalAssessmentScore: 45.0,
    assessmentNotes: 'Candidate did not meet the mandatory 65% aggregate benchmark for JSS 1 admission.',
    rejectionReason: 'Entrance examination aggregate score (45.0%) below the institutional cut-off threshold of 65.0%. Candidate advised to undertake foundational bridging instruction.',
    interviewerName: 'Mr. David Okonjo',
    assessmentDate: '2024-08-29',
    stageHistory: [
      {
        id: 'hist-601-1',
        stage: 'APPLIED',
        changedAt: '2024-08-18 10:00',
        changedBy: 'Public Admissions Portal',
        notes: 'Submitted.',
      },
      {
        id: 'hist-601-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-08-21 11:30',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Registered for entrance test.',
      },
      {
        id: 'hist-601-3',
        stage: 'ASSESSED',
        changedAt: '2024-08-29 13:00',
        changedBy: 'Mr. David Okonjo',
        notes: 'Candidate scored 45.0%. Did not attain minimum cut-off.',
      },
      {
        id: 'hist-601-4',
        stage: 'REJECTED',
        changedAt: '2024-09-02 16:00',
        changedBy: 'Prof. Marcus Adebayo',
        notes: 'Application rejected. Regrets letter transmitted to guardian. Retained in archived records.',
      },
    ],
  },
  {
    id: 'app-602',
    applicationNumber: 'APP/2024/016',
    appliedDate: '2024-08-22',
    firstName: 'Emmanuel',
    middleName: 'Chima',
    lastName: 'Nwankwo',
    gender: 'M',
    dateOfBirth: '2008-01-12',
    residentialAddress: '11 Oyinkan Abayomi Drive, Ikoyi, Lagos',
    desiredLevel: 'SSS 3',
    priorSchool: 'Federal Government College, Ijanikin',
    priorGradeAverage: '61%',
    guardianName: 'Engr. Festus Nwankwo',
    guardianRelationship: 'Father',
    guardianPhone: '+2348039900112',
    guardianEmail: 'festus.nwankwo@telecoms.ng',
    guardianOccupation: 'Project Director',
    stage: 'REJECTED',
    rejectionReason: 'Institutional policy precludes direct external transfer admissions into terminal WAEC examination classes (SSS 3). Candidate advised to apply for SSS 2 repeat/acceleration.',
    stageHistory: [
      {
        id: 'hist-602-1',
        stage: 'APPLIED',
        changedAt: '2024-08-22 15:30',
        changedBy: 'Public Admissions Portal',
        notes: 'Application received for SSS 3 entry.',
      },
      {
        id: 'hist-602-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-08-25 09:30',
        changedBy: 'Dr. Evelyn Vance',
        notes: 'Reviewing statutory WAEC registration constraints.',
      },
      {
        id: 'hist-602-3',
        stage: 'REJECTED',
        changedAt: '2024-08-26 14:00',
        changedBy: 'Prof. Marcus Adebayo',
        notes: 'Rejected under Ministry/WAEC policy regarding non-transferability of SSS 3 terminal registration.',
      },
    ],
  },

  // 7. ARCHIVED: WITHDRAWN (Preserved in archive, never deleted)
  {
    id: 'app-701',
    applicationNumber: 'APP/2024/017',
    appliedDate: '2024-08-15',
    firstName: 'Simisola',
    middleName: 'Faith',
    lastName: 'Ogunlesi',
    gender: 'F',
    dateOfBirth: '2012-05-30',
    residentialAddress: '16 Lugard Avenue, Ikoyi, Lagos',
    desiredLevel: 'JSS 1',
    priorSchool: 'Corona Primary School, Victoria Island',
    priorGradeAverage: '90%',
    guardianName: 'Dr. Leke Ogunlesi',
    guardianRelationship: 'Father',
    guardianPhone: '+2348025544331',
    guardianEmail: 'leke.ogunlesi@oilandgas.com',
    guardianOccupation: 'Managing Director, Exploration',
    stage: 'WITHDRAWN',
    assessmentScores: [
      { subject: 'Mathematics', score: 91, maxScore: 100 },
      { subject: 'English Language', score: 93, maxScore: 100 },
    ],
    totalAssessmentScore: 92.0,
    withdrawalReason: 'Parent relocated internationally to London, United Kingdom for diplomatic posting prior to fee clearance and enrollment.',
    interviewerName: 'Mrs. Claire Sterling',
    assessmentDate: '2024-08-25',
    stageHistory: [
      {
        id: 'hist-701-1',
        stage: 'APPLIED',
        changedAt: '2024-08-15 11:00',
        changedBy: 'Public Admissions Portal',
        notes: 'Submitted.',
      },
      {
        id: 'hist-701-2',
        stage: 'UNDER_REVIEW',
        changedAt: '2024-08-18 10:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Processed.',
      },
      {
        id: 'hist-701-3',
        stage: 'ASSESSED',
        changedAt: '2024-08-25 14:30',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Scored 92% aggregate.',
      },
      {
        id: 'hist-701-4',
        stage: 'ADMITTED',
        changedAt: '2024-08-28 10:00',
        changedBy: 'Dr. Evelyn Vance',
        notes: 'Offer issued.',
      },
      {
        id: 'hist-701-5',
        stage: 'WITHDRAWN',
        changedAt: '2024-09-04 16:00',
        changedBy: 'Mrs. Claire Sterling',
        notes: 'Parent formally requested withdrawal due to overseas diplomatic reassignment.',
      },
    ],
  },
];

export function getStoredApplicants(): Applicant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICANTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // First time initialization: seed realistic applicants
    localStorage.setItem(STORAGE_KEY_APPLICANTS, JSON.stringify(INITIAL_APPLICANTS));
    return INITIAL_APPLICANTS;
  } catch (err) {
    console.error('Failed to read applicants from localStorage', err);
    return INITIAL_APPLICANTS;
  }
}

export function saveApplicants(applicants: Applicant[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));
    enqueueOfflineAction(
      '/api/admissions/applicants',
      'POST',
      { count: applicants.length },
      `Persisted ${applicants.length} admission applications`
    );
  } catch (err) {
    console.error('Failed to save applicants to localStorage', err);
  }
}

export function generateNextApplicationNumber(existingApplicants: Applicant[]): string {
  const currentYear = new Date().getFullYear();
  let maxNumber = 0;
  existingApplicants.forEach((app) => {
    const match = app.applicationNumber.match(/APP\/\d+\/(\d+)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxNumber) maxNumber = val;
    }
  });
  const nextSeq = String(maxNumber + 1).padStart(3, '0');
  return `APP/${currentYear}/${nextSeq}`;
}

export function generateNextAdmissionNumber(existingStudents: Student[]): string {
  const currentYear = new Date().getFullYear();
  let maxNumber = 260; // Base count in realistic cohort
  existingStudents.forEach((student) => {
    const match = student.admissionNumber.match(/APA\/\d+\/(\d+)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > maxNumber) maxNumber = val;
    }
  });
  const nextSeq = String(maxNumber + 1).padStart(3, '0');
  return `APA/${currentYear}/${nextSeq}`;
}

// Stage advancement
export function advanceApplicantStage(
  applicants: Applicant[],
  applicantId: string,
  nextStage: AdmissionStage,
  details: {
    notes?: string;
    assessmentScores?: { subject: string; score: number; maxScore: number }[];
    totalAssessmentScore?: number;
    assessmentNotes?: string;
    interviewerName?: string;
    assessmentDate?: string;
  },
  performer: UserProfile
): { updatedApplicants: Applicant[]; updatedApplicant: Applicant } {
  let updatedApplicant: Applicant | null = null;

  const updatedApplicants = applicants.map((app) => {
    if (app.id !== applicantId) return app;

    const now = new Date();
    const timestampStr = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;

    const newHistory = [
      ...app.stageHistory,
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stage: nextStage,
        changedAt: timestampStr,
        changedBy: `${performer.name} (${performer.title || performer.role})`,
        notes: details.notes || `Advanced to ${nextStage.replace('_', ' ')} stage.`,
      },
    ];

    updatedApplicant = {
      ...app,
      stage: nextStage,
      assessmentScores: details.assessmentScores || app.assessmentScores,
      totalAssessmentScore:
        details.totalAssessmentScore !== undefined
          ? details.totalAssessmentScore
          : app.totalAssessmentScore,
      assessmentNotes: details.assessmentNotes || app.assessmentNotes,
      interviewerName: details.interviewerName || app.interviewerName,
      assessmentDate: details.assessmentDate || app.assessmentDate,
      stageHistory: newHistory,
    };

    return updatedApplicant;
  });

  if (!updatedApplicant) {
    throw new Error(`Applicant ${applicantId} not found`);
  }

  saveApplicants(updatedApplicants);
  return { updatedApplicants, updatedApplicant };
}

// Reject applicant
export function rejectApplicant(
  applicants: Applicant[],
  applicantId: string,
  rejectionReason: string,
  performer: UserProfile
): { updatedApplicants: Applicant[]; updatedApplicant: Applicant } {
  let updatedApplicant: Applicant | null = null;

  const updatedApplicants = applicants.map((app) => {
    if (app.id !== applicantId) return app;

    const now = new Date();
    const timestampStr = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;

    const newHistory = [
      ...app.stageHistory,
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stage: 'REJECTED' as AdmissionStage,
        changedAt: timestampStr,
        changedBy: `${performer.name} (${performer.title || performer.role})`,
        notes: `Application rejected: ${rejectionReason}`,
      },
    ];

    updatedApplicant = {
      ...app,
      stage: 'REJECTED',
      rejectionReason,
      stageHistory: newHistory,
    };

    return updatedApplicant;
  });

  if (!updatedApplicant) {
    throw new Error(`Applicant ${applicantId} not found`);
  }

  saveApplicants(updatedApplicants);
  return { updatedApplicants, updatedApplicant };
}

// Withdraw applicant
export function withdrawApplicant(
  applicants: Applicant[],
  applicantId: string,
  withdrawalReason: string,
  performer: UserProfile
): { updatedApplicants: Applicant[]; updatedApplicant: Applicant } {
  let updatedApplicant: Applicant | null = null;

  const updatedApplicants = applicants.map((app) => {
    if (app.id !== applicantId) return app;

    const now = new Date();
    const timestampStr = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;

    const newHistory = [
      ...app.stageHistory,
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stage: 'WITHDRAWN' as AdmissionStage,
        changedAt: timestampStr,
        changedBy: `${performer.name} (${performer.title || performer.role})`,
        notes: `Application withdrawn: ${withdrawalReason}`,
      },
    ];

    updatedApplicant = {
      ...app,
      stage: 'WITHDRAWN',
      withdrawalReason,
      stageHistory: newHistory,
    };

    return updatedApplicant;
  });

  if (!updatedApplicant) {
    throw new Error(`Applicant ${applicantId} not found`);
  }

  saveApplicants(updatedApplicants);
  return { updatedApplicants, updatedApplicant };
}

// Re-open / Appeal archived applicant
export function reopenApplicant(
  applicants: Applicant[],
  applicantId: string,
  reopenReason: string,
  performer: UserProfile
): { updatedApplicants: Applicant[]; updatedApplicant: Applicant } {
  let updatedApplicant: Applicant | null = null;

  const updatedApplicants = applicants.map((app) => {
    if (app.id !== applicantId) return app;

    const now = new Date();
    const timestampStr = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;

    const newHistory = [
      ...app.stageHistory,
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stage: 'UNDER_REVIEW' as AdmissionStage,
        changedAt: timestampStr,
        changedBy: `${performer.name} (${performer.title || performer.role})`,
        notes: `Archived application re-opened for appeal/re-evaluation: ${reopenReason}`,
      },
    ];

    updatedApplicant = {
      ...app,
      stage: 'UNDER_REVIEW',
      stageHistory: newHistory,
    };

    return updatedApplicant;
  });

  if (!updatedApplicant) {
    throw new Error(`Applicant ${applicantId} not found`);
  }

  saveApplicants(updatedApplicants);
  return { updatedApplicants, updatedApplicant };
}

// Complete Enrollment: Auto-generates full student record and updates class capacity
export function enrollApplicant(
  applicants: Applicant[],
  applicantId: string,
  assignedArm: string,
  customAdmissionNumber: string | undefined,
  levels: ClassLevel[],
  performer: UserProfile
): {
  updatedApplicants: Applicant[];
  updatedApplicant: Applicant;
  newStudent: Student;
  updatedLevels: ClassLevel[];
} {
  const currentStudents = getStoredStudents();
  const applicant = applicants.find((a) => a.id === applicantId);
  if (!applicant) throw new Error(`Applicant ${applicantId} not found`);

  const admissionNumber =
    customAdmissionNumber?.trim() || generateNextAdmissionNumber(currentStudents);

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const timestampStr = `${todayDateStr} ${now.toTimeString().slice(0, 5)}`;

  // 1. Create full Student record
  const newStudent: Student = {
    id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    admissionNumber,
    firstName: applicant.firstName.trim(),
    lastName: applicant.lastName.trim(),
    gender: applicant.gender,
    classLevel: applicant.desiredLevel,
    classArm: assignedArm,
    guardianName: applicant.guardianName.trim(),
    guardianPhone: applicant.guardianPhone.trim(),
    guardianEmail: applicant.guardianEmail?.trim() || undefined,
    dob: applicant.dateOfBirth,
    enrollmentDate: todayDateStr,
    status: 'ACTIVE',
  };

  // 2. Persist new student record to student directory
  const updatedStudents = [...currentStudents, newStudent];
  saveStudents(updatedStudents);

  // 3. Update Class Level & Arm enrollment statistics
  const updatedLevels = syncLevelArmEnrollments(levels, updatedStudents);

  // 4. Update applicant status to ENROLLED
  let updatedApplicant: Applicant | null = null;
  const updatedApplicants = applicants.map((app) => {
    if (app.id !== applicantId) return app;

    const newHistory = [
      ...app.stageHistory,
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stage: 'ENROLLED' as AdmissionStage,
        changedAt: timestampStr,
        changedBy: `${performer.name} (${performer.title || performer.role})`,
        notes: `Enrolled successfully into ${app.desiredLevel} - Arm: ${assignedArm}. Generated Official Admission Number: ${admissionNumber}.`,
      },
    ];

    updatedApplicant = {
      ...app,
      stage: 'ENROLLED',
      assignedArm,
      assignedAdmissionNumber: admissionNumber,
      enrolledDate: todayDateStr,
      stageHistory: newHistory,
    };

    return updatedApplicant;
  });

  if (!updatedApplicant) {
    throw new Error('Failed to update applicant stage to ENROLLED');
  }

  saveApplicants(updatedApplicants);

  // Enqueue offline action for student enrollment
  enqueueOfflineAction(
    '/api/students/enroll',
    'POST',
    {
      applicantId,
      admissionNumber,
      studentId: newStudent.id,
      classLevel: newStudent.classLevel,
      classArm: newStudent.classArm,
    },
    `Enrolled ${newStudent.firstName} ${newStudent.lastName} with Admission No: ${admissionNumber}`
  );

  return {
    updatedApplicants,
    updatedApplicant,
    newStudent,
    updatedLevels,
  };
}
