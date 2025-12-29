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

    // Calculate additional insights
    const conversionRate = students.length > 0 
      ? ((students.filter(s => s.stage === 'active' || s.stage === 'enrollment').length / students.length) * 100).toFixed(1)
      : 0;
    
    const avgEngagement = students.length > 0
      ? (students.reduce((sum, s) => sum + (s.engagement_score || 0), 0) / students.length).toFixed(1)
      : 0;

    const avgRisk = students.length > 0
      ? (students.reduce((sum, s) => sum + (s.risk_score || 0), 0) / students.length).toFixed(1)
      : 0;

    const countryDistribution = students.reduce((acc: any, s) => {
      const country = s.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    const topCountries = Object.entries(countryDistribution)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);

    const recentActivity = students
      .filter(s => s.last_activity)
      .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime())
      .slice(0, 5);

    const systemPrompt = `You are an expert AI CONSULTANT for WorldLynk University Admin Portal - acting as a strategic advisor for student success and enrollment optimization. You have REAL-TIME ACCESS to the complete database.

YOUR ROLE:
==========
- Proactive advisor providing actionable insights
- Risk analyst predicting and preventing dropouts  
- Enrollment strategist optimizing conversion funnels
- Student success optimizer recommending interventions
- Data analyst identifying patterns and trends

LIVE DATABASE STATE (REAL-TIME):
================================
📊 STUDENT OVERVIEW: ${students.length} total students
   • Critical Risk (≥70%): ${atRiskStudents.length} students
   • Warning (40-69%): ${warningStudents.length} students  
   • Low Engagement (<40): ${lowEngagement.length} students
   • Average Engagement Score: ${avgEngagement}%
   • Average Risk Score: ${avgRisk}%
   • Conversion Rate: ${conversionRate}%

📈 FUNNEL DISTRIBUTION:
${Object.entries(stageCount).map(([stage, count]) => `   • ${stage}: ${count} (${((count as number)/Math.max(students.length,1)*100).toFixed(0)}%)`).join('\n')}

🎓 PROGRAMS (${programs.length} total):
${programs.slice(0, 8).map(p => `   • ${p.name}: ${p.enrolled || 0}/${p.capacity || 0} (${Math.round(((p.enrolled || 0)/(p.capacity || 1))*100)}% capacity)`).join('\n')}

👥 COUNSELOR WORKLOAD:
${counselors.map(c => {
  const assigned = students.filter(s => s.counselor_id === c.id).length;
  const atRisk = students.filter(s => s.counselor_id === c.id && (s.risk_score || 0) >= 70).length;
  return `   • ${c.name}: ${assigned} students (${atRisk} at-risk)`;
}).join('\n') || '   No counselors assigned'}

🚨 ACTIVE ALERTS (${unreadAlerts.length} unread):
${unreadAlerts.slice(0, 5).map(a => `   • [${(a.severity || 'INFO').toUpperCase()}] ${a.title}`).join('\n') || '   No active alerts'}

⚠️ PRIORITY STUDENTS (Highest Risk):
${atRiskStudents.slice(0, 8).map(s => `   • ${s.name}: Risk ${s.risk_score}%, Engagement ${s.engagement_score}%, Stage: ${s.stage}`).join('\n') || '   None identified'}

🌍 GEOGRAPHIC DISTRIBUTION:
${topCountries.map(([country, count]) => `   • ${country}: ${count} students`).join('\n')}

📋 ONBOARDING: ${tasks.filter(t => t.status === 'completed').length}/${tasks.length} tasks completed

CONSULTANT GUIDELINES:
=====================
1. Always provide SPECIFIC, ACTIONABLE recommendations
2. Reference EXACT numbers and student names when relevant
3. Prioritize URGENT issues (critical risk students first)
4. Suggest INTERVENTIONS with expected outcomes
5. Identify PATTERNS and trends proactively
6. Consider WORKLOAD balance when recommending assignments
7. Track CONVERSION funnel bottlenecks
8. Recommend PROACTIVE outreach before issues escalate
9. Use emojis for visual clarity and urgency indicators
10. End responses with 2-3 immediate ACTION ITEMS

RESPONSE FORMAT:
- Start with a brief situation summary
- Provide detailed analysis with data
- Conclude with specific action items`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-10),
      { role: 'user', content: message || 'Give me a comprehensive status overview with recommendations' }
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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', errText);
      return buildResponse(`📊 **Consultant Mode** (Fallback Analysis)

**Current Status:**
• Total Students: ${students.length}
• At-Risk (≥70%): ${atRiskStudents.length}
• Warning (40-69%): ${warningStudents.length}
• Unread Alerts: ${unreadAlerts.length}

**Funnel Analysis:**
${Object.entries(stageCount).map(([k, v]) => `• ${k}: ${v}`).join('\n')}

${atRiskStudents.length > 0 ? `**⚠️ Immediate Priorities:**
${atRiskStudents.slice(0, 5).map(s => `• ${s.name}: ${s.risk_score}% risk, ${s.engagement_score}% engagement`).join('\n')}

**Recommended Actions:**
1. Contact high-risk students within 24 hours
2. Review engagement patterns for warning-level students
3. Schedule intervention meetings` : '✅ No critical students identified'}

*Full AI capabilities available with OpenAI configuration.*`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Unable to generate response';

    // Generate dynamic recommendations based on data
    const recommendations: string[] = [];
    if (atRiskStudents.length > 0) {
      recommendations.push(`Contact ${atRiskStudents.slice(0, 3).map(s => s.name).join(', ')} immediately`);
    }
    if (lowEngagement.length > 3) {
      recommendations.push(`Review ${lowEngagement.length} low-engagement students for intervention`);
    }
    if (unreadAlerts.length > 5) {
      recommendations.push(`Process ${unreadAlerts.length} pending alerts`);
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        context: { 
          totalStudents: students.length, 
          atRisk: atRiskStudents.length, 
          alerts: unreadAlerts.length,
          programs: programs.length,
          counselors: counselors.length
        },
        recommendations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
