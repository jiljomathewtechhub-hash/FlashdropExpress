import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function getLocalEnv(key: string): string {
  if (process.env[key]) return process.env[key]!;
  if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`]!;
  for (const file of ['.env.local', '.env']) {
    try {
      const envFile = path.resolve(process.cwd(), file);
      if (fs.existsSync(envFile)) {
        const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith(`${key}=`)) {
            const val = trimmed.replace(`${key}=`, '').trim();
            if (val) return val;
          }
          if (trimmed.startsWith(`VITE_${key}=`)) {
            const val = trimmed.replace(`VITE_${key}=`, '').trim();
            if (val) return val;
          }
        }
      }
    } catch {}
  }
  return '';
}

function normalizePhone(num?: string): string {
  if (!num) return '';
  const digits = num.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

function notificationDevServerPlugin(): Plugin {
  return {
    name: 'notification-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (
          (url === '/api/send-notification' ||
            url.startsWith('/.netlify/functions/send-notification')) &&
          req.method === 'POST'
        ) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const {
                channel,
                destination,
                subject,
                message,
                html_body,
                order_number,
                resend_api_key,
                carrier_gateway,
                admin_email,
              } = payload;

              const apiKey =
                process.env.RESEND_API_KEY ||
                process.env.VITE_RESEND_API_KEY ||
                resend_api_key ||
                getLocalEnv('RESEND_API_KEY');

              const sender = 'FlashDrop Express <support@flashdropexpress.com>';

              if (channel === 'email' && destination) {
                const toRecipients = typeof destination === 'string' && destination.includes(',')
                  ? destination.split(',').map((e: string) => e.trim()).filter(Boolean)
                  : destination;

                const emailRes = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    from: sender,
                    to: toRecipients,
                    reply_to: 'support@flashdropexpress.com',
                    subject: subject || `FlashDrop Express Order #${order_number || ''}`,
                    html: html_body || `<p>${message}</p>`,
                  }),
                });
                const emailData = await emailRes.json();
                console.log(
                  `[Vite Dev Server] ✓ Email dispatched to ${Array.isArray(toRecipients) ? toRecipients.join(', ') : toRecipients} (${emailRes.status}):`,
                  emailData
                );
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: emailData }));
                return;
              }

              if (channel === 'sms' && destination) {
                const digits = destination.replace(/\D/g, '').slice(-10);
                const gateway = carrier_gateway || 'freedom';
                const gatewayDomains: Record<string, string> = {
                  freedom: 'txt.freedommobile.ca',
                  rogers: 'pcs.rogers.com',
                  bell: 'txt.bell.ca',
                  telus: 'msg.telus.com',
                };
                const domain = gatewayDomains[gateway] || 'txt.freedommobile.ca';
                const gatewayEmail = `${digits}@${domain}`;

                // Dispatch SMS via Canadian Carrier Email-to-SMS Gateway (Freedom Mobile Default)
                const smsRes = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    from: sender,
                    to: gatewayEmail,
                    reply_to: 'support@flashdropexpress.com',
                    subject: 'FlashDrop SMS Alert',
                    text: message,
                  }),
                });
                const smsData = await smsRes.json();
                console.log(
                  `[Vite Dev Server] ✓ SMS Gateway dispatched to ${gatewayEmail} (${smsRes.status}):`,
                  smsData
                );

                // Also send priority email alert to admin email so message is never missed
                const targetAdminEmail = admin_email || process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'support@flashdropexpress.com';
                if (targetAdminEmail) {
                  const toAdminList = targetAdminEmail.includes(',')
                    ? targetAdminEmail.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : targetAdminEmail;

                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                      from: sender,
                      to: toAdminList,
                      reply_to: 'support@flashdropexpress.com',
                      subject: `[SMS URGENT ALERT] Order #${order_number || ''}`,
                      text: `[SMS notification alert for ${destination} (${gateway.toUpperCase()})]:\n\n${message}`,
                    }),
                  }).catch(() => {});
                }

                // Direct Twilio SMS dispatch
                const twilioSid = getLocalEnv('TWILIO_ACCOUNT_SID') || payload.twilio_account_sid || '';
                const twilioToken = getLocalEnv('TWILIO_AUTH_TOKEN') || payload.twilio_auth_token || '';
                const twilioFrom = normalizePhone(getLocalEnv('TWILIO_FROM_PHONE') || payload.twilio_from_phone || '+13653603570');
                const targetPhone = normalizePhone(destination);

                if (twilioSid && twilioToken && twilioFrom && targetPhone) {
                  try {
                    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
                    const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
                    const bodyParams = new URLSearchParams({
                      To: targetPhone,
                      From: twilioFrom,
                      Body: message,
                    });
                    let twilioRes = await fetch(twilioUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: authHeader,
                      },
                      body: bodyParams.toString(),
                    });
                    let twilioData = await twilioRes.json();

                    // If trial account requires predefined template (error 572006 or 400 parameter rejection)
                    if (twilioData && (twilioData.code === 572006 || twilioData.status === 400)) {
                      const fallbackTemplate = payload.event === 'status_changed' ? 'sms_delivery_updates' : 'sms_order_confirmation';
                      const fallbackParams = new URLSearchParams({
                        To: targetPhone,
                        From: twilioFrom,
                        Body: fallbackTemplate,
                      });
                      twilioRes = await fetch(twilioUrl, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/x-www-form-urlencoded',
                          Authorization: authHeader,
                        },
                        body: fallbackParams.toString(),
                      });
                      twilioData = await twilioRes.json();
                    }

                    console.log(`[Vite Dev Server] ✓ Twilio SMS dispatched (${twilioRes.status}):`, twilioData?.status || twilioData?.sid || twilioData?.message);
                  } catch (err) {
                    console.warn('[Vite Dev Server] Twilio SMS dispatch warning:', err);
                  }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: smsData }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              console.error('[Vite Dev Server] Notification delivery error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err?.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    notificationDevServerPlugin(),
  ],
  server: {
    port: 3000,
    host: true,
  },
});
