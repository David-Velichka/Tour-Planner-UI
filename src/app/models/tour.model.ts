export enum TransportType {
  BIKE = 'BIKE',
  HIKE = 'HIKE',
  RUNNING = 'RUNNING',
  VACATION = 'VACATION'
}

export interface Tour {
  id: number;
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: TransportType;
  distanceKm: number;
  estimatedTimeMin: number;
  routeGeometry?: string;
  imageFilePath?: string;
  popularity: number;
  childFriendliness: string;
  elevationProfile?: string;  // 3D coordinates [[lon,lat,elev],...] as JSON string
  ascentM?: number;           // total ascent in meters
  descentM?: number;          // total descent in meters
}
