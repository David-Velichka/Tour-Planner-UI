import { Routes } from '@angular/router';
import { App } from './app';

export const routes: Routes = [
	{ path: 'login', component: App }, // change to login component
	{ path: 'register', component: App }, // change to register component
	{ path: 'app', component: App },
	{ path: '', pathMatch: 'full', redirectTo: 'login' }, // root path
	{ path: '**', redirectTo: 'login' } // random path
];
