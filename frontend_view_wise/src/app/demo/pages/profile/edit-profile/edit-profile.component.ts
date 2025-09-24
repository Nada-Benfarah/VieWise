import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidationErrors, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, User } from 'src/app/services/auth.service';
import { NotificationService } from '../../../../services/notification/notification.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  user: User | null = null;
  profileImageUrl: string | null = null;
  isSaving = false;
  isUploading = false;
  isChangingPwd = false;
  showPwd = { old: false, n1: false, n2: false };
  defaultAvatar = 'assets/images/user/avatar-1.jpg';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}


  ngOnInit(): void {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      password: [{ value: '********', disabled: true }],
      phone_number: [''],
      first_name: [{ value: '' }],
    });

    // ✅ init du formulaire de mot de passe
    this.passwordForm = this.fb.group(
      {
        old_password: ['', [Validators.required]],
        new_password: ['', [Validators.required, Validators.minLength(8)]],
        new_password2: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator }
    );

    this.authService.getCurrentUser().subscribe((user: any) => {
      this.user = user || null;
      if (user) {
        this.profileForm.patchValue({
          email: user.email || '',
          phone_number: user.phone_number || '',
          password: '********',
          first_name: user.first_name || '',
        });
        this.profileImageUrl = user.avatar_url || null;
      }
    });
  }

  // ✅ validateur de correspondance
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const a = group.get('new_password')?.value;
    const b = group.get('new_password2')?.value;
    return a && b && a !== b ? { mismatch: true } : null;
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.notificationService.error('Veuillez corriger les erreurs du formulaire.');
      return;
    }
    if (this.isChangingPwd) return;

    this.isChangingPwd = true;
    const { old_password, new_password, new_password2 } = this.passwordForm.value;
    this.authService.changePassword(old_password, new_password, new_password2).subscribe({
      next: (res) => {
        this.isChangingPwd = false;
        this.passwordForm.reset();
        this.notificationService.success(res?.message || 'Mot de passe modifié.');
      },
      error: (err) => {
        this.isChangingPwd = false;
        // mapping des messages serveur
        const msg =
          err?.error?.old_password?.[0] ||
          err?.error?.new_password2?.[0] ||
          err?.error?.new_password?.[0] ||
          err?.error?.detail ||
          err?.error?.error ||
          'Échec de la modification du mot de passe.';
        this.notificationService.error(msg);
      }
    });
  }

  get displayAvatar(): string {
    // si l’utilisateur a une image => on l’affiche
    return this.profileImageUrl || this.defaultAvatar;
  }

  onImgError(e: Event) {
    // si l’URL ne répond pas (404, etc.), on bascule vers l’avatar par défaut
    (e.target as HTMLImageElement).src = this.defaultAvatar;
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.user) return;

    const payload = {
      first_name: (this.profileForm.get('first_name')?.value || '').trim(),
      phone_number: (this.profileForm.get('phone_number')?.value || '').trim() || null
    };

    this.isSaving = true;
    this.authService.updateCurrentUser(payload).subscribe({
      next: (updated) => {
        this.isSaving = false;
        this.user = updated;
        this.profileForm.patchValue({
          first_name: updated.first_name,
          phone_number: updated.phone_number
        });
        this.notificationService.success('Profil mis à jour avec succès.');
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.phone_number?.[0]
          || err?.error?.first_name?.[0]
          || 'Erreur lors de la mise à jour.';
        this.notificationService.error(msg);
      }
    });
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Aperçu immédiat (optionnel)
    const reader = new FileReader();
    reader.onload = () => { this.profileImageUrl = reader.result as string; };
    reader.readAsDataURL(file);

    // Envoi au backend
    this.isUploading = true;
    this.authService.uploadAvatar(file).subscribe({
      next: (updated) => {
        this.isUploading = false;
        this.user = updated;
        // Force le rafraîchissement (anti-cache)
        this.profileImageUrl = (updated.avatar_url ?? null)
          ? `${updated.avatar_url}?v=${Date.now()}`
          : null;
        this.notificationService.success('Photo de profil mise à jour.');
      },
      error: (err) => {
        this.isUploading = false;
        this.notificationService.error('Échec du téléversement de la photo.');
      }
    });
  }

  removePhoto(): void {
    if (!this.user?.avatar_url) return;
    this.authService.deleteAvatar().subscribe({
      next: (updated) => {
        this.user = updated;
        this.profileImageUrl = null;
        this.notificationService.success('Photo de profil supprimée.');
      },
      error: () => this.notificationService.error('Échec de la suppression de la photo.')
    });
  }
}
