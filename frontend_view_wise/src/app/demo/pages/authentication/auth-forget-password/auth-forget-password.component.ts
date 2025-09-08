import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from '../../../../services/notification/notification.service';
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-auth-forget-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, NgIf],
  templateUrl: './auth-forget-password.component.html',
  styleUrl: './auth-forget-password.component.scss'
})
export class AuthForgetPasswordComponent implements OnInit {
  forgetForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.forgetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    if (this.forgetForm.invalid || this.isSubmitting) return;
    this.isSubmitting = true;
    this.authService.requestPasswordReset(this.forgetForm.value.email).subscribe({
      next: () => {
        this.notificationService.success('Un email de réinitialisation a été envoyé.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.notificationService.error(err?.error?.error || 'Erreur lors de la demande.');
        this.isSubmitting = false;
      }
    });
  }
}

