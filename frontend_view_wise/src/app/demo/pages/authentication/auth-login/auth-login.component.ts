// Angular import
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';
import { NotificationService } from '../../../../services/notification/notification.service';
declare const google: any;

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule,
    ],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.scss'
})
export class AuthLoginComponent implements OnInit {
  signInForm: FormGroup;
  isSaving = false;
  errors: string | null = null;
  googleClient: any;

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
    private router: Router,private notificationService: NotificationService
  ) {
  }

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
    this.googleClient = google.accounts.oauth2.initTokenClient({
      client_id: '1073315035474-q5vf8g2kfjc42ft4j39u4so22uee8iv0.apps.googleusercontent.com',
      scope: 'email profile openid',
      callback: (response: any) => this.handleGoogleLogin(response)
    });
  }
  handleGoogleClick() {
    this.googleClient.requestAccessToken();
  }

  handleGoogleLogin(response: any) {
    const token = response.access_token;

    this.authService.loginWithGoogle(token).subscribe({
      next: (res: any) => {
        console.log('✅ Google login response:', res);

        const access = res.key; // 👈 le token est ici !
        const user = res.user;

        if (!access || !user) {
          this.notificationService.error('Échec de la connexion Google. Données manquantes.');
          return;
        }

        this.authService.user = {
          id: user.id,
          email: user.email,
          username: user.first_name
        } as User;

        this.storageService.setToken(access);
        localStorage.setItem('current_user', JSON.stringify(user));

        this.notificationService.success('Connexion Google réussie');

        this.authService.checkOnboardingCompleted().subscribe((completed) => {
          this.router.navigate([completed ? '/' : '/welcome']);
        });
      },

      error: (err) => {
        console.error("Erreur Google login :", err);
        const errorBody = err?.error;
        const rawError =
          errorBody?.non_field_errors?.[0] ||
          errorBody?.detail ||
          errorBody?.message;

        let msg =
          rawError === "User is already registered with this e-mail address."
            ? "Un compte existe déjà avec cet e-mail. Veuillez vous connecter avec votre mot de passe."
            : rawError || "Erreur serveur pendant la connexion Google";

        this.notificationService.error(msg);
      }
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
        console.log('✅ Google login response:', res);

        const { access, refresh, user } = res;

        this.authService.user = {
          id: user.id,
          email: user.email,
          username: user.first_name
        } as User;

        this.storageService.setToken(access);
        localStorage.setItem('current_user', JSON.stringify(user));
        this.notificationService.success('Connexion réussie !');
        console.log("👤 Utilisateur connecté :", user);

        // 🔍 Vérifier si l'onboarding est déjà rempli
        this.authService.checkOnboardingCompleted().subscribe((completed) => {
          if (completed) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/welcome']);
            this.notificationService.info('Tu dois remplir ce formulaire pour passer à la page suivante !', 'Info');

          }
        });

      },
      error: (error) => {
        this.isSaving = false;
        this.errors = error.error?.detail || 'Échec de la connexion. Veuillez réessayer.';
        this.notificationService.error('Vous devez activer votre adresse email avant de vous connecter');
      }
    });
  }
}
