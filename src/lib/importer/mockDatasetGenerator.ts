import { Student, Staff, FeePayment, ClassLevel } from '../../types';

// Realistic first and last names for authentic diversity
const FIRST_NAMES_MALE = [
  'Chinedu', 'Oluwaseun', 'Babajide', 'Emeka', 'Tunde', 'Ibrahim', 'Farouk', 'Kelechi',
  'David', 'Samuel', 'Daniel', 'Michael', 'Godswill', 'Victor', 'Nnamdi', 'Femi',
  'Dapo', 'Abubakar', 'Musa', 'Tariq', 'Joshua', 'Ezekiel', 'Emmanuel', 'Chidi',
  'Ayomide', 'Gideon', 'Osas', 'Tobi', 'Kayode', 'Segun', 'Aliyu', 'Uche'
];

const FIRST_NAMES_FEMALE = [
  'Amina', 'Chidinma', 'Zainab', 'Ngozi', 'Fatima', 'Folashade', 'Blessing', 'Precious',
  'Grace', 'Faith', 'Miracle', 'Simisola', 'Onyinye', 'Maryam', 'Hauwa', 'Khadijah',
  'Halima', 'Eunice', 'Chisom', 'Temiloluwa', 'Damilola', 'Tolani', 'Adanna', 'Ifeoma',
  'Titilayo', 'Joy', 'Esther', 'Bukola', 'Yetunde', 'Morayo', 'Adaora', 'Chioma'
];

const LAST_NAMES = [
  'Adebayo', 'Okafor', 'Balogun', 'Danladi', 'Mensah', 'Adeleke', 'Bello', 'Ibrahim',
  'Okonkwo', 'Sowore', 'Al-Hassan', 'Osei', 'Bruce', 'Nwosu', 'Vance', 'Sterling',
  'Onyekachi', 'Eze', 'Ogundipe', 'Suleiman', 'Mohammed', 'Afolabi', 'Bakare', 'Achebe',
  'Ajayi', 'Lawal', 'Fashola', 'Oladipo', 'Gbadamosi', 'Soyinka', 'Attah', 'Chukwu'
];

const GUARDIAN_TITLES = ['Mr.', 'Mrs.', 'Dr.', 'Chief', 'Engr.', 'Barr.', 'Prof.', 'Alhaji', 'Hajiya'];

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-'];

// Generate 260 realistic students mapped directly across configured levels & arms
export function generateRealisticStudentCohort(levels: ClassLevel[]): Student[] {
  const students: Student[] = [];
  let admCounter = 1;

  // Age offsets per class level
  const levelAgeMap: Record<string, number> = {
    'JSS 1': 11,
    'JSS 2': 12,
    'JSS 3': 13,
    'SSS 1': 14,
    'SSS 2': 15,
    'SSS 3': 16,
  };

  levels.forEach((level) => {
    const baseAge = levelAgeMap[level.name] || 12;

    level.arms.forEach((arm) => {
      // Generate between 18 and 24 students per arm to total ~250+ students
      const countForArm = Math.min(arm.capacity || 35, 20 + Math.floor(Math.random() * 5));

      for (let i = 0; i < countForArm; i++) {
        const isMale = i % 2 === 0;
        const firstName = isMale
          ? FIRST_NAMES_MALE[(admCounter + i * 3) % FIRST_NAMES_MALE.length]
          : FIRST_NAMES_FEMALE[(admCounter + i * 5) % FIRST_NAMES_FEMALE.length];
        const lastName = LAST_NAMES[(admCounter * 7 + i) % LAST_NAMES.length];
        const guardianTitle = GUARDIAN_TITLES[(admCounter + i) % GUARDIAN_TITLES.length];
        const guardianLastName = i % 8 === 0 ? LAST_NAMES[(admCounter + 3) % LAST_NAMES.length] : lastName;
        const guardianFirstName = isMale
          ? FIRST_NAMES_FEMALE[(admCounter + 2) % FIRST_NAMES_FEMALE.length]
          : FIRST_NAMES_MALE[(admCounter + 4) % FIRST_NAMES_MALE.length];

        const admNumber = `APA/2024/${String(admCounter).padStart(3, '0')}`;
        
        // Realistic phone formats
        const phonePrefixes = ['+234803', '+234802', '+234814', '+234903', '+234706', '+234818'];
        const prefix = phonePrefixes[(admCounter + i) % phonePrefixes.length];
        const phoneSuffix = String(1000000 + ((admCounter * 12345 + i * 789) % 9000000)).slice(0, 7);
        const guardianPhone = `${prefix}${phoneSuffix}`;

        // Birthdate
        const birthYear = 2024 - baseAge;
        const birthMonth = String(1 + ((admCounter + i) % 12)).padStart(2, '0');
        const birthDay = String(1 + ((admCounter * 3 + i) % 28)).padStart(2, '0');
        const dob = `${birthYear}-${birthMonth}-${birthDay}`;

        students.push({
          id: `stu-${admCounter}`,
          admissionNumber: admNumber,
          firstName,
          lastName,
          gender: isMale ? 'M' : 'F',
          classLevel: level.name,
          classArm: arm.name,
          guardianName: `${guardianTitle} ${guardianFirstName} ${guardianLastName}`,
          guardianPhone,
          guardianEmail: `${guardianFirstName.toLowerCase()}.${guardianLastName.toLowerCase()}@example.com`,
          dob,
          bloodGroup: BLOOD_GROUPS[(admCounter + i) % BLOOD_GROUPS.length],
          enrollmentDate: '2024-09-09',
          status: 'ACTIVE',
        });

        admCounter++;
      }
    });
  });

  return students;
}

