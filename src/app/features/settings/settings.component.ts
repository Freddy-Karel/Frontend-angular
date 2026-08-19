import { Component, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AppTheme, ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  user = signal<any>(null);
  loading = false;
  settingsForm: FormGroup;
  currentTheme: Signal<AppTheme>;

  themes = [
    { id: 'light', name: 'Clair', swatch: '#F8F9FC', description: 'Interface claire et neutre' },
    { id: 'dark', name: 'Sombre', swatch: '#111827', description: 'Contraste eleve pour le soir' },
    { id: 'blue', name: 'Bleu', swatch: '#0284C7', description: 'Palette professionnelle' },
    { id: 'green', name: 'Vert', swatch: '#059669', description: 'Palette calme et lisible' },
    { id: 'purple', name: 'Violet', swatch: '#7C3AED', description: 'Palette creative' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private themeService: ThemeService
  ) {
    this.currentTheme = this.themeService.currentTheme;
    this.settingsForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications: [false],
      weeklyDigest: [true],
      language: ['fr']
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadSettings();
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

  loadSettings(): void {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      this.settingsForm.patchValue(JSON.parse(savedSettings));
    }
  }


  getThemeName(themeId: string = this.currentTheme()): string {
    return this.themes.find(theme => theme.id === themeId)?.name || 'Clair';
  }

  selectTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.toastService.success('Thème', `Thème ${this.themes.find(t => t.id === themeId)?.name} appliqué`);
  }

  onSubmit(): void {
    if (this.settingsForm.invalid) {
      this.toastService.warning('Attention', 'Veuillez vérifier vos paramètres');
      return;
    }

    this.loading = true;
    
    // Save settings to localStorage
    localStorage.setItem('settings', JSON.stringify(this.settingsForm.value));
    
    setTimeout(() => {
      this.loading = false;
      this.toastService.success('Succès', 'Paramètres enregistrés avec succès');
    }, 500);
  }

  resetSettings(): void {
    this.settingsForm.reset({
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      language: 'fr'
    });
    this.toastService.info('Info', 'Paramètres réinitialisés');
  }
}
