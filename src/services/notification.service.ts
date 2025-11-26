import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  message: string;
  type: NotificationType;
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);

  show(message: string, type: NotificationType = 'info', duration: number = 3000) {
    const newNotification: Notification = { message, type, id: Date.now() };
    this.notifications.update(current => [...current, newNotification]);

    setTimeout(() => {
      this.hide(newNotification.id);
    }, duration);
  }

  hide(id: number) {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }
}