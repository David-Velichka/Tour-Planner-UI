export interface TourLog {
  id: string;
  tourId: string;
  loggedAt: string;
  comment: string;
  difficulty: number;
  totalDistanceKm: number;
  totalTimeMin: number;
  rating: number;
}
