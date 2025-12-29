import { useStudents } from '@/hooks/useStudents';
import { AlertTriangle, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TopPriorityTodayProps {
  onStudentClick: (studentId: string) => void;
}

export function TopPriorityToday({ onStudentClick }: TopPriorityTodayProps) {
  const { students } = useStudents();

  const priorityStudents = students
    .filter(s => s.risk_score >= 60 || s.engagement_score < 40)
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5)
    .map(student => {
      const daysSinceActivity = Math.floor((Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilBreach = Math.max(1, 14 - daysSinceActivity);
      
      let riskType = 'Engagement Risk';
      let consequence = 'Academic warning in ' + daysUntilBreach + ' days';
      let action = 'Schedule check-in meeting';
      
      if (student.risk_score >= 80) {
        riskType = 'Attendance Breach Risk';
        consequence = 'Visa escalation in ' + daysUntilBreach + ' days';
        action = 'Initiate urgent intervention';
      } else if (student.risk_score >= 70) {
        riskType = 'Compliance Risk';
        consequence = 'Compliance breach in ' + daysUntilBreach + ' days';
        action = 'Review obligations status';
      } else if (student.engagement_score < 30) {
        riskType = 'Disengagement Risk';
        consequence = 'Dropout risk in ' + (daysUntilBreach + 7) + ' days';
        action = 'Assign peer mentor';
      }

      return {
        ...student,
        riskType,
        consequence,
        action,
        daysUntilBreach
      };
    });

  if (priorityStudents.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-4 md:p-6 mb-4 md:mb-6 border border-red-500/20">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <h2 className="text-lg font-bold text-white">Top Priority Today</h2>
        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs ml-2">
          {priorityStudents.length} Urgent
        </Badge>
      </div>

      <div className="space-y-3">
        {priorityStudents.map((student) => (
          <div
            key={student.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => onStudentClick(student.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-medium text-white text-sm sm:text-base truncate">{student.name}</span>
                <Badge className={cn(
                  "text-[10px] sm:text-xs",
                  student.risk_score >= 80 ? "bg-red-500/10 text-red-400 border-red-500/30" :
                  student.risk_score >= 70 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                  "bg-blue-500/10 text-blue-400 border-blue-500/30"
                )}>
                  {student.riskType}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-[10px] sm:text-xs text-gray-400">
                <span className="flex items-center gap-1 text-red-400">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{student.consequence}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[10px] sm:text-xs text-orange-400 hidden sm:block">{student.action}</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
