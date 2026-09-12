import { Order, OrderStatus, BusinessSettings } from '../types/order';

const ADMIN_PHONE_DEFAULT = '+1 647 804 9775';
const BASE_DOMAIN = 'https://flashdropexpress.com';

const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return BASE_DOMAIN;
};

// Base responsive HTML wrapper for FlashDrop Express branded emails
const wrapHtmlEmail = (title: string, preheader: string, contentHtml: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0D14; color: #E2E8F0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111624; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1A0507 0%, #111624 100%); padding: 28px 24px; text-align: center; border-bottom: 2px solid #C5161D; }
    .logo-text { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF; text-transform: uppercase; margin: 0; }
    .logo-red { color: #C5161D; }
    .tagline { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94A3B8; margin-top: 4px; }
    .content { padding: 32px 24px; }
    .card { background-color: #0B0F17; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .badge-red { background-color: #3F0D12; color: #FCA5A5; border: 1px solid #7F1D1D; }
    .badge-green { background-color: #064E3B; color: #6EE7B7; border: 1px solid #047857; }
    .badge-blue { background-color: #172554; color: #93C5FD; border: 1px solid #1E40AF; }
    .button { display: inline-block; background-color: #C5161D; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; font-weight: 800; font-size: 13px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(197, 22, 29, 0.35); }
    .button:hover { background-color: #A51218; }
    .footer { padding: 24px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #1E293B; background-color: #0B0F17; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
    .row-label { color: #94A3B8; }
    .row-value { color: #F8FAFC; font-weight: 600; text-align: right; }
    .divider { border-top: 1px solid #1E293B; margin: 14px 0; }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 24px 12px; background-color: #07090E;">
    <tr>
      <td align="center">
        <div class="container">
          <div class="header">
            <h1 class="logo-text">FLASH<span class="logo-red">DROP</span> EXPRESS</h1>
            <div class="tagline">Greater Toronto Area Rapid Logistics & Courier</div>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; color: #94A3B8; font-weight: 600;">FlashDrop Express GTA Operations</p>
            <p style="margin: 0 0 8px 0;">24/7 Hotline: ${ADMIN_PHONE_DEFAULT} &bull; Email: support@flashdropexpress.com</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} FlashDrop Express. All commercial courier rights reserved.</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// -------------------------------------------------------------
// 1. CUSTOMER: New Order Confirmation Email
// -------------------------------------------------------------
export const createCustomerOrderEmail = (order: Order, settings: BusinessSettings) => {
  const origin = getOrigin();
  const trackUrl = `${origin}/?track=${order.order_number}`;

  const subject = `Order Confirmed: #${order.order_number} - FlashDrop Express`;
  const preheader = `Your delivery order #${order.order_number} has been received and scheduled for dispatch.`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-green">Order Confirmed & Scheduled</span>
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">
        Thank You, ${order.customer_name}!
      </h2>
      <p style="color: #94A3B8; font-size: 13px; margin: 0;">
        Your commercial delivery has been logged with FlashDrop Express GTA dispatch desk.
      </p>
    </div>

    <!-- Order Header Card -->
    <div class="card">
      <div class="row">
        <span class="row-label">Order Reference</span>
        <span class="row-value" style="font-family: monospace; color: #38BDF8; font-size: 14px;">#${order.order_number}</span>
      </div>
      <div class="row">
        <span class="row-label">Scheduled Pickup</span>
        <span class="row-value">${order.pickup_date} at ${order.pickup_time}</span>
      </div>
      <div class="row">
        <span class="row-label">Delivery Priority</span>
        <span class="row-value" style="text-transform: uppercase;">${order.delivery_time_option}</span>
      </div>
      <div class="row">
        <span class="row-label">Assigned Fleet Vehicle</span>
        <span class="row-value">${order.vehicle_name}</span>
      </div>
    </div>

    <!-- Route Card -->
    <div class="card">
      <div style="margin-bottom: 14px;">
        <div style="font-size: 11px; font-weight: 700; color: #F87171; text-transform: uppercase; margin-bottom: 4px;">
          📍 1. Pickup Location
        </div>
        <div style="color: #FFFFFF; font-weight: 700; font-size: 13px;">${order.pickup_address}</div>
        ${order.pickup_unit ? `<div style="color: #FCD34D; font-size: 11px; margin-top: 2px;">Dock/Unit: ${order.pickup_unit}</div>` : ''}
        <div style="color: #94A3B8; font-size: 11px; margin-top: 2px;">Contact: ${order.pickup_contact_name || order.customer_name} (${order.pickup_contact_phone || order.customer_phone})</div>
      </div>
      <div class="divider"></div>
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; margin-bottom: 4px;">
          🏁 2. Drop-Off Destination
        </div>
        <div style="color: #FFFFFF; font-weight: 700; font-size: 13px;">${order.delivery_address}</div>
        ${order.delivery_unit ? `<div style="color: #67E8F9; font-size: 11px; margin-top: 2px;">Unit/Buzzer: ${order.delivery_unit}</div>` : ''}
        <div style="color: #94A3B8; font-size: 11px; margin-top: 2px;">Receiver: ${order.delivery_contact_name || order.customer_name} (${order.delivery_contact_phone || order.customer_phone})</div>
      </div>
    </div>

    <!-- Cargo & Payment Summary -->
    <div class="card">
      <div class="row">
        <span class="row-label">Cargo Manifest</span>
        <span class="row-value">${order.item_description || order.item_type} (${order.quantity} units, ${order.weight_lbs} lbs)</span>
      </div>
      <div class="row">
        <span class="row-label">Estimated Distance</span>
        <span class="row-value">${order.distance_km} km (${order.service_area})</span>
      </div>
      <div class="divider"></div>
      <div class="row">
        <span class="row-label">Base Freight</span>
        <span class="row-value">$${(order.base_price || 0).toFixed(2)} CAD</span>
      </div>
      <div class="row">
        <span class="row-label">HST (13%)</span>
        <span class="row-value">$${(order.tax_amount || (order.total_price * 0.13 / 1.13)).toFixed(2)} CAD</span>
      </div>
      <div class="row" style="font-size: 15px; margin-top: 6px;">
        <span class="row-label" style="color: #FFFFFF; font-weight: 800;">Total Amount</span>
        <span class="row-value" style="color: #34D399; font-weight: 900; font-size: 16px;">$${order.total_price.toFixed(2)} CAD</span>
      </div>
      <div class="row" style="margin-top: 4px;">
        <span class="row-label">Payment Terms</span>
        <span class="row-value">${order.payment_status === 'paid' ? 'Paid in Full (Card Online)' : 'Pay on Delivery / Net 30'}</span>
      </div>
    </div>

    <!-- CTA Tracking Button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${trackUrl}" class="button">Track Your Courier in Real-Time &rarr;</a>
      <p style="color: #64748B; font-size: 11px; margin-top: 10px;">
        Track live driver dispatch, GPS route progression, and digital proof of delivery.
      </p>
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
    plain: `FlashDrop Express: Order Confirmed #${order.order_number}! Scheduled for ${order.pickup_date} at ${order.pickup_time}. Total: $${order.total_price.toFixed(2)} CAD. Track live: ${trackUrl}`,
  };
};

// -------------------------------------------------------------
// 2. CUSTOMER: Order Status Changed Email
// -------------------------------------------------------------
export const createCustomerStatusEmail = (order: Order, prevStatus: OrderStatus, newStatus: OrderStatus, notes?: string) => {
  const origin = getOrigin();
  const trackUrl = `${origin}/?track=${order.order_number}`;

  const statusTitles: Record<OrderStatus, string> = {
    submitted: 'Order Submitted to Queue',
    confirmed: 'Order Confirmed by Dispatch',
    assigned: 'Driver Assigned & Scheduled',
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
    confirmed: 'Your order has been officially verified and accepted for delivery.',
    assigned: `A fleet courier (${order.assigned_driver_name || 'Assigned Driver'}) has been dispatched to your order.`,
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

  const subject = `Delivery Status Update: #${order.order_number} is now ${currentTitle}`;
  const preheader = `Order #${order.order_number} update: ${currentMsg}`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge ${newStatus === 'delivered' ? 'badge-green' : newStatus === 'cancelled' ? 'badge-red' : 'badge-blue'}">
        ${currentTitle}
      </span>
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">
        Order #${order.order_number}
      </h2>
      <p style="color: #94A3B8; font-size: 13px; margin: 0;">
        ${currentMsg}
      </p>
    </div>

    <!-- Status Details Card -->
    <div class="card">
      <div class="row">
        <span class="row-label">Status</span>
        <span class="row-value" style="color: ${newStatus === 'delivered' ? '#34D399' : '#38BDF8'}; text-transform: uppercase;">
          ${newStatus.replace(/_/g, ' ')}
        </span>
      </div>
      ${order.assigned_driver_name ? `
      <div class="row">
        <span class="row-label">Assigned Courier</span>
        <span class="row-value">${order.assigned_driver_name} (${order.vehicle_name})</span>
      </div>
      ` : ''}
      ${notes ? `
      <div class="row">
        <span class="row-label">Dispatch Notes</span>
        <span class="row-value" style="font-style: italic;">${notes}</span>
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
        <span class="row-value" style="color: #34D399;">${order.proof_of_delivery.recipient_name}</span>
      </div>
      <div class="row">
        <span class="row-label">Delivered Timestamp</span>
        <span class="row-value">${new Date(order.proof_of_delivery.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      ` : ''}
    </div>

    <!-- Live Tracking Button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${trackUrl}" class="button">View Live Order Tracking &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
    plain: `FlashDrop Express Update: Order #${order.order_number} is now ${currentTitle}. ${currentMsg} Track: ${trackUrl}`,
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
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">
        Order #${order.order_number} Received
      </h2>
      <p style="color: #94A3B8; font-size: 13px; margin: 0;">
        A new commercial delivery order requires driver allocation and dispatch.
      </p>
    </div>

    <!-- Admin Order Summary Card -->
    <div class="card">
      <div class="row">
        <span class="row-label">Order Value</span>
        <span class="row-value" style="color: #34D399; font-size: 16px; font-weight: 900;">$${order.total_price.toFixed(2)} CAD</span>
      </div>
      <div class="row">
        <span class="row-label">Payment Status</span>
        <span class="row-value">${order.payment_status.toUpperCase()}</span>
      </div>
      <div class="row">
        <span class="row-label">Service Level</span>
        <span class="row-value" style="text-transform: uppercase;">${order.delivery_time_option}</span>
      </div>
      <div class="row">
        <span class="row-label">Vehicle Type</span>
        <span class="row-value">${order.vehicle_name}</span>
      </div>
    </div>

    <!-- Customer Details -->
    <div class="card">
      <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 8px;">
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
        <span class="row-value"><a href="tel:${order.customer_phone}" style="color: #34D399; text-decoration: none;">${order.customer_phone}</a></span>
      </div>
      <div class="row">
        <span class="row-label">Email</span>
        <span class="row-value"><a href="mailto:${order.customer_email}" style="color: #38BDF8; text-decoration: none;">${order.customer_email}</a></span>
      </div>
    </div>

    <!-- Route Summary -->
    <div class="card">
      <div style="font-size: 11px; font-weight: 700; color: #F87171; text-transform: uppercase; margin-bottom: 4px;">
        Pickup: ${order.pickup_date} @ ${order.pickup_time}
      </div>
      <div style="color: #FFFFFF; font-weight: 600; font-size: 12px;">${order.pickup_address} ${order.pickup_unit ? `(${order.pickup_unit})` : ''}</div>
      <div style="color: #94A3B8; font-size: 11px;">Contact: ${order.pickup_contact_name || order.customer_name} (${order.pickup_contact_phone || order.customer_phone})</div>
      <div class="divider"></div>
      <div style="font-size: 11px; font-weight: 700; color: #34D399; text-transform: uppercase; margin-bottom: 4px;">
        Drop-Off: ${order.distance_km} km (${order.service_area})
      </div>
      <div style="color: #FFFFFF; font-weight: 600; font-size: 12px;">${order.delivery_address} ${order.delivery_unit ? `(${order.delivery_unit})` : ''}</div>
      <div style="color: #94A3B8; font-size: 11px;">Receiver: ${order.delivery_contact_name || order.customer_name} (${order.delivery_contact_phone || order.customer_phone})</div>
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
        <span class="row-value" style="color: #FCD34D;">${order.custom_instructions}</span>
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

  const subject = `📋 [STATUS UPDATE] Order #${order.order_number} -> ${newStatus.replace(/_/g, ' ').toUpperCase()}`;
  const preheader = `Order #${order.order_number} status updated to ${newStatus}. Assigned: ${order.assigned_driver_name || 'Unassigned'}.`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-blue">Dispatch Status Changed</span>
      <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 900; margin: 12px 0 4px 0;">
        #${order.order_number}: ${newStatus.replace(/_/g, ' ').toUpperCase()}
      </h2>
      <p style="color: #94A3B8; font-size: 12px; margin: 0;">
        Previous state: ${prevStatus.replace(/_/g, ' ')} &rarr; Current: ${newStatus.replace(/_/g, ' ')}
      </p>
    </div>

    <div class="card">
      <div class="row">
        <span class="row-label">Order Number</span>
        <span class="row-value" style="font-family: monospace; color: #38BDF8;">#${order.order_number}</span>
      </div>
      <div class="row">
        <span class="row-label">Current Status</span>
        <span class="row-value" style="color: #34D399; font-weight: 700; text-transform: uppercase;">${newStatus.replace(/_/g, ' ')}</span>
      </div>
      <div class="row">
        <span class="row-label">Assigned Courier</span>
        <span class="row-value">${order.assigned_driver_name || 'Unassigned / Queue'}</span>
      </div>
      ${notes ? `
      <div class="row">
        <span class="row-label">Update Notes</span>
        <span class="row-value" style="font-style: italic;">${notes}</span>
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
        <span class="row-value">$${order.total_price.toFixed(2)} CAD</span>
      </div>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${adminUrl}" class="button">View in Admin Dashboard &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
  };
};

export const createAdminStatusSms = (order: Order, newStatus: OrderStatus, notes?: string): string => {
  const origin = getOrigin();
  const pickupShort = order.pickup_address.split(',')[0].trim();
  const dropShort = order.delivery_address.split(',')[0].trim();
  const driverInfo = order.assigned_driver_name ? ` [Driver: ${order.assigned_driver_name}]` : '';

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
      <h2 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 14px 0 4px 0;">Reset Your Password</h2>
      <p style="font-size: 13px; color: #94A3B8; margin: 0;">FlashDrop Express Commercial Account</p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1;">
      Hello,
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #CBD5E1;">
      We received a request to reset the password for your FlashDrop Express account registered to <strong style="color: #FFFFFF;">${email}</strong>.
    </p>

    <div class="card" style="text-align: center; border-color: #7F1D1D; background: #1A0709; padding: 24px 20px;">
      <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #FCA5A5; margin: 0 0 8px 0; font-weight: 700;">Your 6-Digit Security PIN</p>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #FFFFFF; padding: 8px 0; text-shadow: 0 0 16px rgba(239, 68, 68, 0.4);">
        ${securityCode}
      </div>
      <p style="font-size: 11px; color: #94A3B8; margin: 8px 0 0 0;">Valid for 30 minutes &bull; Single use only</p>
    </div>

    <div style="text-align: center; margin: 28px 0 24px 0;">
      <a href="${resetUrl}" class="button" style="padding: 16px 36px; font-size: 14px; display: inline-block;">Reset Password Directly &rarr;</a>
    </div>

    <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0 0 20px 0;">
      Or copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color: #EF4444; word-break: break-all; font-size: 11px;">${resetUrl}</a>
    </p>

    <div style="background-color: #0F172A; border-radius: 10px; padding: 16px; margin-top: 20px; border: 1px solid #1E293B;">
      <p style="font-size: 12px; color: #E2E8F0; margin: 0 0 4px 0; font-weight: 700;">Didn't request this change?</p>
      <p style="font-size: 11px; color: #94A3B8; margin: 0; line-height: 1.5;">
        If you did not request a password reset, please ignore this email. Your existing credentials remain completely secure.
      </p>
    </div>
  `;

  return {
    subject,
    html: wrapHtmlEmail(subject, preheader, contentHtml),
  };
};