// Generate realistic Staff cohort
export function generateRealisticStaffCohort(): Staff[] {
  const staffMembers: Staff[] = [
    {
      id: 'stf-1',
      staffNumber: 'STF-2021-001',
      firstName: 'David',
      lastName: 'Okonjo',
      gender: 'M',
      email: 'david.okonjo@apexacademy.edu',
      phone: '+2348034567890',
      role: 'TEACHER',
      department: 'Mathematics',
      qualification: 'B.Sc. Mathematics & Statistics (First Class)',
      employmentDate: '2021-08-15',
      assignedLevel: 'JSS 1',
      assignedArm: 'Diamond',
      status: 'ACTIVE',
    },
    {
      id: 'stf-2',
      staffNumber: 'STF-2020-002',
      firstName: 'Rebecca',
      lastName: 'Mensah',
      gender: 'F',
      email: 'rebecca.mensah@apexacademy.edu',
      phone: '+2348023456781',
      role: 'TEACHER',
      department: 'English Literature',
      qualification: 'B.A. English Language & M.Ed Curriculum Design',
      employmentDate: '2020-09-01',
      assignedLevel: 'JSS 1',
      assignedArm: 'Gold',
      status: 'ACTIVE',
    },
    {
      id: 'stf-3',
      staffNumber: 'STF-2019-003',
      firstName: 'Samuel',
      lastName: 'Okafor',
      gender: 'M',
      email: 'samuel.okafor@apexacademy.edu',
      phone: '+2348145678902',
      role: 'TEACHER',
      department: 'Basic Science',
      qualification: 'Ph.D. Chemical Pathology',
      employmentDate: '2019-10-10',
      assignedLevel: 'JSS 1',
      assignedArm: 'Silver',
      status: 'ACTIVE',
    },
    {
      id: 'stf-4',
      staffNumber: 'STF-2022-004',
      firstName: 'Grace',
      lastName: 'Danladi',
      gender: 'F',
      email: 'grace.danladi@apexacademy.edu',
      phone: '+2349036789013',
      role: 'TEACHER',
      department: 'Social Studies',
      qualification: 'B.Sc. Sociology & International Relations',
      employmentDate: '2022-01-15',
      assignedLevel: 'JSS 2',
      assignedArm: 'Diamond',
      status: 'ACTIVE',
    },
    {
      id: 'stf-5',
      staffNumber: 'STF-2018-005',
      firstName: 'Kenneth',
      lastName: 'Bruce',
      gender: 'M',
      email: 'kenneth.bruce@apexacademy.edu',
      phone: '+2347067890124',
      role: 'TEACHER',
      department: 'Physics',
      qualification: 'M.Sc. Applied Geophysics & Electronics',
      employmentDate: '2018-08-20',
      assignedLevel: 'SSS 1',
      assignedArm: 'Science (Diamond)',
      status: 'ACTIVE',
    },
    {
      id: 'stf-6',
      staffNumber: 'STF-2021-006',
      firstName: 'Chioma',
      lastName: 'Adeleke',
      gender: 'F',
      email: 'chioma.adeleke@apexacademy.edu',
      phone: '+2348188901235',
      role: 'TEACHER',
      department: 'Chemistry',
      qualification: 'B.Sc. Industrial Chemistry (Second Class Upper)',
      employmentDate: '2021-09-01',
      assignedLevel: 'SSS 2',
      assignedArm: 'Science (Diamond)',
      status: 'ACTIVE',
    },
    {
      id: 'stf-7',
      staffNumber: 'STF-2017-007',
      firstName: 'Tariq',
      lastName: 'Al-Hassan',
      gender: 'M',
      email: 'tariq.alhassan@apexacademy.edu',
      phone: '+2348039012346',
      role: 'TEACHER',
      department: 'Biology',
      qualification: 'M.Sc. Microbiology & Molecular Genetics',
      employmentDate: '2017-09-12',
      assignedLevel: 'SSS 3',
      assignedArm: 'Diamond (Science & Tech)',
      status: 'ACTIVE',
    },
    {
      id: 'stf-8',
      staffNumber: 'STF-2022-008',
      firstName: 'Ngozi',
      lastName: 'Nwosu',
      gender: 'F',
      email: 'ngozi.nwosu@apexacademy.edu',
      phone: '+2348020123457',
      role: 'TEACHER',
      department: 'Computer Science & ICT',
      qualification: 'B.Tech. Computer Engineering & Cisco CCNA',
      employmentDate: '2022-03-01',
      assignedLevel: 'JSS 3',
      assignedArm: 'Diamond',
      status: 'ACTIVE',
    },
    {
      id: 'stf-9',
      staffNumber: 'STF-2020-009',
      firstName: 'Patrick',
      lastName: 'Osei',
      gender: 'M',
      email: 'patrick.osei@apexacademy.edu',
      phone: '+2348141234568',
      role: 'TEACHER',
      department: 'Fine & Applied Arts',
      qualification: 'M.F.A. Fine Arts & Visual Design',
      employmentDate: '2020-11-01',
      assignedLevel: 'JSS 2',
      assignedArm: 'Gold',
      status: 'ACTIVE',
    },
    {
      id: 'stf-10',
      staffNumber: 'STF-2019-010',
      firstName: 'Aisha',
      lastName: 'Mohammed',
      gender: 'F',
      email: 'aisha.mohammed@apexacademy.edu',
      phone: '+2349032345679',
      role: 'TEACHER',
      department: 'Economics & Commerce',
      qualification: 'M.Sc. Economics & Econometrics',
      employmentDate: '2019-08-15',
      assignedLevel: 'SSS 1',
      assignedArm: 'Commercial (Gold)',
      status: 'ACTIVE',
    },
    {
      id: 'stf-11',
      staffNumber: 'STF-2018-011',
      firstName: 'Fatima',
      lastName: 'Bello',
      gender: 'F',
      email: 'fatima.bello@apexacademy.edu',
      phone: '+2347063456780',
      role: 'BURSAR',
      department: 'Finance & Accounts',
      qualification: 'FCA, ICAN Chartered Accountant & MBA Finance',
      employmentDate: '2018-05-10',
      status: 'ACTIVE',
    },
    {
      id: 'stf-12',
      staffNumber: 'STF-2016-012',
      firstName: 'Claire',
      lastName: 'Sterling',
      gender: 'F',
      email: 'claire.sterling@apexacademy.edu',
      phone: '+2348184567891',
      role: 'ACADEMIC_DIRECTOR',
      department: 'Academic Planning',
      qualification: 'M.Ed. Educational Leadership & Management',
      employmentDate: '2016-08-01',
      status: 'ACTIVE',
    },
  ];

  return staffMembers;
}

