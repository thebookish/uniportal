import { useState, useEffect } from 'react';
import { X, Save, Loader2, Eye, Code, Palette, Plus, Trash2, Copy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  category: string;
  trigger_stage?: string;
  description?: string;
  variables?: string[];
}

interface EmailTemplateEditorProps {
  template?: EmailTemplate | null;
  onSave: () => void;
  onClose: () => void;
}

const TEMPLATE_CATEGORIES = [
  { id: 'welcome', name: 'Welcome', color: 'bg-green-500/10 text-green-400' },
  { id: 'document', name: 'Document Request', color: 'bg-cyan-500/10 text-cyan-400' },
  { id: 'reminder', name: 'Reminder', color: 'bg-amber-500/10 text-amber-400' },
  { id: 'offer', name: 'Offer', color: 'bg-purple-500/10 text-purple-400' },
  { id: 'onboarding', name: 'Onboarding', color: 'bg-blue-500/10 text-blue-400' },
  { id: 'support', name: 'Support', color: 'bg-red-500/10 text-red-400' },
  { id: 'custom', name: 'Custom', color: 'bg-gray-500/10 text-gray-400' },
];

const TRIGGER_STAGES = [
  'lead', 'application', 'offer', 'acceptance', 'enrollment', 'onboarding', 'active', 'at_risk', 'manual'
];

const AVAILABLE_VARIABLES = [
  { key: 'student_name', description: 'Student full name' },
  { key: 'first_name', description: 'Student first name' },
  { key: 'program_name', description: 'Program/course name' },
  { key: 'university_name', description: 'University name' },
  { key: 'counselor_name', description: 'Assigned counselor' },
  { key: 'intake_date', description: 'Program start date' },
  { key: 'deadline', description: 'Application deadline' },
  { key: 'portal_link', description: 'Student portal URL' },
  { key: 'contact_email', description: 'Support email address' },
  { key: 'contact_phone', description: 'Support phone number' },
];

export function EmailTemplateEditor({ template, onSave, onClose }: EmailTemplateEditorProps) {
  const { profile, university } = useAuth();
  const universityId = (profile as any)?.university_id;

  const [formData, setFormData] = useState<EmailTemplate>({
    name: template?.name || '',
    subject: template?.subject || '',
    body_html: template?.body_html || getDefaultTemplate(),
    body_text: template?.body_text || '',
    category: template?.category || 'custom',
    trigger_stage: template?.trigger_stage || 'manual',
    description: template?.description || '',
    variables: template?.variables || [],
  });

  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  function getDefaultTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{brand_primary_color}} 0%, #ea580c 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">{{university_name}}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 20px; font-weight: 600;">Hello {{first_name}},</h2>
              
              <p style="margin: 0 0 20px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Your message content goes here. Use the available variables to personalize your emails.
              </p>
              
              <table role="presentation" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: {{brand_primary_color}}; border-radius: 8px;">
                    <a href="{{portal_link}}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Access Portal
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                If you have any questions, please contact us at <a href="mailto:{{contact_email}}" style="color: {{brand_primary_color}};">{{contact_email}}</a>.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px; color: #a1a1aa; font-size: 14px;">
                {{university_name}}
              </p>
              <p style="margin: 0; color: #71717a; font-size: 12px;">
                This is an official communication. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  function insertVariable(variable: string) {
    const textArea = document.getElementById('body_html') as HTMLTextAreaElement;
    if (textArea) {
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const text = formData.body_html;
      const varText = `{{${variable}}}`;
      setFormData({
        ...formData,
        body_html: text.substring(0, start) + varText + text.substring(end)
      });
    }
  }

  function getPreviewHtml(): string {
    let html = formData.body_html;
    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      student_name: 'John Smith',
      first_name: 'John',
      program_name: 'Computer Science BSc',
      university_name: university?.name || 'Sample University',
      counselor_name: 'Sarah Johnson',
      intake_date: 'September 2025',
      deadline: 'March 31, 2025',
      portal_link: 'https://portal.example.com',
      contact_email: (university as any)?.contact_email || 'admissions@university.edu',
      contact_phone: (university as any)?.contact_phone || '+1 (555) 123-4567',
      brand_primary_color: (university as any)?.brand_primary_color || '#F97316',
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      // Use escaped regex to properly match {{variable}}
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    return html;
  }

  async function handleSave() {
    if (!formData.name || !formData.subject || !formData.body_html) {
      alert('Please fill in all required fields (Name, Subject, Body)');
      return;
    }

    setSaving(true);
    try {
      if (template?.id) {
        await supabase
          .from('email_templates')
          .update({
            name: formData.name,
            subject: formData.subject,
            body_html: formData.body_html,
            body_text: formData.body_text,
            category: formData.category,
            trigger_stage: formData.trigger_stage,
            description: formData.description,
            variables: formData.variables,
          })
          .eq('id', template.id);
      } else {
        await supabase.from('email_templates').insert({
          university_id: universityId,
          name: formData.name,
          subject: formData.subject,
          body_html: formData.body_html,
          body_text: formData.body_text,
          category: formData.category,
          trigger_stage: formData.trigger_stage,
          description: formData.description,
          variables: formData.variables,
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {template?.id ? 'Edit Email Template' : 'Create Email Template'}
            </h2>
            <p className="text-sm text-gray-400">Design professional email communications</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button
                onClick={() => setViewMode('edit')}
                className={cn(
                  "px-3 py-1.5 text-sm flex items-center gap-2",
                  viewMode === 'edit' ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                <Code className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={cn(
                  "px-3 py-1.5 text-sm flex items-center gap-2",
                  viewMode === 'preview' ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {viewMode === 'edit' ? (
            <div className="p-6 grid grid-cols-3 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Template Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Email"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject Line *</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Welcome to {{university_name}}!"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  >
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trigger Stage</label>
                  <select
                    value={formData.trigger_stage}
                    onChange={(e) => setFormData({ ...formData, trigger_stage: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  >
                    {TRIGGER_STAGES.map(stage => (
                      <option key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of when this template is used"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                  />
                </div>

                {/* Available Variables */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Available Variables</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {AVAILABLE_VARIABLES.map(v => (
                      <button
                        key={v.key}
                        onClick={() => insertVariable(v.key)}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-left group"
                      >
                        <div>
                          <code className="text-cyan-400 text-xs">{`{{${v.key}}}`}</code>
                          <p className="text-xs text-gray-500">{v.description}</p>
                        </div>
                        <Plus className="w-4 h-4 text-gray-500 group-hover:text-orange-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - HTML Editor */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Body (HTML) *</label>
                <textarea
                  id="body_html"
                  value={formData.body_html}
                  onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                  className="w-full h-[calc(100vh-320px)] px-4 py-3 rounded-lg bg-[#0d1117] border border-white/10 text-green-400 font-mono text-sm resize-none"
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={getPreviewHtml()}
                  className="w-full h-[calc(100vh-280px)] border-0"
                  title="Email Preview"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Template</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
