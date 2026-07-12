import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, email, role = 'viewer', full_name } = body;

    if (action === 'invite') {
      if (!email) throw new Error('Email is required');

      const cleanEmail = email.trim().toLowerCase();
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { error } = await supabase
        .from('invitations')
        .insert({
          email: cleanEmail,
          role,
          full_name: full_name || cleanEmail.split('@')[0],
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      // TODO: Send custom email with link like: https://yourapp.com/accept-invite?token=xxx
      console.log(`Invitation created for ${cleanEmail} | Token: ${token}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Invitation sent to ${cleanEmail}`,
          token 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list') {
      const { data } = await supabase.from('user_roles').select('*');
      return new Response(JSON.stringify({ users: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Unknown action');
  } catch (err: any) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});