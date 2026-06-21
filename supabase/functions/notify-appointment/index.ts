// Sends appointment notification emails via Lovable Emails (send-transactional-email).
// Gracefully no-ops if email infrastructure isn't set up yet.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { appointment_id, kind } = await req.json();
    if (!appointment_id || !['received', 'confirmed'].includes(kind)) {
      return new Response(JSON.stringify({ error: 'invalid body' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: apt, error } = await supabase
      .from('appointments')
      .select('*, locations(name_ar, name_he, name_en)')
      .eq('id', appointment_id)
      .maybeSingle();
    if (error || !apt) {
      return new Response(JSON.stringify({ error: 'appointment not found' }), { status: 404, headers: corsHeaders });
    }

    const lang = (apt.language ?? 'ar') as 'ar' | 'he' | 'en';
    const locName = (apt.locations as { name_ar: string; name_he: string; name_en: string })?.[`name_${lang}`] ?? '';
    const d = new Date(apt.slot_at);
    const dateStr = d.toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'he' ? 'he-IL' : 'ar-EG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const templateName = `appointment-${kind}-${lang}`;
    const templateData = {
      parentName: apt.parent_name,
      childName: apt.child_name,
      location: locName,
      date: dateStr,
      time: timeStr,
    };

    // Try invoking the Lovable Emails send function. If it doesn't exist yet, no-op.
    try {
      const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName,
          recipientEmail: apt.email,
          idempotencyKey: `${kind}-${apt.id}`,
          templateData,
        },
      });
      if (sendErr) console.warn('send-transactional-email error', sendErr.message);
    } catch (e) {
      console.warn('email infra not ready', (e as Error).message);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
