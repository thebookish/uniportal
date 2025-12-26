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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const { studentId } = await req.json();

    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)
    );

    let riskScore = 0;
    let severity: 'critical' | 'warning' | 'info' = 'info';
    let recommendations: string[] = [];
    let reasoning = '';

    if (openaiKey) {
      try {
        const prompt = `Analyze this student's dropout risk and return JSON only:
- Name: ${student.name}
- Engagement: ${student.engagement_score}/100
- Days Inactive: ${daysSinceActivity}
- Stage: ${student.stage}

Return: {"riskScore": <0-100>, "severity": "<critical|warning|info>", "recommendations": ["<action1>", "<action2>"], "reasoning": "<brief>"}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Analyze student dropout risk. Return only valid JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const result = JSON.parse(data.choices[0].message.content);
          riskScore = Math.min(100, Math.max(0, result.riskScore));
          severity = result.severity;
          recommendations = result.recommendations || [];
          reasoning = result.reasoning || '';
        }
      } catch (aiError) {
        console.error('OpenAI error:', aiError);
      }
    }

    if (recommendations.length === 0) {
      if (student.engagement_score < 30) {
        riskScore += 40;
        recommendations.push('Schedule immediate intervention meeting');
      } else if (student.engagement_score < 50) {
        riskScore += 20;
        recommendations.push('Send engagement check-in message');
      }

      if (daysSinceActivity > 7) {
        riskScore += 30;
        recommendations.push('Contact student about inactivity');
      } else if (daysSinceActivity > 3) {
        riskScore += 15;
      }

      if (student.stage === 'onboarding') {
        riskScore += 10;
        recommendations.push('Ensure onboarding tasks are completed');
      }

      if (riskScore >= 70) {
        severity = 'critical';
        recommendations.push('Assign dedicated counselor support');
      } else if (riskScore >= 40) {
        severity = 'warning';
      }

      reasoning = `Engagement ${student.engagement_score}/100, ${daysSinceActivity} days inactive`;
    }

    await supabaseClient
      .from('students')
      .update({ risk_score: riskScore })
      .eq('id', studentId);

    if (riskScore >= 40 && recommendations.length > 0) {
      const { data: existingAlert } = await supabaseClient
        .from('ai_alerts')
        .select('id')
        .eq('student_id', studentId)
        .eq('read', false)
        .maybeSingle();

      if (!existingAlert) {
        await supabaseClient.from('ai_alerts').insert({
          severity,
          title: riskScore >= 70 ? 'High Dropout Risk Detected' : 'Student Needs Attention',
          description: `${student.name}: ${reasoning}`,
          student_id: studentId,
          recommendations,
          read: false
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        risk_score: riskScore, 
        severity, 
        recommendations,
        reasoning,
        student_name: student.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
