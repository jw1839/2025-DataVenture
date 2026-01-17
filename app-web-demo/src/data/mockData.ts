// 발표용 목업 데이터 - 실제 사용자가 많다고 가정한 더미 데이터

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter';
  profileImage?: string;
  phone?: string;
}

export interface CandidateProfile extends User {
  role: 'candidate';
  education: string;
  experience: string;
  skills: string[];
  desiredPosition: string;
  desiredSalary: string;
  bio: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface InterviewResult {
  id: string;
  candidateId: string;
  candidateName: string;
  date: string;
  mode: 'practice' | 'real';
  duration: number; // 분
  overallScore: number;
  communication: {
    delivery: number;
    vocabulary: number;
    comprehension: number;
    average: number;
  };
  competencies: {
    informationAnalysis: number;
    problemSolving: number;
    flexibleThinking: number;
    negotiation: number;
    itSkills: number;
  };
  topPosition: {
    position: string;
    score: number;
    reason: string;
  };
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  percentile: number; // 상위 몇 %
}

export interface JobPosting {
  id: string;
  companyName: string;
  companyLogo?: string;
  position: string;
  category: '경영관리' | '영업' | '전산';
  experience: string;
  salary: string;
  location: string;
  skills: string[];
  description: string;
  benefits: string[];
  deadline: string;
  isActive: boolean;
  applicantsCount: number;
}

export interface Applicant {
  id: string;
  candidateId: string;
  candidateName: string;
  profileImage?: string;
  age: number;
  gender: string;
  skills: string[];
  experience: string;
  overallScore: number;
  matchingScore: number;
  matchingReason: string;
  appliedDate: string;
  resumeUrl?: string;
}

// 현재 로그인한 사용자 (구직자)
export const currentCandidateUser: CandidateProfile = {
  id: 'candidate-001',
  name: '김민수',
  email: 'minsu.kim@email.com',
  phone: '010-1234-5678',
  role: 'candidate',
  profileImage: '/avatars/default-male.png',
  education: '서울대학교 컴퓨터공학과 졸업',
  experience: '3년 (프론트엔드 개발자)',
  skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js', 'Python'],
  desiredPosition: '프론트엔드 개발자 / Full-Stack 개발자',
  desiredSalary: '5000만원 ~ 6000만원',
  bio: '사용자 경험을 최우선으로 생각하는 프론트엔드 개발자입니다. 3년간의 실무 경험을 통해 React 생태계에 대한 깊은 이해를 갖추었으며, 최신 기술 트렌드를 적극적으로 학습하고 적용하는 것을 즐깁니다.',
  githubUrl: 'https://github.com/minsukim',
  linkedinUrl: 'https://linkedin.com/in/minsukim',
  portfolioUrl: 'https://minsu-portfolio.com',
};

// 현재 로그인한 사용자 (채용담당자)
export const currentRecruiterUser: User = {
  id: 'recruiter-001',
  name: '이지원',
  email: 'jiwon.lee@techcorp.com',
  phone: '02-1234-5678',
  role: 'recruiter',
  profileImage: '/avatars/default-female.png',
};

// 채용담당자의 회사 정보
export interface CompanyProfile {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  size: string;
  location: string;
  website: string;
  description: string;
  vision: string;
  culture: string[];
  benefits: string[];
  founded: string;
  employees: string;
}

export const currentCompany: CompanyProfile = {
  id: 'company-001',
  name: 'TechCorp',
  logo: '/companies/techcorp.png',
  industry: 'IT 서비스',
  size: '중견기업',
  location: '서울 강남구',
  website: 'https://techcorp.com',
  description: 'TechCorp는 혁신적인 SaaS 플랫폼을 개발하는 글로벌 IT 기업입니다. 2015년 설립 이후 빠르게 성장하여 현재 300명 이상의 직원이 함께하고 있으며, 국내외 1,000개 이상의 기업 고객에게 서비스를 제공하고 있습니다.',
  vision: '기술로 세상을 더 나은 곳으로 만든다',
  culture: [
    '수평적 조직 문화',
    '자율과 책임',
    '실패를 두려워하지 않는 도전',
    '투명한 커뮤니케이션',
    '워라밸 중시',
    '지속적인 학습과 성장',
  ],
  benefits: [
    '재택근무 주 2회',
    '점심/저녁 식대 제공',
    '최신 장비 지원 (맥북 프로)',
    '도서/교육비 연 200만원 지원',
    '건강검진 (배우자 포함)',
    '경조사 지원금',
    '명절 선물',
    '사내 헬스장',
    '간식 무제한',
    '스톡옵션',
  ],
  founded: '2015',
  employees: '300+',
};

// 채용담당자가 관리하는 공고 목록
export interface RecruiterJobPosting extends JobPosting {
  status: 'active' | 'closed' | 'draft';
  createdDate: string;
  viewCount: number;
}

export const recruiterJobPostings: RecruiterJobPosting[] = [
  {
    id: 'job-001',
    companyName: 'TechCorp',
    companyLogo: '/companies/techcorp.png',
    position: '시니어 프론트엔드 개발자',
    category: '전산',
    experience: '3년 이상',
    salary: '5000만원 ~ 7000만원',
    location: '서울 강남구',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    description: 'TechCorp는 혁신적인 SaaS 플랫폼을 개발하는 스타트업입니다. 빠르게 성장하는 팀에서 프론트엔드 아키텍처를 주도할 시니어 개발자를 찾습니다.',
    benefits: ['재택근무 주 2회', '점심/저녁 식대 제공', '최신 장비 지원', '도서/교육비 지원'],
    deadline: '2025-11-15',
    isActive: true,
    applicantsCount: 47,
    status: 'active',
    createdDate: '2025-10-15',
    viewCount: 1243,
  },
  {
    id: 'job-002',
    companyName: 'TechCorp',
    position: '백엔드 개발자 (Node.js)',
    category: '전산',
    experience: '2~5년',
    salary: '4500만원 ~ 6500만원',
    location: '서울 강남구',
    skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
    description: '확장 가능한 백엔드 시스템을 구축할 개발자를 찾습니다. RESTful API 설계 및 마이크로서비스 아키텍처 경험자 우대.',
    benefits: ['재택근무 주 2회', '최신 장비 지원', '도서/교육비 지원', '스톡옵션'],
    deadline: '2025-11-20',
    isActive: true,
    applicantsCount: 32,
    status: 'active',
    createdDate: '2025-10-18',
    viewCount: 892,
  },
  {
    id: 'job-003',
    companyName: 'TechCorp',
    position: 'DevOps 엔지니어',
    category: '전산',
    experience: '3년 이상',
    salary: '5500만원 ~ 7500만원',
    location: '서울 강남구',
    skills: ['AWS', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform'],
    description: '인프라 자동화 및 배포 파이프라인을 구축하고 관리할 DevOps 엔지니어를 찾습니다.',
    benefits: ['재택근무 주 2회', '최신 장비 지원', '도서/교육비 지원', '성과급'],
    deadline: '2025-11-10',
    isActive: true,
    applicantsCount: 18,
    status: 'active',
    createdDate: '2025-10-20',
    viewCount: 567,
  },
  {
    id: 'job-draft-001',
    companyName: 'TechCorp',
    position: 'UI/UX 디자이너',
    category: '전산',
    experience: '2~4년',
    salary: '4000만원 ~ 5500만원',
    location: '서울 강남구',
    skills: ['Figma', 'Sketch', 'Prototyping', 'User Research'],
    description: '사용자 중심의 디자인을 만들어갈 UI/UX 디자이너를 찾습니다.',
    benefits: ['재택근무 주 2회', '최신 장비 지원', '디자인 툴 제공'],
    deadline: '2025-12-01',
    isActive: false,
    applicantsCount: 0,
    status: 'draft',
    createdDate: '2025-10-25',
    viewCount: 0,
  },
  {
    id: 'job-closed-001',
    companyName: 'TechCorp',
    position: '주니어 프론트엔드 개발자',
    category: '전산',
    experience: '신입~2년',
    salary: '3500만원 ~ 4500만원',
    location: '서울 강남구',
    skills: ['React', 'JavaScript', 'HTML', 'CSS'],
    description: '함께 성장할 주니어 개발자를 찾습니다.',
    benefits: ['재택근무 주 2회', '교육 프로그램', '멘토링'],
    deadline: '2025-10-25',
    isActive: false,
    applicantsCount: 63,
    status: 'closed',
    createdDate: '2025-09-20',
    viewCount: 2145,
  },
];

// 김민수의 최근 인터뷰 결과
export const myLatestInterview: InterviewResult = {
  id: 'interview-001',
  candidateId: 'candidate-001',
  candidateName: '김민수',
  date: '2025-10-28',
  mode: 'real',
  duration: 15,
  overallScore: 85,
  communication: {
    delivery: 88,
    vocabulary: 82,
    comprehension: 85,
    average: 85,
  },
  competencies: {
    informationAnalysis: 82,
    problemSolving: 87,
    flexibleThinking: 79,
    negotiation: 75,
    itSkills: 92,
  },
  topPosition: {
    position: '전산 (IT 개발)',
    score: 90,
    reason: 'IT 능력과 문제 해결 능력이 탁월하여 소프트웨어 개발 직무에 매우 적합합니다. 특히 복잡한 시스템 설계와 알고리즘 최적화에 강점을 보이며, 기술 트렌드에 대한 이해도가 높습니다.',
  },
  strengths: [
    '복잡한 데이터를 명확하게 해석하는 능력이 우수함',
    '논리적인 문장 구성과 적절한 전문 용어 사용',
    '실무 경험 기반의 구체적이고 실질적인 답변',
    '최신 기술 스택에 대한 깊은 이해도',
  ],
  improvements: [
    '협상 상황에서 설득 논리 보강 필요',
    '답변 길이를 다소 줄여 간결성 개선 권장',
  ],
  detailedFeedback: `김민수 님의 인터뷰는 전반적으로 매우 인상적이었습니다. 특히 IT 능력(92점)과 문제 해결 능력(87점)에서 탁월한 성과를 보여주셨습니다.

**의사소통 능력**: 전달력(88점)이 뛰어나며, 복잡한 기술 개념을 명확하고 이해하기 쉽게 설명하는 능력이 돋보였습니다. 다만, 때때로 답변이 다소 길어지는 경향이 있어 핵심을 더 간결하게 전달하는 연습이 도움될 것 같습니다.

**직무 역량**: IT 분야에 대한 깊은 이해와 실무 경험이 명확히 드러났습니다. 알고리즘 최적화와 시스템 설계에 대한 사고 과정이 논리적이며, 실제 프로젝트 경험을 바탕으로 한 답변이 설득력 있었습니다. 문제 해결 능력 또한 우수하여, 제한된 상황에서도 창의적이고 실용적인 해결책을 제시하셨습니다.

**개선 포인트**: 협상·설득 능력(75점)은 상대적으로 개선의 여지가 있습니다. 기술적 역량이 뛰어나신 만큼, 비즈니스 커뮤니케이션과 이해관계자 설득 스킬을 더 발전시킨다면 시니어 개발자로 성장하는 데 큰 도움이 될 것입니다.

**추천 직무**: 전산(IT 개발) 직무에 가장 적합하시며, 특히 프론트엔드 개발, Full-Stack 개발, 시스템 아키텍처 설계 분야에서 높은 성과를 기대할 수 있습니다.`,
  percentile: 12, // 상위 12%
};

// 추천 채용 공고 (구직자용)
export const recommendedJobPostings: JobPosting[] = [
  {
    id: 'job-001',
    companyName: 'TechCorp',
    companyLogo: '/companies/techcorp.png',
    position: '시니어 프론트엔드 개발자',
    category: '전산',
    experience: '3년 이상',
    salary: '5000만원 ~ 7000만원',
    location: '서울 강남구',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    description: 'TechCorp는 혁신적인 SaaS 플랫폼을 개발하는 스타트업입니다. 빠르게 성장하는 팀에서 프론트엔드 아키텍처를 주도할 시니어 개발자를 찾습니다.',
    benefits: ['재택근무 주 2회', '점심/저녁 식대 제공', '최신 장비 지원', '도서/교육비 지원'],
    deadline: '2025-11-15',
    isActive: true,
    applicantsCount: 47,
  },
  {
    id: 'job-002',
    companyName: 'DataFlow',
    companyLogo: '/companies/dataflow.png',
    position: 'Full-Stack 개발자',
    category: '전산',
    experience: '2~5년',
    salary: '5500만원 ~ 6500만원',
    location: '서울 서초구',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    description: '데이터 시각화 플랫폼을 개발하는 DataFlow에서 프론트엔드와 백엔드를 모두 다룰 수 있는 Full-Stack 개발자를 모십니다.',
    benefits: ['스톡옵션', '자율 출퇴근', '간식 무제한', '성과급'],
    deadline: '2025-11-20',
    isActive: true,
    applicantsCount: 32,
  },
  {
    id: 'job-003',
    companyName: 'AI Solutions',
    companyLogo: '/companies/aisolutions.png',
    position: '프론트엔드 개발자 (AI 플랫폼)',
    category: '전산',
    experience: '3년 이상',
    salary: '4800만원 ~ 6000만원',
    location: '경기 판교',
    skills: ['React', 'TypeScript', 'Python', 'Three.js'],
    description: 'AI 기반 솔루션을 제공하는 AI Solutions에서 혁신적인 사용자 인터페이스를 구축할 프론트엔드 개발자를 찾습니다.',
    benefits: ['유연근무제', '연 1회 해외 컨퍼런스', '건강검진', '사내 헬스장'],
    deadline: '2025-11-25',
    isActive: true,
    applicantsCount: 28,
  },
];

// 지원자 목록 (채용담당자용)
export const applicantsList: Applicant[] = [
  {
    id: 'applicant-001',
    candidateId: 'candidate-001',
    candidateName: '김민수',
    profileImage: '/avatars/default-male.png',
    age: 28,
    gender: '남',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js'],
    experience: '3년',
    overallScore: 85,
    matchingScore: 95,
    matchingReason: 'React와 TypeScript 실무 경력 3년으로 귀사의 시니어 프론트엔드 개발자 요구사항에 95% 부합합니다. 특히 IT 능력(92점)과 문제 해결 능력(87점)이 우수하며, Next.js와 TypeScript에 대한 깊은 이해를 보유하고 있습니다.',
    appliedDate: '2025-10-29',
    resumeUrl: '/resumes/김민수_이력서.pdf',
  },
  {
    id: 'applicant-002',
    candidateId: 'candidate-002',
    candidateName: '이서연',
    profileImage: '/avatars/default-female.png',
    age: 26,
    gender: '여',
    skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'Figma'],
    experience: '2년',
    overallScore: 82,
    matchingScore: 88,
    matchingReason: '2년의 프론트엔드 경험과 디자인에 대한 이해가 뛰어나 UI/UX 품질이 중요한 프로젝트에 적합합니다. 유연한 사고 능력(85점)과 빠른 학습 능력이 강점입니다.',
    appliedDate: '2025-10-28',
    resumeUrl: '/resumes/이서연_이력서.pdf',
  },
  {
    id: 'applicant-003',
    candidateId: 'candidate-003',
    candidateName: '박준호',
    profileImage: '/avatars/default-male.png',
    age: 32,
    gender: '남',
    skills: ['React', 'TypeScript', 'Redux', 'Webpack', 'Testing'],
    experience: '5년',
    overallScore: 88,
    matchingScore: 92,
    matchingReason: '5년의 풍부한 경력과 높은 코드 품질 기준을 가진 시니어 개발자입니다. 문제 해결 능력(90점)과 팀 리딩 경험이 있어 기술 리드 역할에도 적합합니다.',
    appliedDate: '2025-10-27',
    resumeUrl: '/resumes/박준호_이력서.pdf',
  },
  {
    id: 'applicant-004',
    candidateId: 'candidate-004',
    candidateName: '최지은',
    profileImage: '/avatars/default-female.png',
    age: 29,
    gender: '여',
    skills: ['React', 'TypeScript', 'GraphQL', 'Apollo', 'Jest'],
    experience: '4년',
    overallScore: 84,
    matchingScore: 89,
    matchingReason: 'GraphQL과 최신 프론트엔드 기술 스택에 능숙하며, 테스트 주도 개발(TDD) 경험이 풍부합니다. 정보 분석 능력(86점)이 우수하여 복잡한 요구사항을 잘 이해합니다.',
    appliedDate: '2025-10-27',
    resumeUrl: '/resumes/최지은_이력서.pdf',
  },
  {
    id: 'applicant-005',
    candidateId: 'candidate-005',
    candidateName: '정민재',
    profileImage: '/avatars/default-male.png',
    age: 27,
    gender: '남',
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Docker'],
    experience: '3년',
    overallScore: 80,
    matchingScore: 85,
    matchingReason: 'Full-Stack 경험이 있어 백엔드와의 협업이 원활하며, DevOps에 대한 이해도가 높습니다. IT 능력(88점)이 강점이며 지속적으로 성장하는 모습을 보입니다.',
    appliedDate: '2025-10-26',
    resumeUrl: '/resumes/정민재_이력서.pdf',
  },
];

// 통계 데이터 (채용담당자 대시보드용)
export const dashboardStats = {
  totalApplicants: 47,
  newThisWeek: 12,
  averageScore: 74.5,
  topTenPercent: 5,
  byPosition: {
    '전산': 28,
    '경영관리': 12,
    '영업': 7,
  },
  weeklyTrend: [
    { week: '10/01', count: 8 },
    { week: '10/08', count: 12 },
    { week: '10/15', count: 15 },
    { week: '10/22', count: 18 },
    { week: '10/29', count: 20 },
  ],
  competencyAverages: {
    informationAnalysis: 72,
    problemSolving: 75,
    flexibleThinking: 70,
    negotiation: 68,
    itSkills: 78,
  },
};

// 더 많은 채용 공고 샘플
export const allJobPostings: JobPosting[] = [
  ...recommendedJobPostings,
  {
    id: 'job-004',
    companyName: 'FinTech Pro',
    position: '백엔드 개발자',
    category: '전산',
    experience: '3~7년',
    salary: '6000만원 ~ 8000만원',
    location: '서울 여의도',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Kafka'],
    description: '금융 플랫폼의 안정적인 백엔드 시스템을 구축할 개발자를 찾습니다.',
    benefits: ['연봉 상위 10%', '성과급 별도', '주택자금 대출 지원'],
    deadline: '2025-11-30',
    isActive: true,
    applicantsCount: 35,
  },
  {
    id: 'job-005',
    companyName: 'Marketing Hub',
    position: '영업 매니저',
    category: '영업',
    experience: '5년 이상',
    salary: '4500만원 ~ 6000만원',
    location: '서울 중구',
    skills: ['B2B 영업', '마케팅 전략', '고객 관리', 'CRM'],
    description: '기업 고객을 대상으로 한 솔루션 영업 및 관계 관리를 담당합니다.',
    benefits: ['인센티브 무제한', '법인차량 지원', '해외 연수'],
    deadline: '2025-11-18',
    isActive: true,
    applicantsCount: 22,
  },
];

// 연습 모드 인터뷰 기록 (구직자의 과거 기록)
export const practiceInterviews: InterviewResult[] = [
  {
    id: 'practice-001',
    candidateId: 'candidate-001',
    candidateName: '김민수',
    date: '2025-10-20',
    mode: 'practice',
    duration: 10,
    overallScore: 72,
    communication: {
      delivery: 75,
      vocabulary: 70,
      comprehension: 71,
      average: 72,
    },
    competencies: {
      informationAnalysis: 70,
      problemSolving: 73,
      flexibleThinking: 68,
      negotiation: 65,
      itSkills: 85,
    },
    topPosition: {
      position: '전산 (IT 개발)',
      score: 82,
      reason: 'IT 기술에 대한 이해도가 높으나, 커뮤니케이션 스킬 보완이 필요합니다.',
    },
    strengths: ['기술적 지식이 풍부함', 'IT 관련 답변이 구체적'],
    improvements: ['답변의 구조화 필요', '협상 능력 향상 필요'],
    detailedFeedback: '전반적으로 기술적 역량은 우수하나, 의사소통 능력을 더 개선하면 좋을 것 같습니다.',
    percentile: 25,
  },
  {
    id: 'practice-002',
    candidateId: 'candidate-001',
    candidateName: '김민수',
    date: '2025-10-25',
    mode: 'practice',
    duration: 15,
    overallScore: 78,
    communication: {
      delivery: 80,
      vocabulary: 76,
      comprehension: 78,
      average: 78,
    },
    competencies: {
      informationAnalysis: 76,
      problemSolving: 82,
      flexibleThinking: 73,
      negotiation: 70,
      itSkills: 88,
    },
    topPosition: {
      position: '전산 (IT 개발)',
      score: 86,
      reason: '이전 대비 의사소통 능력이 크게 향상되었으며, 문제 해결 접근법이 논리적입니다.',
    },
    strengths: ['논리적 사고 향상', '답변의 명확성 개선', '실무 경험 활용'],
    improvements: ['협상 시나리오 연습 필요'],
    detailedFeedback: '지난 연습 대비 많은 발전이 보입니다. 특히 답변의 구조화가 잘 되어 있습니다.',
    percentile: 18,
  },
];

