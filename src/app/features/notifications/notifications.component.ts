import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RelativeDatePipe, NavbarComponent, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notifications.set(this.notificationService.getNotifications()());
    this.unreadCount.set(this.notificationService.unreadCount());
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
    this.notifications.set(this.notificationService.getNotifications()());
    this.unreadCount.set(this.notificationService.unreadCount());
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
    this.notifications.set(this.notificationService.getNotifications()());
    this.unreadCount.set(this.notificationService.unreadCount());
  }

  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId);
    this.notifications.set(this.notificationService.getNotifications()());
    this.unreadCount.set(this.notificationService.unreadCount());
  }

  handleNotificationClick(notification: Notification): void {
    this.markAsRead(notification.id);
    
    if (notification.boardId) {
      this.router.navigate(['/board', notification.boardId]);
    }
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
