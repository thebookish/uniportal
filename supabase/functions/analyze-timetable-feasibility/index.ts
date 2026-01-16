import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeasibilityFactor {
  factor: string;
  impact: number;
  description: string;
}

interface ConflictDetection {
  conflict_type: 'class_work_overlap' | 'unrealistic_transition' | 'excessive_sessions' | 'day_exceeds_hours';
  day: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      const { student_id, analyze_all } = await req.json();

      let studentIds: string[] = [];

      if (analyze_all) {
        // Get all students with calendar data
        const { data: summaries } = await supabase
          .from('student_calendar_summary')
          .select('student_id');
        studentIds = [...new Set(summaries?.map(s => s.student_id) || [])];
      } else if (student_id) {
        studentIds = [student_id];
      } else {
        return new Response(
          JSON.stringify({ error: 'student_id or analyze_all is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const results = [];

      for (const sid of studentIds) {
        const result = await analyzeStudentFeasibility(supabase, sid);
        results.push(result);
      }

      return new Response(
        JSON.stringify({ success: true, data: results, message: `Analyzed ${results.length} student(s)` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function analyzeStudentFeasibility(supabase: any, studentId: string) {
  // Get calendar summary
  const { data: summary } = await supabase
    .from('student_calendar_summary')
    .select('*')
    .eq('student_id', studentId)
    .order('week_start', { ascending: false })
    .limit(1)
    .single();

  if (!summary) {
    return { student_id: studentId, error: 'No calendar data found' };
  }

  const weeklyCalendar = summary.weekly_calendar || [];
  const factors: FeasibilityFactor[] = [];
  const conflicts: ConflictDetection[] = [];
  let baseScore = 100;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Group events by day
  const dayGroups: { [key: number]: any[] } = {};
  for (const event of weeklyCalendar) {
    const day = event.day_of_week;
    if (!dayGroups[day]) dayGroups[day] = [];
    dayGroups[day].push(event);
  }

  // FACTOR 1: Mandatory hours per day analysis
  for (const [day, events] of Object.entries(dayGroups)) {
    const dayNum = parseInt(day);
    const mandatoryEvents = events.filter((e: any) => e.mandatory);
    let mandatoryHours = 0;

    for (const event of mandatoryEvents) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      mandatoryHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    if (mandatoryHours > 8) {
      const impact = -20;
      baseScore += impact;
      factors.push({
        factor: 'excessive_daily_mandatory',
        impact,
        description: `${dayNames[dayNum]} has ${mandatoryHours.toFixed(1)} mandatory hours (>8 hours)`,
      });
      conflicts.push({
        conflict_type: 'day_exceeds_hours',
        day: dayNames[dayNum],
        severity: 'high',
        details: `${mandatoryHours.toFixed(1)} mandatory hours exceeds sustainable limit`,
      });
    } else if (mandatoryHours > 6) {
      const impact = -10;
      baseScore += impact;
      factors.push({
        factor: 'high_daily_mandatory',
        impact,
        description: `${dayNames[dayNum]} has ${mandatoryHours.toFixed(1)} mandatory hours (>6 hours)`,
      });
    }
  }

  // FACTOR 2: Session clustering (back-to-back detection)
  for (const [day, events] of Object.entries(dayGroups)) {
    const dayNum = parseInt(day);
    const sortedEvents = events.sort((a: any, b: any) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    let consecutiveCount = 0;
    for (let i = 1; i < sortedEvents.length; i++) {
      const prevEnd = new Date(sortedEvents[i - 1].end);
      const currStart = new Date(sortedEvents[i].start);
      const gapMinutes = (currStart.getTime() - prevEnd.getTime()) / (1000 * 60);

      if (gapMinutes < 15) {
        consecutiveCount++;
        if (gapMinutes < 0) {
          // Overlap detected
          conflicts.push({
            conflict_type: 'class_work_overlap',
            day: dayNames[dayNum],
            severity: 'high',
            details: `Events overlap: ${sortedEvents[i - 1].title || 'Event'} and ${sortedEvents[i].title || 'Event'}`,
          });
        } else if (gapMinutes < 5) {
          conflicts.push({
            conflict_type: 'unrealistic_transition',
            day: dayNames[dayNum],
            severity: 'medium',
            details: `Only ${gapMinutes} minutes between sessions (unrealistic transition)`,
          });
        }
      }
    }

    if (consecutiveCount >= 3) {
      const impact = -15;
      baseScore += impact;
      factors.push({
        factor: 'session_clustering',
        impact,
        description: `${dayNames[dayNum]} has ${consecutiveCount + 1} back-to-back sessions`,
      });
      conflicts.push({
        conflict_type: 'excessive_sessions',
        day: dayNames[dayNum],
        severity: 'medium',
        details: `${consecutiveCount + 1} consecutive sessions with minimal breaks`,
      });
    }
  }

  // FACTOR 3: Class-work overlap detection
  for (const [day, events] of Object.entries(dayGroups)) {
    const dayNum = parseInt(day);
    const classEvents = events.filter((e: any) => e.type === 'class');
    const workEvents = events.filter((e: any) => e.type === 'work');

    for (const classEvent of classEvents) {
      const classStart = new Date(classEvent.start).getTime();
      const classEnd = new Date(classEvent.end).getTime();

      for (const workEvent of workEvents) {
        const workStart = new Date(workEvent.start).getTime();
        const workEnd = new Date(workEvent.end).getTime();

        // Check for overlap
        if (classStart < workEnd && classEnd > workStart) {
          const impact = -25;
          baseScore += impact;
          factors.push({
            factor: 'class_work_overlap',
            impact,
            description: `${dayNames[dayNum]}: Class overlaps with work schedule`,
          });
          conflicts.push({
            conflict_type: 'class_work_overlap',
            day: dayNames[dayNum],
            severity: 'high',
            details: `Mandatory ${classEvent.title || 'class'} overlaps with ${workEvent.title || 'work shift'}`,
          });
          break;
        }
      }
    }
  }

  // FACTOR 4: Total weekly load
  const totalClassHours = summary.total_class_hours || 0;
  const totalWorkHours = summary.total_work_hours || 0;
  const totalHours = totalClassHours + totalWorkHours;

  if (totalHours > 50) {
    const impact = -20;
    baseScore += impact;
    factors.push({
      factor: 'excessive_weekly_load',
      impact,
      description: `Total weekly commitment of ${totalHours.toFixed(1)} hours (>50 hours)`,
    });
  } else if (totalHours > 40) {
    const impact = -10;
    baseScore += impact;
    factors.push({
      factor: 'high_weekly_load',
      impact,
      description: `Total weekly commitment of ${totalHours.toFixed(1)} hours (>40 hours)`,
    });
  }

  // FACTOR 5: Consecutive heavy days
  const heavyDays = Object.entries(dayGroups).filter(([_, events]) => {
    let totalHours = 0;
    for (const event of events) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return totalHours > 6;
  }).map(([day]) => parseInt(day));

  let consecutiveHeavyDays = 0;
  for (let i = 1; i < heavyDays.length; i++) {
    if (heavyDays[i] - heavyDays[i - 1] === 1) {
      consecutiveHeavyDays++;
    }
  }

  if (consecutiveHeavyDays >= 3) {
    const impact = -15;
    baseScore += impact;
    factors.push({
      factor: 'consecutive_heavy_days',
      impact,
      description: `${consecutiveHeavyDays + 1} consecutive days with >6 hours of commitments`,
    });
  }

  // Clamp score
  const finalScore = Math.max(0, Math.min(100, baseScore));

  // Determine band
  let scoreBand: 'feasible' | 'strained' | 'at_risk';
  if (finalScore >= 85) {
    scoreBand = 'feasible';
  } else if (finalScore >= 60) {
    scoreBand = 'strained';
  } else {
    scoreBand = 'at_risk';
  }

  const weekStart = summary.week_start;

  // Save feasibility score
  await supabase
    .from('timetable_feasibility')
    .upsert({
      student_id: studentId,
      week_start: weekStart,
      feasibility_score: finalScore,
      score_band: scoreBand,
      factors,
    }, { onConflict: 'student_id,week_start' });

  // Save new conflicts (remove old ones first)
  await supabase
    .from('calendar_conflicts')
    .delete()
    .eq('student_id', studentId)
    .eq('resolved', false);

  if (conflicts.length > 0) {
    await supabase
      .from('calendar_conflicts')
      .insert(conflicts.map(c => ({
        student_id: studentId,
        conflict_type: c.conflict_type,
        day: c.day,
        severity: c.severity,
        details: c.details,
      })));
  }

  // Generate viability risk prediction
  await generateViabilityRisk(supabase, studentId, finalScore, scoreBand, factors, conflicts);

  return {
    student_id: studentId,
    feasibility_score: finalScore,
    score_band: scoreBand,
    factors,
    conflicts_count: conflicts.length,
  };
}

async function generateViabilityRisk(
  supabase: any,
  studentId: string,
  score: number,
  band: string,
  factors: FeasibilityFactor[],
  conflicts: ConflictDetection[]
) {
  // Get previous feasibility to detect trends
  const { data: previousFeasibility } = await supabase
    .from('timetable_feasibility')
    .select('feasibility_score, week_start')
    .eq('student_id', studentId)
    .order('week_start', { ascending: false })
    .limit(3);

  // Check for declining trend
  let decliningTrend = false;
  if (previousFeasibility && previousFeasibility.length >= 2) {
    const scores = previousFeasibility.map((f: any) => f.feasibility_score);
    decliningTrend = scores[0] < scores[1] && (scores.length < 3 || scores[1] < scores[2]);
  }

  // Determine if viability risk should be created
  const reasons: string[] = [];
  let weeksToRisk = 0;
  let confidence: 'low' | 'medium' | 'high' = 'low';
  let shouldCreateRisk = false;

  if (band === 'at_risk') {
    shouldCreateRisk = true;
    weeksToRisk = 1;
    confidence = 'high';
    reasons.push('Timetable feasibility score below sustainable threshold');
  } else if (band === 'strained') {
    if (decliningTrend) {
      shouldCreateRisk = true;
      weeksToRisk = 2;
      confidence = 'medium';
      reasons.push('Feasibility score declining week-on-week');
    }
    if (conflicts.filter(c => c.severity === 'high').length >= 2) {
      shouldCreateRisk = true;
      weeksToRisk = 2;
      confidence = 'medium';
      reasons.push('Multiple high-severity conflicts detected');
    }
  }

  // Add specific reasons from factors
  for (const factor of factors) {
    if (factor.impact <= -15) {
      reasons.push(factor.description);
    }
  }

  if (conflicts.some(c => c.conflict_type === 'class_work_overlap')) {
    reasons.push('Work schedule conflicts with mandatory classes');
  }

  // Generate recommendation
  let recommendation = '';
  if (shouldCreateRisk) {
    if (band === 'at_risk') {
      recommendation = 'Student workload may become unsustainable within 1 week. Early review of timetable flexibility recommended.';
    } else if (conflicts.some(c => c.conflict_type === 'class_work_overlap')) {
      recommendation = 'Consider proactive check-in before attendance breach. Work-class conflicts need resolution.';
    } else {
      recommendation = 'Student workload may become unsustainable within 2-3 weeks. Monitor closely.';
    }
  }

  // Deactivate old risks
  await supabase
    .from('attendance_viability_risk')
    .update({ active: false })
    .eq('student_id', studentId);

  // Create new risk if needed
  if (shouldCreateRisk) {
    await supabase
      .from('attendance_viability_risk')
      .insert({
        student_id: studentId,
        risk_type: 'attendance_viability_risk',
        weeks_to_risk: weeksToRisk,
        confidence,
        reasons,
        recommendation,
        active: true,
      });
  }
}
