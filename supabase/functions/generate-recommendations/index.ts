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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_KEY') ?? ''
    );

    const { studentId, context } = await req.json();

    // Fetch student data with related info
    const { data: student, error } = await supabaseClient
      .from('students')
      .select(`
        *,
        programs(*),
        documents(*),
        ai_alerts(*)
      `)
      .eq('id', studentId)
      .single();

    if (error) throw error;

    // Generate personalized recommendations using OpenAI
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
            content: 'You are an AI academic advisor. Generate 3-5 specific, actionable recommendations for university staff to help this student succeed. Return as JSON array of strings.'
          },
          {
            role: 'user',
            content: `Student Profile:
            - Name: ${student.name}
            - Stage: ${student.stage}
            - Engagement: ${student.engagement_score}/100
            - Risk Score: ${student.risk_score}/100
            - Program: ${student.programs?.name || 'Not assigned'}
            - Pending Documents: ${student.documents?.filter((d: any) => d.status === 'pending').length || 0}
            - Context: ${context || 'General recommendations'}
            
            Generate specific recommendations for university staff.`
          }
        ],
        temperature: 0.8,
        max_tokens: 400
      })
    });

    const aiResult = await openaiResponse.json();
    const recommendations = JSON.parse(aiResult.choices[0].message.content);

    return new Response(
      JSON.stringify({ success: true, recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
