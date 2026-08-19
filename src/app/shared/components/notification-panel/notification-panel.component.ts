import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { RelativeDatePipe } from '../../pipes/relative-date.pipe';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, RelativeDatePipe, RouterModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent {
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  isOpen = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Reactive updates from service
    effect(() => {
      this.notifications.set(this.notificationService.getNotifications()());
    });
    
    effect(() => {
      this.unreadCount.set(this.notificationService.unreadCount());
    });
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }

  closePanel(): void {
    this.isOpen = false;
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId);
  }

  handleNotificationClick(notification: Notification): void {
    this.markAsRead(notification.id);
    
    if (notification.boardId) {
      this.router.navigate(['/board', notification.boardId]);
    }
    
    this.closePanel();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'OK';
      case 'error': return '!';
      case 'warning': return '!';
      case 'info': return 'i';
      default: return '?';
    }
  }
}
