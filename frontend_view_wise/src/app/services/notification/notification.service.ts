// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root' // disponible globalement
})
export class NotificationService {

  constructor(private toastr: ToastrService) {}

  success(message: string, title: string = 'Succès') {
    this.toastr.success(message, title);
  }

  error(message: string, title: string = 'Erreur') {
    this.toastr.error(message, title);
  }

  info(message: string, title: string = 'Info') {
    this.toastr.info(message, title);
  }

  warning(message: string, title: string = 'Avertissement') {
    this.toastr.warning(message, title);
  }
}
