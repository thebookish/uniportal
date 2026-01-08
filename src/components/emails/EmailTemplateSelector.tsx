import { useState, useEffect, useRef } from 'react';
import { FileText, ChevronDown, Check, Edit, Eye, X } from 'lucide-react';
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
  studentName = 'Student',
  programName = '',
  className,
  showPreview = true,
  initialSubject = '',
  initialBody = ''
}: EmailTemplateSelectorProps) {
  const { profile, university } = useAuth();
  const universityId = (profile as any)?.university_id;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [universityId]);

  useEffect(() => {
    onSelect(selectedTemplate, subject, body);
  }, [subject, body, selectedTemplate]);

  async function fetchTemplates() {
    if (!universityId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .eq('university_id', universityId)
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyVariables(text: string): string {
    if (!text) return '';
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
      if (value) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    });
    return result;
  }

  function selectTemplate(template: EmailTemplate) {
    setSelectedTemplate(template);
    setSubject(applyVariables(template.subject));
    
    // For the editable message field, use body_text if available
    // Otherwise keep the body empty since the HTML template will be used for sending
    if (template.body_text) {
      setBody(applyVariables(template.body_text));
    } else {
      // Extract meaningful text content from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = template.body_html;
      
      // Remove script and style elements
      tempDiv.querySelectorAll('script, style').forEach(el => el.remove());
      
      // Get text content and clean it up
      let textContent = tempDiv.textContent || tempDiv.innerText || '';
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\s*\n\s*/g, '\n')
        .trim();
      
      // If the extracted text is too messy (from complex HTML), use a simple message
      if (textContent.length > 500 || textContent.split(' ').length < 5) {
        setBody(`Dear ${studentName},\n\n[This email uses an HTML template. Your message will be formatted professionally.]\n\nBest regards`);
      } else {
        setBody(applyVariables(textContent));
      }
    }
    
    setShowDropdown(false);
  }

  function clearTemplate() {
    setSelectedTemplate(null);
    setSubject(initialSubject);
    setBody(initialBody);
    setShowDropdown(false);
  }

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Template Selector */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Template
        </label>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            {selectedTemplate ? (
              <span className="text-white">{selectedTemplate.name}</span>
            ) : (
              <span className="text-gray-400">Custom message (no template)</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {selectedTemplate && (
              <span 
                onClick={(e) => { e.stopPropagation(); clearTemplate(); }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-3 h-3 text-gray-400" />
              </span>
            )}
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showDropdown && "rotate-180")} />
          </div>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
            {templates.length > 5 && (
              <div className="p-2 border-b border-white/10">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search templates..."
                  className="bg-white/5 border-white/10 text-white text-sm"
                  autoFocus
                />
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto">
              {/* Custom option */}
              <button
                type="button"
                onClick={clearTemplate}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 text-left border-b border-white/5",
                  !selectedTemplate && "bg-orange-500/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-white text-sm">Custom message</span>
                    <p className="text-xs text-gray-500">Write your own email content</p>
                  </div>
                </div>
                {!selectedTemplate && <Check className="w-4 h-4 text-orange-400" />}
              </button>

              {/* Templates by category */}
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white/5 sticky top-0">
                    {category}
                  </div>
                  {categoryTemplates.map(template => (
                    <button
                      type="button"
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 text-left",
                        selectedTemplate?.id === template.id && "bg-orange-500/10"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{template.name}</p>
                        <p className="text-xs text-gray-400 truncate">{template.subject}</p>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <Check className="w-4 h-4 text-orange-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              ))}

              {filteredTemplates.length === 0 && searchTerm && (
                <p className="px-3 py-4 text-center text-gray-400 text-sm">
                  No templates found
                </p>
              )}

              {templates.length === 0 && !loading && (
                <div className="px-3 py-4 text-center">
                  <p className="text-gray-400 text-sm">No templates created yet</p>
                  <p className="text-gray-500 text-xs mt-1">Go to Settings → Email Templates</p>
                </div>
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
          <label className="block text-sm font-medium text-gray-300">
            Message *
            {selectedTemplate && <span className="text-gray-500 font-normal ml-2">(editable preview)</span>}
          </label>
          {selectedTemplate && showPreview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHtmlPreview(!showHtmlPreview)}
              className="text-xs text-cyan-400 hover:text-cyan-300 h-auto py-1"
            >
              <Eye className="w-3 h-3 mr-1" />
              {showHtmlPreview ? 'Edit' : 'Preview Email'}
            </Button>
          )}
        </div>
        
        {showHtmlPreview && selectedTemplate ? (
          <div className="rounded-lg overflow-hidden border border-white/10 bg-white">
            <iframe
              srcDoc={applyVariables(selectedTemplate.body_html)}
              className="w-full h-72 border-0"
              title="Email Preview"
            />
          </div>
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter your message here..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 resize-none font-sans"
          />
        )}
      </div>

      {/* Template indicator */}
      {selectedTemplate && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-300">
              Using: <span className="text-cyan-400 font-medium">{selectedTemplate.name}</span>
            </span>
            {selectedTemplate.category && (
              <Badge className="bg-gray-500/20 text-gray-400 text-xs">{selectedTemplate.category}</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">Email will use the HTML template design</p>
        </div>
      )}
    </div>
  );
}
