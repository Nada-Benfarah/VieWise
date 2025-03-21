

// Angular import
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-auth-register',
  imports: [RouterModule, ReactiveFormsModule],
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
    private authService: AuthService
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
          alert('User registered successfully');
        },
        error: (error) => {
          this.isSaving = false;
          if (error.status === 400) {
            const { errors } = error;
            this.errors = errors;
            alert('User already exists');
          } else {
            alert('Error registering user');
          }
        }
      });
    }
  }
}