// Generate realistic Historical Fees cohort
export function generateRealisticFeesCohort(students: Student[]): FeePayment[] {
  const feePayments: FeePayment[] = [];
  const categories = [
    { name: 'Tuition Fee', baseAmount: 250000 },
    { name: 'Development & Tech Levy', baseAmount: 45000 },
    { name: 'Laboratory & Science Consumables', baseAmount: 30000 },
    { name: 'Uniform & Sports Kit', baseAmount: 35000 },
    { name: 'PTA Assessment Fee', baseAmount: 15000 },
  ];

  const methods: ('BANK_TRANSFER' | 'ONLINE_CARD' | 'CASH' | 'CHEQUE')[] = [
    'BANK_TRANSFER',
    'ONLINE_CARD',
    'BANK_TRANSFER',
    'BANK_TRANSFER',
    'ONLINE_CARD',
    'CASH',
  ];

  const terms = ['First Term', 'Second Term'];
  const session = '2024/2025';

  let txnCounter = 1001;

  // Generate fees for a representative slice of students
  const targetStudents = students.slice(0, Math.min(students.length, 120));

  targetStudents.forEach((stu, idx) => {
    // 1-2 payments per student
    const count = (idx % 2) + 1;

    for (let c = 0; c < count; c++) {
      const cat = categories[(idx + c) % categories.length];
      const method = methods[(idx * 3 + c) % methods.length];
      const term = terms[c % terms.length];
      const date = c === 0 ? '2024-09-15' : '2024-10-04';

      feePayments.push({
        id: `fee-${txnCounter}`,
        transactionReference: `TXN-2024-${txnCounter}`,
        admissionNumber: stu.admissionNumber,
        studentName: `${stu.firstName} ${stu.lastName}`,
        classLevel: stu.classLevel,
        sessionYear: session,
        term,
        feeCategory: cat.name,
        amount: cat.baseAmount,
        paymentDate: date,
        paymentMethod: method,
        status: 'PAID',
      });

      txnCounter++;
    }
  });

  return feePayments;
}

