import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  padding = input<'sm' | 'md' | 'lg'>('md');
  hoverable = input<boolean>(false);

  get classes(): string {
    const paddingClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    
    const hoverClass = this.hoverable() ? 'hover:shadow-card-hover transition-shadow duration-200' : '';
    
    return `card rounded-lg ${paddingClasses[this.padding()]} ${hoverClass}`;
  }
}
