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

  signIn(event?: Event) {
    event?.preventDefault();
    console.log("✅ Formulaire soumis avec :", this.signInForm.value);

    if (this.signInForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.errors = null;

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
        localStorage.setItem('current_user', JSON.stringify(user));
        console.log("👤 Utilisateur connecté :", user);

        // 🔍 Vérifier si l'onboarding est déjà rempli
        this.authService.checkOnboardingCompleted().subscribe((completed) => {
          if (completed) {
            // ✅ Onboarding déjà rempli
            this.router.navigate(['/']);
          } else {
            // ❌ Onboarding manquant
            this.router.navigate(['/welcome']);
          }
        });

      },
      error: (error) => {
        this.isSaving = false;
        this.errors = error.error?.detail || 'Échec de la connexion. Veuillez réessayer.';
        alert('Vous devez activer votre adresse email avant de vous connecter');
      }
    });
  }
}
