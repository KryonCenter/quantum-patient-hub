// Send an appointment confirmation email using the Lovable AI Gateway / Resend-style fallback.
// Uses Lovable Email infrastructure if available; otherwise returns a graceful error.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface Body {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  products: string;
  branchName?: string | null;
  branchAddress?: string | null;
  brandColor?: string;
  logoUrl?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.to || !body.patientName) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const brand = body.brandColor || '#10b981';
    const html = `
      <!DOCTYPE html>
      <html><body style="margin:0;font-family:Arial,sans-serif;background:#f6f6f6;padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:2px solid ${brand};">
          <tr><td style="background:${brand}1A;padding:20px;text-align:center;">
            ${body.logoUrl ? `<img src="${body.logoUrl}" alt="logo" style="height:60px;border-radius:50%;" />` : ''}
            <h2 style="margin:10px 0 0;color:${brand};">Confirmación de Cita</h2>
          </td></tr>
          <tr><td style="padding:24px;color:#1f2937;">
            <p>Hola <b>${body.patientName}</b>,</p>
            <p>Tu cita está confirmada con los siguientes detalles:</p>
            <table cellpadding="6" style="width:100%;border-collapse:collapse;">
              <tr><td><b>📅 Fecha:</b></td><td>${body.date}</td></tr>
              <tr><td><b>🕐 Hora:</b></td><td>${body.time}</td></tr>
              <tr><td><b>📝 Motivo:</b></td><td>${body.reason || '—'}</td></tr>
              <tr><td><b>💊 Servicio/Producto:</b></td><td>${body.products || '—'}</td></tr>
              <tr><td><b>👨‍⚕️ Doctor/a:</b></td><td>${body.doctorName}</td></tr>
              ${body.branchName ? `<tr><td><b>🏥 Sucursal:</b></td><td>${body.branchName}</td></tr>` : ''}
              ${body.branchAddress ? `<tr><td><b>📍 Dirección:</b></td><td>${body.branchAddress}</td></tr>` : ''}
            </table>
            <p style="margin-top:20px;">¡Te esperamos!</p>
          </td></tr>
          <tr><td style="background:#f9fafb;padding:14px;text-align:center;color:#6b7280;font-size:12px;">
            Enviado por ${body.doctorName}
          </td></tr>
        </table>
      </body></html>
    `;

    // Try enqueueing via Lovable email queue (if infra is set up)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { error: enqErr } = await admin.rpc('enqueue_email', {
      _queue: 'transactional_emails',
      _message: {
        recipient: body.to,
        template_name: 'appointment-confirmation',
        subject: `Confirmación de cita — ${body.date} ${body.time}`,
        html,
        idempotency_key: `appt-${body.to}-${body.date}-${body.time}`,
      },
    } as any);

    if (enqErr) {
      // Fallback: return body so the UI can show a message; caller may rely on browser/email later
      return new Response(JSON.stringify({
        ok: false,
        warning: 'Email infrastructure not yet configured. Please enable Lovable Emails to send.',
        details: enqErr.message,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
