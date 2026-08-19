import { Component, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { AppTheme, ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NotificationPanelComponent, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  user = signal<any>(null);
  isDropdownOpen = false;
  currentTheme: Signal<AppTheme>;
  searchQuery = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private toastService: ToastService
  ) {
    this.currentTheme = this.themeService.currentTheme;
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.authService.getCurrentUser().subscribe({
      next: (response: any) => {
        this.user.set(response.user);
      },
      error: (error: any) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleLightDark();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.toastService.success('Deconnexion', 'Vous avez ete deconnecte avec succes');
    this.authService.logout();
  }

  getInitials(): string {
    const currentUser = this.user();
    if (currentUser?.fullName) {
      return currentUser.fullName.split(' ').map((name: string) => name.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    return currentUser?.email?.charAt(0).toUpperCase() || 'U';
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
  }

  onSearchEnter(): void {
    this.router.navigate(['/dashboard'], { queryParams: { search: this.searchQuery().trim() || null } });
  }
}
