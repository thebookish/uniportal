# WorldLynk AI-Driven Student Risk Analysis System

## Technical Documentation for Stakeholders

**Version:** 1.0  
**Last Updated:** January 2025  
**Classification:** Internal Use Only

---

## Executive Summary

The WorldLynk AI system is a predictive intelligence layer that transforms universities from reactive institutions into proactive student success machines. By analyzing multiple data points in real-time, the system identifies at-risk students before they drop out, enabling early intervention and improved retention rates.

---

## 1. Data Collection Overview

### 1.1 Primary Data Sources

| Data Category | Specific Data Points | Collection Method | Update Frequency |
|--------------|---------------------|-------------------|------------------|
| **Student Profile** | Name, Email, Country, Phone | Manual entry / Import | On creation |
| **Academic Status** | Program, Enrollment Date, Lifecycle Stage | System tracking | Real-time |
| **Engagement Metrics** | Login frequency, Portal interactions, Task completion | Automated tracking | Real-time |
| **Activity Tracking** | Last activity timestamp, Days inactive | System monitoring | Continuous |
| **Communication History** | Emails sent/opened, Messages read | Email/messaging system | Per interaction |
| **Document Status** | Required documents submitted/pending | Document management | On upload |
| **Counselor Interactions** | Assigned counselor, Meeting history, Notes | Staff input | Per interaction |

### 1.2 External Integrations (Optional)

| Integration | Data Retrieved | Purpose |
|-------------|---------------|---------|
| **Moodle LMS** | Last access time, Course enrollments, Grades, Account status | Academic engagement tracking |
| **Email Systems** | Open rates, Click rates, Response times | Communication effectiveness |

### 1.3 Student Lifecycle Stages

The system tracks students through 10 distinct lifecycle stages:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STUDENT LIFECYCLE PROGRESSION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────┐    ┌─────────────┐    ┌───────┐    ┌────────────┐               │
│   │ LEAD │ →  │ APPLICATION │ →  │ OFFER │ →  │ ACCEPTANCE │               │
│   └──────┘    └─────────────┘    └───────┘    └────────────┘               │
│                                                      ↓                       │
│   ┌─────────┐    ┌────────────┐    ┌────────┐    ┌────────────┐            │
│   │ DROPPED │ ←  │  AT_RISK   │ ←  │ ACTIVE │ ←  │ ONBOARDING │            │
│   └─────────┘    └────────────┘    └────────┘    └────────────┘            │
│        ↓              ↓                               ↓                      │
│   ┌─────────┐    ┌──────────┐                    ┌──────────┐              │
│   │ CHURNED │    │ RETAINED │ ←─────────────────│ ENROLLED │              │
│   └─────────┘    └──────────┘                    └──────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. AI Risk Analysis Engine

### 2.1 How Risk Scores Are Calculated

The AI uses a **hybrid approach** combining rule-based scoring with OpenAI's GPT-4o-mini model for nuanced analysis.

#### Rule-Based Scoring Matrix

| Risk Factor | Condition | Risk Points Added |
|-------------|-----------|-------------------|
| **Very Low Engagement** | Engagement Score < 30 | +40 points |
| **Low Engagement** | Engagement Score < 50 | +20 points |
| **Extended Inactivity** | > 7 days since last activity | +30 points |
| **Moderate Inactivity** | > 3 days since last activity | +15 points |
| **Vulnerable Stage** | Currently in "onboarding" | +10 points |
| **Document Delays** | Missing required documents | +15 points |
| **Communication Gap** | No response to messages | +10 points |

**Final Risk Score = Sum of applicable risk points (capped at 100)**

### 2.2 AI-Enhanced Analysis

When available, the OpenAI model provides:

1. **Contextual Risk Assessment** - Understanding patterns beyond simple thresholds
2. **Predictive Modeling** - Anticipating future dropout probability
3. **Personalized Recommendations** - Tailored intervention strategies
4. **Natural Language Insights** - Human-readable explanations of risk factors

