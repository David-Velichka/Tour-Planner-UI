import { Routes } from '@angular/router';
import { App } from './app';
import { Login } from './components/auth/login/login';

export const routes: Routes = [
	{ path: 'login', component: Login },
	{ path: 'register', component: Login }, // change to register
	{ path: 'app', component: App },
	{ path: '', pathMatch: 'full', redirectTo: 'login' }, // root path
	{ path: '**', redirectTo: 'login' } // random path
];
