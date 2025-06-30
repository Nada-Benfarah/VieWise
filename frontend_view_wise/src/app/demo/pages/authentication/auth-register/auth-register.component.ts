// Angular import
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from 'src/app/services/auth.service';
import { NotificationService } from '../../../../services/notification/notification.service';
import { StorageService } from '../../../../services/storage.service';
declare const google: any;


@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './auth-register.component.html',
  styleUrl: './auth-register.component.scss'
})
export class AuthRegisterComponent implements OnInit {
  isSaving = false;
  errors = {};
  googleClient: any;

  SignUpOptions = [
    {
      image: 'assets/images/authentication/google.svg',
      name: 'Google'
    },
  ];

  signUpForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService,private storageService: StorageService


  ) {}

  ngOnInit() {
    this.signUpForm = this.fb.group({
      username: ['', [Validators.required]],
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

        const access = res.key;
        const user = res.user;

        if (!access || !user) {
          this.notification.error('Échec de la connexion Google. Données manquantes.');
          return;
        }

        this.authService.user = {
          id: user.id,
          email: user.email,
          username: user.first_name
        } as User;

        this.storageService.setToken(access);
        localStorage.setItem('current_user', JSON.stringify(user));

        this.notification.success('Connexion Google réussie');

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

        this.notification.error(msg);
      }
    });
  }



  signUp() {
    if (this.isSaving) return;

    this.isSaving = true;
    if (this.signUpForm.valid) {
      this.authService.register(this.signUpForm.value).subscribe({
        next: () => {
          this.isSaving = false;
          this.notification.success('Inscription réussie. Consulter votre boîte mail.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isSaving = false;
          if (error.status === 400) {
            this.notification.error("L'utilisateur existe déjà ou les données sont invalides.");
          } else {
            this.notification.error('Une erreur est survenue. Veuillez réessayer.');
          }
        }
      });
    }
  }
}
