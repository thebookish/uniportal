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
    const { message, conversationHistory } = await req.json();
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Database configuration missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const [studentsRes, alertsRes, programsRes] = await Promise.all([
      supabaseClient.from('students').select('id, name, email, stage, engagement_score, risk_score, country, last_activity'),
      supabaseClient.from('ai_alerts').select('*').eq('read', false).order('created_at', { ascending: false }).limit(20),
      supabaseClient.from('programs').select('id, name, department, enrolled, capacity')
    ]);

    const students = studentsRes.data || [];
    const alerts = alertsRes.data || [];
    const programs = programsRes.data || [];

    const atRiskStudents = students.filter(s => s.risk_score >= 70);
    const warningStudents = students.filter(s => s.risk_score >= 40 && s.risk_score < 70);
    const lowEngagement = students.filter(s => s.engagement_score < 40);

    const stageCount = students.reduce((acc: any, s) => {
      acc[s.stage] = (acc[s.stage] || 0) + 1;
      return acc;
    }, {});

    if (!openaiKey) {
      const fallbackResponse = `📊 **Current Data Summary**

**Students:** ${students.length} total
- 🔴 Critical Risk: ${atRiskStudents.length}
- 🟡 Warning: ${warningStudents.length}
- Low Engagement: ${lowEngagement.length}

**Stages:** ${Object.entries(stageCount).map(([k, v]) => `${k}: ${v}`).join(', ')}

**Alerts:** ${alerts.length} active

**Programs:** ${programs.length} (${programs.reduce((s, p) => s + p.enrolled, 0)} enrolled)

${atRiskStudents.length > 0 ? `\n⚠️ **At-Risk Students:**\n${atRiskStudents.slice(0, 3).map(s => `- ${s.name}: Risk ${s.risk_score}%`).join('\n')}` : ''}

*Note: Full AI analysis requires OpenAI API key.*`;

      return new Response(
        JSON.stringify({ response: fallbackResponse, context: { totalStudents: students.length, atRisk: atRiskStudents.length, alerts: alerts.length } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemContext = `You are an AI assistant for WorldLynk University Admin Portal.

LIVE DATABASE:
- Students: ${students.length} | At-Risk: ${atRiskStudents.length} | Warning: ${warningStudents.length}
- Alerts: ${alerts.length} active | Programs: ${programs.length}
- Stages: ${Object.entries(stageCount).map(([k, v]) => `${k}=${v}`).join(', ')}

AT-RISK (Top 5):
${atRiskStudents.slice(0, 5).map(s => `${s.name}: Risk=${s.risk_score}%, Eng=${s.engagement_score}%, Stage=${s.stage}`).join('\n') || 'None'}

ALERTS:
${alerts.slice(0, 3).map(a => `[${a.severity}] ${a.title}`).join('\n') || 'None'}

PROGRAMS:
${programs.slice(0, 5).map(p => `${p.name}: ${p.enrolled}/${p.capacity}`).join('\n')}

Be concise, data-driven, reference actual numbers. Help with insights, interventions, and recommendations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContext },
          ...(conversationHistory || []).slice(-10),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', errText);
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        context: { totalStudents: students.length, atRisk: atRiskStudents.length, alerts: alerts.length }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
