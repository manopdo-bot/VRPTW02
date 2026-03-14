export type CustomerType = 'Hotel' | 'Shop' | 'School';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  lat: number;
  lng: number;
  demand: number; // e.g., kg of bread
  readyTime: string; // HH:mm
  dueTime: string; // HH:mm
  serviceTime: number; // minutes
}

export type VehicleType = 'Truck' | 'Van';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  capacity: number;
  costPerKm: number;
  fixedCost: number;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface RouteStop {
  customerId: string | 'FACTORY';
  lat: number;
  lng: number;
  arrivalTime: string;
  departureTime: string;
  distanceFromPrev: number; // km
  timeFromPrev: number; // minutes
}

export interface Route {
  id: string;
  vehicleId: string;
  stops: RouteStop[];
  totalDistance: number; // km
  totalTime: number; // minutes
  totalCost: number;
  totalLoad: number;
  pathCoordinates?: [number, number][]; // For drawing on map
}

export interface OptimizationResult {
  id: string;
  date: string;
  routes: Route[];
  totalDistance: number;
  totalCost: number;
  unassignedCustomers: string[];
}
