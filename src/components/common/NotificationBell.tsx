import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  CheckCheck,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  Trash2,
  ChevronRight,
  Shield,
  EyeOff,
} from 'lucide-react';
import { inAppNotificationService, InAppNotification } from '../../lib/inAppNotificationService';
import { store, UserSession } from '../../lib/store';

interface NotificationBellProps {
  onNavigate?: (tab: string, param?: any) => void;
  align?: 'left' | 'right';
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigate,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserSession | null>(store.getCurrentUser());
  const [drivers, setDrivers] = useState(store.getDrivers());
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(inAppNotificationService.isSoundEnabled());
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state with inAppNotificationService and store
  const refreshNotifications = () => {
    const currentUser = store.getCurrentUser();
    const currentDrivers = store.getDrivers();
    setUser(currentUser);
    setDrivers(currentDrivers);
    const list = inAppNotificationService.getNotificationsForUser(currentUser, currentDrivers);
    setNotifications(list);
    setUnreadCount(inAppNotificationService.getUnreadCount(currentUser, currentDrivers));
    setSoundEnabled(inAppNotificationService.isSoundEnabled());
  };

  useEffect(() => {
    refreshNotifications();
    const unsubStore = store.subscribe(() => {
      refreshNotifications();
    });
    const unsubNotif = inAppNotificationService.subscribe(() => {
      refreshNotifications();
    });
    return () => {
      unsubStore();
      unsubNotif();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Don't render for guests / non-staff / non-admin
  if (!user || (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'driver' && user.role !== 'dispatcher')) {
    return null;
  }

  const handleNotificationClick = (notif: InAppNotification) => {
    // Open full detail pop-up window modal and mark as opened
    inAppNotificationService.openModal(notif);
    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    inAppNotificationService.markAllAsRead(user, drivers);
  };

  const handleClearAll = () => {
    if (confirm('Clear all notifications from your feed?')) {
      inAppNotificationService.clearAll(user, drivers);
    }
  };

  const handleToggleSound = () => {
    const state = inAppNotificationService.toggleSound();
    setSoundEnabled(state);
  };

  // Format time display (e.g. Just now, 5 mins ago, or Sep 13, 10:20 PM)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSeconds < 60) return 'Just now';
      if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
      if (diffSeconds < 86400) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  // Get icon based on event type
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
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const displayedNotifications =
    filterMode === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className={`relative p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer border ${
          isOpen
            ? 'bg-red-50 text-red-600 border-red-300 ring-2 ring-red-500/20 shadow-xs'
            : 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200 shadow-xs'
        }`}
        title={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Window */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-fade-in divide-y divide-slate-100 text-slate-800`}
          style={{ maxHeight: 'calc(100vh - 90px)' }}
        >
          {/* Header Panel */}
          <div className="p-3.5 bg-slate-50/80 flex items-center justify-between border-b border-slate-200/80">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-slate-900 font-['Outfit'] uppercase tracking-wider">
                Live Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center space-x-1">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  soundEnabled
                    ? 'bg-white border-slate-200 text-slate-700 hover:text-red-600 shadow-xs'
                    : 'bg-slate-200 border-slate-300 text-slate-400'
                }`}
                title={soundEnabled ? 'Chime sound is enabled (Click to mute)' : 'Chime sound is muted (Click to unmute)'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-red-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition text-xs shadow-xs cursor-pointer"
                  title="Mark all as opened / read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-1.5 bg-white flex items-center justify-between text-[11px] border-b border-slate-100">
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unread')}
                className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  filterMode === 'unread'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Unopened ({unreadCount})
              </button>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-red-600 flex items-center space-x-1 transition text-[10px] cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Notifications Scrollable List */}
          <div className="overflow-y-auto max-h-[360px] divide-y divide-slate-100 bg-slate-50/40">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400">
                  {filterMode === 'unread'
                    ? 'No unopened notifications.'
                    : 'No activity logs in your feed yet.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const isUnread = !notif.is_read;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 sm:p-3.5 transition cursor-pointer flex items-start space-x-3 relative group ${
                      isUnread
                        ? 'bg-red-50/70 hover:bg-red-100/70 border-l-4 border-l-red-600'
                        : 'bg-white hover:bg-slate-50 border-l-4 border-l-slate-300 opacity-90 hover:opacity-100'
                    }`}
                  >
                    {/* Event Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5 ${
                        isUnread
                          ? 'bg-white border border-red-200 ring-2 ring-red-500/10'
                          : 'bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {getEventIcon(notif.type)}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <h4
                            className={`text-xs truncate ${
                              isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {isUnread && (
                            <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-red-600 text-white shadow-xs">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Relative Timestamp */}
                        <span className="text-[10px] text-slate-500 flex-shrink-0 flex items-center">
                          <Clock className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
                          {formatTime(notif.created_at)}
                        </span>
                      </div>

                      {/* Message Body */}
                      <p className={`text-[11px] leading-relaxed line-clamp-2 ${isUnread ? 'text-slate-800' : 'text-slate-500'}`}>
                        {notif.message}
                      </p>

                      {/* Footer Metadata & Status Badges */}
                      <div className="flex items-center justify-between pt-1 text-[10px] gap-2">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {notif.order_number && (
                            <span className="font-mono font-bold text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded border border-red-200">
                              #{notif.order_number}
                            </span>
                          )}

                          {/* Opened vs Unopened Distinction Pill */}
                          {isUnread ? (
                            <span className="text-red-700 font-extrabold flex items-center bg-red-100/70 border border-red-300 px-1.5 py-0.5 rounded shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse mr-1" />
                              Unopened
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium flex items-center bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              <CheckCheck className="w-3 h-3 text-emerald-600 mr-1" />
                              Opened {notif.read_at ? formatTime(notif.read_at) : ''}
                            </span>
                          )}

                          {/* Inline Direct Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              inAppNotificationService.toggleReadStatus(notif.id);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer border ${
                              isUnread
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
                                : 'bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border-slate-200 shadow-2xs'
                            }`}
                            title={isUnread ? 'Mark as Opened' : 'Mark as Unopened'}
                          >
                            {isUnread ? (
                              <>
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span>Mark Opened</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-slate-400" />
                                <span>Mark Unread</span>
                              </>
                            )}
                          </button>
                        </div>

                        <span className="text-slate-700 group-hover:text-red-600 transition flex items-center font-bold text-[10px] shrink-0">
                          Pop Window <ChevronRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 bg-slate-50 flex items-center justify-between border-t border-slate-200 text-xs px-3">
            <span className="text-[10px] text-slate-500">
              {user.role === 'admin' || user.role === 'owner'
                ? 'GTA Operations Dispatch Monitor'
                : 'Assigned Courier & Dispatch Channel'}
            </span>
            {(user.role === 'admin' || user.role === 'owner') && onNavigate && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('admin', { tab: 'notifications' });
                }}
                className="text-[10px] text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
                title="View SMS and Email Dispatch Gateway Logs"
              >
                Gateway Logs &rarr;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
