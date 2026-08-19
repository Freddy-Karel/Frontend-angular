import { Component, signal, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inline-card-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inline-card-form.component.html',
  styleUrls: ['./inline-card-form.component.scss']
})
export class InlineCardFormComponent {
  cardTitle = signal('');
  loading = signal(false);
  
  listId = input.required<number>();
  isOpen = input<boolean>(false);
  
  cardCreated = output<{ listId: number; title: string }>();
  cancelled = output<void>();

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.cardTitle.set('');
        setTimeout(() => {
          const input = document.getElementById('card-title-input');
          if (input) input.focus();
        }, 100);
      }
    });
  }

  close(): void {
    this.cardTitle.set('');
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.cardTitle().trim()) {
      this.loading.set(true);
      this.cardCreated.emit({
        listId: this.listId(),
        title: this.cardTitle().trim()
      });
      this.loading.set(false);
      this.cardTitle.set('');
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    } else if (event.key === 'Escape') {
      this.close();
    }
  }
}
