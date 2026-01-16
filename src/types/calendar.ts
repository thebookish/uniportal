// Calendar & Attendance Intelligence Types

export type AcademicEventType = 'lecture' | 'seminar' | 'lab';
export type WorkEventType = 'work' | 'personal';
export type ConflictType = 'class_work_overlap' | 'unrealistic_transition' | 'excessive_sessions' | 'day_exceeds_hours';
export type ConflictSeverity = 'low' | 'medium' | 'high';
export type FeasibilityBand = 'feasible' | 'strained' | 'at_risk';
export type RiskConfidence = 'low' | 'medium' | 'high';

export interface CalendarAcademicEvent {
  id: string;
  student_id: string;
  university_id?: string;
  event_type: AcademicEventType;
  title?: string;
  start_time: string;
  end_time: string;
  mandatory: boolean;
  day_of_week?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CalendarWorkEvent {
  id: string;
  student_id: string;
  university_id?: string;
  event_type: WorkEventType;
  title?: string;
  start_time: string;
  end_time: string;
  recurring: boolean;
  day_of_week?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  university_id?: string;
  event_id?: string;
  date: string;
  present: boolean;
  created_at?: string;
}

export interface WeeklyCalendarBlock {
  type: 'class' | 'work';
  start: string;
  end: string;
  mandatory: boolean;
  day_of_week: number;
  title?: string;
}

export interface StudentCalendarSummary {
  id: string;
  student_id: string;
  university_id?: string;
  week_start: string;
  total_class_hours: number;
  total_mandatory_hours: number;
  total_work_hours: number;
  free_time_blocks: { start: string; end: string; day: number }[];
  weekly_calendar: WeeklyCalendarBlock[];
  created_at?: string;
  updated_at?: string;
}

export interface FeasibilityFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface TimetableFeasibility {
  id: string;
  student_id: string;
  university_id?: string;
  week_start: string;
  feasibility_score: number;
  score_band: FeasibilityBand;
  factors: FeasibilityFactor[];
  created_at?: string;
  updated_at?: string;
}

export interface CalendarConflict {
  id: string;
  student_id: string;
  university_id?: string;
  conflict_type: ConflictType;
  day: string;
  severity: ConflictSeverity;
  details: string;
  resolved: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceViabilityRisk {
  id: string;
  student_id: string;
  university_id?: string;
  risk_type: string;
  weeks_to_risk: number;
  confidence: RiskConfidence;
  reasons: string[];
  recommendation?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Input types for APIs
export interface AcademicEventInput {
  student_id: string;
  event_type: AcademicEventType;
  start_time: string;
  end_time: string;
  mandatory?: boolean;
  title?: string;
}

export interface WorkEventInput {
  student_id: string;
  event_type: WorkEventType;
  start_time: string;
  end_time: string;
  title?: string;
}

export interface AttendanceInput {
  student_id: string;
  date: string;
  present: boolean;
  event_id?: string;
}

// Risk Summary for Dashboard
export interface CalendarRiskSummary {
  total_students_analyzed: number;
  strained_timetables_count: number;
  strained_timetables_percentage: number;
  at_risk_count: number;
  at_risk_percentage: number;
  conflicts_detected: number;
  average_feasibility_score: number;
}

// Student Calendar Detail
export interface StudentCalendarDetail {
  student_id: string;
  student_name: string;
  student_email: string;
  weekly_calendar: WeeklyCalendarBlock[];
  feasibility: TimetableFeasibility | null;
  conflicts: CalendarConflict[];
  viability_risk: AttendanceViabilityRisk | null;
  attendance_rate?: number;
}

// Pilot Report Data
export interface PilotReportData {
  report_generated_at: string;
  total_students_analyzed: number;
  unfeasible_timetables_count: number;
  unfeasible_timetables_percentage: number;
  flagged_before_attendance_drop: number;
  average_weeks_early_warning: number;
  anonymized_examples: {
    case_id: string;
    feasibility_score: number;
    score_band: FeasibilityBand;
    conflicts_count: number;
    primary_conflict_type: string;
    weeks_to_risk: number;
  }[];
  conflict_breakdown: {
    type: ConflictType;
    count: number;
  }[];
}
