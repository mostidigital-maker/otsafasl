// Meant to run once a day (via pg_cron / Supabase scheduled trigger).
// Emails everyone with a *confirmed* appointment tomorrow, using the
// 'appointment_reminder' template, and marks reminder_sent_at so it
// never sends twice for the same appointment.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL')!;
const FROM_NAME = Deno.env.get('NOTIFY_FROM_NAME') ?? 'המרפאה';
// Optional: replies from parents go to the clinic inbox, e.g. info@otsafa.com
const REPLY_TO = Deno.env.get('NOTIFY_REPLY_TO');
 
function fillTemplate(text: string, data: Record<string, string>) {
  return text.replace(/{{\s*(\w+)\s*}}/g, (_, key) => data[key] ?? '');
}
 
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: [to], subject, html, ...(REPLY_TO ? { reply_to: REPLY_TO } : {}) }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}
 
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
 
  // Tomorrow's calendar day, in UTC. If the clinic needs this pinned to
  // Asia/Jerusalem specifically, tell me and I'll adjust the boundaries.
  const now = new Date();
  const start = new Date(now); start.setUTCDate(start.getUTCDate() + 1); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start); end.setUTCHours(23, 59, 59, 999);
 
  const { data: appts, error } = await supabase
    .from('appointments')
    .select('*, locations(name_ar, name_he, name_en)')
    .gte('slot_at', start.toISOString())
    .lte('slot_at', end.toISOString())
    .eq('status', 'confirmed')
    .is('reminder_sent_at', null)
    .is('deleted_at', null);
 
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
 
  let sent = 0;
  for (const apt of appts ?? []) {
    if (!apt.email) continue;
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
      .eq('template_key', 'appointment_reminder')
      .eq('language', lang)
      .maybeSingle();
 
    if (!tmpl || !tmpl.is_enabled) continue;
 
    const data = { parent_name: apt.parent_name, child_name: apt.child_name, date: dateStr, time: timeStr, location: locName };
    try {
      await sendEmail(apt.email, fillTemplate(tmpl.subject, data), fillTemplate(tmpl.body_html, data));
      await supabase.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', apt.id);
      sent++;
    } catch (e) {
      console.error('reminder failed for appointment', apt.id, e);
    }
  }
 
  return new Response(JSON.stringify({ ok: true, sent }), { headers: { 'Content-Type': 'application/json' } });
});
