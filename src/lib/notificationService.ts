import { Order, OrderStatus, BusinessSettings, Driver } from '../types/order';
import { NotificationLog, NotificationChannel, NotificationRecipientType, NotificationEvent } from '../types/notification';
import {
  createCustomerOrderEmail,
  createCustomerQuoteReadyEmail,
  createCustomerStatusEmail,
  createAdminNewOrderEmail,
  createAdminNewOrderSms,
  createAdminStatusEmail,
  createAdminStatusSms,
  createPasswordResetEmail,
  createDriverAssignedEmail,
} from './notificationTemplates';
import { supabase, isSupabaseConfigured } from './supabase';

const NOTIFICATIONS_STORAGE_KEY = 'flashdrop_notifications_log';

export const normalizePhone = (num?: string): string => {
  if (!num) return '';
  const digits = num.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '';
};

export const ADMIN_PHONE_DEFAULT = '+16478049775';
export const ADMIN_PHONE_TARGET = ADMIN_PHONE_DEFAULT;
export const ADMIN_EMAIL_TARGET = (import.meta.env.VITE_ADMIN_EMAIL as string) || 'support@flashdropexpress.com';
export const ADMIN_BACKUP_EMAIL_DEFAULT = (import.meta.env.VITE_ADMIN_BACKUP_EMAIL as string) || 'support@flashdropexpress.com';

export const resolveAdminEmailTarget = (candidate?: string, backupCandidate?: string): string[] => {
  const list: string[] = [];
  const primaryCandidate = candidate?.trim();
  const primary = (primaryCandidate || ADMIN_EMAIL_TARGET).trim();

  if (primary) {
    if (primary.includes(',')) {
      primary.split(',').forEach((e) => {
        const trimmed = e.trim();
        if (trimmed && !list.includes(trimmed)) {
          list.push(trimmed);
        }
      });
    } else if (!list.includes(primary)) {
      list.push(primary);
    }
  }

  const backup = (backupCandidate || (import.meta.env.VITE_ADMIN_BACKUP_EMAIL as string) || ADMIN_BACKUP_EMAIL_DEFAULT).trim();
  if (backup && !list.includes(backup)) {
    list.push(backup);
  }

  if (list.length === 0) {
    list.push('support@flashdropexpress.com');
  }

  return list;
};

