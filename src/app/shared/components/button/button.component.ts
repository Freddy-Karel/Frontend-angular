import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  label = input.required<string>();
  type = input<'button' | 'submit'>('button');
  variant = input<'primary' | 'secondary' | 'outline' | 'danger'>('primary');
  size = input<'sm' | 'md' | 'lg'>('md');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  fullWidth = input<boolean>(false);

  get classes(): string {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    
    const variantClasses = {
      primary: 'btn-primary focus:ring-primary',
      secondary: 'btn-secondary focus:ring-secondary',
      outline: 'border-2 btn-secondary focus:ring-primary',
      danger: 'btn-danger focus:ring-danger'
    };
    
    const widthClass = this.fullWidth() ? 'w-full' : '';
    
    return `${baseClasses} ${sizeClasses[this.size()]} ${variantClasses[this.variant()]} ${widthClass}`;
  }
}
