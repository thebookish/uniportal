import { useState, useEffect } from 'react';
import { FileText, ChevronDown, Check, Search, Plus, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  category?: string;
  description?: string;
  variables?: string[];
}

interface EmailTemplateSelectorProps {
  onSelect: (template: EmailTemplate | null, subject: string, body: string) => void;
  selectedTemplateId?: string;
  studentName?: string;
  studentEmail?: string;
  programName?: string;
  className?: string;
  showPreview?: boolean;
  initialSubject?: string;
  initialBody?: string;
}

export function EmailTemplateSelector({
  onSelect,
  selectedTemplateId,
  studentName = 'Student',
  studentEmail = '',
  programName = '',
  className,
  showPreview = true,
  initialSubject = '',
  initialBody = ''
}: EmailTemplateSelectorProps) {
  const { profile, university } = useAuth();
  const universityId = (profile as any)?.university_id;

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [universityId]);

  useEffect(() => {
    onSelect(selectedTemplate, subject, body);
  }, [subject, body, selectedTemplate]);

  async function fetchTemplates() {
    if (!universityId) return;
    try {
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .eq('university_id', universityId)
        .eq('is_active', true)
        .order('category', { ascending: true });
      
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyVariables(text: string): string {
    const variables: Record<string, string> = {
      student_name: studentName,
      first_name: studentName.split(' ')[0],
      program_name: programName || 'the program',
      university_name: university?.name || 'University',
      contact_email: (university as any)?.contact_email || '',
      contact_phone: (university as any)?.contact_phone || '',
      portal_link: window.location.origin,
      brand_primary_color: (university as any)?.brand_primary_color || '#F97316',
    };

    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }

  function selectTemplate(template: EmailTemplate) {
    setSelectedTemplate(template);
    setSubject(applyVariables(template.subject));
    
    // Extract text from HTML or use body_text
    if (template.body_text) {
      setBody(applyVariables(template.body_text));
    } else {
      // Simple HTML to text conversion for the message field
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = template.body_html;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      setBody(applyVariables(textContent.replace(/\s+/g, ' ').trim()));
    }
    
    setShowDropdown(false);
  }

  function clearTemplate() {
    setSelectedTemplate(null);
    setSubject(initialSubject);
    setBody(initialBody);
  }

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(templates.map(t => t.category).filter(Boolean))];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Template Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Template (optional)
        </label>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            {selectedTemplate ? (
              <span className="text-white">{selectedTemplate.name}</span>
            ) : (
              <span className="text-gray-400">Select a template or write custom...</span>
            )}
          </span>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showDropdown && "rotate-180")} />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl max-h-80 overflow-hidden">
            <div className="p-2 border-b border-white/10">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="bg-white/5 border-white/10 text-white text-sm"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {/* Custom option */}
              <button
                onClick={clearTemplate}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 text-left",
                  !selectedTemplate && "bg-orange-500/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-400" />
                  <span className="text-white">Write custom message</span>
                </div>
                {!selectedTemplate && <Check className="w-4 h-4 text-orange-400" />}
              </button>

              {/* Templates by category */}
              {categories.map(category => {
                const categoryTemplates = filteredTemplates.filter(t => t.category === category);
                if (categoryTemplates.length === 0) return null;
                
                return (
                  <div key={category}>
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider bg-white/5">
                      {category}
                    </div>
                    {categoryTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => selectTemplate(template)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 text-left",
                          selectedTemplate?.id === template.id && "bg-orange-500/10"
                        )}
                      >
                        <div>
                          <p className="text-white text-sm">{template.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[280px]">{template.subject}</p>
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}

              {/* Templates without category */}
              {filteredTemplates.filter(t => !t.category).map(template => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 text-left",
                    selectedTemplate?.id === template.id && "bg-orange-500/10"
                  )}
                >
                  <div>
                    <p className="text-white text-sm">{template.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[280px]">{template.subject}</p>
                  </div>
                  {selectedTemplate?.id === template.id && (
                    <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  )}
                </button>
              ))}

              {filteredTemplates.length === 0 && searchTerm && (
                <p className="px-3 py-4 text-center text-gray-400 text-sm">
                  No templates found matching "{searchTerm}"
                </p>
              )}

              {templates.length === 0 && (
                <p className="px-3 py-4 text-center text-gray-400 text-sm">
                  No templates created yet. Go to Settings → Email Templates to create one.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject line"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      {/* Message Body */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">Message *</label>
          {selectedTemplate && showPreview && (
            <button
              type="button"
              onClick={() => setShowHtmlPreview(!showHtmlPreview)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              {showHtmlPreview ? 'Edit Message' : 'Preview HTML'}
            </button>
          )}
        </div>
        
        {showHtmlPreview && selectedTemplate ? (
          <div className="rounded-lg overflow-hidden border border-white/10">
            <iframe
              srcDoc={applyVariables(selectedTemplate.body_html)}
              className="w-full h-64 bg-white"
              title="Email Preview"
            />
          </div>
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter your message here..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 resize-none"
          />
        )}
      </div>

      {/* Selected template info */}
      {selectedTemplate && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FileText className="w-3 h-3" />
          Using template: <span className="text-cyan-400">{selectedTemplate.name}</span>
          {selectedTemplate.category && (
            <Badge className="bg-gray-500/20 text-gray-400 text-xs">{selectedTemplate.category}</Badge>
          )}
        </div>
      )}
    </div>
  );
}
