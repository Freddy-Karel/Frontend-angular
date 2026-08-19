import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBoards(): Observable<any> {
    return this.http.get(`${this.apiUrl}/boards`);
  }

  createBoard(data: { title: string; description?: string; backgroundColor?: string; coverImageUrl?: string | null }): Observable<any> {
    return this.http.post(`${this.apiUrl}/boards`, data);
  }

  getBoardById(boardId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/boards/${boardId}`);
  }

  getBoardWithLists(boardId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/boards/${boardId}`);
  }

  updateBoard(boardId: string, data: { title?: string; description?: string | null; backgroundColor?: string | null; coverImageUrl?: string | null }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/boards/${boardId}`, data);
  }

  deleteBoard(boardId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/boards/${boardId}`);
  }

  updateListPosition(listId: string, position: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/lists/${listId}`, { position });
  }

  updateCardPosition(cardId: string, listId: string, position: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/cards/${cardId}/position`, { listId, position });
  }

  getCards(listId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cards/list/${listId}`);
  }

  createCard(listId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cards`, { ...data, listId });
  }

  updateCard(cardId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/cards/${cardId}`, data);
  }

  deleteCard(cardId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cards/${cardId}`);
  }

  createList(boardId: string, title: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/boards/${boardId}/lists`, { title });
  }

  updateList(listId: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/lists/${listId}`, data);
  }

  deleteList(listId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lists/${listId}`);
  }

  createSubtask(cardId: number, title: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/subtasks`, { cardId, title });
  }

  updateSubtask(subtaskId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/subtasks/${subtaskId}`, data);
  }

  deleteSubtask(subtaskId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subtasks/${subtaskId}`);
  }

  createComment(cardId: number, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/comments`, { cardId, content });
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/${commentId}`);
  }

  addBoardMember(boardId: string, email: string, role: 'admin' | 'member' | 'viewer' = 'member'): Observable<any> {
    return this.http.post(`${this.apiUrl}/boards/${boardId}/members`, { email, role });
  }

  removeBoardMember(boardId: string, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/boards/${boardId}/members/${userId}`);
  }
}
