export enum TransportType {
  BIKE = 'BIKE',
  HIKE = 'HIKE',
  RUNNING = 'RUNNING',
  VACATION = 'VACATION'
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: TransportType;
  distanceKm: number;
  estimatedTimeMin: number;
}
