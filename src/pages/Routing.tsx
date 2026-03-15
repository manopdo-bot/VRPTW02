import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { optimizeRoutes } from '../utils/routing';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import { OptimizationResult } from '../types';
import { useLocation } from 'react-router-dom';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const factoryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6'];

const Routing = () => {
  const { customers, vehicles, factoryLocation, trafficDensity, setTrafficDensity, addOptimizationResult, history } = useAppContext();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(history[0] || null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.resultId) {
      const res = history.find(h => h.id === location.state.resultId);
      if (res) setResult(res);
    }
  }, [location.state, history]);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await optimizeRoutes(customers, vehicles, factoryLocation, trafficDensity);
      setResult(res);
      addOptimizationResult(res);
    } catch (error) {
      console.error("Optimization failed", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Route Optimization</h1>
          <p className="text-gray-500 mt-2">Generate optimal delivery routes</p>
        </div>
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Traffic Density</label>
            <select 
              className="border border-gray-300 rounded-xl px-4 py-2 bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={trafficDensity}
              onChange={(e) => setTrafficDensity(e.target.value as any)}
            >
              <option value="Low">Low (Fast)</option>
              <option value="Medium">Medium (Normal)</option>
              <option value="High">High (Slow)</option>
            </select>
          </div>
          <button 
            onClick={handleOptimize} 
            disabled={isOptimizing || customers.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-5"
          >
            {isOptimizing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </button>
        </div>
      </div>

      {result && result.unassignedCustomers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Some customers could not be assigned</h4>
            <p className="text-sm text-amber-700 mt-1">
              {result.unassignedCustomers.length} customers were skipped due to capacity or time window constraints.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[600px] relative z-0">
          <MapContainer center={[factoryLocation.lat, factoryLocation.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Marker position={[factoryLocation.lat, factoryLocation.lng]} icon={factoryIcon}>
              <Popup>
                <div className="font-semibold">Factory</div>
                <div className="text-xs text-gray-500">Start/End Point</div>
              </Popup>
            </Marker>

            {customers.map(c => (
              <Marker key={c.id} position={[c.lat, c.lng]} icon={customerIcon}>
                <Popup>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-gray-500">Demand: {c.demand} kg</div>
                  <div className="text-xs text-gray-500">Window: {c.readyTime} - {c.dueTime}</div>
                </Popup>
              </Marker>
            ))}

            {result?.routes.map((route, idx) => {
              if (route.pathCoordinates && route.pathCoordinates.length > 0) {
                return (
                  <Polyline 
                    key={route.id} 
                    positions={route.pathCoordinates} 
                    pathOptions={{ color: colors[idx % colors.length], weight: 4, opacity: 0.7 }} 
                  />
                );
              }
              // Fallback to straight lines if OSRM failed
              const positions = route.stops.map(s => [s.lat, s.lng] as [number, number]);
              return (
                <Polyline 
                  key={route.id} 
                  positions={[[factoryLocation.lat, factoryLocation.lng], ...positions]} 
                  pathOptions={{ color: colors[idx % colors.length], weight: 4, opacity: 0.7, dashArray: '10, 10' }} 
                />
              );
            })}
          </MapContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-y-auto h-[600px]">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Details</h2>
          {result ? (
            <div className="space-y-6">
              {result.routes.map((route, idx) => {
                const vehicle = vehicles.find(v => v.id === route.vehicleId);
                return (
                  <div key={route.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                        <h3 className="font-semibold text-gray-900">{vehicle?.name || route.vehicleId}</h3>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                        {route.totalDistance.toFixed(1)} km
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="text-gray-600">Load: <span className="font-medium text-gray-900">{route.totalLoad} kg</span></div>
                      <div className="text-gray-600">Cost: <span className="font-medium text-gray-900">฿{route.totalCost.toFixed(0)}</span></div>
                    </div>
                    
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                      {route.stops.map((stop, sIdx) => {
                        const isFirst = sIdx === 0;
                        const isLast = sIdx === route.stops.length - 1;
                        const isFactory = stop.customerId === 'FACTORY';
                        const customer = customers.find(c => c.id === stop.customerId);
                        
                        let timeDisplay = '';
                        if (isFirst) timeDisplay = `Departs: ${stop.departureTime}`;
                        else if (isLast) timeDisplay = `Finish: ${stop.arrivalTime}`;
                        else timeDisplay = `Arrives: ${stop.arrivalTime} | Departs: ${stop.departureTime}`;

                        return (
                          <div key={sIdx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-gray-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" style={{ backgroundColor: isFactory ? '#ef4444' : colors[idx % colors.length] }}></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-2 rounded-lg bg-white border border-gray-100 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium text-sm text-gray-900">{isFactory ? 'Factory' : customer?.name}</div>
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {timeDisplay}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-center">
              Run optimization to see route details here.
            </div>
          )}
        </div>
      </div>

      {/* Gantt Chart Section */}
      {result && result.routes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Schedule (Gantt Chart)</h2>
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b border-gray-200 pb-2 mb-4">
              <div className="w-32 shrink-0 font-medium text-sm text-gray-500">Vehicle</div>
              <div className="flex-1 relative h-6">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="absolute text-xs text-gray-400" style={{ left: `${(i / 13) * 100}%`, transform: 'translateX(-50%)' }}>
                    {`${(i + 6).toString().padStart(2, '0')}:00`}
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Rows */}
            <div className="space-y-4">
              {result.routes.map((route, idx) => {
                const vehicle = vehicles.find(v => v.id === route.vehicleId);
                // Assume day starts at 06:00 (360 mins) and ends at 19:00 (1140 mins) -> 780 mins total
                const dayStart = 360;
                const dayLength = 780;

                const timeToPercent = (timeStr: string) => {
                  const [h, m] = timeStr.split(':').map(Number);
                  const mins = h * 60 + m;
                  return Math.max(0, Math.min(100, ((mins - dayStart) / dayLength) * 100));
                };

                return (
                  <div key={route.id} className="flex items-center">
                    <div className="w-32 shrink-0 font-medium text-sm text-gray-900 truncate pr-4" title={vehicle?.name}>
                      {vehicle?.name}
                    </div>
                    <div className="flex-1 relative h-8 bg-gray-50 rounded-lg border border-gray-100">
                      {route.stops.map((stop, sIdx) => {
                        if (stop.customerId === 'FACTORY') return null;
                        const customer = customers.find(c => c.id === stop.customerId);
                        const startPct = timeToPercent(stop.arrivalTime);
                        const endPct = timeToPercent(stop.departureTime);
                        const width = Math.max(0.5, endPct - startPct); // Ensure at least some width

                        return (
                          <div
                            key={sIdx}
                            className="absolute h-full rounded-md shadow-sm flex items-center justify-center overflow-hidden group cursor-pointer"
                            style={{ 
                              left: `${startPct}%`, 
                              width: `${width}%`,
                              backgroundColor: colors[idx % colors.length],
                              opacity: 0.9
                            }}
                          >
                            <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-xs p-2 rounded whitespace-nowrap -top-10 left-1/2 transform -translate-x-1/2">
                              {customer?.name}<br/>
                              {stop.arrivalTime} - {stop.departureTime}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routing;
