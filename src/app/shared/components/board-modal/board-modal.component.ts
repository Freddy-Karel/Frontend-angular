import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-board-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './board-modal.component.html',
  styleUrls: ['./board-modal.component.scss']
})
export class BoardModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<{ title: string; description: string; backgroundColor: string; coverImageUrl?: string | null }>();

  boardForm: FormGroup;
  backgroundColors = [
    '#0052FF', // Blue
    '#00C853', // Green
    '#FF3D00', // Orange
    '#6200EA', // Purple
    '#C2185B', // Pink
    '#0097A7', // Cyan
    '#FF6D00', // Amber
    '#424242', // Gray
  ];

  constructor(private fb: FormBuilder) {
    this.boardForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      backgroundColor: ['#0052FF'],
      coverImageUrl: [null]
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onCreate(): void {
    if (this.boardForm.valid) {
      this.create.emit(this.boardForm.value);
      this.boardForm.reset({
        title: '',
        description: '',
        backgroundColor: '#0052FF',
        coverImageUrl: null
      });
    }
  }


  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 900 * 1024) {
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.boardForm.patchValue({ coverImageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  clearCover(): void {
    this.boardForm.patchValue({ coverImageUrl: null });
  }

  selectColor(color: string): void {
    this.boardForm.patchValue({ backgroundColor: color });
  }
}
