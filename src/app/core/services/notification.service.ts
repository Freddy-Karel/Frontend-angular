import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  boardId?: string;
  cardId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly storageKey = 'gestion_projet_notifications';
  private notifications = signal<Notification[]>(this.readStoredNotifications());
  unreadCount = signal(this.notifications().filter(n => !n.read).length);

  getNotifications() {
    return this.notifications;
  }

  markAsRead(notificationId: string): void {
    const current = this.notifications();
    const updated = current.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.setNotifications(updated);
  }

  markAllAsRead(): void {
    const current = this.notifications();
    const updated = current.map(n => ({ ...n, read: true }));
    this.setNotifications(updated);
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    this.setNotifications([newNotification, ...this.notifications()]);
  }

  deleteNotification(notificationId: string): void {
    const current = this.notifications();
    const updated = current.filter(n => n.id !== notificationId);
    this.setNotifications(updated);
  }

  loadNotifications(notifications: Notification[]): void {
    this.setNotifications(notifications);
  }

  private setNotifications(notifications: Notification[]): void {
    this.notifications.set(notifications);
    this.unreadCount.set(notifications.filter(n => !n.read).length);
    localStorage.setItem(this.storageKey, JSON.stringify(notifications));
  }

  private readStoredNotifications(): Notification[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as Notification[];
      return parsed.map(notification => ({
        ...notification,
        timestamp: new Date(notification.timestamp),
      }));
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

}
