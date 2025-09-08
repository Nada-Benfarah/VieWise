import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from '../../../../services/notification/notification.service';
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-auth-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, NgIf],
  templateUrl: './auth-reset-password.component.html',
  styleUrl: './auth-reset-password.component.scss'
})
export class AuthResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  isSubmitting = false;
  uid: string;
  token: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.uid = this.route.snapshot.queryParamMap.get('uid') || '';
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordsMatchValidator }
    );

    if (!this.uid || !this.token) {
      this.notificationService.error('Lien de réinitialisation invalide ou expiré.');
      this.resetForm.disable();
    }
  }

  passwordsMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  submit() {
    if (!this.uid || !this.token) {
      this.notificationService.error('Lien de réinitialisation invalide ou expiré.');
      return;
    }
    if (this.resetForm.invalid) {
      this.notificationService.error('Veuillez remplir correctement le formulaire.');
      this.resetForm.markAllAsTouched();
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.authService.resetPassword(this.uid, this.token, this.resetForm.value.password).subscribe({
      next: () => {
        this.notificationService.success('Mot de passe réinitialisé avec succès.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.notificationService.error(err?.error?.error || 'Erreur lors de la réinitialisation.');
        this.isSubmitting = false;
      }
    });
  }
}
