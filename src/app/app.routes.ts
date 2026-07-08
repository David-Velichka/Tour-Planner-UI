import { Routes } from '@angular/router';
import { App } from './app';
import { Login } from './components/auth/login/login';
import { MainShell } from './components/main-shell/main-shell';
import { Register } from './components/auth/register/register';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
	{ path: 'login', component: Login, canActivate: [guestGuard] },
	{ path: 'register', component: Register, canActivate: [guestGuard] },
	{ path: 'app', component: MainShell, canActivate: [authGuard] },
	{ path: '', pathMatch: 'full', redirectTo: 'app' }, // root path
	{ path: '**', redirectTo: 'app' } // random path
];
