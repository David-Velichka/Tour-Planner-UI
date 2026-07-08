import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Tour, TransportType } from '../models/tour.model';
import { AuthService } from './auth.service';

// Data sent from the tour form to create or update a tour.
// distanceKm and estimatedTimeMin are computed by the backend (ORS), not entered by the user.
export interface TourFormData {
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: TransportType;
  imageFilePath?: string;
  imageFile?: File;
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
  elevationProfile: string | null;
  ascentM: number | null;
  descentM: number | null;
}

interface TourListApiResponse {
  tours: TourApiResponse[];
}

export interface TourExportDto {
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: string;
  distanceKm: number;
  estimatedTimeMin: number;
  routeGeometry: string | null;
  imageFilePath: string | null;
  logs: {
    loggedAt: string;
    comment: string;
    difficulty: number;
    totalDistanceKm: number;
    totalTimeMin: number;
    rating: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = 'http://localhost:8080/api/tours';

  private headers(): HttpHeaders {
    const token = this.authService.currentToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
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
      elevationProfile: dto.elevationProfile ?? undefined,
      ascentM: dto.ascentM ?? undefined,
      descentM: dto.descentM ?? undefined,
    };
  }

  async getTours(): Promise<Tour[]> {
    const response = await firstValueFrom(
      this.http.get<TourListApiResponse>(this.baseUrl, { headers: this.headers() })
    );
    return response.tours.map((t) => this.mapTour(t));
  }

  async createTour(data: TourFormData): Promise<Tour> {
    const dto = await firstValueFrom(
      this.http.post<TourApiResponse>(this.baseUrl, data, { headers: this.headers() })
    );
    return this.mapTour(dto);
  }

  async updateTour(id: number, data: TourFormData): Promise<Tour> {
    const dto = await firstValueFrom(
      this.http.put<TourApiResponse>(`${this.baseUrl}/${id}`, data, {
        headers: this.headers(),
      })
    );
    return this.mapTour(dto);
  }

  async deleteTour(id: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.headers() })
    );
  }

  async searchTours(query: string): Promise<Tour[]> {
    const response = await firstValueFrom(
      this.http.get<{ tours: TourApiResponse[] }>(`${this.baseUrl}/search`, {
        headers: this.headers(),
        params: { q: query },
      })
    );
    return response.tours.map((t) => this.mapTour(t));
  }

  async exportTours(): Promise<Blob> {
    return firstValueFrom(
      this.http.get('http://localhost:8080/api/export', {
        headers: this.headers(),
        responseType: 'blob',
      })
    );
  }

  async importTours(data: TourExportDto[]): Promise<void> {
    await firstValueFrom(
      this.http.post<void>('http://localhost:8080/api/import', { tours: data }, { headers: this.headers() })
    );
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await firstValueFrom(
      this.http.post<{ filename: string }>('http://localhost:8080/api/images', formData, {
        headers: this.headers(),
      })
    );
    return response.filename;
  }

  async getImageBlob(imageFilePath: string): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`http://localhost:8080/api/images/${imageFilePath.replace(/^\/+/, '')}`, {
        headers: this.headers(),
        responseType: 'blob',
      })
    );
  }
}
