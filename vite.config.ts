import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function getLocalApiKey(): string {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  if (process.env.VITE_RESEND_API_KEY) return process.env.VITE_RESEND_API_KEY;
  try {
    const envFile = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('RESEND_API_KEY=')) {
          return trimmed.replace('RESEND_API_KEY=', '').trim();
        }
        if (trimmed.startsWith('VITE_RESEND_API_KEY=')) {
          return trimmed.replace('VITE_RESEND_API_KEY=', '').trim();
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
                getLocalApiKey();

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
