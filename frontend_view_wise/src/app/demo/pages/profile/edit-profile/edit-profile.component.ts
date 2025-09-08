import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  user: User | null = null;
  profileImageUrl: string | null = null;
  isSaving = false;
  isUploading = false;
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

    // Appel direct à getCurrentUser et stockage du résultat dans this.user
    this.authService.getCurrentUser().subscribe((user: any) => {
      this.user = user;
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
