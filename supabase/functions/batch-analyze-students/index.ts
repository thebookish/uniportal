import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function analyzeWithOpenAI(student: any, openaiKey: string): Promise<{
  riskScore: number;
  severity: 'critical' | 'warning' | 'info';
  recommendations: string[];
  reasoning: string;
}> {
  try {
    const daysSinceActivity = Math.floor((Date.now() - new Date(student.last_activity || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
    
    const prompt = `Analyze student dropout risk. Return JSON only.

Student: ${student.name}
Engagement: ${student.engagement_score || 0}/100
Risk: ${student.risk_score || 0}/100
Stage: ${student.stage}
Days Inactive: ${daysSinceActivity}

Return: {"riskScore": <0-100>, "severity": "<critical|warning|info>", "recommendations": ["action1", "action2"], "reasoning": "brief"}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Analyze student risk. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    
    return {
      riskScore: Math.min(100, Math.max(0, result.riskScore || 0)),
      severity: result.severity || 'info',
      recommendations: result.recommendations || [],
      reasoning: result.reasoning || `Engagement ${student.engagement_score || 0}%, ${daysSinceActivity} days inactive`
    };
  } catch (error) {
    console.error('OpenAI fallback:', error);
    return fallbackAnalysis(student);
  }
}

function fallbackAnalysis(student: any): {
  riskScore: number;
  severity: 'critical' | 'warning' | 'info';
  recommendations: string[];
  reasoning: string;
} {
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)
  );

  let riskScore = 0;
  const recommendations: string[] = [];

  if (student.engagement_score < 30) {
    riskScore += 40;
    recommendations.push('Schedule immediate intervention meeting');
  } else if (student.engagement_score < 50) {
    riskScore += 20;
    recommendations.push('Send engagement check-in message');
  }

  if (daysSinceActivity > 7) {
    riskScore += 30;
    recommendations.push('Contact student about extended inactivity');
  } else if (daysSinceActivity > 3) {
    riskScore += 15;
    recommendations.push('Monitor activity closely');
  }

  if (student.stage === 'onboarding') {
    riskScore += 10;
    recommendations.push('Ensure onboarding tasks are completed');
  }

  let severity: 'critical' | 'warning' | 'info' = 'info';
  if (riskScore >= 70) {
    severity = 'critical';
    recommendations.push('Assign dedicated counselor support immediately');
  } else if (riskScore >= 40) {
    severity = 'warning';
  }

  return {
    riskScore,
    severity,
    recommendations,
    reasoning: `Calculated based on engagement score (${student.engagement_score}) and inactivity (${daysSinceActivity} days)`
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database configuration missing', analyzed: 0, analyses: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const { data: students, error: studentsError } = await supabaseClient
      .from('students')
      .select('*');

    if (studentsError) {
      return new Response(
        JSON.stringify({ success: false, error: studentsError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analyses = [];

    for (const student of students || []) {
      try {
        const analysis = openaiKey 
          ? await analyzeWithOpenAI(student, openaiKey)
          : fallbackAnalysis(student);

        await supabaseClient
          .from('students')
          .update({ risk_score: analysis.riskScore })
          .eq('id', student.id);

        if (analysis.riskScore >= 40 && analysis.recommendations.length > 0) {
          const { data: existingAlert } = await supabaseClient
            .from('ai_alerts')
            .select('id')
            .eq('student_id', student.id)
            .eq('read', false)
            .maybeSingle();

          if (!existingAlert) {
            await supabaseClient.from('ai_alerts').insert({
              severity: analysis.severity,
              title: analysis.riskScore >= 70 ? 'High Dropout Risk Detected' : 'Student Needs Attention',
              description: `${student.name}: ${analysis.reasoning}`,
              student_id: student.id,
              recommendations: analysis.recommendations,
              read: false
            });
          }
        }

        analyses.push({
          student_id: student.id,
          student_name: student.name,
          risk_score: analysis.riskScore,
          severity: analysis.severity,
          recommendations: analysis.recommendations,
          reasoning: analysis.reasoning
        });
      } catch (studentError) {
        console.error(`Error analyzing ${student.name}:`, studentError);
        analyses.push({
          student_id: student.id,
          student_name: student.name,
          risk_score: student.risk_score || 0,
          severity: 'info',
          recommendations: [],
          reasoning: 'Analysis skipped due to error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analyzed: analyses.length, 
        analyses,
        aiEnabled: !!openaiKey,
        message: `Analyzed ${analyses.length} students${openaiKey ? ' with AI' : ' (fallback mode)'}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Batch analysis error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Analysis failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
