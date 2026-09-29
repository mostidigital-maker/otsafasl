// Sends appointment emails via Resend, using the admin-editable
// public.email_templates table (subject/body per template_key + language).
// Replaces the old Lovable Emails ("send-transactional-email") dependency.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
 
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
// e.g. "appointments@yourclinic.co.il" — must be a verified sender/domain in Resend.
const FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL')!;
const FROM_NAME = Deno.env.get('NOTIFY_FROM_NAME') ?? 'המרפאה';
// Optional: replies from parents go to the clinic inbox, e.g. info@otsafa.com
const REPLY_TO = Deno.env.get('NOTIFY_REPLY_TO');
 
type Kind = 'new' | 'confirmed';
const TEMPLATE_KEY: Record<Kind, string> = {
  new: 'appointment_new',
  confirmed: 'appointment_confirmed',
};
 
function fillTemplate(text: string, data: Record<string, string>) {
  return text.replace(/{{\s*(\w+)\s*}}/g, (_, key) => data[key] ?? '');
}
 
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: [to], subject, html, ...(REPLY_TO ? { reply_to: REPLY_TO } : {}) }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}
 
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
 
  try {
    const { appointment_id, kind } = (await req.json()) as { appointment_id?: string; kind?: Kind };
    if (!appointment_id || !kind || !(kind in TEMPLATE_KEY)) {
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
    if (!apt.email) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no email on file' }), { headers: corsHeaders });
    }
 
    const lang = (apt.language ?? 'he') as 'ar' | 'he' | 'en';
    const locName = (apt.locations as { name_ar: string; name_he: string; name_en: string } | null)?.[`name_${lang}`] ?? '';
    const d = new Date(apt.slot_at);
    const dateStr = d.toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'he' ? 'he-IL' : 'ar-EG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
 
    const { data: tmpl } = await supabase
      .from('email_templates')
      .select('subject, body_html, is_enabled')
      .eq('template_key', TEMPLATE_KEY[kind])
      .eq('language', lang)
      .maybeSingle();
 
    if (!tmpl || !tmpl.is_enabled) {
      return new Response(JSON.stringify({ ok: true, skipped: 'template disabled or missing' }), { headers: corsHeaders });
    }
 
    const data = {
      parent_name: apt.parent_name,
      child_name: apt.child_name,
      date: dateStr,
      time: timeStr,
      location: locName,
    };
 
    await sendEmail(apt.email, fillTemplate(tmpl.subject, data), fillTemplate(tmpl.body_html, data));
 
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
