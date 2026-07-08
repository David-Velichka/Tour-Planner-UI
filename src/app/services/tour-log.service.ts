import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TourLog } from '../models/tour-log.model';
import { AuthService } from './auth.service';

// Data sent from the tour log form to create or update a log.
export interface TourLogFormData {
  loggedAt: string;
  comment: string;
  difficulty: number;
  totalDistanceKm: number;
  totalTimeMin: number;
  rating: number;
}

@Injectable({ providedIn: 'root' })
export class TourLogService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = 'http://localhost:8080/api/tour-logs';

  private headers(): HttpHeaders {
    const token = this.authService.currentToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  async getLogs(tourId: number): Promise<TourLog[]> {
    const response = await firstValueFrom(
      this.http.get<{ logs: TourLog[] }>(this.baseUrl, {
        headers: this.headers(),
        params: { tourId: tourId.toString() },
      })
    );
    return response.logs;
  }

  async createLog(tourId: number, data: TourLogFormData): Promise<TourLog> {
    return firstValueFrom(
      this.http.post<TourLog>(this.baseUrl, { ...data, tourId }, { headers: this.headers() })
    );
  }

  async updateLog(id: number, data: TourLogFormData): Promise<TourLog> {
    return firstValueFrom(
      this.http.put<TourLog>(`${this.baseUrl}/${id}`, data, { headers: this.headers() })
    );
  }

  async deleteLog(id: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.headers() })
    );
  }
}
