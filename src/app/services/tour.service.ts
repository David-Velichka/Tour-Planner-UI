import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Tour, TransportType } from '../models/tour.model';

// Data sent from the tour form to create or update a tour.
// distanceKm and estimatedTimeMin are computed by the backend (ORS), not entered by the user.
export interface TourFormData {
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: TransportType;
  imageFilePath?: string;
}

interface TourApiResponse {
  id: number;
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: TransportType;
  distanceKm: number;
  estimatedTimeMin: number;
  routeGeometry: string | null;
  imageFilePath: string | null;
  popularity: number;
  childFriendliness: string;
}

interface TourListApiResponse {
  tours: TourApiResponse[];
}

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/tours';

  private headers(userId: number): HttpHeaders {
    return new HttpHeaders({ 'X-User-Id': userId.toString() });
  }

  private mapTour(dto: TourApiResponse): Tour {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      from: dto.from,
      to: dto.to,
      transportType: dto.transportType,
      distanceKm: dto.distanceKm,
      estimatedTimeMin: dto.estimatedTimeMin,
      routeGeometry: dto.routeGeometry ?? undefined,
      imageFilePath: dto.imageFilePath ?? undefined,
      popularity: dto.popularity,
      childFriendliness: dto.childFriendliness,
    };
  }

  async getTours(userId: number): Promise<Tour[]> {
    const response = await firstValueFrom(
      this.http.get<TourListApiResponse>(this.baseUrl, { headers: this.headers(userId) })
    );
    return response.tours.map((t) => this.mapTour(t));
  }

  async createTour(userId: number, data: TourFormData): Promise<Tour> {
    const dto = await firstValueFrom(
      this.http.post<TourApiResponse>(this.baseUrl, data, { headers: this.headers(userId) })
    );
    return this.mapTour(dto);
  }

  async updateTour(userId: number, id: number, data: TourFormData): Promise<Tour> {
    const dto = await firstValueFrom(
      this.http.put<TourApiResponse>(`${this.baseUrl}/${id}`, data, {
        headers: this.headers(userId),
      })
    );
    return this.mapTour(dto);
  }

  async deleteTour(userId: number, id: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.headers(userId) })
    );
  }

  async searchTours(userId: number, query: string): Promise<Tour[]> {
    const response = await firstValueFrom(
      this.http.get<{ tours: TourApiResponse[] }>(`${this.baseUrl}/search`, {
        headers: this.headers(userId),
        params: { q: query },
      })
    );
    return response.tours.map((t) => this.mapTour(t));
  }
}