### 2.3 Risk Score Interpretation

| Score Range | Severity | Color Code | Action Required |
|-------------|----------|------------|-----------------|
| **70-100** | 🔴 Critical | Red | Immediate intervention required |
| **40-69** | 🟠 Warning | Amber | Schedule follow-up within 48 hours |
| **20-39** | 🟡 Moderate | Yellow | Monitor closely, preventive outreach |
| **0-19** | 🟢 Low Risk | Green | Standard engagement protocols |

---

## 3. Alert Types & Triggers

### 3.1 Automated Alert Categories

#### Dropout Risk Alerts
- **Trigger:** Risk score exceeds 40
- **Content:** Student name, risk score, contributing factors, recommended actions
- **Recipients:** Assigned counselor, Student Success team

#### Engagement Anomaly Alerts
- **Trigger:** Engagement score drops >20% in 7 days
- **Content:** Previous vs. current engagement, activity breakdown
- **Recipients:** Assigned counselor

#### Inactivity Alerts
- **Trigger:** No activity for 3+ days (warning) or 7+ days (critical)
- **Content:** Last activity date, current lifecycle stage
- **Recipients:** Assigned counselor, Admissions (if pre-enrollment)

#### Compliance Breach Warnings
- **Trigger:** Student approaching regulatory deadlines
- **Content:** Deadline type, days remaining, required actions
- **Recipients:** International Office, Compliance team

#### Document Deadline Alerts
- **Trigger:** Required documents past due or approaching deadline
- **Content:** Missing documents list, impact on enrollment
- **Recipients:** Student (automated), Admissions team

### 3.2 Alert Delivery Channels

| Channel | Use Case | Response Time Target |
|---------|----------|---------------------|
| **In-App Notification** | Primary alert channel | Real-time |
| **Email** | Critical alerts to staff | Within 15 minutes |
| **Dashboard Badge** | Aggregate alert counts | Real-time |
| **AI Intelligence Feed** | Prioritized alert stream | Real-time |

---

## 4. AI-Generated Recommendations

### 4.1 Recommendation Framework

Based on risk analysis, the AI generates actionable recommendations:

#### For High Engagement Drop (Score < 30)
```
• Schedule immediate 1:1 intervention meeting
• Review and simplify current academic workload
• Assign dedicated success coach for intensive support
• Initiate emergency retention protocol
```

#### For Moderate Engagement Issues (Score 30-50)
```
• Send personalized check-in message within 24 hours
• Offer additional academic support resources
• Schedule casual catch-up call
• Review course load appropriateness
```

#### For Extended Inactivity (>7 days)
```
• Immediate phone outreach attempt
• Send "We miss you" personalized email
• Notify emergency contact (if available)
• Document all outreach attempts
```

#### For Onboarding Stage Students
```
• Verify all onboarding tasks are clearly communicated
• Provide orientation session recording access
• Assign peer mentor/buddy
• Schedule welcome call with counselor
```

### 4.2 Intervention Success Tracking

The system tracks intervention outcomes to improve recommendations:

| Metric | Description |
|--------|-------------|
| **Intervention Success Rate** | % of at-risk students retained after intervention |
| **Time to Recovery** | Average days from intervention to normal engagement |
| **Most Effective Actions** | Which intervention types yield best results |
| **False Positive Rate** | Alerts for students who weren't actually at risk |

---

## 5. Dashboard Metrics & KPIs

### 5.1 Real-Time Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Students Near Breach (7 days)** | Students requiring immediate action | < 5% of active students |
| **Students Near Breach (14 days)** | Students needing monitoring | < 10% of active students |
| **Unresolved Obligations** | Pending student tasks | Declining trend |
| **Active Interventions** | Ongoing support cases | < 15% of at-risk students |
| **Average Time to Resolution** | Days from alert to resolution | < 5 days |

### 5.2 Funnel Analytics

