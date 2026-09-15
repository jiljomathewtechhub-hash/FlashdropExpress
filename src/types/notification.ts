export type NotificationChannel = 'email' | 'sms';
export type NotificationRecipientType = 'customer' | 'admin' | 'driver';
export type NotificationEvent = 'order_created' | 'status_changed' | 'password_reset' | 'test' | 'driver_assigned' | 'quote_sent';
export type NotificationStatus = 'sent' | 'delivered' | 'failed';

export interface NotificationLog {
  id: string;
  order_id: string;
  order_number: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient_type: NotificationRecipientType;
  destination: string; // email address or phone number
  subject?: string;
  message: string; // plain text for SMS or preview
  html_body?: string; // rich responsive HTML email
  status: NotificationStatus;
  sent_at: string;
  metadata?: Record<string, any>;
}

export interface SendNotificationRequest {
  channel: NotificationChannel;
  recipient_type: NotificationRecipientType;
  destination: string;
  order_id: string;
  order_number: string;
  event: NotificationEvent;
  subject?: string;
  message: string;
  html_body?: string;
  metadata?: Record<string, any>;
}
