export interface TourLog {
  id: number;
  tourId: number;
  loggedAt: string;
  comment: string;
  difficulty: number;
  totalDistanceKm: number;
  totalTimeMin: number;
  rating: number;
}
