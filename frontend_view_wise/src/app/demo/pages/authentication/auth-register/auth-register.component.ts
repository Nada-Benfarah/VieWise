

// Angular import
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-auth-register',
  imports: [RouterModule, ReactiveFormsModule ],
  templateUrl: './auth-register.component.html',
  styleUrl: './auth-register.component.scss'
})
export class AuthRegisterComponent implements OnInit {
  isSaving = false;
  errors = {};
  // public method
  SignUpOptions = [
    {
      image: 'assets/images/authentication/google.svg',
      name: 'Google'
    },
  ];

  signUpForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,private router: Router,
  ) {}

  ngOnInit() {
    this.signUpForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

  }

  signUp() {
    if (this.isSaving) return;

    this.isSaving = true;
    if (this.signUpForm.valid) {
      this.authService.register(this.signUpForm.value).subscribe({
        next: () => {
          this.isSaving = false;
          alert('Inscription réussie. Consulter votre boite mail.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isSaving = false;
          if (error.status === 400) {
           alert("L'utilisateur existe déjà ou données invalides.");
          } else {
            alert('Une erreur est survenue. Veuillez réessayer.');
          }
        }
      });
    }
  }

}
