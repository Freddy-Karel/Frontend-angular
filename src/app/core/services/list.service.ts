import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ListService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLists(boardId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/boards/${boardId}/lists`);
  }

  createList(boardId: number, title: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/boards/${boardId}/lists`, { title });
  }
}
