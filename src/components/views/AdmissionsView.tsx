import { useState, useEffect } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter, Star, FileText, Send, CheckCircle, XCircle, Loader2, Sparkles, Clock, AlertTriangle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { EmailTemplateSelector } from '@/components/emails/EmailTemplateSelector';

interface AdmissionsViewProps {
  onStudentClick: (studentId: string) => void;
}

export function AdmissionsView({ onStudentClick }: AdmissionsViewProps) {
  const { profile } = useAuth();
  const universityId = (profile as any)?.university_id;
  
  const [activeTab, setActiveTab] = useState<'leads' | 'applications' | 'offers'>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const { students, loading, refetch } = useStudents();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalPurpose, setEmailModalPurpose] = useState<'offer' | 'document_request'>('offer');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const leads = students.filter(s => s.stage === 'lead');
  const applications = students.filter(s => s.stage === 'application');
  const offers = students.filter(s => s.stage === 'offer');

  const currentStudents = activeTab === 'leads' ? leads : activeTab === 'applications' ? applications : offers;

  const filteredStudents = currentStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (b.quality_score || 50) - (a.quality_score || 50));

  function openOfferModal(studentId: string) {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student);
    setEmailModalPurpose('offer');
    setEmailSubject('Congratulations! Your Offer Letter');
    setEmailBody(`Dear ${student?.name || 'Student'},\n\nWe are pleased to inform you that you have been accepted to our institution!\n\nPlease log in to your portal to view your offer details and next steps.\n\nBest regards,\nAdmissions Team`);
    setShowEmailModal(true);
  }

  function openDocumentRequestModal(studentId: string) {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student);
    setEmailModalPurpose('document_request');
    setEmailSubject('Documents Required - Action Needed');
    setEmailBody(`Dear ${student?.name || 'Student'},\n\nTo proceed with your application, please submit the following documents:\n\n• Academic Transcript\n• ID Document\n• English Proficiency Certificate\n\nPlease log in to your portal to upload these documents at your earliest convenience.\n\nBest regards,\nAdmissions Team`);
    setShowEmailModal(true);
  }

  async function sendEmailAndExecuteAction() {
    if (!universityId || !selectedStudent) return;
    setSendingEmail(true);
    
    try {
      if (emailModalPurpose === 'offer') {
        // Update student stage to offer
        await supabase.from('students').update({ stage: 'offer' }).eq('id', selectedStudent.id).eq('university_id', universityId);
      } else if (emailModalPurpose === 'document_request') {
        // Create document records
        await supabase.from('documents').insert([
          { student_id: selectedStudent.id, name: 'Transcript', status: 'pending', university_id: universityId },
          { student_id: selectedStudent.id, name: 'ID Document', status: 'pending', university_id: universityId },
          { student_id: selectedStudent.id, name: 'English Proficiency', status: 'pending', university_id: universityId }
        ]);
      }

      // Record communication
      await supabase.from('communications').insert({
        student_id: selectedStudent.id,
        type: 'email',
        subject: emailSubject,
        message: emailBody,
        status: 'sent',
        university_id: universityId
      });

      // Send actual email
      if (selectedStudent?.email) {
        await supabase.functions.invoke('supabase-functions-send-email', {
          body: {
            to: selectedStudent.email,
            toName: selectedStudent.name,
            subject: emailSubject,
            message: emailBody,
            studentId: selectedStudent.id,
            universityId,
            templateId: selectedTemplate?.id
          }
        });
      }

      refetch();
      setShowEmailModal(false);
      alert(emailModalPurpose === 'offer' ? 'Offer issued and email sent!' : 'Document request sent!');
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  }

  async function requestDocuments(studentId: string) {
    if (!universityId) return;
    setActionLoading(studentId);
    try {
      const student = students.find(s => s.id === studentId);
      const subject = 'Documents Required - Action Needed';
      const message = `Dear ${student?.name || 'Student'},\n\nTo proceed with your application, please submit the following documents:\n\n• Academic Transcript\n• ID Document\n• English Proficiency Certificate\n\nPlease log in to your portal to upload these documents at your earliest convenience.\n\nBest regards,\nAdmissions Team`;

      await supabase.from('documents').insert([
        { student_id: studentId, name: 'Transcript', status: 'pending', university_id: universityId },
        { student_id: studentId, name: 'ID Document', status: 'pending', university_id: universityId },
        { student_id: studentId, name: 'English Proficiency', status: 'pending', university_id: universityId }
      ]);
      await supabase.from('communications').insert({
        student_id: studentId,
        type: 'email',
        subject,
        message,
        status: 'sent',
        university_id: universityId
      });

      // Send actual email
      if (student?.email) {
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

      refetch();
      alert('Document request sent successfully!');
    } catch (error) {
      console.error('Error requesting documents:', error);
      alert('Error requesting documents. Please try again.');
    } finally {
      setActionLoading(null);
    }
  }

  async function moveToApplication(studentId: string) {
    setActionLoading(studentId);
    try {
      await supabase.from('students').update({ stage: 'application' }).eq('id', studentId);
      refetch();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Admissions Dashboard</h1>
          <p className="text-sm md:text-base text-gray-400">Manage leads, applications, and offers with AI insights</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-xs md:text-sm font-medium text-orange-400">AI Quality Scoring Active</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <button
          onClick={() => setActiveTab('leads')}
          className={cn(
            "glass-card p-4 md:p-6 text-left transition-all",
            activeTab === 'leads' && "border border-orange-500/30 glow-orange"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 md:w-5 h-4 md:h-5 text-blue-400" />
            <span className="text-xs md:text-sm text-gray-400">New Leads</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">{leads.length}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={cn(
            "glass-card p-4 md:p-6 text-left transition-all",
            activeTab === 'applications' && "border border-orange-500/30 glow-orange"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 md:w-5 h-4 md:h-5 text-purple-400" />
            <span className="text-xs md:text-sm text-gray-400">Applications</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">{applications.length}</p>
          <p className="text-xs text-gray-500 mt-1">In progress</p>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={cn(
            "glass-card p-4 md:p-6 text-left transition-all",
            activeTab === 'offers' && "border border-orange-500/30 glow-orange"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-4 md:w-5 h-4 md:h-5 text-green-400" />
            <span className="text-xs md:text-sm text-gray-400">Offers Sent</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">{offers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <Button variant="outline" className="border-white/10 hover:bg-white/5">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No {activeTab} found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => {
            const pendingDocs = student.documents?.filter((d: any) => d.status === 'pending').length || 0;
            const qualityScore = student.quality_score || 50;

            return (
              <div
                key={student.id}
                className="glass-card p-4 hover:scale-[1.005] transition-all cursor-pointer"
                onClick={() => onStudentClick(student.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{student.name}</h3>
                      <Badge className={cn("text-xs", getQualityColor(qualityScore))}>
                        <Star className="w-3 h-3 mr-1" />
                        {qualityScore} AI Score
                      </Badge>
                      {qualityScore >= 80 && (
                        <span className="ai-badge">
                          <Sparkles className="w-3 h-3" />
                          High-Fit
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{student.email}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}
                      </span>
                      <span>{student.country}</span>
                      {student.programs?.name && <span>{student.programs.name}</span>}
                      {pendingDocs > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          {pendingDocs} docs pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {activeTab === 'leads' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => requestDocuments(student.id)}
                          disabled={actionLoading === student.id}
                          className="border-white/10 hover:bg-white/5"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Request Docs
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => moveToApplication(student.id)}
                          disabled={actionLoading === student.id}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          {actionLoading === student.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Start Application
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    {activeTab === 'applications' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => requestDocuments(student.id)}
                          disabled={actionLoading === student.id}
                          className="border-white/10 hover:bg-white/5"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Request More
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => issueOffer(student.id)}
                          disabled={actionLoading === student.id || pendingDocs > 0}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          {actionLoading === student.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              Issue Offer
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    {activeTab === 'offers' && (
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                        Awaiting Response
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
