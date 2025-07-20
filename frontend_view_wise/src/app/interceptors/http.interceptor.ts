import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const token = storageService.getToken();

  if (token) {
    const isJwt = token.includes('.') && token.split('.').length === 3;
    const headerPrefix = isJwt ? 'Bearer' : 'Token';

    const cloned = req.clone({
      setHeaders: { Authorization: `${headerPrefix} ${token}` }
    });





    return next(cloned);
  }

  return next(req);
};
