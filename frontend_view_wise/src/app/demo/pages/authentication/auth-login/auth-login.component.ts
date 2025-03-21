// Angular import
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  isSaving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private storageService: StorageService,
    private router: Router
  ) {}

  // public method
  SignInOptions = [
    {
      image: 'assets/images/authentication/google.svg',
      name: 'Google'
    }
  ];

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      email: [''],
      password: ['']
    });
  }

  signIn() {
    if (this.signInForm.invalid || this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.authService.login(this.signInForm.value).subscribe({
      next: (res: { email: string; username: string; tokens: { access: string } }) => {
        this.isSaving = false;

        const { email, username, tokens } = res;
        this.authService.user = { email, username } as User;
        this.storageService.setToken(tokens.access);
        console.log(tokens.access);
        this.router.navigate(['']);
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }
}
