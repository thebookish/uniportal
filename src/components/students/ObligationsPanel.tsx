import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, FileText, DollarSign, GraduationCap, Calendar, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface ObligationsPanelProps {
  student: any;
}

type Obligation = {
  id: string;
  name: string;
  requirement: string;
  current_value: string | null;
  status: 'met' | 'warning' | 'breach';
  consequence: string | null;
  due_date: string | null;
};

export function ObligationsPanel({ student }: ObligationsPanelProps) {
  const [dbObligations, setDbObligations] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObligations();
  }, [student.id]);

  async function fetchObligations() {
    try {
      const { data } = await supabase
        .from('obligations')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: true });
      
      if (data && data.length > 0) {
        setDbObligations(data);
      }
    } catch (error) {
      console.error('Error fetching obligations:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate dynamic obligations based on student data
  const attendanceRate = Math.max(0, 100 - (student.risk_score || 0));
  const attendanceStatus = attendanceRate >= 80 ? 'met' : attendanceRate >= 60 ? 'warning' : 'breach';
  
  const daysSinceActivity = Math.floor((Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24));
  const visaCheckDue = new Date(Date.now() + (30 - daysSinceActivity) * 24 * 60 * 60 * 1000);
  const visaStatus = daysSinceActivity < 14 ? 'met' : daysSinceActivity < 21 ? 'warning' : 'breach';

  const feeStatus = student.engagement_score >= 50 ? 'met' : student.engagement_score >= 30 ? 'warning' : 'breach';
  const academicStatus = student.risk_score < 40 ? 'met' : student.risk_score < 70 ? 'warning' : 'breach';

  // Default obligations calculated from student data
  const calculatedObligations = [
    {
      name: 'Attendance Requirement',
      requirement: '≥ 80%',
      current: `${attendanceRate}%`,
      status: attendanceStatus as 'met' | 'warning' | 'breach',
      icon: Calendar,
      consequence: 'Visa cancellation risk'
    },
    {
      name: 'Visa Check-in',
      requirement: 'Every 30 days',
      current: visaCheckDue.toLocaleDateString(),
      status: visaStatus as 'met' | 'warning' | 'breach',
      icon: FileText,
      consequence: 'Immigration compliance breach'
    },
    {
      name: 'Fee Payment',
      requirement: 'Current',
      current: feeStatus === 'met' ? 'Paid' : feeStatus === 'warning' ? 'Due Soon' : 'Overdue',
      status: feeStatus as 'met' | 'warning' | 'breach',
      icon: DollarSign,
      consequence: 'Enrollment suspension'
    },
    {
      name: 'Academic Progress',
      requirement: 'Satisfactory',
      current: academicStatus === 'met' ? 'On Track' : academicStatus === 'warning' ? 'At Risk' : 'Failing',
      status: academicStatus as 'met' | 'warning' | 'breach',
      icon: GraduationCap,
      consequence: 'Academic probation'
    }
  ];

  // Use DB obligations if available, otherwise use calculated ones
  const obligations = dbObligations.length > 0 
    ? dbObligations.map(o => ({
        name: o.name,
        requirement: o.requirement,
        current: o.current_value || 'N/A',
        status: o.status,
        icon: o.name.toLowerCase().includes('attendance') ? Calendar : 
              o.name.toLowerCase().includes('visa') ? FileText :
              o.name.toLowerCase().includes('fee') ? DollarSign : GraduationCap,
        consequence: o.consequence || 'N/A'
      }))
    : calculatedObligations;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'met': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'breach': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'met': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'warning': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'breach': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return '';
    }
  };

  const breachCount = obligations.filter(o => o.status === 'breach').length;
  const warningCount = obligations.filter(o => o.status === 'warning').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-400" />
          Active Obligations
        </h3>
        <div className="flex items-center gap-2">
          {breachCount > 0 && (
            <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
              {breachCount} Breach
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
              {warningCount} Warning
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {obligations.map((obligation, index) => {
          const Icon = obligation.icon;
          return (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border",
                obligation.status === 'breach' ? "bg-red-500/5 border-red-500/20" :
                obligation.status === 'warning' ? "bg-amber-500/5 border-amber-500/20" :
                "bg-white/5 border-white/10"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    obligation.status === 'met' ? "bg-green-500/10" :
                    obligation.status === 'warning' ? "bg-amber-500/10" :
                    "bg-red-500/10"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      obligation.status === 'met' ? "text-green-400" :
                      obligation.status === 'warning' ? "text-amber-400" :
                      "text-red-400"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{obligation.name}</p>
                    <p className="text-xs text-gray-400">
                      Required: {obligation.requirement} • Current: {obligation.current}
                    </p>
                    {obligation.status !== 'met' && (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ {obligation.consequence}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusIcon(obligation.status)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
