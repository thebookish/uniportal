import { supabase } from './supabase';

export async function analyzeStudentRisk(studentId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('supabase-functions-analyze-student-risk', {
      body: { studentId }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error analyzing student risk:', error);
    throw error;
  }
}

export async function generateRecommendations(studentId: string, context?: string) {
  try {
    const { data, error } = await supabase.functions.invoke('supabase-functions-generate-recommendations', {
      body: { studentId, context }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

export async function runBatchAnalysis() {
  try {
    const { data, error } = await supabase.functions.invoke('supabase-functions-batch-analyze-students', {});

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error running batch analysis:', error);
    throw error;
  }
}

export async function getAIStatus() {
  try {
    const { data: alerts, error } = await supabase
      .from('ai_alerts')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    const lastAnalysis = alerts && alerts.length > 0 
      ? new Date(alerts[0].created_at) 
      : null;

    return {
      isActive: true,
      lastAnalysis,
      accuracy: 92,
      totalAnalyzed: studentCount || 0
    };
  } catch (error) {
    console.error('Error getting AI status:', error);
    return {
      isActive: false,
      lastAnalysis: null,
      accuracy: 0,
      totalAnalyzed: 0
    };
  }
}
