// Netlify Serverless Function for Email and SMS Notifications
// Supports Resend / SendGrid / Twilio / Canadian Carrier SMS Gateway

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { channel, recipient_type, destination, subject, message, html_body, order_number, resend_api_key } = payload;

    const apiKey = process.env.RESEND_API_KEY || resend_api_key;

    console.log(`[Netlify Notification Dispatch] ${channel?.toUpperCase()} to ${recipient_type} (${destination}): ${subject || message}`);

    // 1. Email delivery via Resend
    if (channel === 'email' && apiKey) {
      try {
        const senderDomain = 'FlashDrop Express <dispatch@flashdropexpress.com>';
        const toRecipients = typeof destination === 'string' && destination.includes(',')
          ? destination.split(',').map((e: string) => e.trim()).filter(Boolean)
          : destination;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: senderDomain,
            to: toRecipients,
            subject: subject || `FlashDrop Express Order #${order_number || ''}`,
            html: html_body || `<p>${message}</p>`,
          }),
        });
        const resData = await res.json();
        console.log('Resend Email Result:', resData);
      } catch (emailErr) {
        console.warn('Resend email delivery warning:', emailErr);
      }
    }

    // 2. Carrier Email-to-SMS Gateway (100% Free Canadian SMS for +1 647 804 9775 - Freedom Mobile Default)
    if (channel === 'sms' && apiKey && destination) {
      try {
        const digits = destination.replace(/\D/g, '').slice(-10);
        const gateway = payload.carrier_gateway || 'freedom';
        const gatewayDomains: Record<string, string> = {
          freedom: 'txt.freedommobile.ca',
          rogers: 'pcs.rogers.com',
          bell: 'txt.bell.ca',
          telus: 'msg.telus.com',
        };
        const domain = gatewayDomains[gateway] || 'txt.freedommobile.ca';
        const targetGatewayEmail = payload.carrier_gateway_email || `${digits}@${domain}`;
        const senderDomain = 'FlashDrop Express <dispatch@flashdropexpress.com>';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: senderDomain,
            to: targetGatewayEmail,
            subject: 'FlashDrop Alert',
            text: message,
          }),
        });

        // Also send instant duplicate to admin email so message is never missed
        const targetAdmin = payload.admin_email || process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'support@flashdropexpress.com, jiljomathew.techhub@gmail.com';
        if (targetAdmin) {
          const toAdminList = targetAdmin.includes(',')
            ? targetAdmin.split(',').map((s: string) => s.trim()).filter(Boolean)
            : targetAdmin;

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              from: senderDomain,
              to: toAdminList,
              subject: `[SMS URGENT ALERT] Order #${order_number || ''}`,
              text: `[SMS notification alert for ${destination} (${gateway.toUpperCase()})]:\n\n${message}`,
            }),
          }).catch(() => {});
        }
      } catch (carrierErr) {
        console.warn('Carrier email-to-sms warning:', carrierErr);
      }
    }

    // 3. SMS delivery via Twilio if configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID || payload.twilio_account_sid;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN || payload.twilio_auth_token;
    const twilioFrom = process.env.TWILIO_FROM_PHONE || payload.twilio_from_phone;

    if (channel === 'sms' && twilioSid && twilioToken && twilioFrom && destination) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const bodyParams = new URLSearchParams({
          To: destination,
          From: twilioFrom,
          Body: message,
        });

        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: authHeader,
          },
          body: bodyParams.toString(),
        });
      } catch (smsErr) {
        console.warn('Twilio SMS delivery warning:', smsErr);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Notification processed successfully',
        channel,
        destination,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Notification function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Notification handler failure',
      }),
    };
  }
};
