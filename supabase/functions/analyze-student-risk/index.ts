import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentData {
  id: string;
  engagement_score: number;
  last_activity: string;
  stage: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_KEY') ?? ''
    );

    const { studentId } = await req.json();

    // Fetch student data
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Calculate risk score using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI that analyzes student data to predict dropout risk. Return a JSON object with risk_score (0-100), risk_level (low/moderate/high), and recommendations array.'
          },
          {
            role: 'user',
            content: `Analyze this student data and predict dropout risk:
            - Engagement Score: ${student.engagement_score}
            - Days Since Last Activity: ${Math.floor((Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24))}
            - Current Stage: ${student.stage}
            - Tags: ${student.tags?.join(', ') || 'none'}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const aiResult = await openaiResponse.json();
    const analysis = JSON.parse(aiResult.choices[0].message.content);

    // Update student risk score
    await supabaseClient
      .from('students')
      .update({ risk_score: analysis.risk_score })
      .eq('id', studentId);

    // Create AI alert if high risk
    if (analysis.risk_level === 'high') {
      await supabaseClient
        .from('ai_alerts')
        .insert({
          severity: 'critical',
          title: 'High Dropout Risk Detected',
          description: `${student.name} has ${analysis.risk_score}% probability of dropout`,
          student_id: studentId,
          recommendations: analysis.recommendations,
          read: false
        });
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
