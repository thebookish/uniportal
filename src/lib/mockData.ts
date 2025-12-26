import { Student, AIAlert, Metric, Program, Counselor } from '@/types';

export const mockMetrics: Metric[] = [
  { label: 'Total Leads', value: 1247, change: 12.5, trend: 'up' },
  { label: 'Active Applications', value: 342, change: 8.3, trend: 'up' },
  { label: 'Offers Issued', value: 189, change: -3.2, trend: 'down' },
  { label: 'Enrolled Students', value: 156, change: 15.7, trend: 'up' },
  { label: 'At-Risk Students', value: 23, change: -18.5, trend: 'down' },
  { label: 'Dropout Rate', value: 4.2, change: -12.3, trend: 'down' },
];

export const mockAIAlerts: AIAlert[] = [
  {
    id: '1',
    severity: 'critical',
    title: 'High Dropout Risk Detected',
    description: 'Sarah Chen has shown 85% probability of dropout based on engagement patterns',
    studentId: 's1',
    studentName: 'Sarah Chen',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    recommendations: [
      'Schedule immediate 1-on-1 counseling session',
      'Review course fit and consider program alternatives',
      'Activate peer mentorship program'
    ],
    read: false
  },
  {
    id: '2',
    severity: 'warning',
    title: 'Engagement Score Declining',
    description: 'Marcus Johnson engagement dropped from 78 to 42 in past 7 days',
    studentId: 's2',
    studentName: 'Marcus Johnson',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    recommendations: [
      'Send automated check-in message',
      'Review recent activity logs for blockers',
      'Assign to senior counselor for follow-up'
    ],
    read: false
  },
  {
    id: '3',
    severity: 'warning',
    title: 'Document Submission Overdue',
    description: 'Priya Sharma has 3 critical documents pending for 14+ days',
    studentId: 's3',
    studentName: 'Priya Sharma',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    recommendations: [
      'Send urgent reminder with deadline extension',
      'Offer document upload assistance',
      'Escalate to international office if no response'
    ],
    read: true
  },
  {
    id: '4',
    severity: 'info',
    title: 'High-Fit Student Identified',
    description: 'AI detected excellent program match for incoming lead: Alex Rivera',
    studentId: 's4',
    studentName: 'Alex Rivera',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    recommendations: [
      'Fast-track application review',
      'Assign to top-performing counselor',
      'Send personalized program information'
    ],
    read: true
  }
];

export const mockStudents: Student[] = [
  {
    id: 's1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1-555-0123',
    country: 'China',
    stage: 'active',
    engagementScore: 32,
    riskScore: 85,
    program: 'Computer Science BSc',
    counselor: 'John Smith',
    lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    documents: [
      { name: 'Transcript', status: 'approved' },
      { name: 'Passport', status: 'approved' },
      { name: 'English Test', status: 'pending' }
    ],
    tags: ['high-risk', 'international']
  },
  {
    id: 's2',
    name: 'Marcus Johnson',
    email: 'marcus.j@email.com',
    country: 'USA',
    stage: 'enrollment',
    engagementScore: 42,
    riskScore: 68,
    program: 'Business Administration MBA',
    counselor: 'Emily Davis',
    lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    documents: [
      { name: 'Transcript', status: 'approved' },
      { name: 'ID', status: 'approved' }
    ],
    tags: ['declining-engagement']
  },
  {
    id: 's3',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    country: 'India',
    stage: 'offer',
    engagementScore: 65,
    riskScore: 45,
    program: 'Data Science MSc',
    counselor: 'John Smith',
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    documents: [
      { name: 'Transcript', status: 'pending' },
      { name: 'Passport', status: 'pending' },
      { name: 'English Test', status: 'pending' }
    ],
    tags: ['document-overdue', 'international']
  },
  {
    id: 's4',
    name: 'Alex Rivera',
    email: 'alex.rivera@email.com',
    country: 'Mexico',
    stage: 'lead',
    engagementScore: 92,
    riskScore: 12,
    program: 'Engineering BSc',
    counselor: 'Sarah Williams',
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    documents: [],
    tags: ['high-potential', 'ai-recommended']
  },
  {
    id: 's5',
    name: 'Emma Thompson',
    email: 'emma.t@email.com',
    country: 'UK',
    stage: 'application',
    engagementScore: 78,
    riskScore: 25,
    program: 'Psychology BSc',
    counselor: 'Emily Davis',
    lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000),
    documents: [
      { name: 'Transcript', status: 'submitted' },
      { name: 'Personal Statement', status: 'submitted' }
    ],
    tags: ['on-track']
  }
];

export const mockPrograms: Program[] = [
  {
    id: 'p1',
    name: 'Computer Science BSc',
    department: 'Engineering & Technology',
    intakeDate: new Date('2024-09-01'),
    capacity: 120,
    enrolled: 98,
    eligibility: ['High School Diploma', 'Math Proficiency', 'English B2+']
  },
  {
    id: 'p2',
    name: 'Business Administration MBA',
    department: 'Business School',
    intakeDate: new Date('2024-09-15'),
    capacity: 80,
    enrolled: 72,
    eligibility: ['Bachelor Degree', '3+ Years Experience', 'GMAT 600+']
  },
  {
    id: 'p3',
    name: 'Data Science MSc',
    department: 'Engineering & Technology',
    intakeDate: new Date('2024-10-01'),
    capacity: 60,
    enrolled: 45,
    eligibility: ['Bachelor in STEM', 'Programming Skills', 'Statistics Knowledge']
  }
];

export const mockCounselors: Counselor[] = [
  {
    id: 'c1',
    name: 'John Smith',
    email: 'john.smith@university.edu',
    assignedStudents: 45,
    capacity: 50,
    conversionRate: 68.5,
    avgResponseTime: 2.3
  },
  {
    id: 'c2',
    name: 'Emily Davis',
    email: 'emily.davis@university.edu',
    assignedStudents: 38,
    capacity: 50,
    conversionRate: 72.1,
    avgResponseTime: 1.8
  },
  {
    id: 'c3',
    name: 'Sarah Williams',
    email: 'sarah.williams@university.edu',
    assignedStudents: 42,
    capacity: 50,
    conversionRate: 75.3,
    avgResponseTime: 1.5
  }
];

export const lifecycleStages = [
  { id: 'lead', label: 'Lead', count: 1247, color: '#6B7280' },
  { id: 'application', label: 'Application', count: 342, color: '#3B82F6' },
  { id: 'offer', label: 'Offer', count: 189, color: '#8B5CF6' },
  { id: 'acceptance', label: 'Acceptance', count: 167, color: '#EC4899' },
  { id: 'enrollment', label: 'Enrollment', count: 156, color: '#F59E0B' },
  { id: 'onboarding', label: 'Onboarding', count: 134, color: '#10B981' },
  { id: 'active', label: 'Active', count: 892, color: '#39FF14' },
  { id: 'at_risk', label: 'At-Risk', count: 23, color: '#FFB800' },
  { id: 'retained', label: 'Retained', count: 756, color: '#00D9FF' },
  { id: 'dropped', label: 'Dropped', count: 34, color: '#FF2E63' }
];