// Generate realistic dataset with INTENTIONAL validation errors for preview & correction testing
export function generateSampleDatasetWithErrors(): Record<string, string>[] {
  return [
    {
      'Admission Number': 'APA/2024/901',
      'First Name': 'Zainab',
      'Last Name': 'Okafor',
      'Gender': 'F',
      'Class Level': 'JSS 1',
      'Class Arm': 'Diamond',
      'Guardian Name': 'Dr. Kingsley Okafor',
      'Guardian Phone': '+2348034567890',
      'Guardian Email': 'kingsley.okafor@example.com',
      'Date of Birth': '2013-04-12',
    },
    {
      'Admission Number': 'APA/2024/902',
      'First Name': 'Oluwaseun',
      'Last Name': 'Adeleke',
      'Gender': 'M',
      'Class Level': 'JSS 1',
      'Class Arm': 'Emerald', // ERROR: "Emerald" does not exist in JSS 1 (only Diamond, Gold, Silver)
      'Guardian Name': 'Mrs. Folake Adeleke',
      'Guardian Phone': '+2348023456781',
      'Guardian Email': 'folake.adeleke@example.com',
      'Date of Birth': '2013-09-20',
    },
    {
      'Admission Number': 'APA/2024/903',
      'First Name': 'Ibrahim',
      'Last Name': 'Danladi',
      'Gender': 'M',
      'Class Level': 'JSS 2',
      'Class Arm': 'Diamond',
      'Guardian Name': 'Alhaji Musa Danladi',
      'Guardian Phone': '080312INVALID', // ERROR: Alphabetical characters in phone
      'Guardian Email': 'musa.danladi@example.com',
      'Date of Birth': '2012-05-18',
    },
    {
      'Admission Number': 'APA/2024/901', // ERROR: Duplicate admission number (matches first row!)
      'First Name': 'Damilola',
      'Last Name': 'Balogun',
      'Gender': 'F',
      'Class Level': 'JSS 2',
      'Class Arm': 'Gold',
      'Guardian Name': 'Mr. Seyi Balogun',
      'Guardian Phone': '+2348145678902',
      'Guardian Email': 'seyi.balogun@example.com',
      'Date of Birth': '2012-11-03',
    },
    {
      'Admission Number': '', // ERROR: Missing required admission number
      'First Name': 'Farouk',
      'Last Name': 'Bello',
      'Gender': 'M',
      'Class Level': 'JSS 3',
      'Class Arm': 'Diamond',
      'Guardian Name': 'Dr. Halima Bello',
      'Guardian Phone': '+2349036789013',
      'Guardian Email': 'halima.bello@example.com',
      'Date of Birth': '2011-02-14',
    },
    {
      'Admission Number': 'APA/2024/905',
      'First Name': '', // ERROR: Missing required first name
      'Last Name': 'Mensah',
      'Gender': 'F',
      'Class Level': 'SSS 1',
      'Class Arm': 'Arts (Ruby)',
      'Guardian Name': 'Mr. Kwame Mensah',
      'Guardian Phone': '+2347067890124',
      'Guardian Email': 'kwame.mensah@example.com',
      'Date of Birth': '2010-07-22',
    },
    {
      'Admission Number': 'APA/2024/906',
      'First Name': 'Tariq',
      'Last Name': 'Al-Hassan',
      'Gender': 'M',
      'Class Level': 'Year 10', // ERROR: Non-existent Class Level
      'Class Arm': 'Diamond',
      'Guardian Name': 'Engr. Omar Al-Hassan',
      'Guardian Phone': '+2348188901235',
      'Guardian Email': 'omar.alhassan@example.com',
      'Date of Birth': '2010-01-30',
    },
    {
      'Admission Number': 'APA/2024/907',
      'First Name': 'Chioma',
      'Last Name': 'Nwosu',
      'Gender': 'FEMALE',
      'Class Level': 'SSS 2',
      'Class Arm': 'Science (Diamond)',
      'Guardian Name': 'Prof. Emmanuel Nwosu',
      'Guardian Phone': '080123', // ERROR: Too short (only 6 digits)
      'Guardian Email': 'emmanuel.nwosu@example.com',
      'Date of Birth': '2009-08-11',
    },
    {
      'Admission Number': 'APA/2024/908',
      'First Name': 'Emeka',
      'Last Name': 'Eze',
      'Gender': 'M',
      'Class Level': 'SSS 3',
      'Class Arm': 'Diamond (Science & Tech)',
      'Guardian Name': '', // ERROR: Missing guardian name
      'Guardian Phone': '+2348020123457',
      'Guardian Email': 'eze.family@example.com',
      'Date of Birth': '2008-03-25',
    },
    {
      'Admission Number': 'APA/2024/909',
      'First Name': 'Simisola',
      'Last Name': 'Afolabi',
      'Gender': 'F',
      'Class Level': 'SSS 3',
      'Class Arm': 'Ruby (Arts & Business)',
      'Guardian Name': 'Barr. Tunde Afolabi',
      'Guardian Phone': '+2348039012346',
      'Guardian Email': 'tunde.afolabi@example.com',
      'Date of Birth': '2008-10-17',
    },
  ];
}

