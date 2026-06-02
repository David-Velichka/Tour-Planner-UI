import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TourLog } from '../models/tour-log.model';

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
  private readonly baseUrl = 'http://localhost:8080/api/tour-logs';

  private headers(userId: number): HttpHeaders {
    return new HttpHeaders({ 'X-User-Id': userId.toString() });
  }

  async getLogs(userId: number, tourId: number): Promise<TourLog[]> {
    const response = await firstValueFrom(
      this.http.get<{ logs: TourLog[] }>(this.baseUrl, {
        headers: this.headers(userId),
        params: { tourId: tourId.toString() },
      })
    );
    return response.logs;
  }

  async createLog(userId: number, tourId: number, data: TourLogFormData): Promise<TourLog> {
    return firstValueFrom(
      this.http.post<TourLog>(this.baseUrl, { ...data, tourId }, { headers: this.headers(userId) })
    );
  }

  async updateLog(userId: number, id: number, data: TourLogFormData): Promise<TourLog> {
    return firstValueFrom(
      this.http.put<TourLog>(`${this.baseUrl}/${id}`, data, { headers: this.headers(userId) })
    );
  }

  async deleteLog(userId: number, id: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.headers(userId) })
    );
  }
}
