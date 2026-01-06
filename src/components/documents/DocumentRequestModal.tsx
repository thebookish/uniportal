import { useState, useEffect } from 'react';
import { X, FileText, Loader2, Check, Send, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface DocumentType {
  id: string;
  name: string;
  description: string;
  is_required: boolean;
  category: string;
}

interface DocumentRequestModalProps {
  studentId: string;
  studentName: string;
  studentEmail: string;
  existingDocs?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentRequestModal({
  studentId,
  studentName,
  studentEmail,
  existingDocs = [],
  onClose,
  onSuccess
}: DocumentRequestModalProps) {
  const { profile, university } = useAuth();
  const universityId = (profile as any)?.university_id;

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Documents Required - Action Needed');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    fetchDocumentTypes();
  }, [universityId]);

  useEffect(() => {
    // Generate email message when selected docs change
    if (selectedDocs.length > 0) {
      const selectedNames = documentTypes
        .filter(d => selectedDocs.includes(d.id))
        .map(d => d.name);
      
      setEmailMessage(
        `Dear ${studentName},\n\nTo proceed with your application, please submit the following documents:\n\n${selectedNames.map(n => `• ${n}`).join('\n')}\n\nPlease log in to your student portal to upload these documents at your earliest convenience.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\n${university?.name || 'Admissions Team'}`
      );
    }
  }, [selectedDocs, documentTypes, studentName, university]);

  async function fetchDocumentTypes() {
    try {
      const { data } = await supabase
        .from('document_types')
        .select('*')
        .eq('university_id', universityId)
        .order('display_order', { ascending: true });
      
      if (data && data.length > 0) {
        setDocumentTypes(data);
        // Pre-select required documents that haven't been submitted
        const existingDocNames = existingDocs.map(d => d.name.toLowerCase());
        const requiredMissing = data
          .filter(d => d.is_required && !existingDocNames.includes(d.name.toLowerCase()))
          .map(d => d.id);
        setSelectedDocs(requiredMissing);
      } else {
        // Create default document types if none exist
        const defaultDocs: Partial<DocumentType>[] = [
          { name: 'Academic Transcript', description: 'Official academic transcripts', is_required: true, category: 'academic' },
          { name: 'ID Document', description: 'Government-issued ID', is_required: true, category: 'identity' },
          { name: 'English Proficiency', description: 'IELTS, TOEFL, or equivalent', is_required: true, category: 'language' },
          { name: 'Personal Statement', description: 'Statement of purpose', is_required: false, category: 'application' },
          { name: 'Letters of Recommendation', description: 'Academic references', is_required: false, category: 'application' },
          { name: 'Financial Documents', description: 'Bank statements or sponsorship', is_required: false, category: 'financial' },
        ];
        
        const { data: created } = await supabase
          .from('document_types')
          .insert(defaultDocs.map(d => ({ ...d, university_id: universityId })))
          .select();
        
        if (created) {
          setDocumentTypes(created);
          const requiredIds = created.filter(d => d.is_required).map(d => d.id);
          setSelectedDocs(requiredIds);
        }
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleDocument(docId: string) {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  }

  function selectAll() {
    setSelectedDocs(documentTypes.map(d => d.id));
  }

  function selectRequired() {
    setSelectedDocs(documentTypes.filter(d => d.is_required).map(d => d.id));
  }

  function selectMissing() {
    const existingDocNames = existingDocs.map(d => d.name.toLowerCase());
    const missing = documentTypes
      .filter(d => !existingDocNames.includes(d.name.toLowerCase()))
      .map(d => d.id);
    setSelectedDocs(missing);
  }

  async function handleSend() {
    if (selectedDocs.length === 0) {
      alert('Please select at least one document to request.');
      return;
    }

    setSending(true);
    try {
      const selectedDocTypes = documentTypes.filter(d => selectedDocs.includes(d.id));
      
      // Create document records for each selected type
      const docInserts = selectedDocTypes.map(doc => ({
        student_id: studentId,
        name: doc.name,
        status: 'pending',
        university_id: universityId
      }));

      await supabase.from('documents').insert(docInserts);

      // Create communication record
      await supabase.from('communications').insert({
        student_id: studentId,
        type: 'email',
        subject: emailSubject,
        message: emailMessage,
        status: 'sent',
        university_id: universityId
      });

      // Send email
      await supabase.functions.invoke('supabase-functions-send-email', {
        body: {
          to: studentEmail,
          toName: studentName,
          subject: emailSubject,
          message: emailMessage,
          studentId,
          universityId
        }
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending document request:', error);
      alert('Failed to send document request. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const existingDocNames = existingDocs.map(d => d.name.toLowerCase());
  const categories = [...new Set(documentTypes.map(d => d.category))];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="glass-card p-8">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Request Documents</h2>
            <p className="text-sm text-gray-400">for {studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant="outline" size="sm" onClick={selectAll} className="border-white/10 hover:bg-white/5">
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectRequired} className="border-white/10 hover:bg-white/5">
              Select Required
            </Button>
            <Button variant="outline" size="sm" onClick={selectMissing} className="border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400">
              Select Missing
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDocs([])} className="border-white/10 hover:bg-white/5">
              Clear All
            </Button>
          </div>

          {/* Document Types by Category */}
          <div className="space-y-6 mb-6">
            {categories.map(category => {
              const categoryDocs = documentTypes.filter(d => d.category === category);
              return (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <div className="space-y-2">
                    {categoryDocs.map(doc => {
                      const isExisting = existingDocNames.includes(doc.name.toLowerCase());
                      const existingDoc = existingDocs.find(d => d.name.toLowerCase() === doc.name.toLowerCase());
                      
                      return (
                        <div
                          key={doc.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-colors",
                            selectedDocs.includes(doc.id)
                              ? "bg-orange-500/10 border-orange-500/30"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedDocs.includes(doc.id)}
                              onCheckedChange={() => toggleDocument(doc.id)}
                              className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{doc.name}</span>
                                {doc.is_required && (
                                  <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">Required</Badge>
                                )}
                              </div>
                              {doc.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          {isExisting && existingDoc && (
                            <Badge className={cn(
                              existingDoc.status === 'approved' && "bg-green-500/10 text-green-400 border-green-500/30",
                              existingDoc.status === 'pending' && "bg-amber-500/10 text-amber-400 border-amber-500/30",
                              existingDoc.status === 'submitted' && "bg-blue-500/10 text-blue-400 border-blue-500/30",
                              existingDoc.status === 'rejected' && "bg-red-500/10 text-red-400 border-red-500/30"
                            )}>
                              {existingDoc.status}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Email Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-400" />
              Email Preview
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5">
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || selectedDocs.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />Send Request</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
