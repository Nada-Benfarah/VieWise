// Angular import
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.scss'
})
export class AuthLoginComponent implements OnInit {
  signInForm: FormGroup;
  isSaving = false;
  errors: string | null = null;

  SignInOptions = [
    {
      image: 'assets/images/authentication/google.svg',
      name: 'Google'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private storageService: StorageService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  signIn() {
    if (this.signInForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.errors = null;
    console.log(this.signInForm.value,"uuuuu")

    this.authService.login(this.signInForm.value).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        const { access, refresh, user } = res;
        this.authService.user = {
          id: user.id,
          email: user.email,
          username: user.first_name
        } as User;

        this.storageService.setToken(access);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSaving = false;
        this.errors = error.error?.detail || 'Échec de la connexion. Veuillez réessayer.';
      }
    });
  }
}
