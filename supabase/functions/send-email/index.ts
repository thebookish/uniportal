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

    // Fetch university details for branding
    let universityName = senderName || 'WorldLynk';
    let universityLogo = '';
    let brandPrimaryColor = '#F97316';
    let footerText = 'This is an official communication.';
    let contactEmail = '';
    let contactPhone = '';
    let websiteUrl = '';
    
    if (universityId && supabaseClient) {
      const { data: universityData } = await supabaseClient
        .from('universities')
        .select('name, email_logo_url, brand_primary_color, email_footer_text, contact_email, contact_phone, website_url')
        .eq('id', universityId)
        .single();
      
      if (universityData) {
        universityName = senderName || universityData.name || 'WorldLynk';
        universityLogo = universityData.email_logo_url || '';
        brandPrimaryColor = universityData.brand_primary_color || '#F97316';
        footerText = universityData.email_footer_text || 'This is an official communication.';
        contactEmail = universityData.contact_email || '';
        contactPhone = universityData.contact_phone || '';
        websiteUrl = universityData.website_url || '';
      }
    }

    // Build professional branded email content
    const logoSection = universityLogo 
      ? `<img src="${universityLogo}" alt="${universityName}" style="max-height: 50px; margin-bottom: 15px;">`
      : '';
    
    const contactSection = (contactEmail || contactPhone) 
      ? `
        <p style="margin: 10px 0 0; color: #71717a; font-size: 12px;">
          ${contactEmail ? `Email: <a href="mailto:${contactEmail}" style="color: ${brandPrimaryColor};">${contactEmail}</a>` : ''}
          ${contactEmail && contactPhone ? ' | ' : ''}
          ${contactPhone ? `Phone: ${contactPhone}` : ''}
        </p>
      `
      : '';

    const websiteSection = websiteUrl
      ? `<p style="margin: 5px 0 0; color: #71717a; font-size: 12px;"><a href="${websiteUrl}" style="color: ${brandPrimaryColor};">${websiteUrl.replace(/^https?:\/\//, '')}</a></p>`
      : '';

    let emailHtml = htmlContent || `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandPrimaryColor} 0%, #ea580c 100%); padding: 30px 40px; text-align: center;">
              ${logoSection}
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${universityName}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 20px; font-weight: 600;">${subject}</h2>
              
              <div style="color: #3f3f46; font-size: 16px; line-height: 1.7;">
                ${message?.replace(/\n/g, '<br>') || ''}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 30px 40px; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${universityName}</p>
              <p style="margin: 10px 0 0; color: #a1a1aa; font-size: 13px;">${footerText}</p>
              ${contactSection}
              ${websiteSection}
              <p style="margin: 15px 0 0; color: #52525b; font-size: 11px;">
                © ${new Date().getFullYear()} ${universityName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Unsubscribe -->
        <table role="presentation" style="max-width: 600px; margin: 20px auto 0;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">
                You received this email because you are associated with ${universityName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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