// Convert objects array to CSV string
export function convertToCSV(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const val = row[header] ?? '';
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// Generate blank template CSVs
export function getStudentTemplateCSV(): string {
  return [
    'Admission Number,First Name,Last Name,Gender,Class Level,Class Arm,Guardian Name,Guardian Phone,Guardian Email,Date of Birth,Blood Group',
    'APA/2024/001,Chinedu,Okafor,M,JSS 1,Diamond,Mr. Emeka Okafor,+2348031234567,emeka.okafor@example.com,2013-05-14,O+',
    'APA/2024/002,Amina,Bello,F,JSS 1,Gold,Hajiya Fatima Bello,+2348029876543,fatima.bello@example.com,2013-08-21,A+',
    'APA/2024/003,Babajide,Adeleke,M,SSS 1,Science (Diamond),Dr. Kunle Adeleke,+2348145678901,kunle.adeleke@example.com,2010-02-11,B+',
  ].join('\n');
}

export function getStaffTemplateCSV(): string {
  return [
    'Staff Number,First Name,Last Name,Gender,Email,Phone,Role,Department,Qualification,Employment Date,Assigned Level,Assigned Arm',
    'STF-2024-001,David,Okonjo,M,david.okonjo@apexacademy.edu,+2348034567890,TEACHER,Mathematics,B.Sc. Mathematics,2024-08-15,JSS 1,Diamond',
    'STF-2024-002,Rebecca,Mensah,F,rebecca.mensah@apexacademy.edu,+2348023456781,TEACHER,English Literature,B.A. English,2024-08-15,JSS 1,Gold',
  ].join('\n');
}

export function getFeeTemplateCSV(): string {
  return [
    'Transaction Reference,Admission Number,Student Name,Class Level,Session Year,Term,Fee Category,Amount,Payment Date,Payment Method',
    'TXN-2024-001,APA/2024/001,Chinedu Okafor,JSS 1,2024/2025,First Term,Tuition Fee,250000,2024-09-10,BANK_TRANSFER',
    'TXN-2024-002,APA/2024/002,Amina Bello,JSS 1,2024/2025,First Term,Tuition Fee,250000,2024-09-12,ONLINE_CARD',
  ].join('\n');
}
