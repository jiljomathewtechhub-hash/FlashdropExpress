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
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: senderDomain,
            to: destination,
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

    // 2. Carrier Email-to-SMS Gateway (100% Free Canadian SMS for +1 647 804 9775)
    if (channel === 'sms' && apiKey && destination) {
      try {
        const digits = destination.replace(/\D/g, '').slice(-10);
        const gateway = payload.carrier_gateway || 'rogers';
        const gatewayDomains: Record<string, string> = {
          rogers: 'pcs.rogers.com',
          bell: 'txt.bell.ca',
          telus: 'msg.telus.com',
          freedom: 'txt.freedommobile.ca',
        };
        const domain = gatewayDomains[gateway] || 'pcs.rogers.com';
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
        const targetAdmin = (payload.admin_email && !payload.admin_email.includes('nidhin@flashdropexpress.com')) ? payload.admin_email : 'support@flashdropexpress.com';
        if (targetAdmin) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              from: senderDomain,
              to: targetAdmin,
              subject: `[SMS URGENT ALERT] Order #${order_number || ''}`,
              text: `[SMS notification sent to ${destination}]:\n\n${message}`,
            }),
          }).catch(() => {});
        }
      } catch (carrierErr) {
        console.warn('Carrier email-to-sms warning:', carrierErr);
      }
    }

    // 3. SMS delivery via Twilio if configured
    if (channel === 'sms' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_PHONE) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const bodyParams = new URLSearchParams({
          To: destination,
          From: process.env.TWILIO_FROM_PHONE,
          Body: message,
        });

        const authHeader = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
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
