import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      body = { message: 'Hello' };
    }
    
    const { message, conversationHistory, action, universityId } = body;
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Try multiple env var names for Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      // Return a helpful response even without DB
      return new Response(
        JSON.stringify({ 
          response: `🤖 **AI Assistant Ready**\n\nI'm online but database connection needs configuration.\n\n**To fix:**\n1. Go to project settings\n2. Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are set\n\nAvailable env vars: ${Object.keys(Deno.env.toObject()).filter(k => k.includes('SUPA')).join(', ') || 'None found'}`,
          context: { totalStudents: 0, atRisk: 0, alerts: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Build queries with optional university filtering
    let studentsQuery = supabaseClient.from('students').select('*');
    let alertsQuery = supabaseClient.from('ai_alerts').select('*').order('created_at', { ascending: false }).limit(50);
    let programsQuery = supabaseClient.from('programs').select('*');
    let counselorsQuery = supabaseClient.from('users').select('*');
    let onboardingQuery = supabaseClient.from('onboarding_tasks').select('*');

    // Filter by university_id if provided
    if (universityId) {
      studentsQuery = studentsQuery.eq('university_id', universityId);
      alertsQuery = alertsQuery.eq('university_id', universityId);
      programsQuery = programsQuery.eq('university_id', universityId);
      counselorsQuery = counselorsQuery.eq('university_id', universityId);
      onboardingQuery = onboardingQuery.eq('university_id', universityId);
    }

    const [studentsRes, alertsRes, programsRes, counselorsRes, onboardingRes] = await Promise.all([
      studentsQuery,
      alertsQuery,
      programsQuery,
      counselorsQuery,
      onboardingQuery
    ]);

    const students = studentsRes.data || [];
    const alerts = alertsRes.data || [];
    const programs = programsRes.data || [];
    const counselors = counselorsRes.data || [];
    const tasks = onboardingRes.data || [];

    const atRiskStudents = students.filter(s => (s.risk_score || 0) >= 70);
    const warningStudents = students.filter(s => (s.risk_score || 0) >= 40 && (s.risk_score || 0) < 70);
    const lowEngagement = students.filter(s => (s.engagement_score || 0) < 40);
    const unreadAlerts = alerts.filter(a => !a.read);

    const stageCount = students.reduce((acc: any, s) => {
      acc[s.stage] = (acc[s.stage] || 0) + 1;
      return acc;
    }, {});

    const buildResponse = (content: string) => {
      return new Response(
        JSON.stringify({ 
          response: content,
          context: { 
            totalStudents: students.length, 
            atRisk: atRiskStudents.length, 
            alerts: unreadAlerts.length,
            programs: programs.length,
            counselors: counselors.length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    };

    if (!openaiKey) {
      const fallbackResponse = `📊 **Live Dashboard Data**

**Students:** ${students.length} total
- 🔴 Critical Risk (≥70%): ${atRiskStudents.length}
- 🟡 Warning (40-69%): ${warningStudents.length}
- 📉 Low Engagement (<40): ${lowEngagement.length}

**By Stage:** ${Object.entries(stageCount).map(([k, v]) => `${k}: ${v}`).join(' | ')}

**Alerts:** ${unreadAlerts.length} unread of ${alerts.length} total
**Programs:** ${programs.length} (${programs.reduce((s, p) => s + (p.enrolled || 0), 0)} enrolled)
**Counselors:** ${counselors.length} active

${atRiskStudents.length > 0 ? `\n⚠️ **Immediate Attention:**\n${atRiskStudents.slice(0, 5).map(s => `• ${s.name}: Risk ${s.risk_score}%, Engagement ${s.engagement_score}%`).join('\n')}` : '✅ No critical risk students'}

*Configure OPENAI_API_KEY for full AI capabilities.*`;

      return buildResponse(fallbackResponse);
    }

    const systemPrompt = `You are the AI command center for WorldLynk University Admin Portal. You have FULL ACCESS to the database and can:

1. ANALYZE students, risks, engagement, and performance
2. RECOMMEND interventions and actions
3. MONITOR alerts and priorities
4. GUIDE admins on best practices
5. GENERATE reports and insights

CURRENT DATABASE STATE (REAL-TIME):
=====================================
STUDENTS: ${students.length} total
- Critical Risk (≥70%): ${atRiskStudents.length}
- Warning (40-69%): ${warningStudents.length}
- Low Engagement (<40): ${lowEngagement.length}

STAGE DISTRIBUTION:
${Object.entries(stageCount).map(([stage, count]) => `- ${stage}: ${count} students`).join('\n')}

PROGRAMS: ${programs.length}
${programs.slice(0, 10).map(p => `- ${p.name}: ${p.enrolled || 0}/${p.capacity || 0} capacity`).join('\n')}

COUNSELORS: ${counselors.length}
${counselors.map(c => `- ${c.name}: ${students.filter(s => s.counselor_id === c.id).length} students assigned`).join('\n') || 'No counselors'}

ACTIVE ALERTS: ${unreadAlerts.length}
${unreadAlerts.slice(0, 5).map(a => `- [${a.severity?.toUpperCase()}] ${a.title}`).join('\n') || 'No active alerts'}

AT-RISK STUDENTS (Top 10):
${atRiskStudents.slice(0, 10).map(s => `- ${s.name} (${s.email}): Risk=${s.risk_score}%, Engagement=${s.engagement_score}%, Stage=${s.stage}, Country=${s.country || 'N/A'}`).join('\n') || 'None'}

ONBOARDING TASKS: ${tasks.length} total, ${tasks.filter(t => t.status === 'completed').length} completed

INSTRUCTIONS:
- Be concise and actionable
- Reference specific data and numbers
- Suggest specific interventions
- Identify patterns and trends
- Prioritize critical issues`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-10),
      { role: 'user', content: message || 'Give me a status overview' }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', errText);
      return buildResponse(`📊 **Fallback Mode** (OpenAI temporarily unavailable)

**Students:** ${students.length} | At-Risk: ${atRiskStudents.length} | Alerts: ${unreadAlerts.length}

${atRiskStudents.length > 0 ? `**Priority:**\n${atRiskStudents.slice(0, 3).map(s => `• ${s.name}: ${s.risk_score}% risk`).join('\n')}` : '✅ No critical issues'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Unable to generate response';

    return buildResponse(aiResponse);
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({ 
        response: `System operational. Error details: ${error.message}. Please try again.`,
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
