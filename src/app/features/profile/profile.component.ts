import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user = signal<any>(null);
  loading = false;
  profileForm: FormGroup;
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.profileForm = this.fb.group({
      fullName: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      currentPassword: [{ value: '', disabled: true }],
      newPassword: [{ value: '', disabled: true }],
      confirmPassword: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.authService.getCurrentUser().subscribe({
      next: (response: any) => {
        this.user.set(response.user);
        this.profileForm.patchValue({
          fullName: response.user.fullName,
          email: response.user.email
        });
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.toastService.error('Erreur', 'Impossible de charger le profil');
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.profileForm.enable();
    } else {
      this.profileForm.disable();
      this.profileForm.patchValue({
        fullName: this.user()?.fullName,
        email: this.user()?.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.toastService.warning('Attention', 'Veuillez remplir tous les champs requis');
      return;
    }

    const { fullName, email, currentPassword, newPassword, confirmPassword } = this.profileForm.value;

    if (newPassword && newPassword !== confirmPassword) {
      this.toastService.error('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    this.loading = true;
    
    // TODO: Implement profile update API call
    setTimeout(() => {
      this.loading = false;
      this.toastService.success('Succès', 'Profil mis à jour avec succès');
      this.isEditing = false;
      this.loadUserProfile();
    }, 1000);
  }

  get fullNameControl() {
    return this.profileForm.get('fullName');
  }

  get emailControl() {
    return this.profileForm.get('email');
  }

  get currentPasswordControl() {
    return this.profileForm.get('currentPassword');
  }

  get newPasswordControl() {
    return this.profileForm.get('newPassword');
  }

  get confirmPasswordControl() {
    return this.profileForm.get('confirmPassword');
  }

  getInitials(): string {
    const currentUser = this.user();
    if (currentUser?.fullName) {
      return currentUser.fullName.split(' ').map((name: string) => name.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    return currentUser?.email?.charAt(0).toUpperCase() || 'U';
  }

  getMemberSince(): string {
    return new Date().toLocaleDateString('fr-FR');
  }
}
