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
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_KEY') ?? ''
    );

    // Fetch relevant data from database
    const [studentsRes, alertsRes, programsRes] = await Promise.all([
      supabaseClient.from('students').select('id, name, email, stage, engagement_score, risk_score').limit(100),
      supabaseClient.from('ai_alerts').select('*').eq('read', false).limit(20),
      supabaseClient.from('programs').select('id, name, department, enrolled, capacity').limit(20)
    ]);

    const students = studentsRes.data || [];
    const alerts = alertsRes.data || [];
    const programs = programsRes.data || [];

    const atRiskStudents = students.filter(s => s.risk_score >= 70);
    const lowEngagementStudents = students.filter(s => s.engagement_score < 40);

    const systemContext = `You are an AI assistant for the WorldLynk University Admin Portal - a student lifecycle management system.

Current Database State:
- Total Students: ${students.length}
- At-Risk Students (risk >= 70): ${atRiskStudents.length}
- Low Engagement Students (engagement < 40): ${lowEngagementStudents.length}
- Active Alerts: ${alerts.length}
- Programs: ${programs.length}

Student Summary:
${students.slice(0, 10).map(s => `- ${s.name}: Stage=${s.stage}, Engagement=${s.engagement_score}, Risk=${s.risk_score}`).join('\n')}

Alert Summary:
${alerts.slice(0, 5).map(a => `- ${a.severity.toUpperCase()}: ${a.title}`).join('\n')}

Programs:
${programs.map(p => `- ${p.name}: ${p.enrolled}/${p.capacity} enrolled`).join('\n')}

You can help users:
1. Get insights about students and their status
2. Identify at-risk students
3. Suggest interventions
4. Answer questions about the system
5. Provide recommendations based on data

When users ask to take actions, provide clear instructions on how to do it in the UI, or confirm the action if it's something that can be automated.

Be concise, helpful, and data-driven in your responses.`;

    const messages = [
      { role: 'system', content: systemContext },
      ...(conversationHistory || []).slice(-10),
      { role: 'user', content: message }
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Check if the response suggests an action
    const actionSuggested = aiResponse.toLowerCase().includes('action:') || 
                          aiResponse.toLowerCase().includes('recommend:');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        actionSuggested,
        context: {
          totalStudents: students.length,
          atRisk: atRiskStudents.length,
          alerts: alerts.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in AI chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