```
┌─────────────────────────────────────────────────────────────┐
│                    CONVERSION FUNNEL                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LEADS         ████████████████████████████  2,450  (100%)  │
│                           ↓                                  │
│  APPLICATIONS  ████████████████████         1,715  (70%)    │
│                           ↓                                  │
│  OFFERS        ██████████████               1,225  (50%)    │
│                           ↓                                  │
│  ACCEPTANCES   ████████████                 1,102  (45%)    │
│                           ↓                                  │
│  ENROLLMENTS   ██████████                     980  (40%)    │
│                           ↓                                  │
│  ACTIVE        █████████                      882  (36%)    │
│                           ↓                                  │
│  RETAINED      ████████                       794  (32%)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Data Privacy & Security

### 6.1 Data Protection Measures

| Measure | Implementation |
|---------|----------------|
| **Encryption** | AES-256 at rest, TLS 1.3 in transit |
| **Access Control** | Role-based permissions, audit logging |
| **Data Retention** | Configurable per university policy |
| **Anonymization** | Option to anonymize data for analytics |
| **GDPR Compliance** | Data export/deletion on request |

### 6.2 AI Data Usage

- Student data is **never** used to train external AI models
- AI analysis happens within secure infrastructure
- No student data is shared with third parties
- All AI interactions are logged for audit purposes

---

## 7. Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   FRONTEND   │     │   BACKEND    │     │   DATABASE   │    │
│  │  (React App) │ ←→  │  (Supabase)  │ ←→  │ (PostgreSQL) │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         ↑                    ↑                    ↑              │
│         │                    │                    │              │
│         ↓                    ↓                    ↓              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  Real-time   │     │  Edge        │     │  Row Level   │    │
│  │  Subscriptions│     │  Functions   │     │  Security    │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                              ↑                                   │
│                              │                                   │
│                              ↓                                   │
│                       ┌──────────────┐                          │
│                       │   OpenAI     │                          │
│                       │   GPT-4o     │                          │
│                       └──────────────┘                          │
│                                                                  │
│  EXTERNAL INTEGRATIONS:                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Moodle  │  │  Email   │  │  Resend  │  │  Future  │       │
│  │   LMS    │  │  (SMTP)  │  │   API    │  │  APIs    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Glossary

| Term | Definition |
|------|------------|
| **Engagement Score** | Numerical measure (0-100) of student interaction with the institution |
| **Risk Score** | AI-calculated probability (0-100) of student dropout |
| **Lifecycle Stage** | Current position in the student journey from lead to graduation |
| **Intervention** | Proactive action taken to support an at-risk student |
| **Retention** | Successfully keeping enrolled students through to completion |
| **Churn** | Student dropout or withdrawal from the program |
| **Compliance Breach** | Violation of regulatory requirements (visa, enrollment deadlines) |
| **Edge Function** | Serverless backend function for real-time processing |
| **RLS** | Row Level Security - database access control |

---

## 9. FAQ for Stakeholders

**Q: How accurate is the AI risk prediction?**
> The system combines multiple data points for high accuracy. Initial benchmarks show 85%+ accuracy in identifying students who would have dropped out without intervention.

**Q: Can the AI make mistakes?**
> Yes, like any prediction system. That's why all alerts require human review before action. The system prioritizes avoiding false negatives (missing at-risk students) over false positives.

**Q: What if a student's risk score seems wrong?**
> Staff can review contributing factors in the student detail panel and override or dismiss alerts with documentation.

**Q: How quickly does the system detect issues?**
> Real-time. Engagement and activity changes trigger immediate recalculation of risk scores.

**Q: Is student data used to train AI models?**
> No. Student data is only used for analysis within the platform and is never used to train external AI models.

**Q: Can students see their own risk scores?**
> No. Risk scores are internal metrics visible only to authorized staff.

---

## 10. Contact & Support

For technical questions about the AI system:
- **Technical Documentation:** [Internal Wiki Link]
- **Support Team:** support@worldlynk.com
- **Emergency Issues:** [Escalation procedure]

---

*This document is confidential and intended for internal stakeholder use only. Do not distribute externally without authorization.*
