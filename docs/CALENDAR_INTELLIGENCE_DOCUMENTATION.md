# Calendar & Attendance Intelligence System

## Technical Documentation for Stakeholders (Pilot v1)

**Version:** 1.0 (Pilot)  
**Owner:** Jas  
**Last Updated:** January 2025  
**Classification:** Internal Use Only

---

## Executive Summary

The Calendar & Attendance Intelligence layer is a predictive feasibility intelligence system that:

- Determines whether a student's timetable is realistically attendable
- Detects calendar conflicts early (before attendance drops)
- Predicts attendance viability risk using calendar signals
- Supports registry, compliance, and ops teams with explainable risk insights

**This is NOT an attendance tracker. This is predictive feasibility intelligence.**

---

## 1. Problem This Feature Solves

Universities already have:
- Timetabling systems
- Attendance systems
- VLEs / CRMs

What they do NOT have:
- A way to know whether a timetable actually works for a student
- Visibility into conflicts before attendance breaches occur
- Ownership of calendar-driven risk across systems

**This feature exposes between-system blind spots.**

---

## 2. Data Inputs

### 2.1 Academic Timetable Events

```json
{
  "student_id": "uuid",
  "event_type": "lecture|seminar|lab",
  "start_time": "ISO timestamp",
  "end_time": "ISO timestamp",
  "mandatory": true
}
```

**Source:** CSV, ICS, or API import

### 2.2 Attendance Signals (Optional)

```json
{
  "student_id": "uuid",
  "date": "YYYY-MM-DD",
  "present": true
}
```

Used only for trend comparison, not core logic.

### 2.3 Work/Personal Events (Optional)

```json
{
  "student_id": "uuid",
  "event_type": "work|personal",
  "start_time": "ISO timestamp",
  "end_time": "ISO timestamp"
}
```

Improves prediction accuracy but not required for v1.

---

## 3. Normalized Weekly Calendar Model

Each student has a unified weekly calendar model:

```json
{
  "student_id": "uuid",
  "weekly_calendar": [
    {
      "type": "class|work",
      "start": "ISO timestamp",
      "end": "ISO timestamp",
      "mandatory": true,
      "day_of_week": 1
    }
  ],
  "total_class_hours": 20,
  "total_mandatory_hours": 18,
  "total_work_hours": 12,
  "free_time_blocks": [
    { "start": "09:00", "end": "11:00", "day": 2 }
  ]
}
```

### Derived Metrics
- Daily class density
- Back-to-back sessions
- Free blocks between commitments
- Overlaps (class ↔ work)

---

## 4. Core Engine: Timetable Feasibility

### 4.1 Feasibility Score (0-100)

Rules-based scoring using:

| Factor | Condition | Impact |
|--------|-----------|--------|
| Excessive daily mandatory | >8 hours/day | -20 points |
| High daily mandatory | >6 hours/day | -10 points |
| Session clustering | 4+ back-to-back sessions | -15 points |
| Class-work overlap | Any overlap detected | -25 points |
| Excessive weekly load | >50 hours total | -20 points |
| High weekly load | >40 hours total | -10 points |
| Consecutive heavy days | 4+ days with >6 hours | -15 points |

### 4.2 Score Bands

| Score Range | Band | Meaning |
|-------------|------|---------|
| 85-100 | Feasible | Schedule is sustainable |
| 60-84 | Strained | Schedule requires monitoring |
| <60 | At Risk | Schedule likely unsustainable |

**This score is fully explainable.** Each factor contributing to the score is documented.

### 4.3 Conflict Detection

The system detects and stores:

| Conflict Type | Description |
|---------------|-------------|
| `class_work_overlap` | Class time overlaps with work schedule |
| `unrealistic_transition` | <5 minutes between sessions |
| `excessive_sessions` | 4+ consecutive sessions with minimal breaks |
| `day_exceeds_hours` | Day has >8 mandatory hours |

```json
{
  "conflict_type": "class_work_overlap",
  "day": "Tuesday",
  "severity": "high",
  "details": "Mandatory lecture overlaps work shift"
}
```

---

## 5. Predictive Risk Logic

### Risk Type: Attendance Viability Risk

Triggers when:
- Feasibility score declining week-on-week
- Conflicts increasing
- Free blocks shrinking
- Attendance still technically compliant

### Output

```json
{
  "risk_type": "attendance_viability_risk",
  "weeks_to_risk": 2,
  "confidence": "medium",
  "reasons": [
    "Increasing timetable density",
    "New conflicts with work schedule"
  ]
}
```

**⚠️ This is early warning, not failure detection.**

---

## 6. Recommendations Engine

Each risk outputs one suggested action:

| Condition | Recommendation |
|-----------|----------------|
| Feasibility <60 | "Student workload may become unsustainable within 1 week" |
| Class-work overlap | "Consider proactive check-in before attendance breach" |
| Declining score | "Early review of timetable flexibility recommended" |
| High weekly load | "Student workload may become unsustainable within 2-3 weeks" |

