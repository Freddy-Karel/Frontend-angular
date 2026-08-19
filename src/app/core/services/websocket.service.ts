import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string): void {
    this.socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket']
    });
  }

  joinBoard(boardId: number): void {
    this.socket?.emit('join-board', boardId);
  }

  leaveBoard(boardId: number): void {
    this.socket?.emit('leave-board', boardId);
  }

  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  disconnect(): void {
    this.socket?.disconnect();
  }
}