class NotificationService {
  private logs: NotificationLog[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      }
    } catch (err) {
      console.warn('Failed to load notification logs from storage:', err);
    }
  }

  private saveLogs() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.logs.slice(0, 100)));
      }
    } catch (err) {
      console.warn('Failed to save notification logs to storage:', err);
    }
  }

  public getLogs(): NotificationLog[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  // Dispatch individual notification to backend / serverless / simulation
  public async dispatchNotification(params: {
    order_id: string;
    order_number: string;
    event: NotificationEvent;
    channel: NotificationChannel;
    recipient_type: NotificationRecipientType;
    destination: string;
    subject?: string;
    message: string;
    html_body?: string;
    metadata?: Record<string, any>;
  }): Promise<NotificationLog> {
    const cleanDestination = params.channel === 'sms' ? normalizePhone(params.destination) : params.destination;

    const log: NotificationLog = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      order_id: params.order_id,
      order_number: params.order_number,
      event: params.event,
      channel: params.channel,
      recipient_type: params.recipient_type,
      destination: cleanDestination,
      subject: params.subject,
      message: params.message,
      html_body: params.html_body,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: params.metadata,
    };

    // 1. Live Notification Dispatch via Serverless / Backend Proxy
    const resendKey = (import.meta.env.VITE_RESEND_API_KEY as string) || '';
    if (typeof window !== 'undefined') {
      const endpoints = ['/.netlify/functions/send-notification', '/api/send-notification'];
      const payload = {
        ...log,
        resend_api_key: resendKey,
        carrier_gateway: params.metadata?.carrier_gateway || 'freedom',
        twilio_account_sid: params.metadata?.twilio_account_sid || (import.meta.env.VITE_TWILIO_ACCOUNT_SID as string) || '',
        twilio_auth_token: params.metadata?.twilio_auth_token || (import.meta.env.VITE_TWILIO_AUTH_TOKEN as string) || '',
        twilio_from_phone: normalizePhone(params.metadata?.twilio_from_phone || (import.meta.env.VITE_TWILIO_FROM_PHONE as string) || '+13653603570'),
      };

      let delivered = false;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const data = await res.json();
            log.status = 'delivered';
            delivered = true;
            console.log(`%c[FlashDrop Live Dispatch SUCCESS] via ${ep}`, 'color: #10B981; font-weight: bold;', data);
            break;
          }
        } catch {
          // try next
        }
      }

      // Fallback: If in an environment where proxy is unavailable, try direct Resend API
      if (!delivered && params.channel === 'email') {
        const toList = cleanDestination.includes(',')
          ? cleanDestination.split(',').map((s) => s.trim()).filter(Boolean)
          : cleanDestination;

        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'FlashDrop Express <support@flashdropexpress.com>',
            to: toList,
            reply_to: 'support@flashdropexpress.com',
            subject: params.subject || `FlashDrop Express Order #${params.order_number}`,
            html: params.html_body || `<p>${params.message}</p>`,
          }),
        }).catch(() => {});
      }

      // Direct Twilio Client Fallback if proxy was unreachable
      if (!delivered && params.channel === 'sms') {
        const twilioSid = payload.twilio_account_sid;
        const twilioToken = payload.twilio_auth_token;
        const twilioFrom = payload.twilio_from_phone;

        if (twilioSid && twilioToken && twilioFrom && cleanDestination) {
          try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
            const authHeader = 'Basic ' + btoa(`${twilioSid}:${twilioToken}`);
            const bodyParams = new URLSearchParams({
              To: cleanDestination,
              From: twilioFrom,
              Body: params.message,
            });

            let tRes = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: authHeader,
              },
              body: bodyParams.toString(),
            });
            let tData = await tRes.json();

            // If trial account requires predefined template (error 572006 or 400 parameter rejection)
            if (tData && (tData.code === 572006 || tData.status === 400)) {
              const fallbackTemplate = params.event === 'status_changed' ? 'sms_delivery_updates' : 'sms_order_confirmation';
              const fallbackParams = new URLSearchParams({
                To: cleanDestination,
                From: twilioFrom,
                Body: fallbackTemplate,
              });
              tRes = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  Authorization: authHeader,
                },
                body: fallbackParams.toString(),
              });
              tData = await tRes.json();
            }

            if (tData?.sid) {
              log.status = 'delivered';
              console.log('%c[Twilio Direct Client SMS SUCCESS]', 'color: #10B981; font-weight: bold;', tData.sid);
            }
          } catch (tErr) {
            console.warn('Twilio direct client SMS warning:', tErr);
          }
        }
      }
    }

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        supabase
          .from('order_status_history')
          .insert([
            {
              order_id: params.order_id.length === 36 ? params.order_id : null,
              status: params.event,
              notes: `[${params.channel.toUpperCase()} to ${params.recipient_type.toUpperCase()} (${params.destination})]: ${params.subject || params.message}`,
            },
          ])
          .then();
      } catch {
        // Table fallback
      }
    }

    // 3. Log into store audit memory
    this.logs.unshift(log);
    this.saveLogs();

    console.log(`%c[FlashDrop Notification ${params.channel.toUpperCase()}] to ${params.recipient_type} (${params.destination})`, 'color: #C5161D; font-weight: bold;', {
      subject: params.subject,
      message: params.message,
      order: params.order_number,
    });

    return log;
  }

  // -----------------------------------------------------------------
  // High-Level Trigger: Order Placed / Created
  // -----------------------------------------------------------------
  public async notifyOrderCreated(order: Order, settings: BusinessSettings): Promise<NotificationLog[]> {
    const logs: NotificationLog[] = [];
    const adminEmails = resolveAdminEmailTarget(settings?.admin_notification_email || settings?.email, settings?.admin_backup_email);
    const adminEmailStr = adminEmails.join(', ');
    const adminPhone = settings?.admin_sms_phone || settings?.phone || ADMIN_PHONE_DEFAULT;

    // 1. Customer: EMAIL ONLY
    if (order.customer_email) {
      const customerEmail = createCustomerOrderEmail(order, settings);
      const custLog = await this.dispatchNotification({
        order_id: order.id,
        order_number: order.order_number,
        event: 'order_created',
        channel: 'email',
        recipient_type: 'customer',
        destination: order.customer_email,
        subject: customerEmail.subject,
        message: customerEmail.plain,
        html_body: customerEmail.html,
      });
      logs.push(custLog);
    }

    // 2. Admin: EMAIL (Delivered to both support@flashdropexpress.com and verified backup Gmail)
    const adminEmailPayload = createAdminNewOrderEmail(order, settings);
    const adminEmailLog = await this.dispatchNotification({
      order_id: order.id,
      order_number: order.order_number,
      event: 'order_created',
      channel: 'email',
      recipient_type: 'admin',
      destination: adminEmailStr,
      subject: adminEmailPayload.subject,
      message: `New Order #${order.order_number} created by ${order.customer_name}. Total: $${order.total_price.toFixed(2)} CAD.`,
      html_body: adminEmailPayload.html,
      metadata: {
        admin_email: adminEmailStr,
      },
    });
    logs.push(adminEmailLog);

    // 3. Admin: SMS to +1 647 804 9775 (Freedom Mobile Gateway)
    const adminSmsText = createAdminNewOrderSms(order);
    const adminSmsLog = await this.dispatchNotification({
      order_id: order.id,
      order_number: order.order_number,
      event: 'order_created',
      channel: 'sms',
      recipient_type: 'admin',
      destination: adminPhone,
      message: adminSmsText,
      metadata: { 
        carrier_gateway: settings?.carrier_sms_gateway || 'freedom',
        admin_email: adminEmailStr,
        twilio_account_sid: settings?.twilio_account_sid || (import.meta.env.VITE_TWILIO_ACCOUNT_SID as string) || '',
        twilio_auth_token: settings?.twilio_auth_token || (import.meta.env.VITE_TWILIO_AUTH_TOKEN as string) || '',
        twilio_from_phone: settings?.twilio_from_phone || (import.meta.env.VITE_TWILIO_FROM_PHONE as string) || '+13653603570',
      },
    });
    logs.push(adminSmsLog);

    return logs;
  }

  // -----------------------------------------------------------------
  // High-Level Trigger: Official Price Quote Sent to Customer
  // -----------------------------------------------------------------
  public async notifyQuoteSent(order: Order, settings: BusinessSettings): Promise<NotificationLog[]> {
    const logs: NotificationLog[] = [];

    // 1. Customer: Branded Official Quotation Email
    if (order.customer_email) {
      const quoteEmail = createCustomerQuoteReadyEmail(order, settings);
      const custLog = await this.dispatchNotification({
        order_id: order.id,
        order_number: order.order_number,
        event: 'quote_sent' as any,
        channel: 'email',
        recipient_type: 'customer',
        destination: order.customer_email,
        subject: quoteEmail.subject,
        message: quoteEmail.plain,
        html_body: quoteEmail.html,
      });
      logs.push(custLog);
    }

    return logs;
  }

  // -----------------------------------------------------------------
  // High-Level Trigger: Driver Assigned to Order
  // -----------------------------------------------------------------
  public async notifyDriverOrderAssigned(
    order: Order,
    driver: Driver,
    settings?: BusinessSettings
  ): Promise<NotificationLog | null> {
    if (!driver.email || !driver.email.trim()) {
      console.warn(`[Driver Dispatch Notification] Driver ${driver.name} has no email address configured.`);
      return null;
    }

    const emailPayload = createDriverAssignedEmail(order, driver, settings);
    return this.dispatchNotification({
      order_id: order.id,
      order_number: order.order_number,
      event: 'driver_assigned',
      channel: 'email',
      recipient_type: 'driver',
      destination: driver.email.trim(),
      subject: emailPayload.subject,
      message: emailPayload.plain,
      html_body: emailPayload.html,
      metadata: {
        driver_id: driver.id,
        driver_name: driver.name,
        driver_email: driver.email,
      },
    });
  }

  // -----------------------------------------------------------------
  // High-Level Trigger: Status Changed
  // -----------------------------------------------------------------
  public async notifyOrderStatusChanged(
    order: Order,
    prevStatus: OrderStatus,
    newStatus: OrderStatus,
    notes?: string,
    settings?: BusinessSettings
  ): Promise<NotificationLog[]> {
    const logs: NotificationLog[] = [];
    const adminEmails = resolveAdminEmailTarget(settings?.admin_notification_email || settings?.email, settings?.admin_backup_email);
    const adminEmailStr = adminEmails.join(', ');
    const adminPhone = settings?.admin_sms_phone || settings?.phone || ADMIN_PHONE_DEFAULT;

    // 1. Customer: EMAIL ONLY
    if (order.customer_email) {
      const customerStatusEmail = createCustomerStatusEmail(order, prevStatus, newStatus, notes);
      const custLog = await this.dispatchNotification({
        order_id: order.id,
        order_number: order.order_number,
        event: 'status_changed',
        channel: 'email',
        recipient_type: 'customer',
        destination: order.customer_email,
        subject: customerStatusEmail.subject,
        message: customerStatusEmail.plain,
        html_body: customerStatusEmail.html,
        metadata: { prevStatus, newStatus, notes },
      });
      logs.push(custLog);
    }

    // 2. Admin: EMAIL
    const adminStatusEmail = createAdminStatusEmail(order, prevStatus, newStatus, notes);
    const adminEmailLog = await this.dispatchNotification({
      order_id: order.id,
      order_number: order.order_number,
      event: 'status_changed',
      channel: 'email',
      recipient_type: 'admin',
      destination: adminEmailStr,
      subject: adminStatusEmail.subject,
      message: `Order #${order.order_number} updated from ${prevStatus} to ${newStatus}.`,
      html_body: adminStatusEmail.html,
      metadata: { prevStatus, newStatus, notes, admin_email: adminEmailStr },
    });
    logs.push(adminEmailLog);

    // 3. Admin: SMS to +1 647 804 9775
    const adminSmsText = createAdminStatusSms(order, newStatus, notes);
    const adminSmsLog = await this.dispatchNotification({
      order_id: order.id,
      order_number: order.order_number,
      event: 'status_changed',
      channel: 'sms',
      recipient_type: 'admin',
      destination: adminPhone,
      message: adminSmsText,
      metadata: { 
        prevStatus, 
        newStatus, 
        carrier_gateway: settings?.carrier_sms_gateway || 'freedom',
        admin_email: adminEmailStr,
        twilio_account_sid: settings?.twilio_account_sid || (import.meta.env.VITE_TWILIO_ACCOUNT_SID as string) || '',
        twilio_auth_token: settings?.twilio_auth_token || (import.meta.env.VITE_TWILIO_AUTH_TOKEN as string) || '',
        twilio_from_phone: settings?.twilio_from_phone || (import.meta.env.VITE_TWILIO_FROM_PHONE as string) || '+13653603570',
      },
    });
    logs.push(adminSmsLog);

    return logs;
  }

  // -----------------------------------------------------------------
  // Test Pipeline Trigger for Admin Dashboard
  // -----------------------------------------------------------------
  public async sendTestNotification(customCustomerEmail?: string): Promise<NotificationLog[]> {
    const dummyOrder: Order = {
      id: 'test-order-sample',
      order_number: 'FDTEST01',
      customer_name: 'Test GTA Logistics Client',
      customer_phone: '+1 (416) 555-0199',
      customer_email: customCustomerEmail || 'customer@example.com',
      company_name: 'Commercial Construction Inc',
      pickup_address: '100 King St W, Toronto, ON M5X 1A9',
      pickup_unit: 'Dock 4',
      pickup_contact_name: 'David Shipper',
      pickup_contact_phone: '+1 (416) 555-0199',
      delivery_address: '2500 Meadowvale Blvd, Mississauga, ON L5N 5S2',
      delivery_unit: 'Bay 2',
      delivery_contact_name: 'Receiving Dock Manager',
      delivery_contact_phone: '+1 (905) 555-0188',
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_time: '14:30',
      delivery_time_option: 'asap',
      service_area: 'Mississauga',
      vehicle_id: 'v-cargovan',
      vehicle_slug: 'cargo_van',
      vehicle_name: 'Cargo Van (High-Roof)',
      item_type: 'paint_pails',
      item_description: 'Industrial Coating Pails (Test Sample)',
      weight_lbs: 1200,
      quantity: 24,
      distance_km: 38,
      base_price: 180,
      excess_km_charge: 0,
      after_hours_charge: 0,
      waiting_charge: 0,
      labor_charge: 0,
      subtotal: 180,
      tax_amount: 23.4,
      total_price: 203.4,
      payment_status: 'paid',
      order_status: 'confirmed',
      assigned_driver_id: null,
      assigned_driver_name: 'Lead Driver Nidhin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.notifyOrderCreated(dummyOrder, {
      name: 'FlashDrop Express',
      phone: ADMIN_PHONE_DEFAULT,
      email: ADMIN_EMAIL_TARGET,
      domain: 'flashdropexpress.com',
      tagline: 'Fast. Reliable. Delivered.',
      operating_hours_start: '08:00',
      operating_hours_end: '17:00',
      operating_days: 'Monday - Saturday',
      after_hours_multiplier: 1.5,
      waiting_rate_hourly: 25,
      labor_rate_hourly: 30,
      short_redirect_fee: 18,
      hst_enabled: true,
      hst_rate: 0.13,
    });
  }

  // Send branded password reset email via verified Resend domain
  public async sendPasswordResetNotification(
    email: string,
    resetUrl: string,
    securityCode: string
  ): Promise<NotificationLog> {
    const emailData = createPasswordResetEmail(email, resetUrl, securityCode);

    return this.dispatchNotification({
      order_id: 'auth_reset',
      order_number: 'SECURITY',
      event: 'password_reset',
      channel: 'email',
      recipient_type: 'customer',
      destination: email,
      subject: emailData.subject,
      message: `Your FlashDrop Express reset PIN is ${securityCode}. Reset link: ${resetUrl}`,
      html_body: emailData.html,
    });
  }
}

export const notificationService = new NotificationService();
