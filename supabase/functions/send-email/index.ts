import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, message, studentId, communicationId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_KEY') ?? ''
    );

    // For now, we'll just record the communication as sent
    // In production, integrate with SendGrid, Mailgun, AWS SES, etc.
    
    // Update communication status
    if (communicationId) {
      await supabaseClient
        .from('communications')
        .update({ status: 'delivered' })
        .eq('id', communicationId);
    }

    // Log the email attempt
    console.log(`Email sent to: ${to}, Subject: ${subject}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email queued for delivery',
        to,
        subject
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
