export interface BusStop {
  code: string;
  name: string;
  road: string;
  latitude?: number;
  longitude?: number;
  services: string[];
}

export interface RouteStop {
  stopCode: string;
  distanceKm: number;
  arrivalMinutes?: number[]; // Empty array [] or optional for services with no live timing
}

export interface ServiceDirection {
  directionId: 1 | 2;
  originName?: string;
  destinationName?: string;
  stops: RouteStop[];
}

export interface BusService {
  serviceNumber: string;
  directions: ServiceDirection[];
}

export interface RideCalculation {
  hasLiveTiming: boolean;
  minutesToBoarding: number;
  rideDurationMinutes: number;
  arrivalClockTime: string;
  distanceKm: number;
  destinationStopCode: string;
  boardingStopCode: string;
}
