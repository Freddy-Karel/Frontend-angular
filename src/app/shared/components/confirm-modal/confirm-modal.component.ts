import { Component, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Confirmer');
  message = input<string>('Êtes-vous sûr de vouloir continuer ?');
  confirmText = input<string>('Confirmer');
  cancelText = input<string>('Annuler');
  type = input<'danger' | 'warning' | 'info'>('danger');
  
  confirm = output<void>();
  cancel = output<void>();
}
