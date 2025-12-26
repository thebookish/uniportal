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
    const prompt = `Analyze this student's risk of dropout and provide recommendations.

Student Data:
- Name: ${student.name}
- Engagement Score: ${student.engagement_score}/100
- Current Risk Score: ${student.risk_score}/100
- Stage: ${student.stage}
- Last Activity: ${student.last_activity}
- Days Since Activity: ${Math.floor((Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24))}

Analyze and respond in JSON format:
{
  "riskScore": <number 0-100>,
  "severity": "<critical|warning|info>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "reasoning": "<brief explanation>"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an AI analyst for a university student success platform. Analyze student data and provide risk assessments.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      riskScore: Math.min(100, Math.max(0, result.riskScore)),
      severity: result.severity,
      recommendations: result.recommendations || [],
      reasoning: result.reasoning || ''
    };
  } catch (error) {
    console.error('OpenAI analysis failed, using fallback:', error);
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_KEY') ?? ''
    );

    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const { data: students, error: studentsError } = await supabaseClient
      .from('students')
      .select('*')
      .in('stage', ['active', 'enrollment', 'onboarding', 'lead', 'application', 'offer', 'acceptance']);

    if (studentsError) throw studentsError;

    const analyses = [];

    for (const student of students || []) {
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
        risk_score: analysis.riskScore,
        severity: analysis.severity,
        recommendations: analysis.recommendations,
        reasoning: analysis.reasoning
      });
    }

    return new Response(
      JSON.stringify({ success: true, analyzed: analyses.length, analyses, aiEnabled: !!openaiKey }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
