import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function getLocalEnv(key: string): string {
  if (process.env[key]) return process.env[key]!;
  if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`]!;
  try {
    const envFile = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${key}=`)) {
          return trimmed.replace(`${key}=`, '').trim();
        }
        if (trimmed.startsWith(`VITE_${key}=`)) {
          return trimmed.replace(`VITE_${key}=`, '').trim();
        }
      }
    }
  } catch {}
  return '';
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

              const sender = 'FlashDrop Express <dispatch@flashdropexpress.com>';

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
                const targetAdminEmail = admin_email || process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'support@flashdropexpress.com, jiljomathew.techhub@gmail.com';
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
                      subject: `[SMS URGENT ALERT] Order #${order_number || ''}`,
                      text: `[SMS notification alert for ${destination} (${gateway.toUpperCase()})]:\n\n${message}`,
                    }),
                  }).catch(() => {});
                }

                // Direct Twilio SMS dispatch if configured
                const twilioSid = getLocalEnv('TWILIO_ACCOUNT_SID') || payload.twilio_account_sid;
                const twilioToken = getLocalEnv('TWILIO_AUTH_TOKEN') || payload.twilio_auth_token;
                const twilioFrom = getLocalEnv('TWILIO_FROM_PHONE') || payload.twilio_from_phone;

                if (twilioSid && twilioToken && twilioFrom && destination) {
                  try {
                    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
                    const bodyParams = new URLSearchParams({
                      To: destination,
                      From: twilioFrom,
                      Body: message,
                    });
                    const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
                    const twilioRes = await fetch(twilioUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: authHeader,
                      },
                      body: bodyParams.toString(),
                    });
                    const twilioData = await twilioRes.json();
                    console.log(`[Vite Dev Server] ✓ Twilio SMS dispatched (${twilioRes.status}):`, twilioData);
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
