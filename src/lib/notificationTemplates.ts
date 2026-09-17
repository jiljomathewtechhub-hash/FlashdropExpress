import { Order, OrderStatus, BusinessSettings, Driver } from '../types/order';

const ADMIN_PHONE_DEFAULT = '+1 647 804 9775';
const BASE_DOMAIN = 'https://flashdropexpress.com';

const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return BASE_DOMAIN;
};

const getPublicAssetUrl = (path: string): string => {
  // Always ensure public assets in emails load from the canonical production domain
  // so external email clients (Gmail, Outlook, Yahoo) can fetch the images
  // without being blocked by private localhost/10.x.x.x networks.
  return `${BASE_DOMAIN}${path.startsWith('/') ? path : '/' + path}`;
};

export const formatDeliveryType = (opt?: string): string => {
  if (!opt) return 'Standard / Same-Day';
  if (opt === 'urgent' || opt === 'asap' || opt === '1-2h') return '3) Urgent / ASAP';
  if (opt === 'direct' || opt === '2-3h') return '2) On Demand / Direct';
  return '1) Standard / Same-Day';
};

// Base responsive HTML wrapper for FlashDrop Express branded emails (White Daylight Theme)
const wrapHtmlEmail = (title: string, preheader: string, contentHtml: string): string => {
  const fdLogoUrl = getPublicAssetUrl('/images/fd-favicon.jpg');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F1F5F9; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
    .header { background-color: #FFFFFF; padding: 24px 20px; text-align: center; border-top: 4px solid #C5161D; border-bottom: 2px solid #C5161D; }
    .logo-text { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0F172A; text-transform: uppercase; margin: 0; line-height: 1.1; }
    .logo-red { color: #C5161D; }
    .tagline { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #64748B; margin-top: 5px; font-weight: 700; }
    .content { padding: 32px 24px; background-color: #FFFFFF; }
    .card { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 5px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .badge-red { background-color: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
    .badge-green { background-color: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
    .badge-blue { background-color: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
    .button { display: inline-block; background-color: #C5161D; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; font-weight: 800; font-size: 13px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(197, 22, 29, 0.25); }
    .button:hover { background-color: #A51218; }
    .footer { padding: 24px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; background-color: #F8FAFC; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
    .row-label { color: #64748B; font-weight: 500; }
    .row-value { color: #0F172A; font-weight: 700; text-align: right; }
    .divider { border-top: 1px solid #E2E8F0; margin: 14px 0; }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 24px 12px; background-color: #F1F5F9;">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <!-- Branded Header with Rounded FD Logo Emblem -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
              <tr>
                <td align="center" valign="middle" style="padding-right: 14px;">
                  <div style="background-color: #FFFFFF; border-radius: 10px; padding: 4px; border: 1px solid #CBD5E1; display: inline-block; width: 44px; height: 44px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); vertical-align: middle;">
                    <img src="${fdLogoUrl}" alt="FlashDrop Express FD Speed Logo" width="44" height="44" style="display: block; border-radius: 6px; width: 44px; height: 44px; object-fit: contain;" />
                  </div>
                </td>
                <td align="left" valign="middle">
                  <h1 class="logo-text">FLASH<span class="logo-red">DROP</span> EXPRESS</h1>
                  <div class="tagline">Greater Toronto Area Rapid Logistics &amp; Courier</div>
                </td>
              </tr>
            </table>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p style="margin: 0 0 6px 0; color: #0F172A; font-weight: 700;">FlashDrop Express &bull; A Division of SNM Group International Inc.</p>
            <p style="margin: 0 0 6px 0; color: #64748B;">Suite 108, 3064 Jaguar Valley Dr, Mississauga, ON L5A 2J3, Canada</p>
            <p style="margin: 0 0 8px 0;">24/7 Hotline: ${ADMIN_PHONE_DEFAULT} &bull; Email: support@flashdropexpress.com</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} FlashDrop Express (SNM Group International Inc.). All commercial courier rights reserved.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// -------------------------------------------------------------
// 1. CUSTOMER: Quote Request Received Email (NO PRICES)
// -------------------------------------------------------------
// 1A. CUSTOMER: Quote Request Acknowledged Email (No Price)
// -------------------------------------------------------------
export const createCustomerOrderEmail = (order: Order, settings: BusinessSettings) => {
  const origin = getOrigin();
  const trackUrl = `${origin}/?track=${order.order_number}`;

  const subject = `Quotation Request Received: #${order.order_number} - FlashDrop Express`;
  const preheader = `We have received your delivery specifications for #${order.order_number}. Our GTA dispatch operations team is calculating your official rate quotation.`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-blue">Quotation Request Under Review</span>
      <h2 style="color: #0F172A; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">
        Thank You, ${order.customer_name}!
      </h2>
      <p style="color: #64748B; font-size: 13px; margin: 0;">
        Your delivery specifications have been received by the FlashDrop Express GTA operations desk.
      </p>
    </div>

    <!-- Status Notice / What Happens Next Card -->
    <div class="card" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #C5161D;">
      <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
        📋 What Happens Next?
      </div>
      <p style="color: #475569; font-size: 12px; line-height: 1.6; margin: 0 0 10px 0;">
        Our GTA operations dispatch team is currently reviewing your route distance, cargo specifications, and vehicle allocation to calculate your official rate quotation.
      </p>
      <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #1E293B;">
        <div style="margin-bottom: 6px;"><strong>1. Operational Review:</strong> Route logistics and courier vehicle verification.</div>
        <div style="margin-bottom: 6px;"><strong>2. Official Quotation:</strong> An itemized rate breakdown will be prepared.</div>
        <div><strong>3. Quotation Email:</strong> You will receive an official quotation email with your rate and a link to review and confirm your booking.</div>
      </div>
    </div>

    <!-- Order Header Card -->
    <div class="card">
      <div class="row">
        <span class="row-label">Quote Reference</span>
        <span class="row-value" style="font-family: monospace; color: #0284C7; font-size: 14px;">#${order.order_number}</span>
      </div>
      <div class="row">
        <span class="row-label">Requested Pickup</span>
        <span class="row-value">${order.pickup_date} at ${order.pickup_time}</span>
      </div>
      <div class="row">
        <span class="row-label">Type of Delivery</span>
        <span class="row-value" style="color: #0F172A; font-weight: 700;">${formatDeliveryType(order.delivery_time_option)}</span>
      </div>
      <div class="row">
        <span class="row-label">Requested Vehicle</span>
        <span class="row-value">${order.vehicle_name}</span>
      </div>
    </div>

    <!-- Routing Addresses Card -->
    <div class="card">
      <div style="margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 700; color: #DC2626; text-transform: uppercase; margin-bottom: 4px;">
          📍 1. Pickup Location
        </div>
        <div style="color: #0F172A; font-weight: 700; font-size: 13px;">${order.pickup_address}</div>
        ${order.pickup_unit ? `<div style="color: #D97706; font-size: 11px; margin-top: 2px;">Dock/Unit: ${order.pickup_unit}</div>` : ''}
        <div style="color: #64748B; font-size: 11px; margin-top: 2px;">Contact: ${order.pickup_contact_name || order.customer_name} (${order.pickup_contact_phone || order.customer_phone})</div>
      </div>
      <div class="divider"></div>
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 4px;">
          🏁 2. Drop-Off Destination
        </div>
        <div style="color: #0F172A; font-weight: 700; font-size: 13px;">${order.delivery_address}</div>
        ${order.delivery_unit ? `<div style="color: #0284C7; font-size: 11px; margin-top: 2px;">Unit/Buzzer: ${order.delivery_unit}</div>` : ''}
        <div style="color: #64748B; font-size: 11px; margin-top: 2px;">Receiver: ${order.delivery_contact_name || order.customer_name} (${order.delivery_contact_phone || order.customer_phone})</div>
      </div>
    </div>

    <!-- Cargo Manifest -->
    <div class="card">
      <div class="row">
        <span class="row-label">Cargo Manifest</span>
        <span class="row-value">${order.item_description || order.item_type} (${order.quantity} units, ${order.weight_lbs} lbs)</span>
      </div>
      <div class="row">
        <span class="row-label">Estimated Route</span>
        <span class="row-value">${order.distance_km} km (${order.service_area})</span>
      </div>
      ${order.custom_instructions ? `
      <div class="row">
        <span class="row-label">Special Notes</span>
        <span class="row-value" style="color: #B45309; font-weight: 600;">${order.custom_instructions}</span>
      </div>` : ''}
    </div>

    <!-- Rate Under Review Notice -->
    <div class="card" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #D97706;">
      <div style="font-size: 11px; font-weight: 700; color: #B45309; text-transform: uppercase; margin-bottom: 4px;">
        ⏳ Rate Quotation In Progress
      </div>
      <p style="color: #475569; font-size: 12px; line-height: 1.5; margin: 0;">
        Our dispatch desk manually reviews your route specifications to ensure accurate commercial pricing. You will receive an official quotation email with a full itemized cost breakdown shortly.
      </p>
    </div>

    <!-- CTA Tracking Button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${trackUrl}" class="button" style="background-color: #C5161D; box-shadow: 0 4px 12px rgba(197, 22, 29, 0.25); font-size: 14px; padding: 14px 28px; display: inline-block;">
        Track Quotation Request Status &rarr;
      </a>
      <p style="color: #64748B; font-size: 11px; margin-top: 12px;">
        Need to update details? Reply to this email or call dispatch at ${settings.phone || '+1 647 804 9775'}.
      </p>
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
    plain: `FlashDrop Express: Quotation Request #${order.order_number} Received. Pickup scheduled for ${order.pickup_date} at ${order.pickup_time}.\n\nOur GTA dispatch operations desk is reviewing your specifications and will send an official quotation email with an itemized price breakdown shortly.\n\nTrack request: ${trackUrl}`,
  };
};

// -------------------------------------------------------------
// 1B. CUSTOMER: Official Price Quotation Email (Sent by Admin)
// -------------------------------------------------------------
export const createCustomerQuoteReadyEmail = (order: Order, settings: BusinessSettings) => {
  const origin = getOrigin();
  const confirmUrl = `${origin}/?confirm_quote=${order.order_number}`;
  const trackUrl = `${origin}/?track=${order.order_number}`;

  const subject = `Official Delivery Quotation: #${order.order_number} ($${order.total_price.toFixed(2)} CAD) - FlashDrop Express`;
  const preheader = `Your customized price quotation for order #${order.order_number} is ready. Total: $${order.total_price.toFixed(2)} CAD.`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-green">Official Price Quote Approved</span>
      <h2 style="color: #0F172A; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">
        Your Custom Quote is Ready!
      </h2>
      <p style="color: #64748B; font-size: 13px; margin: 0;">
        FlashDrop Express dispatch has reviewed and confirmed your delivery rate.
      </p>
    </div>

    <!-- Prominent Price Callout Box -->
    <div style="margin: 20px 0; background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 2px solid #10B981; border-radius: 12px; padding: 20px; text-align: center;">
      <div style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
        Approved Delivery Rate
      </div>
      <div style="font-size: 36px; font-weight: 900; color: #065F46; line-height: 1.1; margin: 4px 0;">
        $${order.total_price.toFixed(2)} <span style="font-size: 16px; font-weight: 700; color: #047857;">CAD</span>
      </div>
      <div style="font-size: 12px; color: #059669; font-weight: 600; margin-top: 4px;">
        Ontario HST Included (13%) &bull; Pay Later Upon Delivery
      </div>
      ${order.discount_amount && order.discount_amount > 0 ? `
      <div style="margin-top: 8px; display: inline-block; background-color: #047857; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase;">
        🎉 Special Customer Savings: You Save $${order.discount_amount.toFixed(2)} CAD
      </div>` : ''}
    </div>

    <!-- Order Header Card -->
    <div class="card">
      <div class="row">
        <span class="row-label">Quote Reference</span>
        <span class="row-value" style="font-family: monospace; color: #0284C7; font-size: 14px;">#${order.order_number}</span>
      </div>
      <div class="row">
        <span class="row-label">Scheduled Pickup</span>
        <span class="row-value">${order.pickup_date} at ${order.pickup_time}</span>
      </div>
      <div class="row">
        <span class="row-label">Type of Delivery</span>
        <span class="row-value" style="color: #0F172A; font-weight: 700;">${formatDeliveryType(order.delivery_time_option)}</span>
      </div>
      <div class="row">
        <span class="row-label">Assigned Vehicle</span>
        <span class="row-value">${order.vehicle_name}</span>
      </div>
    </div>

    <!-- Route Card -->
    <div class="card">
      <div style="margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 700; color: #DC2626; text-transform: uppercase; margin-bottom: 4px;">
          📍 Pickup Location
        </div>
        <div style="color: #0F172A; font-weight: 700; font-size: 13px;">${order.pickup_address}</div>
        ${order.pickup_unit ? `<div style="color: #D97706; font-size: 11px; margin-top: 2px;">Dock/Unit: ${order.pickup_unit}</div>` : ''}
      </div>
      <div class="divider"></div>
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 4px;">
          🏁 Drop-Off Destination
        </div>
        <div style="color: #0F172A; font-weight: 700; font-size: 13px;">${order.delivery_address}</div>
        ${order.delivery_unit ? `<div style="color: #0284C7; font-size: 11px; margin-top: 2px;">Unit/Buzzer: ${order.delivery_unit}</div>` : ''}
      </div>
    </div>

    <!-- Approved Itemized Quotation Breakdown -->
    <div class="card" style="border: 1px solid #10B981; background-color: #F8FAFC;">
      <div style="font-size: 12px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
        Confirmed Quotation Breakdown (CAD)
      </div>
      <div class="row">
        <span class="row-label">Base Transport Rate (${order.vehicle_name})</span>
        <span class="row-value">$${(order.base_price || 0).toFixed(2)} CAD</span>
      </div>
      ${order.excess_km_charge > 0 ? `
      <div class="row">
        <span class="row-label">Excess Distance Charge (${order.distance_km} km total)</span>
        <span class="row-value">+$${order.excess_km_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${(order.delivery_type_charge && order.delivery_type_charge > 0) ? `
      <div class="row">
        <span class="row-label">Delivery Speed Surcharge (${formatDeliveryType(order.delivery_time_option)})</span>
        <span class="row-value">+$${order.delivery_type_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${order.after_hours_charge > 0 ? `
      <div class="row">
        <span class="row-label">After-Hours / Weekend Dispatch</span>
        <span class="row-value">+$${order.after_hours_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${order.waiting_charge > 0 ? `
      <div class="row">
        <span class="row-label">Dedicated Waiting / Loading Time</span>
        <span class="row-value">+$${order.waiting_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${order.labor_charge > 0 ? `
      <div class="row">
        <span class="row-label">Additional Helper / Crew Labor</span>
        <span class="row-value">+$${order.labor_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${order.discount_amount && order.discount_amount > 0 ? `
      <div class="row" style="background-color: #ECFDF5; padding: 6px 10px; border-radius: 6px; margin: 6px 0; border: 1px dashed #10B981;">
        <span class="row-label" style="color: #047857; font-weight: 800;">
          🎁 ${order.discount_type || 'Special Loyalty Discount'}${order.discount_notes ? ` &bull; <span style="font-weight: normal; color: #065F46;">${order.discount_notes}</span>` : ''}
        </span>
        <span class="row-value" style="color: #047857; font-weight: 900; font-size: 13px;">-$${order.discount_amount.toFixed(2)} CAD</span>
      </div>` : ''}
      <div class="divider"></div>
      <div class="row">
        <span class="row-label">Subtotal (Net Before Tax)</span>
        <span class="row-value">$${(order.subtotal || (order.total_price / 1.13)).toFixed(2)} CAD</span>
      </div>
      <div class="row">
        <span class="row-label">Ontario HST (13%)</span>
        <span class="row-value">$${(order.tax_amount || (order.total_price - (order.total_price / 1.13))).toFixed(2)} CAD</span>
      </div>
      <div class="row" style="font-size: 16px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #E2E8F0;">
        <span class="row-label" style="color: #0F172A; font-weight: 800;">Total Quoted Price</span>
        <span class="row-value" style="color: #059669; font-weight: 900; font-size: 18px;">$${order.total_price.toFixed(2)} CAD</span>
      </div>
      <div class="row" style="margin-top: 4px;">
        <span class="row-label">Payment Terms</span>
        <span class="row-value" style="color: #B45309; font-weight: 700;">Pay Later (Pay Upon Delivery)</span>
      </div>
      ${order.quote_notes ? `
      <div style="margin-top: 10px; padding: 10px 14px; background-color: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 11px; color: #475569;">
        <strong style="color: #0F172A;">Dispatch Notes:</strong> ${order.quote_notes}
      </div>` : ''}
    </div>

    <!-- CTA Confirm Delivery Button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${confirmUrl}" class="button" style="background-color: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35); font-size: 15px; padding: 14px 28px; display: inline-block;">
        Accept &amp; Confirm Quotation ($${order.total_price.toFixed(2)} CAD) &rarr;
      </a>
      <div style="margin-top: 12px;">
        <a href="${trackUrl}" style="color: #0284C7; font-size: 12px; text-decoration: underline; font-weight: 600;">
          Or review specifications on live tracking page &rarr;
        </a>
      </div>
      <p style="color: #64748B; font-size: 11px; margin-top: 12px;">
        Need to make changes? Reply to this email or call dispatch at ${settings.phone || '+1 647 804 9775'}.
      </p>
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
    plain: `FlashDrop Express: Official Delivery Quotation #${order.order_number} is ready! Total: $${order.total_price.toFixed(2)} CAD.\n\nAccept & Confirm Quotation: ${confirmUrl}\nOr review on tracking page: ${trackUrl}`,
  };
};

// -------------------------------------------------------------
// 2. CUSTOMER: Order Status Changed Email
// -------------------------------------------------------------
export const createCustomerStatusEmail = (order: Order, prevStatus: OrderStatus, newStatus: OrderStatus, notes?: string) => {
  const origin = getOrigin();
  const trackUrl = `${origin}/?track=${order.order_number}`;
  const confirmUrl = `${origin}/?confirm_quote=${order.order_number}`;

  const statusTitles: Record<OrderStatus, string> = {
    submitted: 'Order Submitted to Queue',
    quote_sent: 'Official Price Quotation Ready',
    confirmed: 'Order Confirmed by Dispatch',
    assigned: 'Driver Assigned & Scheduled',
    accepted: 'Driver Assigned & Accepted Run',
    en_route_pickup: 'Driver En Route to Pickup Site',
    picked_up: 'Cargo Loaded & Picked Up',
    in_transit: 'In Transit to Final Destination',
    delivered: 'Delivered Successfully (POD Confirmed)',
    cancellation_requested: 'Cancellation Requested',
    cancelled: 'Order Cancelled',
    change_requested: 'Order Change Requested',
  };

  const statusMessages: Record<OrderStatus, string> = {
    submitted: 'Your order is currently queued for operational review.',
    quote_sent: 'An official itemized price quote for your delivery has been prepared and is ready for your confirmation.',
    confirmed: 'Your order has been officially verified and accepted for delivery.',
    assigned: `A fleet courier (${order.assigned_driver_name || 'Assigned Driver'}) has been dispatched to your order.`,
    accepted: `Your assigned courier (${order.assigned_driver_name || 'Assigned Driver'}) has accepted the dispatch run and is preparing for pickup.`,
    en_route_pickup: 'The assigned driver is driving toward the designated pickup site.',
    picked_up: 'Your cargo has been safely inspected, loaded, and is now secured in the vehicle.',
    in_transit: 'Your shipment is actively in transit on the road toward the delivery destination.',
    delivered: 'Your order has been safely delivered! Digital proof of delivery has been captured.',
    cancellation_requested: 'A cancellation request for this delivery has been submitted.',
    cancelled: 'This delivery order has been cancelled by dispatch.',
    change_requested: 'A change request for this delivery is under review.',
  };

  const currentTitle = statusTitles[newStatus] || newStatus.replace(/_/g, ' ');
  const currentMsg = statusMessages[newStatus] || `Your order status has transitioned to ${newStatus}.`;

  const subject = newStatus === 'quote_sent'
    ? `Official Delivery Quotation: #${order.order_number} ($${order.total_price.toFixed(2)} CAD) - FlashDrop Express`
    : `Delivery Status Update: #${order.order_number} is now ${currentTitle}`;
  const preheader = newStatus === 'quote_sent'
    ? `Your price quotation for #${order.order_number} is ready. Total: $${order.total_price.toFixed(2)} CAD.`
    : `Order #${order.order_number} update: ${currentMsg}`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge ${newStatus === 'delivered' ? 'badge-green' : newStatus === 'cancelled' ? 'badge-red' : 'badge-blue'}">
        ${currentTitle}
      </span>
      <h2 style="color: #0F172A; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">
        Order #${order.order_number}
      </h2>
      <p style="color: #64748B; font-size: 13px; margin: 0;">
        ${currentMsg}
      </p>
    </div>

    ${newStatus === 'quote_sent' ? `
    <!-- Prominent Price Callout Box -->
    <div style="margin: 20px 0; background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 2px solid #10B981; border-radius: 12px; padding: 20px; text-align: center;">
      <div style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
        Approved Delivery Rate
      </div>
      <div style="font-size: 36px; font-weight: 900; color: #065F46; line-height: 1.1; margin: 4px 0;">
        $${order.total_price.toFixed(2)} <span style="font-size: 16px; font-weight: 700; color: #047857;">CAD</span>
      </div>
      <div style="font-size: 12px; color: #059669; font-weight: 600; margin-top: 4px;">
        Ontario HST Included (13%) &bull; Ready for Customer Confirmation
      </div>
    </div>

    <!-- Approved Itemized Quotation Breakdown -->
    <div class="card" style="border: 1px solid #10B981; background-color: #F8FAFC;">
      <div style="font-size: 12px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
        Itemized Quotation Breakdown (CAD)
      </div>
      <div class="row">
        <span class="row-label">Base Transport Rate (${order.vehicle_name})</span>
        <span class="row-value">$${(order.base_price || 0).toFixed(2)} CAD</span>
      </div>
      ${order.excess_km_charge > 0 ? `
      <div class="row">
        <span class="row-label">Excess Distance Charge (${order.distance_km} km total)</span>
        <span class="row-value">+$${order.excess_km_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${(order.delivery_type_charge && order.delivery_type_charge > 0) ? `
      <div class="row">
        <span class="row-label">Delivery Speed Surcharge (${formatDeliveryType(order.delivery_time_option)})</span>
        <span class="row-value">+$${order.delivery_type_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${order.after_hours_charge > 0 ? `
      <div class="row">
        <span class="row-label">After-Hours / Weekend Dispatch</span>
        <span class="row-value">+$${order.after_hours_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${order.waiting_charge > 0 ? `
      <div class="row">
        <span class="row-label">Dedicated Waiting / Loading Time</span>
        <span class="row-value">+$${order.waiting_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${order.labor_charge > 0 ? `
      <div class="row">
        <span class="row-label">Additional Helper / Crew Labor</span>
        <span class="row-value">+$${order.labor_charge.toFixed(2)} CAD</span>
      </div>` : ''}
      ${order.discount_amount && order.discount_amount > 0 ? `
      <div class="row" style="background-color: #ECFDF5; padding: 6px 10px; border-radius: 6px; margin: 6px 0; border: 1px dashed #10B981;">
        <span class="row-label" style="color: #047857; font-weight: 800;">
          🎁 ${order.discount_type || 'Special Loyalty Discount'}${order.discount_notes ? ` &bull; <span style="font-weight: normal; color: #065F46;">${order.discount_notes}</span>` : ''}
        </span>
        <span class="row-value" style="color: #047857; font-weight: 900; font-size: 13px;">-$${order.discount_amount.toFixed(2)} CAD</span>
      </div>` : ''}
      <div class="divider"></div>
      <div class="row">
        <span class="row-label">Subtotal (Net Before Tax)</span>
        <span class="row-value">$${(order.subtotal || (order.total_price / 1.13)).toFixed(2)} CAD</span>
      </div>
      <div class="row">
        <span class="row-label">Ontario HST (13%)</span>
        <span class="row-value">$${(order.tax_amount || (order.total_price - (order.total_price / 1.13))).toFixed(2)} CAD</span>
      </div>
      <div class="row" style="font-size: 16px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #E2E8F0;">
        <span class="row-label" style="color: #0F172A; font-weight: 800;">Total Quoted Price</span>
        <span class="row-value" style="color: #059669; font-weight: 900; font-size: 18px;">$${order.total_price.toFixed(2)} CAD</span>
      </div>
    </div>
    ` : ''}

    <!-- Status Details Card -->
    <div class="card">
      <div class="row">
        <span class="row-label">Status</span>
        <span class="row-value" style="color: ${newStatus === 'delivered' ? '#059669' : '#0284C7'}; text-transform: uppercase;">
          ${newStatus.replace(/_/g, ' ')}
        </span>
      </div>
      ${newStatus !== 'submitted' ? `
      <div class="row">
        <span class="row-label">Total Amount</span>
        <span class="row-value" style="color: #059669; font-weight: 800;">$${order.total_price.toFixed(2)} CAD</span>
      </div>` : ''}
      ${order.assigned_driver_name ? `
      <div class="row">
        <span class="row-label">Assigned Courier</span>
        <span class="row-value">${order.assigned_driver_name} (${order.vehicle_name})</span>
      </div>
      ` : ''}
      ${notes ? `
      <div class="row">
        <span class="row-label">Dispatch Notes</span>
        <span class="row-value" style="font-style: italic; color: #475569;">${notes}</span>
      </div>
      ` : ''}
      <div class="row">
        <span class="row-label">Route</span>
        <span class="row-value">${order.pickup_address.split(',')[0]} &rarr; ${order.delivery_address.split(',')[0]}</span>
      </div>
      ${order.proof_of_delivery ? `
      <div class="divider"></div>
      <div class="row">
        <span class="row-label">Recipient Verified</span>
        <span class="row-value" style="color: #059669; font-weight: 700;">${order.proof_of_delivery.recipient_name}</span>
      </div>
      <div class="row">
        <span class="row-label">Delivered Timestamp</span>
        <span class="row-value">${new Date(order.proof_of_delivery.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      ` : ''}
    </div>

    <!-- Live Tracking & Action Button -->
    <div style="text-align: center; margin: 28px 0;">
      ${newStatus === 'quote_sent' ? `
      <a href="${confirmUrl}" class="button" style="background-color: #059669; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35); font-size: 15px; padding: 14px 28px; display: inline-block; margin-bottom: 12px;">
        Accept &amp; Confirm Quotation ($${order.total_price.toFixed(2)} CAD) &rarr;
      </a>
      <div>
        <a href="${trackUrl}" style="color: #0284C7; font-size: 12px; text-decoration: underline; font-weight: 600;">
          Or review specifications on live tracking page &rarr;
        </a>
      </div>
      ` : `
      <a href="${trackUrl}" class="button">View Live Order Tracking &rarr;</a>
      `}
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
    plain: newStatus === 'quote_sent'
      ? `FlashDrop Express: Official Delivery Quotation #${order.order_number} is ready! Total: $${order.total_price.toFixed(2)} CAD.\n\nAccept & Confirm Quotation: ${confirmUrl}\nOr review on tracking page: ${trackUrl}`
      : `FlashDrop Express Update: Order #${order.order_number} is now ${currentTitle}. ${currentMsg} Track: ${trackUrl}`,
  };
};

// -------------------------------------------------------------
// 3. ADMIN: New Order Email & SMS Notifications
// -------------------------------------------------------------
export const createAdminNewOrderEmail = (order: Order, settings: BusinessSettings) => {
  const origin = getOrigin();
  const adminUrl = `${origin}/admin`;

  const subject = `🚨 [NEW ORDER ALERT] #${order.order_number} - $${order.total_price.toFixed(2)} CAD`;
  const preheader = `New order #${order.order_number} placed by ${order.customer_name}. Route: ${order.pickup_address.split(',')[0]} to ${order.delivery_address.split(',')[0]}.`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-red">🚨 New Dispatch Booking</span>
      <h2 style="color: #0F172A; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">
        Order #${order.order_number} Received
      </h2>
      <p style="color: #64748B; font-size: 13px; margin: 0;">
        A new commercial delivery order requires driver allocation and dispatch.
      </p>
    </div>

    <!-- Admin Order Summary Card -->
    <div class="card">
      <div class="row">
        <span class="row-label">Order Value</span>
        <span class="row-value" style="color: #059669; font-size: 16px; font-weight: 900;">$${order.total_price.toFixed(2)} CAD</span>
      </div>
      <div class="row">
        <span class="row-label">Payment Status</span>
        <span class="row-value" style="color: #0F172A; font-weight: 700;">${order.payment_status.toUpperCase()}</span>
      </div>
      <div class="row">
        <span class="row-label">Type of Delivery</span>
        <span class="row-value" style="color: #0F172A; font-weight: 700;">${formatDeliveryType(order.delivery_time_option)}</span>
      </div>
      <div class="row">
        <span class="row-label">Vehicle Type</span>
        <span class="row-value">${order.vehicle_name}</span>
      </div>
    </div>

    <!-- Customer Details -->
    <div class="card">
      <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 8px;">
        Customer Information
      </div>
      <div class="row">
        <span class="row-label">Name</span>
        <span class="row-value">${order.customer_name}</span>
      </div>
      ${order.company_name ? `
      <div class="row">
        <span class="row-label">Company</span>
        <span class="row-value">${order.company_name}</span>
      </div>
      ` : ''}
      <div class="row">
        <span class="row-label">Phone</span>
        <span class="row-value"><a href="tel:${order.customer_phone}" style="color: #059669; text-decoration: none; font-weight: 700;">${order.customer_phone}</a></span>
      </div>
      <div class="row">
        <span class="row-label">Email</span>
        <span class="row-value"><a href="mailto:${order.customer_email}" style="color: #0284C7; text-decoration: none; font-weight: 700;">${order.customer_email}</a></span>
      </div>
    </div>

    <!-- Route Summary -->
    <div class="card">
      <div style="font-size: 11px; font-weight: 700; color: #DC2626; text-transform: uppercase; margin-bottom: 4px;">
        Pickup: ${order.pickup_date} @ ${order.pickup_time}
      </div>
      <div style="color: #0F172A; font-weight: 600; font-size: 12px;">${order.pickup_address} ${order.pickup_unit ? `(${order.pickup_unit})` : ''}</div>
      <div style="color: #64748B; font-size: 11px;">Contact: ${order.pickup_contact_name || order.customer_name} (${order.pickup_contact_phone || order.customer_phone})</div>
      <div class="divider"></div>
      <div style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 4px;">
        Drop-Off: ${order.distance_km} km (${order.service_area})
      </div>
      <div style="color: #0F172A; font-weight: 600; font-size: 12px;">${order.delivery_address} ${order.delivery_unit ? `(${order.delivery_unit})` : ''}</div>
      <div style="color: #64748B; font-size: 11px;">Receiver: ${order.delivery_contact_name || order.customer_name} (${order.delivery_contact_phone || order.customer_phone})</div>
    </div>

    <!-- Cargo Summary -->
    <div class="card">
      <div class="row">
        <span class="row-label">Cargo Manifest</span>
        <span class="row-value">${order.item_description || order.item_type}</span>
      </div>
      <div class="row">
        <span class="row-label">Weight & Units</span>
        <span class="row-value">${order.weight_lbs} lbs &bull; ${order.quantity} units</span>
      </div>
      ${order.custom_instructions ? `
      <div class="row">
        <span class="row-label">Special Notes</span>
        <span class="row-value" style="color: #B45309; font-weight: 600;">${order.custom_instructions}</span>
      </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${adminUrl}" class="button">Open Admin Command Center &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
  };
};

export const createAdminNewOrderSms = (order: Order): string => {
  const origin = getOrigin();
  const pickupShort = order.pickup_address.split(',')[0].trim();
  const dropShort = order.delivery_address.split(',')[0].trim();

  return `🚨 FlashDrop NEW ORDER #${order.order_number}! $${order.total_price.toFixed(2)} CAD. ${order.customer_name} (${order.customer_phone}) booked ${order.vehicle_name}. Route: ${pickupShort} -> ${dropShort} (${order.distance_km}km). Dispatch: ${origin}/admin`;
};

// -------------------------------------------------------------
// 4. ADMIN: Status Change Email & SMS Notifications
// -------------------------------------------------------------
export const createAdminStatusEmail = (order: Order, prevStatus: OrderStatus, newStatus: OrderStatus, notes?: string) => {
  const origin = getOrigin();
  const adminUrl = `${origin}/admin`;

  const isQuoteAccepted = (prevStatus === 'quote_sent' && newStatus === 'confirmed') || (newStatus === 'confirmed' && !!order.quote_accepted_at);

  const subject = isQuoteAccepted
    ? `🎉 [QUOTE ACCEPTED] Order #${order.order_number} - ${order.customer_name} Confirmed ($${order.total_price.toFixed(2)} CAD)`
    : `📋 [STATUS UPDATE] Order #${order.order_number} -> ${newStatus.replace(/_/g, ' ').toUpperCase()}`;

  const preheader = isQuoteAccepted
    ? `Customer ${order.customer_name} accepted the price quotation of $${order.total_price.toFixed(2)} CAD for Order #${order.order_number}. Ready for driver assignment!`
    : `Order #${order.order_number} status updated to ${newStatus}. Assigned: ${order.assigned_driver_name || 'Unassigned'}.`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge ${isQuoteAccepted ? 'badge-green' : 'badge-blue'}">
        ${isQuoteAccepted ? '✓ Price Quotation Accepted by Client' : 'Dispatch Status Changed'}
      </span>
      <h2 style="color: #0F172A; font-size: 20px; font-weight: 900; margin: 12px 0 4px 0;">
        ${isQuoteAccepted ? `Quotation Accepted • #${order.order_number}` : `#${order.order_number}: ${newStatus.replace(/_/g, ' ').toUpperCase()}`}
      </h2>
      <p style="color: #64748B; font-size: 12px; margin: 0;">
        ${isQuoteAccepted
          ? `Customer officially accepted your quotation of $${order.total_price.toFixed(2)} CAD. Order is confirmed & ready for driver assignment.`
          : `Previous state: ${prevStatus.replace(/_/g, ' ')} &rarr; Current: ${newStatus.replace(/_/g, ' ')}`
        }
      </p>
    </div>

    <div class="card">
      <div class="row">
        <span class="row-label">Order Number</span>
        <span class="row-value" style="font-family: monospace; color: #0284C7;">#${order.order_number}</span>
      </div>
      <div class="row">
        <span class="row-label">Current Status</span>
        <span class="row-value" style="color: #059669; font-weight: 700; text-transform: uppercase;">
          ${isQuoteAccepted ? 'Quote Accepted (Confirmed)' : newStatus.replace(/_/g, ' ')}
        </span>
      </div>
      <div class="row">
        <span class="row-label">Assigned Courier</span>
        <span class="row-value">${order.assigned_driver_name || '⚠️ Unassigned — Ready to Dispatch'}</span>
      </div>
      ${notes ? `
      <div class="row">
        <span class="row-label">Update Notes</span>
        <span class="row-value" style="font-style: italic; color: #475569;">${notes}</span>
      </div>
      ` : ''}
      <div class="row">
        <span class="row-label">Customer</span>
        <span class="row-value">${order.customer_name} (${order.customer_phone})</span>
      </div>
      <div class="row">
        <span class="row-label">Route</span>
        <span class="row-value">${order.pickup_address.split(',')[0]} &rarr; ${order.delivery_address.split(',')[0]}</span>
      </div>
      <div class="row">
        <span class="row-label">Total Amount</span>
        <span class="row-value" style="color: #0F172A; font-weight: 700;">$${order.total_price.toFixed(2)} CAD</span>
      </div>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${adminUrl}" class="button">
        ${isQuoteAccepted ? 'Assign Driver in Admin Dashboard &rarr;' : 'View in Admin Dashboard &rarr;'}
      </a>
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
    plain: `${subject}\n\nOrder #${order.order_number} is now ${newStatus}.\nCustomer: ${order.customer_name}\nTotal: $${order.total_price.toFixed(2)} CAD\nDriver: ${order.assigned_driver_name || 'Unassigned'}\n\nManage in Admin: ${adminUrl}`,
  };
};

export const createAdminStatusSms = (order: Order, newStatus: OrderStatus, notes?: string): string => {
  const origin = getOrigin();
  const pickupShort = order.pickup_address.split(',')[0].trim();
  const dropShort = order.delivery_address.split(',')[0].trim();
  const driverInfo = order.assigned_driver_name ? ` [Driver: ${order.assigned_driver_name}]` : '';

  if (newStatus === 'confirmed' && (order.quote_accepted_at || order.quote_sent_at)) {
    return `🎉 FlashDrop: Quote ACCEPTED by ${order.customer_name} for Order #${order.order_number} ($${order.total_price.toFixed(2)} CAD). Assign driver: ${origin}/admin`;
  }

  return `📋 FlashDrop Order #${order.order_number} status is now ${newStatus.replace(/_/g, ' ').toUpperCase()}${driverInfo}. Route: ${pickupShort} -> ${dropShort}. Manage: ${origin}/admin`;
};

// Customer & Staff Password Reset Email Template
export const createPasswordResetEmail = (
  email: string,
  resetUrl: string,
  securityCode: string
): { subject: string; html: string } => {
  const subject = `Reset Your FlashDrop Express Password`;
  const preheader = `Use security code ${securityCode} or click the link to securely reset your password.`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-red">Security Notice</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 14px 0 4px 0;">Reset Your Password</h2>
      <p style="font-size: 13px; color: #64748B; margin: 0;">FlashDrop Express Commercial Account</p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      Hello,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      We received a request to reset the password for your FlashDrop Express account registered to <strong style="color: #0F172A;">${email}</strong>.
    </p>

    <div class="card" style="text-align: center; border-color: #FECACA; background-color: #FEF2F2; padding: 24px 20px;">
      <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #B91C1C; margin: 0 0 8px 0; font-weight: 700;">Your 6-Digit Security PIN</p>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #B91C1C; padding: 8px 0;">
        ${securityCode}
      </div>
      <p style="font-size: 11px; color: #7F1D1D; margin: 8px 0 0 0;">Valid for 30 minutes &bull; Single use only</p>
    </div>

    <div style="text-align: center; margin: 28px 0 24px 0;">
      <a href="${resetUrl}" class="button" style="padding: 16px 36px; font-size: 14px; display: inline-block;">Reset Password Directly &rarr;</a>
    </div>

    <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0 0 20px 0;">
      Or copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color: #C5161D; word-break: break-all; font-size: 11px;">${resetUrl}</a>
    </p>

    <div style="background-color: #F8FAFC; border-radius: 10px; padding: 16px; margin-top: 20px; border: 1px solid #E2E8F0;">
      <p style="font-size: 12px; color: #0F172A; margin: 0 0 4px 0; font-weight: 700;">Didn't request this change?</p>
      <p style="font-size: 11px; color: #64748B; margin: 0; line-height: 1.5;">
        If you did not request a password reset, please ignore this email. Your existing credentials remain completely secure.
      </p>
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
  };
};

// -------------------------------------------------------------
// 8. DRIVER: Job / Delivery Assigned Notification Email
// -------------------------------------------------------------
export const createDriverAssignedEmail = (
  order: Order,
  driver: Driver,
  settings?: BusinessSettings
): { subject: string; plain: string; html: string } => {
  const serviceLevel = formatDeliveryType(order.delivery_time_option);
  const subject = `[DISPATCH ASSIGNED] New Run #${order.order_number} Assigned to You — Action Required to Accept`;
  const preheader = `New delivery run #${order.order_number} (${order.vehicle_name} in ${order.service_area}). Accept assignment on your Driver Portal to unlock route, cargo manifest, and payout.`;
  const driverPortalUrl = `${getOrigin()}/#driver`;

  const plain = `FLASHDROP EXPRESS — DISPATCH ASSIGNMENT NOTICE
--------------------------------------------------
Driver: ${driver.name}
Assigned Order: #${order.order_number}
Service Priority: ${serviceLevel}
Assigned Vehicle Class: ${order.vehicle_name}
General Service Area: ${order.service_area}
Scheduled Pickup Window: ${order.pickup_date} at ${order.pickup_time}

IMPORTANT NOTICE — DISPATCH PROTECTION:
To ensure fair distribution of all delivery runs, full route street addresses, exact distance, customer contact information, cargo manifest, and trip compensation remain locked until you accept the assignment in your Driver Dashboard.

👉 ACCEPT ASSIGNMENT & UNLOCK MANIFEST:
${driverPortalUrl}

Once accepted in your Driver Portal, you will immediately unlock:
• Full pickup & delivery street addresses
• Google Maps turn-by-turn navigation
• Shipper & receiver direct contact phone numbers
• Itemized cargo specifications & weights
• Trip rate & compensation breakdown

(Note: Digital photo proof of delivery is mandatory upon drop-off.)`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-blue">New Dispatch Assignment &bull; Awaiting Acceptance</span>
      <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 12px 0 4px 0;">
        Order #${order.order_number} Assigned
      </h2>
      <p style="font-size: 13px; color: #64748B; margin: 0;">
        Assigned Courier: <strong style="color: #0F172A;">${driver.name}</strong> &bull; Vehicle: <strong>${order.vehicle_name}</strong>
      </p>
    </div>

    <!-- Security & Fair Dispatch Notice -->
    <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-left: 4px solid #D97706; border-radius: 12px; padding: 14px 18px; margin-bottom: 22px;">
      <div style="font-size: 12px; font-weight: 800; color: #92400E; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">
        🔒 Fair Dispatch Protection Active
      </div>
      <p style="font-size: 13px; color: #78350F; margin: 0; line-height: 1.5;">
        <strong>Attention ${driver.name}:</strong> You have been allocated a new delivery run. To ensure reliable and unbiased dispatch across our fleet, full route street addresses, customer contact numbers, cargo specifications, and payout details remain <strong>locked until you accept this assignment</strong> in your Driver Portal.
      </p>
    </div>

    <!-- High-Level Dispatch Specifications -->
    <div class="card">
      <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #C5161D; margin: 0 0 14px 0; font-weight: 800;">
        Dispatch Allocation Overview
      </h3>
      <div class="row">
        <span class="row-label">Order Reference:</span>
        <span class="row-value" style="font-family: monospace; color: #C5161D; font-weight: 700;">#${order.order_number}</span>
      </div>
      <div class="row">
        <span class="row-label">Service Priority:</span>
        <span class="row-value">${serviceLevel}</span>
      </div>
      <div class="row">
        <span class="row-label">Required Vehicle:</span>
        <span class="row-value" style="font-weight: 700; color: #0F172A;">${order.vehicle_name}</span>
      </div>
      <div class="row">
        <span class="row-label">Scheduled Pickup:</span>
        <span class="row-value" style="font-weight: 700; color: #0F172A;">${order.pickup_date} at ${order.pickup_time}</span>
      </div>
      <div class="row">
        <span class="row-label">General Service Area:</span>
        <span class="row-value">${order.service_area}</span>
      </div>
    </div>

    <!-- Locked Details Card -->
    <div class="card" style="background-color: #F8FAFC; border: 1px dashed #CBD5E1;">
      <div style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        🔒 Locked Delivery Manifest (Accept to Reveal)
      </div>

      <div class="row" style="color: #64748B;">
        <span class="row-label">Pickup Street Address:</span>
        <span class="row-value" style="font-style: italic; color: #94A3B8;">•••••••••••• (Locked until Accepted)</span>
      </div>
      <div class="row" style="color: #64748B;">
        <span class="row-label">Delivery Destination:</span>
        <span class="row-value" style="font-style: italic; color: #94A3B8;">•••••••••••• (Locked until Accepted)</span>
      </div>
      <div class="row" style="color: #64748B;">
        <span class="row-label">Total Distance:</span>
        <span class="row-value" style="font-style: italic; color: #94A3B8;">•••• km (${order.service_area})</span>
      </div>
      <div class="row" style="color: #64748B;">
        <span class="row-label">Cargo Manifest & Specs:</span>
        <span class="row-value" style="font-style: italic; color: #94A3B8;">•••••••••••• (Locked until Accepted)</span>
      </div>
      <div class="row" style="color: #64748B;">
        <span class="row-label">Shipper & Receiver Phone:</span>
        <span class="row-value" style="font-style: italic; color: #94A3B8;">•••••••••••• (Locked until Accepted)</span>
      </div>
      <div class="row" style="color: #64748B;">
        <span class="row-label">Trip Compensation / Rate:</span>
        <span class="row-value" style="font-style: italic; color: #94A3B8;">$•••••• CAD (Locked until Accepted)</span>
      </div>
    </div>

    <!-- Action CTA -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${driverPortalUrl}" class="button" style="padding: 16px 36px; font-size: 14px; display: inline-block; background-color: #059669; text-decoration: none; border-radius: 10px; font-weight: 800; color: #FFFFFF !important;">
        👉 Accept Assignment on Driver Portal &rarr;
      </a>
      <p style="font-size: 11px; color: #64748B; margin-top: 10px;">
        Accepting unlocks full addresses, GPS turn-by-turn navigation, shipper contacts, and payout.
        <br />
        Digital photo proof of delivery is mandatory upon drop-off.
      </p>
    </div>
  `;

  return {
    subject,
    plain,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
  };
};


