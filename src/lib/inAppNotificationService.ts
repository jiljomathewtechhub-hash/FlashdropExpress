import { UserSession } from './store';

export type InAppNotificationType =
  | 'order_created'
  | 'order_assigned'
  | 'status_changed'
  | 'quote_requested'
  | 'pod_uploaded'
  | 'system';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: InAppNotificationType;
  order_id?: string | null;
  order_number?: string | null;
  assigned_driver_id?: string | null;
  assigned_driver_name?: string | null;
  customer_email?: string | null;
  customer_id?: string | null;
  recipient_role: 'admin' | 'driver' | 'customer' | 'all';
  created_at: string;
  is_read: boolean;
  read_at?: string | null;
}

const STORAGE_KEY = 'flashdrop_in_app_notifications';
const SOUND_ENABLED_KEY = 'flashdrop_sound_enabled';

class InAppNotificationService {
  private notifications: InAppNotification[] = [];
  private listeners: (() => void)[] = [];
  private toastListeners: ((notification: InAppNotification) => void)[] = [];
  private modalListeners: ((notification: InAppNotification | null) => void)[] = [];
  private activeModalNotification: InAppNotification | null = null;
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      const storedSound = localStorage.getItem(SOUND_ENABLED_KEY);
      this.soundEnabled = storedSound !== null ? storedSound === 'true' : true;
    }
  }

  private getDefaultSeedNotifications(): InAppNotification[] {
    return [];
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = Array.isArray(parsed) ? parsed : [];
      } else {
        this.notifications = [];
      }
    } catch (e) {
      console.warn('Failed to load in-app notifications from storage:', e);
      this.notifications = [];
    }
  }

  public clearAllNotifications() {
    this.notifications = [];
    this.activeModalNotification = null;
    this.saveToStorage();
    this.notify();
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      // Keep up to latest 100 notifications
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications.slice(0, 100)));
    } catch (e) {
      console.warn('Failed to save in-app notifications to storage:', e);
    }
  }

  // --- Web Audio Chime Synthesizer ---
  // Generates a crisp, pleasant dual-tone chime (D5 -> A5) without external sound files
  public playNotificationSound() {
    if (!this.soundEnabled || typeof window !== 'undefined' && false) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Master gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.2, now);
      masterGain.connect(ctx.destination);

      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.8, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: 880 Hz (A5) - plays slightly after Tone 1 for a musical chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.7, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    }
    this.notify();
  }

  public toggleSound(): boolean {
    const next = !this.soundEnabled;
    this.setSoundEnabled(next);
    if (next) {
      this.playNotificationSound();
    }
    return next;
  }

  // --- Dispatch In-App Notification ---
  public dispatch(notificationData: Omit<InAppNotification, 'id' | 'created_at' | 'is_read'>): InAppNotification {
    const newNotif: InAppNotification = {
      ...notificationData,
      id: `inapp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    // Prepend new notification
    this.notifications = [newNotif, ...this.notifications];
    this.saveToStorage();

    // Play chime sound
    this.playNotificationSound();

    // Trigger toast notification
    this.toastListeners.forEach((fn) => fn(newNotif));

    // Notify UI components
    this.notify();

    return newNotif;
  }

  private getStoredCurrentUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('flashdrop_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  // --- Strict Role & Privacy Isolation Filtering ---
  public getNotificationsForUser(
    user: UserSession | null,
    drivers: Array<{ id: string; user_id?: string; email?: string; name: string }> = []
  ): InAppNotification[] {
    const activeUser = user || this.getStoredCurrentUser();

    // Strict Security Guard: Unauthenticated visitors / guests NEVER receive private notifications
    if (!activeUser) {
      return [];
    }

    // Admin, Owner & Dispatcher see administrative dispatches & universal alerts
    if (activeUser.role === 'admin' || activeUser.role === 'owner' || activeUser.role === 'dispatcher') {
      return this.notifications.filter((n) => n.recipient_role === 'admin' || n.recipient_role === 'all');
    }

    // Driver / Staff sees strictly their own delivery dispatches
    if (activeUser.role === 'driver') {
      const userEmail = (activeUser.email || '').toLowerCase();
      const userName = (activeUser.name || '').toLowerCase();
      const userDriverId = activeUser.driverId || '';

      // Match driver by id, email, or name
      const matchingDriver = drivers.find(
        (d) =>
          (userDriverId && (d.id === userDriverId || d.user_id === userDriverId)) ||
          (userEmail && d.email && d.email.toLowerCase() === userEmail) ||
          (userName && d.name && d.name.toLowerCase() === userName)
      );

      const driverIds = new Set<string>();
      if (userDriverId) driverIds.add(userDriverId);
      if (matchingDriver?.id) driverIds.add(matchingDriver.id);
      if (matchingDriver?.user_id) driverIds.add(matchingDriver.user_id);
      if (matchingDriver?.email) driverIds.add(matchingDriver.email.toLowerCase());
      if (userEmail) driverIds.add(userEmail);

      return this.notifications.filter((n) => {
        // Universal announcements
        if (n.recipient_role === 'all') return true;
        // Staff-directed
        if (n.recipient_role === 'driver') {
          // If no specific driver ID is attached, it's for all staff
          if (!n.assigned_driver_id) return true;
          // Matches driver ID or email in set
          if (driverIds.has(n.assigned_driver_id) || driverIds.has(n.assigned_driver_id.toLowerCase())) return true;
          // Matches driver email
          if (userEmail && n.assigned_driver_id.toLowerCase() === userEmail) return true;
          if (matchingDriver?.email && n.assigned_driver_id.toLowerCase() === matchingDriver.email.toLowerCase()) return true;
          // Matches driver name
          if (userName && n.assigned_driver_name && n.assigned_driver_name.toLowerCase() === userName) return true;
          if (matchingDriver?.name && n.assigned_driver_name && n.assigned_driver_name.toLowerCase() === matchingDriver.name.toLowerCase()) return true;
        }
        return false;
      });
    }

    // Customer sees strictly their own quote requests, approved quotes, driver assignments, and delivery confirmations
    if (activeUser.role === 'customer') {
      const userEmail = (activeUser.email || '').toLowerCase().trim();
      const userCustId = activeUser.driverId || '';

      return this.notifications.filter((n) => {
        if (n.recipient_role === 'all') return true;
        if (n.recipient_role === 'customer') {
          if (n.customer_email && userEmail && n.customer_email.toLowerCase().trim() === userEmail) {
            return true;
          }
          if (n.customer_id && userCustId && n.customer_id === userCustId) {
            return true;
          }
        }
        return false;
      });
    }

    return [];
  }

  public getUnreadCount(
    user: UserSession | null,
    drivers: Array<{ id: string; user_id?: string; email?: string; name: string }> = []
  ): number {
    const list = this.getNotificationsForUser(user, drivers);
    return list.filter((n) => !n.is_read).length;
  }

  // --- Mark as Opened / Read ---
  public markAsRead(id: string): boolean {
    const nowIso = new Date().toISOString();
    let found = false;

    this.notifications = this.notifications.map((n) => {
      if (n.id === id) {
        found = true;
        return {
          ...n,
          is_read: true,
          read_at: n.read_at || nowIso,
        };
      }
      return n;
    });

    if (found) {
      this.saveToStorage();
      this.notify();
      if (this.activeModalNotification?.id === id) {
        this.activeModalNotification = {
          ...this.activeModalNotification,
          is_read: true,
          read_at: this.activeModalNotification.read_at || nowIso,
        };
        this.modalListeners.forEach((fn) => fn(this.activeModalNotification));
      }
    }
    return found;
  }

  // --- Mark as Unopened / Unread ---
  public markAsUnread(id: string): boolean {
    let found = false;

    this.notifications = this.notifications.map((n) => {
      if (n.id === id) {
        found = true;
        return {
          ...n,
          is_read: false,
          read_at: undefined,
        };
      }
      return n;
    });

    if (found) {
      this.saveToStorage();
      this.notify();
      if (this.activeModalNotification?.id === id) {
        this.activeModalNotification = {
          ...this.activeModalNotification,
          is_read: false,
          read_at: undefined,
        };
        this.modalListeners.forEach((fn) => fn(this.activeModalNotification));
      }
    }
    return found;
  }

  // --- Toggle Opened / Unopened Status ---
  public toggleReadStatus(id: string): boolean {
    const target = this.notifications.find((n) => n.id === id);
    if (!target) return false;

    if (target.is_read) {
      this.markAsUnread(id);
      return false;
    } else {
      this.markAsRead(id);
      return true;
    }
  }

  // --- Modal Pop Window Management ---
  public openModal(notification: InAppNotification, autoMarkRead: boolean = true) {
    const nowIso = new Date().toISOString();

    if (autoMarkRead) {
      this.markAsRead(notification.id);
    }

    const resolved = this.notifications.find((n) => n.id === notification.id) || {
      ...notification,
      is_read: autoMarkRead ? true : notification.is_read,
      read_at: autoMarkRead ? (notification.read_at || nowIso) : notification.read_at,
    };

    this.activeModalNotification = { ...resolved };
    this.modalListeners.forEach((fn) => fn(this.activeModalNotification));
  }

  public closeModal() {
    this.activeModalNotification = null;
    this.modalListeners.forEach((fn) => fn(null));
  }

  public getActiveModalNotification(): InAppNotification | null {
    return this.activeModalNotification;
  }

  public deleteNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveToStorage();
    this.notify();
  }

  public markAllAsRead(user: UserSession | null, drivers: Array<{ id: string; user_id?: string; email?: string; name: string }> = []) {
    const userNotifications = this.getNotificationsForUser(user, drivers);
    const targetIds = new Set(userNotifications.map((n) => n.id));

    this.notifications = this.notifications.map((n) => {
      if (targetIds.has(n.id) && !n.is_read) {
        return {
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        };
      }
      return n;
    });

    this.saveToStorage();
    this.notify();
  }

  public clearAll(user: UserSession | null, drivers: Array<{ id: string; user_id?: string; email?: string; name: string }> = []) {
    const userNotifications = this.getNotificationsForUser(user, drivers);
    const targetIds = new Set(userNotifications.map((n) => n.id));

    this.notifications = this.notifications.filter((n) => !targetIds.has(n.id));
    this.saveToStorage();
    this.notify();
  }

  // --- Subscriptions ---
  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public subscribeToast(listener: (notification: InAppNotification) => void) {
    this.toastListeners.push(listener);
    return () => {
      this.toastListeners = this.toastListeners.filter((l) => l !== listener);
    };
  }

  public subscribeModal(listener: (notification: InAppNotification | null) => void) {
    this.modalListeners.push(listener);
    return () => {
      this.modalListeners = this.modalListeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const inAppNotificationService = new InAppNotificationService();
