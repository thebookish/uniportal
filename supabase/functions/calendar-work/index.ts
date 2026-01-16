import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkEventInput {
  student_id: string;
  event_type: 'work' | 'personal';
  start_time: string;
  end_time: string;
  title?: string;
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
      const body = await req.json();
      
      // Support single event or batch
      const events: WorkEventInput[] = Array.isArray(body) ? body : [body];
      
      const insertData = events.map((event) => {
        const startDate = new Date(event.start_time);
        const dayOfWeek = startDate.getDay();
        
        return {
          student_id: event.student_id,
          event_type: event.event_type,
          start_time: event.start_time,
          end_time: event.end_time,
          title: event.title,
          day_of_week: dayOfWeek,
          recurring: false,
        };
      });

      const { data, error } = await supabase
        .from('calendar_work_events')
        .insert(insertData)
        .select();

      if (error) throw error;

      // Trigger calendar summary recalculation for affected students
      const studentIds = [...new Set(events.map(e => e.student_id))];
      for (const studentId of studentIds) {
        await recalculateCalendarSummary(supabase, studentId);
      }

      return new Response(
        JSON.stringify({ success: true, data, message: `${data.length} work/personal event(s) created` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
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

async function recalculateCalendarSummary(supabase: any, studentId: string) {
  // Get all academic events for the student
  const { data: academicEvents } = await supabase
    .from('calendar_academic_events')
    .select('*')
    .eq('student_id', studentId);

  // Get all work events for the student
  const { data: workEvents } = await supabase
    .from('calendar_work_events')
    .select('*')
    .eq('student_id', studentId);

  if (!academicEvents && !workEvents) return;

  // Calculate weekly summary
  const weekStart = getWeekStart(new Date());
  
  const weeklyCalendar: any[] = [];
  let totalClassHours = 0;
  let totalMandatoryHours = 0;
  let totalWorkHours = 0;

  // Process academic events
  for (const event of academicEvents || []) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    totalClassHours += hours;
    if (event.mandatory) {
      totalMandatoryHours += hours;
    }

    weeklyCalendar.push({
      type: 'class',
      start: event.start_time,
      end: event.end_time,
      mandatory: event.mandatory,
      day_of_week: event.day_of_week,
      title: event.title,
    });
  }

  // Process work events
  for (const event of workEvents || []) {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    totalWorkHours += hours;

    weeklyCalendar.push({
      type: 'work',
      start: event.start_time,
      end: event.end_time,
      mandatory: false,
      day_of_week: event.day_of_week,
      title: event.title,
    });
  }

  // Calculate free time blocks (simplified)
  const freeTimeBlocks = calculateFreeTimeBlocks(weeklyCalendar);

  // Upsert the calendar summary
  await supabase
    .from('student_calendar_summary')
    .upsert({
      student_id: studentId,
      week_start: weekStart.toISOString().split('T')[0],
      total_class_hours: totalClassHours,
      total_mandatory_hours: totalMandatoryHours,
      total_work_hours: totalWorkHours,
      free_time_blocks: freeTimeBlocks,
      weekly_calendar: weeklyCalendar,
    }, { onConflict: 'student_id,week_start' });
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateFreeTimeBlocks(weeklyCalendar: any[]): any[] {
  const freeBlocks: any[] = [];
  const dayGroups: { [key: number]: any[] } = {};

  for (const event of weeklyCalendar) {
    const day = event.day_of_week;
    if (!dayGroups[day]) dayGroups[day] = [];
    dayGroups[day].push(event);
  }

  for (let day = 1; day <= 5; day++) {
    const events = dayGroups[day] || [];
    if (events.length === 0) {
      freeBlocks.push({ start: '09:00', end: '17:00', day });
      continue;
    }

    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    let lastEnd = '09:00';
    for (const event of events) {
      const eventStart = new Date(event.start).toTimeString().slice(0, 5);
      if (eventStart > lastEnd) {
        freeBlocks.push({ start: lastEnd, end: eventStart, day });
      }
      const eventEnd = new Date(event.end).toTimeString().slice(0, 5);
      if (eventEnd > lastEnd) {
        lastEnd = eventEnd;
      }
    }
    if (lastEnd < '17:00') {
      freeBlocks.push({ start: lastEnd, end: '17:00', day });
    }
  }

  return freeBlocks;
}