**No automation. No enforcement. No messaging.**

---

## 7. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/calendar/academic` | POST | Add academic timetable events |
| `/calendar/work` | POST | Add work/personal events |
| `/attendance` | POST | Add attendance records |
| `/risk/summary` | GET | Get risk overview metrics |
| `/risk/student/{id}` | GET | Get individual student detail |
| `/analyze-timetable-feasibility` | POST | Trigger analysis (single or all) |
| `/calendar-pilot-report` | GET | Generate pilot report |

### Edge Function Slugs (Supabase)
- `supabase-functions-calendar-academic`
- `supabase-functions-calendar-work`
- `supabase-functions-attendance`
- `supabase-functions-calendar-risk-summary`
- `supabase-functions-calendar-risk-student`
- `supabase-functions-analyze-timetable-feasibility`
- `supabase-functions-calendar-pilot-report`

---

## 8. Frontend Views (Ops Only)

### 8.1 Risk Overview Tab

Displays:
- Total students analyzed
- % with strained timetables
- % predicted at risk (next 2-4 weeks)
- Average feasibility score
- Active viability risks list

### 8.2 Student Detail View

Shows:
- Weekly calendar blocks (visual)
- Feasibility score with contributing factors
- Detected conflicts (list)
- Attendance rate (if available)
- Recommendation text

### 8.3 Conflicts Tab

Lists all unresolved conflicts with:
- Conflict type badge
- Severity indicator
- Day and details
- Student name

### 8.4 Pilot Report Tab

Auto-generates a report with:
- Number of students with unfeasible timetables
- Number flagged before attendance drop
- Anonymized examples (CASE-001, CASE-002, etc.)
- Average weeks of early warning
- Conflict breakdown by type
- Summary insights (text)

---

## 9. Database Schema

### Tables Created

| Table | Purpose |
|-------|---------|
| `calendar_academic_events` | Academic timetable events |
| `calendar_work_events` | Work/personal events |
| `attendance_records` | Attendance signals |
| `student_calendar_summary` | Normalized weekly calendar |
| `timetable_feasibility` | Feasibility scores by week |
| `calendar_conflicts` | Detected conflicts |
| `attendance_viability_risk` | Predicted risks |

### Realtime Enabled
- `timetable_feasibility`
- `calendar_conflicts`
- `attendance_viability_risk`

---

## 10. Pilot Reporting Output (Critical)

The pilot report includes:

```json
{
  "report_generated_at": "2025-01-XX",
  "total_students_analyzed": 150,
  "unfeasible_timetables_count": 12,
  "unfeasible_timetables_percentage": 8,
  "flagged_before_attendance_drop": 18,
  "average_weeks_early_warning": 2.5,
  "anonymized_examples": [
    {
      "case_id": "CASE-001",
      "feasibility_score": 45,
      "score_band": "at_risk",
      "conflicts_count": 3,
      "primary_conflict_type": "class_work_overlap",
      "weeks_to_risk": 2
    }
  ],
  "conflict_breakdown": [
    { "type": "class_work_overlap", "count": 8 },
    { "type": "day_exceeds_hours", "count": 5 }
  ],
  "summary_insights": [
    "150 students analyzed for timetable feasibility",
    "12 students (8%) have unfeasible timetables",
    "18 students flagged for early intervention"
  ]
}
```

**This is what will be shown to universities.**

---

## 11. Definition of Done

This feature is done when:

✅ We can explain why a timetable will fail  
✅ Risks appear before attendance thresholds are breached  
✅ Logic is transparent and auditable  
✅ No core systems are replaced  

---

## 12. What This Feature Does NOT Do

| Out of Scope | Reason |
|--------------|--------|
| ML model training | Pilot uses rules-based logic |
| Mental health diagnostics | Not in scope |
| Student messaging | No automation |
| Notifications | No automation |
| Full timetable replacement | Between-system intelligence only |
| Mobile app | Desktop ops view only |
| Role-based access control | All roles can access for pilot |

---

## 13. Engineering Notes

- This is proof of an institutional blind spot
- Rules-based scoring for transparency and auditability
- Feasibility score is deterministic given the same inputs
- All factors have documented impact values
- Conflicts are stored individually for detailed analysis
- Viability risks are predictive, not diagnostic

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Feasibility Score** | 0-100 score indicating how sustainable a timetable is |
| **Score Band** | Classification: feasible (85+), strained (60-84), at_risk (<60) |
| **Conflict** | Detected scheduling issue (overlap, no gap, etc.) |
| **Viability Risk** | Prediction that attendance will become unsustainable |
| **Weeks to Risk** | Estimated time until attendance issues manifest |
| **Mandatory Hours** | Hours of required attendance per week |

---

## 15. Contact & Support

For questions about Calendar Intelligence:
- **Feature Owner:** Jas
- **Technical Documentation:** This document
- **Engineering Team:** WorldLynk Development

---

*This document is for the pilot phase. Do not build beyond documented scope.*
