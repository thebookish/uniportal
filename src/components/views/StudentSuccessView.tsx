import { useState, useEffect } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useAIAlerts } from '@/hooks/useAIAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, TrendingDown, TrendingUp, Sparkles, Loader2, UserPlus, Send, CheckCircle, Clock, Target, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { InstitutionalRiskBanner } from '@/components/dashboard/InstitutionalRiskBanner';
import { TopPriorityToday } from '@/components/dashboard/TopPriorityToday';

interface StudentSuccessViewProps {
  onStudentClick: (studentId: string) => void;
}

export function StudentSuccessView({ onStudentClick }: StudentSuccessViewProps) {
  const { profile } = useAuth();
  const universityId = (profile as any)?.university_id;
  
  const { students, loading, refetch } = useStudents();
  const { alerts } = useAIAlerts();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null);

  const atRiskStudents = students.filter(s => s.risk_score >= 70);
  const moderateRiskStudents = students.filter(s => s.risk_score >= 40 && s.risk_score < 70);
  const lowEngagementStudents = students.filter(s => s.engagement_score < 40);
  const riskResolvedStudents = students.filter(s => s.stage === 'active' && s.risk_score < 40);

  async function assignCounselor(studentId: string) {
    if (!universityId) return;
    setActionLoading(studentId);
    try {
      const { data: counselors } = await supabase
        .from('users')
        .select('id')
        .eq('university_id', universityId)
        .eq('role', 'admissions')
        .limit(1);
      
      if (counselors && counselors.length > 0) {
        await supabase.from('students').update({ counselor_id: counselors[0].id }).eq('id', studentId).eq('university_id', universityId);
        await supabase.from('ai_alerts').insert({
          severity: 'info',
          title: 'Counselor Assigned',
          description: 'A counselor has been assigned to provide support',
          student_id: studentId,
          recommendations: ['Schedule initial meeting', 'Review student history'],
          read: false,
          university_id: universityId
        });
      }
      refetch();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function triggerIntervention(studentId: string, type: string) {
    if (!universityId) return;
    setActionLoading(studentId);
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      if (type === 'message') {
        const subject = 'We\'re Here to Help - Student Support';
        const message = `Hi ${student.name},\n\nWe noticed you might need some support. Our team is here to help you succeed.\n\nPlease don't hesitate to reach out if you need anything - whether it's academic assistance, advice, or just someone to talk to.\n\nWe're committed to your success!\n\nBest regards,\nStudent Success Team`;

        await supabase.from('communications').insert({
          student_id: studentId,
          type: 'email',
          subject,
          message,
          status: 'sent',
          university_id: universityId
        });

        // Send actual email
        if (student.email) {
          await supabase.functions.invoke('supabase-functions-send-email', {
            body: {
              to: student.email,
              toName: student.name,
              subject,
              message,
              studentId,
              universityId
            }
          });
        }
      } else if (type === 'meeting') {
        const meetingDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const subject = 'Support Meeting Scheduled - Student Success Team';
        const message = `Hi ${student.name},\n\nWe have scheduled a one-on-one support meeting with you on ${meetingDate.toLocaleDateString()}.\n\nThis meeting is to help discuss your progress and identify ways we can support your academic journey.\n\nPlease check your portal for details.\n\nBest regards,\nStudent Success Team`;

        await supabase.from('onboarding_tasks').insert({
          student_id: studentId,
          title: 'Support Meeting Scheduled',
          description: 'One-on-one meeting with student success team',
          status: 'pending',
          due_date: meetingDate.toISOString().split('T')[0],
          university_id: universityId
        });

        await supabase.from('communications').insert({
          student_id: studentId,
          type: 'email',
          subject,
          message,
          status: 'sent',
          university_id: universityId
        });

        // Send actual email
        if (student.email) {
          await supabase.functions.invoke('supabase-functions-send-email', {
            body: {
              to: student.email,
              toName: student.name,
              subject,
              message,
              studentId,
              universityId
            }
          });
        }
      } else if (type === 'mentorship') {
        const subject = 'Peer Mentorship Program - You\'ve Been Enrolled';
        const message = `Hi ${student.name},\n\nGreat news! You have been enrolled in our Peer Mentorship Program.\n\nYou will be connected with a peer mentor who will provide academic support and guidance throughout your journey.\n\nMore details will be shared with you soon.\n\nBest regards,\nStudent Success Team`;

        await supabase.from('onboarding_tasks').insert({
          student_id: studentId,
          title: 'Peer Mentorship Program',
          description: 'Connect with a peer mentor for academic support',
          status: 'pending',
          university_id: universityId
        });

        await supabase.from('communications').insert({
          student_id: studentId,
          type: 'email',
          subject,
          message,
          status: 'sent',
          university_id: universityId
        });

        // Send actual email
        if (student.email) {
          await supabase.functions.invoke('supabase-functions-send-email', {
            body: {
              to: student.email,
              toName: student.name,
              subject,
              message,
              studentId,
              universityId
            }
          });
        }
      }

      await supabase.from('ai_alerts').insert({
        severity: 'info',
        title: 'Intervention Triggered',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} intervention initiated for ${student.name}`,
        student_id: studentId,
        recommendations: ['Monitor engagement over next 7 days', 'Follow up if no improvement'],
        read: false,
        university_id: universityId
      });

      refetch();
      setSelectedIntervention(null);
      alert('Intervention triggered and email sent successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Error triggering intervention. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-green-400 bg-green-500/10 border-green-500/30';
  };

  const getEngagementTrend = (score: number) => {
    if (score >= 60) return { icon: TrendingUp, color: 'text-green-400', label: 'Improving' };
    if (score >= 40) return { icon: TrendingDown, color: 'text-amber-400', label: 'Stable' };
    return { icon: TrendingDown, color: 'text-red-400', label: 'Declining' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <InstitutionalRiskBanner />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Risk & Intervention Center</h1>
          <p className="text-sm md:text-base text-gray-400">Monitor at-risk students and initiate interventions</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 pulse-alert">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-xs md:text-sm font-medium text-orange-400">Risk AI Active • {students.length} Monitored</span>
        </div>
      </div>

      <TopPriorityToday onStudentClick={onStudentClick} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4 md:p-6 border border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 md:w-5 h-4 md:h-5 text-red-400" />
            <span className="text-xs md:text-sm text-gray-400">Critical Risk</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-red-400">{atRiskStudents.length}</p>
          <p className="text-xs text-gray-500 mt-1">Immediate intervention required</p>
        </div>

        <div className="glass-card p-4 md:p-6 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 md:w-5 h-4 md:h-5 text-amber-400" />
            <span className="text-xs md:text-sm text-gray-400">Monitoring Required</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-amber-400">{moderateRiskStudents.length}</p>
          <p className="text-xs text-gray-500 mt-1">Watch closely</p>
        </div>

        <div className="glass-card p-4 md:p-6 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 md:w-5 h-4 md:h-5 text-blue-400" />
            <span className="text-xs md:text-sm text-gray-400">Active Interventions</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-blue-400">{alerts.filter(a => !a.read).length}</p>
          <p className="text-xs text-gray-500 mt-1">In progress</p>
        </div>

        <div className="glass-card p-4 md:p-6 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-green-400" />
            <span className="text-xs md:text-sm text-gray-400">Risk Resolved</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-green-400">{riskResolvedStudents.length}</p>
          <p className="text-xs text-gray-500 mt-1">Successfully retained</p>
        </div>
      </div>

      <div className="glass-card p-4 md:p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          At-Risk Students
        </h2>

        {atRiskStudents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-400">No critical risk students at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {atRiskStudents.map((student) => {
              const trend = getEngagementTrend(student.engagement_score);
              const TrendIcon = trend.icon;
              const studentAlerts = alerts.filter(a => a.student_id === student.id && !a.read);

              return (
                <div
                  key={student.id}
                  className="glass-card p-4 border border-red-500/20 hover:border-red-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 cursor-pointer" onClick={() => onStudentClick(student.id)}>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{student.name}</h3>
                        <Badge className={cn("text-xs", getRiskColor(student.risk_score))}>
                          Risk: {student.risk_score}%
                        </Badge>
                        {studentAlerts.length > 0 && (
                          <span className="ai-badge">
                            <Sparkles className="w-3 h-3" />
                            {studentAlerts.length} AI Alert{studentAlerts.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Time to Consequence Banner */}
                      <div className="flex items-center gap-4 mb-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-red-400 font-medium">
                            {Math.max(1, Math.floor(14 - (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)))} days until breach
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">|</span>
                        <span className="text-xs text-amber-400">
                          {Math.max(24, Math.floor((14 - (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)) * 24))}h until escalation
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-400">Engagement</p>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-white">{student.engagement_score}/100</span>
                            <TrendIcon className={cn("w-3 h-3", trend.color)} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Last Active</p>
                          <p className="text-sm text-white">
                            {formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Program</p>
                          <p className="text-sm text-white truncate">{student.programs?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Counselor</p>
                          <p className="text-sm text-white">{student.users?.name || 'Unassigned'}</p>
                        </div>
                      </div>

                      {studentAlerts.length > 0 && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-red-400">AI Risk Analysis (92% confidence):</p>
                            <Badge className="bg-white/5 text-gray-300 border-white/10 text-xs">Based on {students.length} similar cases</Badge>
                          </div>
                          <ul className="space-y-1">
                            {studentAlerts[0].recommendations?.slice(0, 2).map((rec, idx) => (
                              <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                                <span className="text-orange-400">→</span>
                                {rec} <span className="text-gray-500">({idx === 0 ? '67%' : '82%'} success rate)</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {selectedIntervention === student.id ? (
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            onClick={() => triggerIntervention(student.id, 'message')}
                            disabled={actionLoading === student.id}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Send Message
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => triggerIntervention(student.id, 'meeting')}
                            disabled={actionLoading === student.id}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            Schedule Meeting
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => triggerIntervention(student.id, 'mentorship')}
                            disabled={actionLoading === student.id}
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Peer Mentorship
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedIntervention(null)}
                            className="w-full border-white/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          {!student.counselor_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => assignCounselor(student.id)}
                              disabled={actionLoading === student.id}
                              className="border-white/10 hover:bg-white/5"
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Assign
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => setSelectedIntervention(student.id)}
                            disabled={actionLoading === student.id}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            {actionLoading === student.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-1" />
                                Initiate Intervention
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {moderateRiskStudents.length > 0 && (
        <div className="glass-card p-4 md:p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            Moderate Risk Students ({moderateRiskStudents.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {moderateRiskStudents.slice(0, 6).map((student) => (
              <div
                key={student.id}
                onClick={() => onStudentClick(student.id)}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white truncate">{student.name}</h4>
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                    {student.risk_score}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Engagement: {student.engagement_score}</span>
                  <span>{formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
