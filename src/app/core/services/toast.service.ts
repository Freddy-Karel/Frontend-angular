import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  private toastId = 0;

  toast$ = this.toastSubject.asObservable();

  show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration: number = 4000): void {
    const toast: Toast = {
      id: ++this.toastId,
      type,
      title,
      message,
      duration
    };
    this.toastSubject.next(toast);
  }

  success(title: string, message: string, duration?: number): void {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string, duration?: number): void {
    this.show('error', title, message, duration);
  }

  warning(title: string, message: string, duration?: number): void {
    this.show('warning', title, message, duration);
  }

  info(title: string, message: string, duration?: number): void {
    this.show('info', title, message, duration);
  }
}
