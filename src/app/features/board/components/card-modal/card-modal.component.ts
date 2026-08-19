import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card, User, Subtask, Comment } from '../../../../core/models/board.model';

@Component({
  selector: 'app-card-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card-modal.component.html',
  styleUrls: ['./card-modal.component.scss']
})
export class CardModalComponent implements OnChanges {
  @Input() card: Card | null = null;
  @Input() boardId!: string;
  @Input() members: User[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() cardUpdated = new EventEmitter<Card>();
  @Output() subtaskCreated = new EventEmitter<{ cardId: number; title: string }>();
  @Output() subtaskUpdated = new EventEmitter<Subtask>();
  @Output() subtaskDeleted = new EventEmitter<number>();
  @Output() commentCreated = new EventEmitter<{ cardId: number; content: string }>();
  @Output() commentDeleted = new EventEmitter<number>();
  @Output() cardDeleted = new EventEmitter<void>();

  newComment = '';
  newSubtaskTitle = '';

  ngOnChanges(): void {
    if (!this.card) {
      this.card = {
        id: 0,
        title: '',
        description: '',
        position: 0,
        listId: 0,
        subtasks: [],
        comments: [],
        labels: []
      };
    }
  }

  formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:mm
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.card) return;
    
    this.commentCreated.emit({ cardId: this.card.id, content: this.newComment.trim() });
    this.newComment = '';
  }

  addSubtask(): void {
    if (!this.newSubtaskTitle.trim() || !this.card) return;
    
    this.subtaskCreated.emit({ cardId: this.card.id, title: this.newSubtaskTitle.trim() });
    this.newSubtaskTitle = '';
  }

  deleteSubtask(subtaskId: number): void {
    if (!this.card) return;
    this.subtaskDeleted.emit(subtaskId);
  }


  updateSubtask(subtask: Subtask): void {
    this.subtaskUpdated.emit(subtask);
  }

  deleteComment(commentId: number): void {
    this.commentDeleted.emit(commentId);
  }

  saveCard(): void {
    if (this.card) {
      this.cardUpdated.emit(this.card);
    }
  }
}
