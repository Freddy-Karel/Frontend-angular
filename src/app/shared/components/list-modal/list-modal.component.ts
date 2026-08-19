import { Component, signal, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-list-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-modal.component.html',
  styleUrls: ['./list-modal.component.scss']
})
export class ListModalComponent {
  listTitle = signal('');
  loading = signal(false);
  
  isOpen = input<boolean>(false);
  
  closeEvent = output<void>();
  createEvent = output<string>();

  constructor() {
    // Reset form when modal opens
    effect(() => {
      if (this.isOpen()) {
        this.listTitle.set('');
        setTimeout(() => {
          const input = document.getElementById('list-title-input');
          if (input) input.focus();
        }, 100);
      }
    });
  }

  closeInternal(): void {
    this.listTitle.set('');
    this.closeEvent.emit();
  }

  onSubmit(): void {
    if (this.listTitle().trim()) {
      this.loading.set(true);
      this.createEvent.emit(this.listTitle().trim());
      this.loading.set(false);
      this.listTitle.set('');
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
    } else if (event.key === 'Escape') {
      this.closeInternal();
    }
  }
}
