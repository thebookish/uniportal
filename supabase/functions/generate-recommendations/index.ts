import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateFallbackRecommendations(student: any): string[] {
  const recommendations: string[] = [];
  
  if ((student.engagement_score || 0) < 30) {
    recommendations.push('Schedule immediate one-on-one meeting with student');
    recommendations.push('Review and simplify current task load');
  } else if ((student.engagement_score || 0) < 50) {
    recommendations.push('Send personalized check-in message');
    recommendations.push('Offer additional support resources');
  }
  
  if ((student.risk_score || 0) >= 70) {
    recommendations.push('Assign dedicated counselor for intensive support');
    recommendations.push('Create weekly progress check-ins');
  } else if ((student.risk_score || 0) >= 40) {
    recommendations.push('Monitor activity and engagement closely');
  }
  
  if (student.stage === 'onboarding') {
    recommendations.push('Verify all onboarding tasks are clearly communicated');
    recommendations.push('Provide orientation session recording');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue current engagement strategy');
    recommendations.push('Schedule quarterly progress review');
  }
  
  return recommendations.slice(0, 5);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: true, recommendations: ['Review student engagement', 'Schedule follow-up meeting', 'Send personalized check-in'], ai_powered: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { studentId, context } = body;

    if (!studentId) {
      return new Response(
        JSON.stringify({ success: false, recommendations: ['Student ID required'], error: 'Missing studentId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: student, error } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error || !student) {
      return new Response(
        JSON.stringify({ success: false, recommendations: ['Student not found'], error: error?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openaiKey) {
      const recommendations = generateFallbackRecommendations(student);
      return new Response(
        JSON.stringify({ success: true, recommendations, ai_powered: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const prompt = `Generate 3-5 specific, actionable recommendations for university staff to help this student succeed.

Student: ${student.name}
Stage: ${student.stage}
Engagement: ${student.engagement_score || 0}/100
Risk Score: ${student.risk_score || 0}/100
Country: ${student.country || 'Unknown'}
Context: ${context || 'General support'}

Return ONLY a JSON array of strings, like: ["recommendation 1", "recommendation 2"]`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an AI academic advisor. Return only valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 400,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const aiResult = await response.json();
      const content = aiResult.choices?.[0]?.message?.content || '{"recommendations":[]}';
      const parsed = JSON.parse(content);
      const recommendations = parsed.recommendations || parsed || generateFallbackRecommendations(student);

      return new Response(
        JSON.stringify({ success: true, recommendations: Array.isArray(recommendations) ? recommendations : [recommendations], ai_powered: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (aiError) {
      console.error('AI error:', aiError);
      const recommendations = generateFallbackRecommendations(student);
      return new Response(
        JSON.stringify({ success: true, recommendations, ai_powered: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, recommendations: ['Unable to generate recommendations'], error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
