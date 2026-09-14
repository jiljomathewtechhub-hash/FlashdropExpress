import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { inAppNotificationService, InAppNotification } from '../../lib/inAppNotificationService';
import { store } from '../../lib/store';

interface ToastItem {
  id: string;
  notification: InAppNotification;
  createdAt: number;
}

interface NotificationToastContainerProps {
  onNavigate?: (tab: string, param?: any) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({ onNavigate }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = inAppNotificationService.subscribeToast((newNotif) => {
      const currentUser = store.getCurrentUser();
      const drivers = store.getDrivers();

      // Only show toast if user is logged in as admin or driver
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner' && currentUser.role !== 'driver')) {
        return;
      }

      // Check if this user is eligible to receive this notification
      const userNotifs = inAppNotificationService.getNotificationsForUser(currentUser, drivers);
      const isEligible = userNotifs.some((n) => n.id === newNotif.id);
      if (!isEligible) return;

      const toastItem: ToastItem = {
        id: `toast-${Date.now()}-${Math.random()}`,
        notification: newNotif,
        createdAt: Date.now(),
      };

      setToasts((prev) => [toastItem, ...prev.slice(0, 2)]); // Keep at most 3 active toasts

      // Auto dismiss after 5.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastItem.id));
      }, 5500);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDismiss = (toastId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const handleToastClick = (notif: InAppNotification) => {
    inAppNotificationService.markAsRead(notif.id);
    const currentUser = store.getCurrentUser();

    if (onNavigate && notif.order_number && currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'owner') {
        onNavigate('admin', { orderNumber: notif.order_number });
      } else if (currentUser.role === 'driver') {
        onNavigate('driver', { orderNumber: notif.order_number });
      } else {
        onNavigate('tracking', notif.order_number);
      }
    }

    // Dismiss clicked toast
    setToasts((prev) => prev.filter((t) => t.notification.id !== notif.id));
  };

  if (toasts.length === 0) return null;

  const getEventIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'order_created':
        return <Package className="w-4 h-4 text-red-600" />;
      case 'order_assigned':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'status_changed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'quote_requested':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'pod_uploaded':
        return <Shield className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(({ id, notification }) => (
        <div
          key={id}
          onClick={() => handleToastClick(notification)}
          className="pointer-events-auto bg-white/98 backdrop-blur-md border-2 border-red-500/80 rounded-2xl p-3.5 shadow-2xl shadow-red-950/20 text-slate-800 cursor-pointer transition-all transform hover:-translate-y-0.5 hover:shadow-red-500/15 animate-fade-in flex items-start space-x-3 group relative overflow-hidden"
        >
          {/* Crimson Top Glow Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

          {/* Icon Badge */}
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
            {getEventIcon(notification.type)}
          </div>

          {/* Notification Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping mr-1.5" />
                Live Dispatch Alert
              </span>
              <span className="text-[10px] text-slate-500 flex items-center">
                <Clock className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                Just now
              </span>
            </div>

            <h4 className="text-xs font-bold text-slate-900 leading-snug">
              {notification.title}
            </h4>

            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
              {notification.message}
            </p>

            {notification.order_number && (
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                  #{notification.order_number}
                </span>
                <span className="text-red-600 font-bold group-hover:underline flex items-center">
                  View <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={(e) => handleDismiss(id, e)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex-shrink-0 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
