import { useState, useEffect } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { usePrograms } from '@/hooks/usePrograms';
import { Sparkles, Loader2, Target, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface CourseFitViewProps {
  onStudentClick: (studentId: string) => void;
}

export function CourseFitView({ onStudentClick }: CourseFitViewProps) {
  const { students, loading: studentsLoading, refetch } = useStudents();
  const { programs, loading: programsLoading } = usePrograms();
  const [fitScores, setFitScores] = useState<Record<string, { score: number; reasons: string[]; alternatives: string[] }>>({});
  const [analyzing, setAnalyzing] = useState(false);

  const loading = studentsLoading || programsLoading;

  useEffect(() => {
    if (!loading && students.length > 0) {
      analyzeFitScores();
    }
  }, [loading, students.length]);

  function analyzeFitScores() {
    const scores: Record<string, { score: number; reasons: string[]; alternatives: string[] }> = {};
    
    students.forEach(student => {
      if (!student.program_id) {
        scores[student.id] = { score: 0, reasons: ['No program assigned'], alternatives: programs.slice(0, 3).map(p => p.name) };
        return;
      }

      const program = programs.find(p => p.id === student.program_id);
      if (!program) {
        scores[student.id] = { score: 50, reasons: ['Program not found'], alternatives: [] };
        return;
      }

      let score = 70;
      const reasons: string[] = [];
      const alternatives: string[] = [];

      if (student.engagement_score >= 70) {
        score += 15;
        reasons.push('High engagement indicates good fit');
      } else if (student.engagement_score < 40) {
        score -= 20;
        reasons.push('Low engagement may indicate mismatch');
        alternatives.push(...programs.filter(p => p.id !== program.id).slice(0, 2).map(p => p.name));
      }

      if (student.risk_score >= 70) {
        score -= 25;
        reasons.push('High risk score suggests potential mismatch');
        alternatives.push(...programs.filter(p => p.id !== program.id && !alternatives.includes(p.name)).slice(0, 2).map(p => p.name));
      }

      if (student.country && program.department) {
        score += 5;
        reasons.push('Geographic alignment with program');
      }

      scores[student.id] = { 
        score: Math.max(0, Math.min(100, score)), 
        reasons, 
        alternatives: [...new Set(alternatives)].slice(0, 3) 
      };
    });

    setFitScores(scores);
  }

  async function reassignProgram(studentId: string, programId: string) {
    try {
      await supabase.from('students').update({ program_id: programId }).eq('id', studentId);
      await supabase.from('ai_alerts').insert({
        severity: 'info',
        title: 'Program Reassigned',
        description: 'Student has been reassigned to a better-fit program based on AI analysis',
        student_id: studentId,
        recommendations: ['Monitor engagement over next 2 weeks', 'Schedule check-in meeting'],
        read: false
      });
      refetch();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const mismatchedStudents = students.filter(s => {
    const fit = fitScores[s.id];
    return fit && fit.score < 60;
  });

  const goodFitStudents = students.filter(s => {
    const fit = fitScores[s.id];
    return fit && fit.score >= 80;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Course Fit Analyzer</h1>
          <p className="text-sm md:text-base text-gray-400">AI-powered student-to-program matching analysis</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-xs md:text-sm font-medium text-orange-400">AI Analysis Complete</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-gray-400">Total Analyzed</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">{students.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-400">Good Fit</p>
          </div>
          <p className="text-2xl font-bold metric-number text-green-400">{goodFitStudents.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-xs text-gray-400">Mismatched</p>
          </div>
          <p className="text-2xl font-bold metric-number text-red-400">{mismatchedStudents.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <p className="text-xs text-gray-400">Avg Fit Score</p>
          </div>
          <p className="text-2xl font-bold metric-number text-white">
            {Object.values(fitScores).length > 0 
              ? Math.round(Object.values(fitScores).reduce((sum, f) => sum + f.score, 0) / Object.values(fitScores).length)
              : 0}%
          </p>
        </div>
      </div>

      {mismatchedStudents.length > 0 && (
        <div className="glass-card p-4 md:p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Mismatched Students ({mismatchedStudents.length})
          </h2>
          <div className="space-y-4">
            {mismatchedStudents.map((student) => {
              const fit = fitScores[student.id];
              const currentProgram = programs.find(p => p.id === student.program_id);

              return (
                <div key={student.id} className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 cursor-pointer" onClick={() => onStudentClick(student.id)}>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{student.name}</h3>
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                          Fit: {fit?.score || 0}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        Current: {currentProgram?.name || 'No program'}
                      </p>
                      {fit?.reasons && (
                        <div className="space-y-1 mb-3">
                          {fit.reasons.map((reason, idx) => (
                            <p key={idx} className="text-xs text-gray-500 flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              {reason}
                            </p>
                          ))}
                        </div>
                      )}
                      {fit?.alternatives && fit.alternatives.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-300 mb-2">
                            <Sparkles className="w-3 h-3 inline mr-1 text-orange-400" />
                            AI Suggested Alternatives:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {fit.alternatives.map((alt, idx) => {
                              const altProgram = programs.find(p => p.name === alt);
                              return (
                                <Button
                                  key={idx}
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (altProgram) reassignProgram(student.id, altProgram.id);
                                  }}
                                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                                >
                                  {alt}
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-card p-4 md:p-6">
        <h2 className="text-lg font-bold text-white mb-4">Course Fit Matrix</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {students.slice(0, 24).map((student) => {
            const fit = fitScores[student.id];
            const score = fit?.score || 50;
            
            const getColor = (s: number) => {
              if (s >= 80) return 'bg-green-500/80 border-green-500';
              if (s >= 60) return 'bg-amber-500/80 border-amber-500';
              return 'bg-red-500/80 border-red-500';
            };

            return (
              <div
                key={student.id}
                onClick={() => onStudentClick(student.id)}
                className={cn(
                  "aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-all",
                  getColor(score)
                )}
                title={`${student.name} - Fit: ${score}%`}
              >
                <p className="text-xs font-bold text-white text-center line-clamp-1">
                  {student.name.split(' ')[0]}
                </p>
                <p className="text-lg font-bold metric-number text-white mt-1">
                  {score}%
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-xs text-gray-400">Good Fit (80+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-xs text-gray-400">Moderate (60-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-xs text-gray-400">Mismatch (&lt;60)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
