import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('accessToken');

    const publicRoutes = [
      '/api/v1/authentication/sign-up',
      '/api/v1/authentication/sign-in'
    ];

    // Extraer solo el path
    const path = new URL(req.url).pathname;
    const isPublicRoute = publicRoutes.includes(path);

    if (!isPublicRoute && token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
