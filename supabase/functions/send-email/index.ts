import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    const emailUser = Deno.env.get('EMAIL_USER');
    const emailPass = Deno.env.get('EMAIL_PASS');

    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { 
      to, 
      toName,
      subject, 
      message, 
      htmlContent,
      studentId, 
      communicationId,
      universityId,
      templateId,
      variables,
      senderName
    } = body;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, subject' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = supabaseUrl && supabaseKey 
      ? createClient(supabaseUrl, supabaseKey)
      : null;

    // Fetch university name if universityId provided
    let universityName = senderName || 'WorldLynk';
    if (universityId && supabaseClient && !senderName) {
      const { data: universityData } = await supabaseClient
        .from('universities')
        .select('name')
        .eq('id', universityId)
        .single();
      
      if (universityData?.name) {
        universityName = universityData.name;
      }
    }

    // Build email content
    let emailHtml = htmlContent || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">${subject}</h2>
        <div style="color: #333; line-height: 1.6;">
          ${message?.replace(/\n/g, '<br>') || ''}
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Sent via ${universityName}
        </p>
      </div>
    `;

    // If template is provided, fetch and populate it
    if (templateId && supabaseClient) {
      const { data: template } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (template) {
        emailHtml = template.body_html;
        // Replace variables
        if (variables) {
          Object.entries(variables).forEach(([key, value]) => {
            emailHtml = emailHtml.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
          });
        }
      }
    }

    let emailSent = false;
    let emailError = null;

    // Send via SMTP (Gmail)
    if (emailUser && emailPass) {
      try {
        const client = new SMTPClient({
          connection: {
            hostname: 'smtp.gmail.com',
            port: 465,
            tls: true,
            auth: {
              username: emailUser,
              password: emailPass,
            },
          },
        });

        await client.send({
          from: `${universityName} <${emailUser}>`,
          to: to,
          subject: subject,
          content: message || 'Please view this email in an HTML-compatible email client.',
          html: emailHtml,
        });

        await client.close();
        emailSent = true;
        console.log('Email sent via SMTP to:', to);
      } catch (err: any) {
        console.error('SMTP error:', err);
        emailError = err.message;
      }
    } else {
      emailError = 'SMTP credentials not configured (EMAIL_USER, EMAIL_PASS)';
      console.log('SMTP not configured, email queued');
    }

    // Record in database
    if (supabaseClient) {
      // Add to email queue
      await supabaseClient.from('email_queue').insert({
        to_email: to,
        to_name: toName || null,
        subject,
        body_html: emailHtml,
        body_text: message || null,
        university_id: universityId || null,
        template_id: templateId || null,
        status: emailSent ? 'sent' : (emailUser ? 'failed' : 'pending'),
        sent_at: emailSent ? new Date().toISOString() : null,
        error_message: emailError || null,
        metadata: { studentId }
      });

      // Update communication record if provided
      if (communicationId) {
        await supabaseClient
          .from('communications')
          .update({ status: emailSent ? 'delivered' : 'failed' })
          .eq('id', communicationId);
      }

      // Create communication record if student ID provided
      if (studentId && !communicationId) {
        await supabaseClient.from('communications').insert({
          student_id: studentId,
          university_id: universityId || null,
          type: 'email',
          subject,
          message: message || emailHtml,
          status: emailSent ? 'delivered' : 'sent'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent,
        message: emailSent ? 'Email sent successfully via SMTP' : 'Email queued (configure EMAIL_USER and EMAIL_PASS to send)',
        to,
        subject
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to send email' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
