// Web Push & Local Notification Service for WalWal

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser.');
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      // Save state to localStorage
      localStorage.setItem('WALWAL_NOTIFICATIONS_ENABLED', 'true');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

export const isMeetupNotificationEnabled = (): boolean => {
  try {
    const saved = localStorage.getItem('WALWAL_SETTINGS_NOTIFICATIONS');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.meetupAlert !== false;
    }
  } catch (e) {}
  return true;
};

export const sendPushNotification = async (payload: NotificationPayload): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (!isMeetupNotificationEnabled()) return false;

  const defaultIcon = payload.icon || '/pwa-192x192.png';
  const notificationOptions: NotificationOptions = {
    body: payload.body,
    icon: defaultIcon,
    badge: defaultIcon,
    tag: payload.tag || 'walwal-meetup',
    data: payload.data,
    requireInteraction: false
  };

  // 1. Dispatch in-app custom event for foreground toast UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('walwal_push_notification', {
        detail: {
          title: payload.title,
          body: payload.body,
          icon: defaultIcon,
          data: payload.data,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      })
    );
  }

  // 2. If permission granted, send system/OS push notification
  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(payload.title, notificationOptions);
          return true;
        }
      }

      new Notification(payload.title, notificationOptions);
      return true;
    } catch (err) {
      console.warn('Error sending OS notification:', err);
      return false;
    }
  }

  return false;
};
