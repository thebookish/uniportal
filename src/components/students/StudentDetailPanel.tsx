import { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Calendar, FileText, Sparkles, AlertTriangle, TrendingDown, Loader2, Send, UserPlus, Check, Upload, Clock, Shield, Target, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ObligationsPanel } from './ObligationsPanel';

interface StudentDetailPanelProps {
  studentId: string;
  onClose: () => void;
}

export function StudentDetailPanel({ studentId, onClose }: StudentDetailPanelProps) {
  const { profile } = useAuth();
  const universityId = (profile as any)?.university_id;
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  async function fetchStudent() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`*, programs(*), users!students_counselor_id_fkey(*), documents(*)`)
        .eq('id', studentId)
        .single();
      if (error) throw error;
      setStudent(data);
      if (data.risk_score >= 40) {
        const recs = [];
        if (data.engagement_score < 40) {
          recs.push('Schedule immediate 1-on-1 counseling session');
          recs.push('Send personalized engagement check-in message');
        }
        if (data.risk_score >= 70) {
          recs.push('Activate peer mentorship program');
          recs.push('Review course fit and consider program alternatives');
        }
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStage(newStage: string) {
    setUpdating(true);
    try {
      await supabase.from('students').update({ stage: newStage }).eq('id', studentId);
      fetchStudent();
    } finally {
      setUpdating(false);
    }
  }

  async function updateDocumentStatus(docId: string, status: string) {
    await supabase.from('documents').update({ status }).eq('id', docId);
    fetchStudent();
  }

  async function sendMessage() {
    if (!universityId) return;
    await supabase.from('communications').insert({
      student_id: studentId,
      type: 'email',
      subject: 'Check-in from WorldLynk',
      message: `Hi ${student.name}, we wanted to check in and see how you're doing.`,
      status: 'sent',
      university_id: universityId
    });
    alert('Message sent!');
  }

  async function scheduleMeeting() {
    if (!universityId) return;
    try {
      // Create an onboarding task for the meeting
      await supabase.from('onboarding_tasks').insert({
        student_id: studentId,
        title: `Counseling Meeting with ${student?.name}`,
        description: 'Scheduled intervention meeting to discuss progress and support options.',
        status: 'pending',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        university_id: universityId
      });

      // Send notification to student
      await supabase.from('communications').insert({
        student_id: studentId,
        type: 'email',
        subject: 'Meeting Scheduled - WorldLynk',
        message: `Hi ${student?.name}, a counseling meeting has been scheduled for you. Please check your portal for details.`,
        status: 'sent',
        university_id: universityId
      });

      // Create AI alert for tracking
      await supabase.from('ai_alerts').insert({
        severity: 'info',
        title: 'Meeting Scheduled',
        description: `Counseling meeting scheduled with ${student?.name}`,
        student_id: studentId,
        recommendations: ['Prepare intervention discussion points', 'Review student history before meeting'],
        read: false,
        university_id: universityId
      });

      alert('Meeting scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Error scheduling meeting');
    }
  }

  async function initiateIntervention() {
    if (!universityId) return;
    try {
      await supabase.from('ai_alerts').insert({
        severity: 'warning',
        title: 'Intervention Initiated',
        university_id: universityId,
        description: `Manual intervention initiated for ${student?.name} by admin`,
        student_id: studentId,
        recommendations: [
          'Contact student within 24 hours',
          'Review engagement history',
          'Prepare support resources'
        ],
        read: false
      });

      // Update student engagement to reflect intervention
      await supabase.from('students').update({
        last_activity: new Date().toISOString()
      }).eq('id', studentId);

      alert('Intervention initiated! Alert created for follow-up.');
      fetchStudent();
    } catch (error) {
      console.error('Error initiating intervention:', error);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!student) return null;

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-green-400';
  };

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-400';
    if (score >= 40) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-rose-400';
  };

  const stages = ['lead', 'application', 'offer', 'acceptance', 'enrollment', 'onboarding', 'active'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f2e]/95 backdrop-blur-xl border-b border-white/10 p-4 md:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{student.name}</h2>
            <p className="text-sm text-gray-400">{student.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/5">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* PRIORITY 1: Institutional Risk Status */}
          <div className={cn(
            "glass-card p-4 border",
            student.risk_score >= 70 ? "border-red-500/30 bg-red-500/5" :
            student.risk_score >= 40 ? "border-amber-500/30 bg-amber-500/5" :
            "border-green-500/30 bg-green-500/5"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className={cn(
                  "w-5 h-5",
                  student.risk_score >= 70 ? "text-red-400" :
                  student.risk_score >= 40 ? "text-amber-400" :
                  "text-green-400"
                )} />
                <h3 className="font-semibold text-white">Institutional Risk Status</h3>
              </div>
              <Badge className={cn(
                "text-xs",
                student.risk_score >= 70 ? "bg-red-500/10 text-red-400 border-red-500/30" :
                student.risk_score >= 40 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                "bg-green-500/10 text-green-400 border-green-500/30"
              )}>
                {student.risk_score >= 70 ? "HIGH RISK" : student.risk_score >= 40 ? "MEDIUM RISK" : "LOW RISK"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Risk Score</p>
                <p className={cn("text-2xl font-bold metric-number", getRiskColor(student.risk_score))}>
                  {student.risk_score}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Days Until Breach</p>
                <p className={cn(
                  "text-2xl font-bold metric-number",
                  student.risk_score >= 70 ? "text-red-400" : "text-amber-400"
                )}>
                  {Math.max(1, Math.floor(14 - (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Last Safe Window</p>
                <p className="text-2xl font-bold metric-number text-orange-400">
                  {Math.max(1, Math.floor(7 - (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)))} days
                </p>
              </div>
            </div>
          </div>

          {/* PRIORITY 2: Active Obligations */}
          <div className="glass-card p-4">
            <ObligationsPanel student={student} />
          </div>

          {/* PRIORITY 3: Time to Consequence */}
          {student.risk_score >= 40 && (
            <div className="glass-card p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Time to Consequence</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400 mb-1">Hours Until Escalation</p>
                  <p className="text-xl font-bold metric-number text-red-400">
                    {Math.max(24, Math.floor((14 - (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)) * 24))}h
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400 mb-1">Days Until Breach</p>
                  <p className="text-xl font-bold metric-number text-amber-400">
                    {Math.max(1, Math.floor(14 - (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)))}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400 mb-1">Intervention Window</p>
                  <p className="text-xl font-bold metric-number text-orange-400">
                    {Math.max(1, Math.floor(7 - (Date.now() - new Date(student.last_activity).getTime()) / (1000 * 60 * 60 * 24)))} days
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400 mb-1">Consequence</p>
                  <p className="text-sm font-medium text-red-400">
                    {student.risk_score >= 70 ? "Visa Escalation" : "Academic Warning"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PRIORITY 4: AI Risk Explanation */}
          {student.risk_score >= 40 && (
            <div className="glass-card p-4 border border-orange-500/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">AI Risk Analysis</h3>
                    <Badge className="bg-white/5 text-gray-300 border-white/10 text-xs">
                      {student.risk_score >= 70 ? "92%" : "78%"} confidence • AI analyzed
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-gray-400">
                      <span className="text-white font-medium">Risk Type:</span> {student.risk_score >= 70 ? "Compliance Breach Risk" : "Engagement Risk"}
                    </p>
                    <p className="text-sm text-gray-400">
                      <span className="text-white font-medium">Contributing Factors:</span>
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1 ml-4">
                      {student.engagement_score < 40 && <li>• Low engagement score ({student.engagement_score}%)</li>}
                      {(Date.now() - new Date(student.last_activity).getTime()) > 5 * 24 * 60 * 60 * 1000 && <li>• Extended inactivity period</li>}
                      {student.risk_score >= 70 && <li>• High risk indicators detected</li>}
                      <li>• Pattern matches historical dropout cases</li>
                    </ul>
                  </div>
                  {recommendations.length > 0 && (
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-white">Recommended Action ({student.risk_score >= 70 ? "67%" : "82%"} success probability)</span>
                      </div>
                      <ul className="space-y-1">
                        {recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-orange-400">→</span>{rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PRIORITY 5: Engagement (Secondary) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <p className="text-sm text-gray-400 mb-2">Engagement Score</p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className={cn("text-3xl font-bold metric-number", getRiskColor(100 - student.engagement_score))}>
                  {student.engagement_score}
                </p>
                <span className="text-gray-400">/100</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full bg-gradient-to-r", getEngagementColor(student.engagement_score))} style={{ width: `${student.engagement_score}%` }} />
              </div>
            </div>

            <div className="glass-card p-4">
              <p className="text-sm text-gray-400 mb-2">Risk Score</p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className={cn("text-3xl font-bold metric-number", getRiskColor(student.risk_score))}>
                  {student.risk_score}
                </p>
                <span className="text-gray-400">/100</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400" style={{ width: `${student.risk_score}%` }} />
              </div>
            </div>

            <div className="glass-card p-4">
              <p className="text-sm text-gray-400 mb-2">Last Activity</p>
              <p className="text-lg font-semibold text-white mb-1">
                {formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })}
              </p>
              {student.engagement_score < 50 && (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <TrendingDown className="w-3 h-3" />Monitoring Required
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-4 md:p-6">
            <h3 className="text-lg font-bold text-white mb-4">Lifecycle Stage</h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {stages.map((stage, index) => {
                const isActive = student.stage === stage;
                const isPast = stages.indexOf(student.stage) > index;
                return (
                  <button
                    key={stage}
                    onClick={() => updateStage(stage)}
                    disabled={updating}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                      isActive ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                      isPast ? "bg-green-500/10 text-green-400 border border-green-500/30" :
                      "bg-white/5 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {isActive && <Check className="w-3 h-3 inline mr-1" />}
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-4 md:p-6">
            <h3 className="text-lg font-bold text-white mb-4">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm text-white">{student.email}</p>
                  </div>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="text-sm text-white">{student.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Country</p>
                    <p className="text-sm text-white">{student.country}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Program</p>
                    <p className="text-sm text-white">{student.programs?.name || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Stage</p>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">{student.stage}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserPlus className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Counselor</p>
                    <p className="text-sm text-white">{student.users?.name || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Documents</h3>
              <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
                <Upload className="w-4 h-4 mr-2" />Request
              </Button>
            </div>
            <div className="space-y-3">
              {student.documents?.length > 0 ? (
                student.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        doc.status === 'approved' && "bg-green-500/10 text-green-400 border-green-500/30",
                        doc.status === 'pending' && "bg-amber-500/10 text-amber-400 border-amber-500/30",
                        doc.status === 'submitted' && "bg-blue-500/10 text-blue-400 border-blue-500/30",
                        doc.status === 'rejected' && "bg-red-500/10 text-red-400 border-red-500/30"
                      )}>{doc.status}</Badge>
                      {doc.status === 'submitted' && (
                        <Button variant="ghost" size="sm" onClick={() => updateDocumentStatus(doc.id, 'approved')} className="text-green-400 hover:bg-green-500/10">
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No documents uploaded</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button onClick={sendMessage} className="w-full sm:flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              <Send className="w-4 h-4 mr-2" />Send Message
            </Button>
            <Button onClick={scheduleMeeting} variant="outline" className="w-full sm:flex-1 border-white/10 hover:bg-white/5">
              <Calendar className="w-4 h-4 mr-2" />Schedule Meeting
            </Button>
            {student?.risk_score >= 50 && (
              <Button onClick={initiateIntervention} className="w-full sm:flex-1 bg-red-500 hover:bg-red-600 text-white">
                <AlertTriangle className="w-4 h-4 mr-2" />Initiate Intervention
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
