import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Shield,
  CheckCheck,
  MapPin,
  User,
  DollarSign,
  FileText,
  EyeOff,
  Bell,
} from 'lucide-react';
import { inAppNotificationService, InAppNotification } from '../../lib/inAppNotificationService';
import { store } from '../../lib/store';
import { Order } from '../../types/order';

interface NotificationDetailModalProps {
  onNavigate?: (tab: string, param?: any) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({ onNavigate }) => {
  const [notification, setNotification] = useState<InAppNotification | null>(
    inAppNotificationService.getActiveModalNotification()
  );
  const [associatedOrder, setAssociatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = inAppNotificationService.subscribeModal((notif) => {
      setNotification(notif);
      if (notif?.order_number || notif?.order_id) {
        const order =
          store.getOrderById(notif.order_number || '') ||
          store.getOrderById(notif.order_id || '') ||
          store.getOrders().find(
            (o) => o.order_number === notif.order_number || o.id === notif.order_id
          );
        setAssociatedOrder(order || null);
      } else {
        setAssociatedOrder(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && notification) {
        inAppNotificationService.closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notification]);

  if (!notification) return null;

  const handleClose = () => {
    inAppNotificationService.closeModal();
  };

  const handleToggleUnread = () => {
    if (notification.is_read) {
      inAppNotificationService.markAsUnread(notification.id);
    } else {
      inAppNotificationService.markAsRead(notification.id);
    }
  };

  const handleGoToOrder = () => {
    const currentUser = store.getCurrentUser();
    const orderNum = notification.order_number || associatedOrder?.order_number;

    if (onNavigate && orderNum) {
      inAppNotificationService.closeModal();

      if (currentUser?.role === 'admin' || currentUser?.role === 'owner') {
        onNavigate('admin', { orderNumber: orderNum });
      } else if (currentUser?.role === 'driver') {
        onNavigate('driver', { orderNumber: orderNum });
      } else {
        onNavigate('tracking', orderNum);
      }
    }
  };

  const getEventIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'order_created':
        return <Package className="w-6 h-6 text-red-600" />;
      case 'order_assigned':
        return <Truck className="w-6 h-6 text-blue-600" />;
      case 'status_changed':
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      case 'quote_requested':
        return <Clock className="w-6 h-6 text-amber-600" />;
      case 'pod_uploaded':
        return <Shield className="w-6 h-6 text-purple-600" />;
      default:
        return <Bell className="w-6 h-6 text-slate-600" />;
    }
  };

  // Format date and time
  const createdDate = new Date(notification.created_at);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - createdDate.getTime()) / 1000);
  let relativeTime = 'Just now';
  if (diffSec >= 60 && diffSec < 3600) {
    relativeTime = `${Math.floor(diffSec / 60)}m ago`;
  } else if (diffSec >= 3600 && diffSec < 86400) {
    relativeTime = `${Math.floor(diffSec / 3600)}h ago`;
  } else if (diffSec >= 86400) {
    relativeTime = `${Math.floor(diffSec / 86400)}d ago`;
  }

  const fullDateTime =
    createdDate.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' at ' +
    createdDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const openedTime = notification.read_at
    ? new Date(notification.read_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
              {getEventIcon(notification.type)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* Visual Opened Status Indicator */}
                {notification.is_read ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                    <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    ✓ Opened {openedTime}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-600 text-white shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1.5" />
                    ● Unopened (New)
                  </span>
                )}

                {notification.order_number && (
                  <span className="font-mono text-xs font-black text-slate-800 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                    #{notification.order_number}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black text-slate-900 font-['Outfit'] tracking-tight">
                {notification.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition border border-slate-200 shadow-xs cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Message Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Activity Message
            </span>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Timestamp & Timing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Activity Logged
              </span>
              <div className="font-bold text-slate-800 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <span>{relativeTime}</span>
              </div>
              <span className="text-[11px] text-slate-500 block">{fullDateTime}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Status In System
              </span>
              <div className="font-bold text-emerald-700 flex items-center">
                <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span>{notification.is_read ? 'Opened & Reviewed' : 'Unopened (New)'}</span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                {notification.is_read
                  ? `Marked opened at ${openedTime}`
                  : 'Unopened alert awaiting review'}
              </span>
            </div>
          </div>

          {/* Order Snapshot if order is attached */}
          {associatedOrder && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-black text-slate-900 font-['Outfit'] uppercase tracking-wide flex items-center">
                  <Package className="w-3.5 h-3.5 text-red-600 mr-1.5" />
                  Order #{associatedOrder.order_number} Details
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {associatedOrder.order_status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Route */}
                <div className="flex items-start space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 font-medium">Route: </span>
                    <strong className="text-slate-800">
                      {associatedOrder.pickup_address.split(',')[0]} &rarr;{' '}
                      {associatedOrder.delivery_address.split(',')[0]}
                    </strong>
                  </div>
                </div>

                {/* Customer */}
                <div className="flex items-start space-x-2">
                  <User className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 font-medium">Customer: </span>
                    <strong className="text-slate-800">
                      {associatedOrder.customer_name}
                      {associatedOrder.company_name ? ` (${associatedOrder.company_name})` : ''}
                    </strong>
                    <span className="text-slate-400 text-[11px] ml-1.5">
                      ({associatedOrder.customer_phone})
                    </span>
                  </div>
                </div>

                {/* Vehicle & Cargo */}
                <div className="flex items-start space-x-2">
                  <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 font-medium">Cargo: </span>
                    <strong className="text-slate-800">
                      {associatedOrder.vehicle_name || 'Cargo Van'} &bull;{' '}
                      {associatedOrder.weight_lbs} lbs
                      {associatedOrder.item_description
                        ? ` &bull; ${associatedOrder.item_description}`
                        : ''}
                    </strong>
                  </div>
                </div>

                {/* Assigned Driver if any */}
                {associatedOrder.assigned_driver_name && (
                  <div className="flex items-start space-x-2">
                    <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 font-medium">Assigned Courier: </span>
                      <strong className="text-purple-700">
                        {associatedOrder.assigned_driver_name}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-semibold">Total Price:</span>
                  <span className="text-base font-black text-slate-900 font-['Outfit']">
                    ${associatedOrder.total_price.toFixed(2)} CAD
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleToggleUnread}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition cursor-pointer"
          >
            {notification.is_read ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Mark as Unopened</span>
              </>
            ) : (
              <>
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark as Opened</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            {(notification.order_number || associatedOrder) && (
              <button
                type="button"
                onClick={handleGoToOrder}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#C5161D] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 transition cursor-pointer"
              >
                <span>View Order in Queue</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
