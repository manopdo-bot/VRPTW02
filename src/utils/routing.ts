import { Customer, Vehicle, Route, RouteStop, OptimizationResult } from '../types';

// Helper to calculate distance using Haversine formula (fallback)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Convert HH:mm to minutes from midnight
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Convert minutes from midnight to HH:mm
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export async function optimizeRoutes(
  customers: Customer[],
  vehicles: Vehicle[],
  factory: { lat: number; lng: number },
  trafficDensity: 'Low' | 'Medium' | 'High'
): Promise<OptimizationResult> {
  // Traffic multiplier affects travel time
  const trafficMultiplier = trafficDensity === 'Low' ? 1 : trafficDensity === 'Medium' ? 1.3 : 1.8;

  // 1. Build Distance Matrix
  // For simplicity and avoiding OSRM rate limits on large datasets, we use Haversine * 1.4 (detour factor)
  // In a real production app, we'd use OSRM Table API here.
  // We will use OSRM Route API later to get the actual paths for the map.
  const points = [{ id: 'FACTORY', lat: factory.lat, lng: factory.lng }, ...customers];
  
  const getDistance = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
    return getDistanceFromLatLonInKm(p1.lat, p1.lng, p2.lat, p2.lng) * 1.4; // Detour factor
  };

  // Assume average speed is 40 km/h (0.67 km/min)
  const getTravelTime = (distance: number) => {
    return (distance / 0.67) * trafficMultiplier;
  };

  // 2. Simple Greedy Heuristic (Nearest Neighbor with Time Windows & Capacity)
  let unassignedCustomers = [...customers];
  const routes: Route[] = [];
  
  // Sort vehicles by capacity descending (use trucks first if possible)
  const sortedVehicles = [...vehicles].sort((a, b) => b.capacity - a.capacity);

  for (const vehicle of sortedVehicles) {
    if (unassignedCustomers.length === 0) break;

    let currentLoad = 0;
    let currentTime = timeToMinutes(vehicle.startTime);
    const vehicleEndTime = timeToMinutes(vehicle.endTime);
    let currentLocation = { id: 'FACTORY', lat: factory.lat, lng: factory.lng };
    
    const stops: RouteStop[] = [{
      customerId: 'FACTORY',
      lat: factory.lat,
      lng: factory.lng,
      arrivalTime: minutesToTime(currentTime),
      departureTime: minutesToTime(currentTime),
      distanceFromPrev: 0,
      timeFromPrev: 0
    }];
    let totalDistance = 0;
    let totalTime = 0;

    while (unassignedCustomers.length > 0) {
      // Find valid next customers
      const validCustomers = unassignedCustomers.filter(c => {
        if (currentLoad + c.demand > vehicle.capacity) return false;
        
        const dist = getDistance(currentLocation, c);
        const travelTime = getTravelTime(dist);
        const arrivalTime = currentTime + travelTime;
        
        // Check if we can arrive before due time
        if (arrivalTime > timeToMinutes(c.dueTime)) return false;
        
        // Check if vehicle can return to factory before its shift ends
        const departureTime = Math.max(arrivalTime, timeToMinutes(c.readyTime)) + c.serviceTime;
        const returnDist = getDistance(c, { lat: factory.lat, lng: factory.lng });
        const returnTime = getTravelTime(returnDist);
        if (departureTime + returnTime > vehicleEndTime) return false;
        
        return true;
      });

      if (validCustomers.length === 0) break;

      // Pick the nearest valid customer
      validCustomers.sort((a, b) => {
        const distA = getDistance(currentLocation, a);
        const distB = getDistance(currentLocation, b);
        return distA - distB;
      });

      const nextCustomer = validCustomers[0];
      const dist = getDistance(currentLocation, nextCustomer);
      const travelTime = getTravelTime(dist);
      
      let arrivalTime = currentTime + travelTime;
      // Wait if arrived before ready time
      if (arrivalTime < timeToMinutes(nextCustomer.readyTime)) {
        arrivalTime = timeToMinutes(nextCustomer.readyTime);
      }
      
      const departureTime = arrivalTime + nextCustomer.serviceTime;

      stops.push({
        customerId: nextCustomer.id,
        lat: nextCustomer.lat,
        lng: nextCustomer.lng,
        arrivalTime: minutesToTime(arrivalTime),
        departureTime: minutesToTime(departureTime),
        distanceFromPrev: dist,
        timeFromPrev: travelTime
      });

      currentLoad += nextCustomer.demand;
      currentTime = departureTime;
      totalDistance += dist;
      totalTime += travelTime + nextCustomer.serviceTime;
      currentLocation = nextCustomer;
      
      unassignedCustomers = unassignedCustomers.filter(c => c.id !== nextCustomer.id);
    }

    if (stops.length > 0) {
      // Return to factory
      const returnDist = getDistance(currentLocation, { lat: factory.lat, lng: factory.lng });
      const returnTime = getTravelTime(returnDist);
      const arrivalTime = currentTime + returnTime;
      
      stops.push({
        customerId: 'FACTORY',
        lat: factory.lat,
        lng: factory.lng,
        arrivalTime: minutesToTime(arrivalTime),
        departureTime: minutesToTime(arrivalTime),
        distanceFromPrev: returnDist,
        timeFromPrev: returnTime
      });
      
      totalDistance += returnDist;
      totalTime += returnTime;

      const totalCost = vehicle.fixedCost + (totalDistance * vehicle.costPerKm);

      routes.push({
        id: `route-${Date.now()}-${vehicle.id}`,
        vehicleId: vehicle.id,
        stops,
        totalDistance,
        totalTime,
        totalCost,
        totalLoad: currentLoad
      });
    }
  }

  // 3. Fetch actual paths from OSRM for the generated routes
  for (const route of routes) {
    try {
      const coordinates = route.stops.map(s => `${s.lng},${s.lat}`).join(';');
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // OSRM returns [lng, lat], Leaflet needs [lat, lng]
        route.pathCoordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
        // Optionally update distance/time with actual OSRM data
        // route.totalDistance = data.routes[0].distance / 1000;
        // route.totalTime = data.routes[0].duration / 60;
      }
    } catch (error) {
      console.error("Failed to fetch OSRM route", error);
    }
  }

  return {
    id: `opt-${Date.now()}`,
    date: new Date().toISOString(),
    routes,
    totalDistance: routes.reduce((sum, r) => sum + r.totalDistance, 0),
    totalCost: routes.reduce((sum, r) => sum + r.totalCost, 0),
    unassignedCustomers: unassignedCustomers.map(c => c.id)
  };
}
