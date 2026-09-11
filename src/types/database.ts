import { UserRole, OrderStatus, PaymentStatus, DeliveryTimeOption } from './order';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  unit?: string;
  contact_name?: string;
  contact_phone?: string;
  lat?: number;
  lng?: number;
  created_at: string;
}
