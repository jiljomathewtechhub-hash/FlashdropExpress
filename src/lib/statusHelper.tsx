import React from 'react';
import {
  CheckCircle2,
  Clock,
  Navigation,
  Package,
  MapPin,
  FileText,
  AlertTriangle,
  XCircle,
  Check,
} from 'lucide-react';
import { OrderStatus } from '../types/order';

export interface StatusConfig {
  label: string;
  badgeClass: string;
  cardClass: string;
  icon: React.ComponentType<{ className?: string }>;
  colorName: 'green' | 'blue' | 'purple' | 'amber' | 'cyan' | 'indigo' | 'orange' | 'rose' | 'slate';
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  delivered: {
    label: 'Delivered Successfully',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    cardClass: 'border-emerald-300/90 bg-emerald-50/25 hover:border-emerald-400',
    icon: CheckCircle2,
    colorName: 'green',
  },
  in_transit: {
    label: 'In Transit to Destination',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold animate-pulse',
    cardClass: 'border-blue-400/90 bg-blue-50/30 hover:border-blue-500',
    icon: Navigation,
    colorName: 'blue',
  },
  picked_up: {
    label: 'Cargo Picked Up & Loaded',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
    cardClass: 'border-purple-300/90 bg-purple-50/30 hover:border-purple-400',
    icon: Package,
    colorName: 'purple',
  },
  en_route_pickup: {
    label: 'En Route to Pickup',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300 font-bold',
    cardClass: 'border-sky-300/90 bg-sky-50/30 hover:border-sky-400',
    icon: MapPin,
    colorName: 'cyan',
  },
  accepted: {
    label: 'Accepted by Driver',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300 font-bold',
    cardClass: 'border-teal-300/90 bg-teal-50/30 hover:border-teal-400',
    icon: Check,
    colorName: 'cyan',
  },
  assigned: {
    label: 'Awaiting Acceptance',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse',
    cardClass: 'border-amber-400/90 bg-amber-50/35 hover:border-amber-500',
    icon: Clock,
    colorName: 'amber',
  },
  confirmed: {
    label: 'Order Confirmed',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 font-bold',
    cardClass: 'border-blue-200 bg-blue-50/20 hover:border-blue-300',
    icon: CheckCircle2,
    colorName: 'blue',
  },
  quote_sent: {
    label: 'Quote Ready',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200 font-bold',
    cardClass: 'border-indigo-200 bg-indigo-50/25 hover:border-indigo-300',
    icon: FileText,
    colorName: 'indigo',
  },
  submitted: {
    label: 'Quote Requested',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-200 font-bold',
    cardClass: 'border-orange-200 bg-orange-50/25 hover:border-orange-300',
    icon: Clock,
    colorName: 'orange',
  },
  cancellation_requested: {
    label: 'Cancellation Requested',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
    cardClass: 'border-rose-300 bg-rose-50/25 hover:border-rose-400',
    icon: AlertTriangle,
    colorName: 'rose',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
    cardClass: 'border-slate-200 bg-slate-50/40 hover:border-slate-300',
    icon: XCircle,
    colorName: 'slate',
  },
  change_requested: {
    label: 'Change Requested',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    cardClass: 'border-amber-200 bg-amber-50/25 hover:border-amber-300',
    icon: AlertTriangle,
    colorName: 'amber',
  },
};

export const getOrderStatusBadge = (status: OrderStatus, size: 'sm' | 'md' = 'md') => {
  const config = ORDER_STATUS_CONFIG[status] || {
    label: (status || '').replace(/_/g, ' '),
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
    cardClass: 'border-slate-200 bg-white',
    icon: Clock,
    colorName: 'slate' as const,
  };
  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <span className={`${padding} rounded-full font-bold uppercase tracking-wider border inline-flex items-center space-x-1.5 ${config.badgeClass}`}>
      <Icon className={`${iconSize} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};
