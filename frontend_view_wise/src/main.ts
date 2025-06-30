import { enableProdMode, importProvidersFrom, inject, provideAppInitializer } from '@angular/core';

import { environment } from './environments/environment';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { StorageService } from './app/services/storage.service';
import { AuthService } from './app/services/auth.service';
import { httpInterceptor } from './app/interceptors/http.interceptor';
import { ToastrModule } from 'ngx-toastr';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: AuthService
    },
    {
      provide: StorageService
    },
    importProvidersFrom(BrowserModule, AppRoutingModule, BrowserAnimationsModule,
      ToastrModule.forRoot({
        timeOut: 4000,
        positionClass: 'toast-top-right',
        preventDuplicates: true,
        closeButton: true,
        progressBar: true
      })),
    provideAnimations(),
    provideHttpClient(withInterceptors([httpInterceptor])),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.getCurrentUser();
    })
  ]
}).catch((err) => console.error(err));
