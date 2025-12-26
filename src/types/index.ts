export type UserRole = 
  | 'super_admin'
  | 'admissions'
  | 'international_office'
  | 'student_success'
  | 'marketing'
  | 'academic_manager'
  | 'finance';

export type LifecycleStage = 
  | 'lead'
  | 'application'
  | 'offer'
  | 'acceptance'
  | 'enrollment'
  | 'onboarding'
  | 'active'
  | 'at_risk'
  | 'retained'
  | 'dropped';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  stage: LifecycleStage;
  engagementScore: number;
  riskScore: number;
  program?: string;
  counselor?: string;
  lastActivity: Date;
  documents: {
    name: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
  }[];
  tags: string[];
}

export interface AIAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  recommendations: string[];
  read: boolean;
}

export interface Metric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface Program {
  id: string;
  name: string;
  department: string;
  intakeDate: Date;
  capacity: number;
  enrolled: number;
  eligibility: string[];
}

export interface Counselor {
  id: string;
  name: string;
  email: string;
  assignedStudents: number;
  capacity: number;
  conversionRate: number;
  avgResponseTime: number;
}
