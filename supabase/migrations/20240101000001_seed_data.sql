-- Insert programs
INSERT INTO public.programs (name, department, intake_date, capacity, enrolled, eligibility) VALUES
('Computer Science BSc', 'Engineering & Technology', '2024-09-01', 120, 98, ARRAY['High School Diploma', 'Math Proficiency', 'English B2+']),
('Business Administration MBA', 'Business School', '2024-09-15', 80, 72, ARRAY['Bachelor Degree', '3+ Years Experience', 'GMAT 600+']),
('Data Science MSc', 'Engineering & Technology', '2024-10-01', 60, 45, ARRAY['Bachelor in STEM', 'Programming Skills', 'Statistics Knowledge']);

-- Insert counselors
INSERT INTO public.users (name, email, role) VALUES
('John Smith', 'john.smith@university.edu', 'admissions'),
('Emily Davis', 'emily.davis@university.edu', 'admissions'),
('Sarah Williams', 'sarah.williams@university.edu', 'admissions');

-- Insert students (using subqueries to get IDs)
INSERT INTO public.students (name, email, phone, country, stage, engagement_score, risk_score, program_id, counselor_id, last_activity, tags)
SELECT 'Sarah Chen', 'sarah.chen@email.com', '+1-555-0123', 'China', 'active', 32, 85, 
  (SELECT id FROM public.programs WHERE name = 'Computer Science BSc' LIMIT 1),
  (SELECT id FROM public.users WHERE name = 'John Smith' LIMIT 1),
  NOW() - INTERVAL '7 days', ARRAY['high-risk', 'international']
UNION ALL
SELECT 'Marcus Johnson', 'marcus.j@email.com', NULL, 'USA', 'enrollment', 42, 68,
  (SELECT id FROM public.programs WHERE name = 'Business Administration MBA' LIMIT 1),
  (SELECT id FROM public.users WHERE name = 'Emily Davis' LIMIT 1),
  NOW() - INTERVAL '3 days', ARRAY['declining-engagement']
UNION ALL
SELECT 'Priya Sharma', 'priya.sharma@email.com', NULL, 'India', 'offer', 65, 45,
  (SELECT id FROM public.programs WHERE name = 'Data Science MSc' LIMIT 1),
  (SELECT id FROM public.users WHERE name = 'John Smith' LIMIT 1),
  NOW() - INTERVAL '1 day', ARRAY['document-overdue', 'international']
UNION ALL
SELECT 'Alex Rivera', 'alex.rivera@email.com', NULL, 'Mexico', 'lead', 92, 12,
  (SELECT id FROM public.programs WHERE name = 'Computer Science BSc' LIMIT 1),
  (SELECT id FROM public.users WHERE name = 'Sarah Williams' LIMIT 1),
  NOW() - INTERVAL '2 hours', ARRAY['high-potential', 'ai-recommended']
UNION ALL
SELECT 'Emma Thompson', 'emma.t@email.com', NULL, 'UK', 'application', 78, 25,
  (SELECT id FROM public.programs WHERE name = 'Computer Science BSc' LIMIT 1),
  (SELECT id FROM public.users WHERE name = 'Emily Davis' LIMIT 1),
  NOW() - INTERVAL '12 hours', ARRAY['on-track'];

-- Insert documents
INSERT INTO public.documents (student_id, name, status)
SELECT (SELECT id FROM public.students WHERE name = 'Sarah Chen' LIMIT 1), 'Transcript', 'approved'
UNION ALL SELECT (SELECT id FROM public.students WHERE name = 'Sarah Chen' LIMIT 1), 'Passport', 'approved'
UNION ALL SELECT (SELECT id FROM public.students WHERE name = 'Sarah Chen' LIMIT 1), 'English Test', 'pending'
UNION ALL SELECT (SELECT id FROM public.students WHERE name = 'Marcus Johnson' LIMIT 1), 'Transcript', 'approved'
UNION ALL SELECT (SELECT id FROM public.students WHERE name = 'Marcus Johnson' LIMIT 1), 'ID', 'approved'
UNION ALL SELECT (SELECT id FROM public.students WHERE name = 'Priya Sharma' LIMIT 1), 'Transcript', 'pending'
UNION ALL SELECT (SELECT id FROM public.students WHERE name = 'Priya Sharma' LIMIT 1), 'Passport', 'pending'
UNION ALL SELECT (SELECT id FROM public.students WHERE name = 'Priya Sharma' LIMIT 1), 'English Test', 'pending'
UNION ALL SELECT (SELECT id FROM public.students WHERE name = 'Emma Thompson' LIMIT 1), 'Transcript', 'submitted'
UNION ALL SELECT (SELECT id FROM public.students WHERE name = 'Emma Thompson' LIMIT 1), 'Personal Statement', 'submitted';

-- Insert AI alerts
INSERT INTO public.ai_alerts (severity, title, description, student_id, recommendations, read)
SELECT 'critical', 'High Dropout Risk Detected', 'Sarah Chen has shown 85% probability of dropout based on engagement patterns',
  (SELECT id FROM public.students WHERE name = 'Sarah Chen' LIMIT 1),
  ARRAY['Schedule immediate 1-on-1 counseling session', 'Review course fit and consider program alternatives', 'Activate peer mentorship program'], FALSE
UNION ALL
SELECT 'warning', 'Engagement Score Declining', 'Marcus Johnson engagement dropped from 78 to 42 in past 7 days',
  (SELECT id FROM public.students WHERE name = 'Marcus Johnson' LIMIT 1),
  ARRAY['Send automated check-in message', 'Review recent activity logs for blockers', 'Assign to senior counselor for follow-up'], FALSE
UNION ALL
SELECT 'warning', 'Document Submission Overdue', 'Priya Sharma has 3 critical documents pending for 14+ days',
  (SELECT id FROM public.students WHERE name = 'Priya Sharma' LIMIT 1),
  ARRAY['Send urgent reminder with deadline extension', 'Offer document upload assistance', 'Escalate to international office if no response'], TRUE
UNION ALL
SELECT 'info', 'High-Fit Student Identified', 'AI detected excellent program match for incoming lead: Alex Rivera',
  (SELECT id FROM public.students WHERE name = 'Alex Rivera' LIMIT 1),
  ARRAY['Fast-track application review', 'Assign to top-performing counselor', 'Send personalized program information'], TRUE;

-- Insert metrics
INSERT INTO public.metrics (label, value, change, trend) VALUES
('Total Leads', 1247, 12.5, 'up'),
('Active Applications', 342, 8.3, 'up'),
('Offers Issued', 189, -3.2, 'down'),
('Enrolled Students', 156, 15.7, 'up'),
('At-Risk Students', 23, -18.5, 'down'),
('Dropout Rate', 4.2, -12.3, 'down');
