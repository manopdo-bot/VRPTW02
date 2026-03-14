import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Customer, Vehicle, OptimizationResult } from '../types';

interface AppState {
  customers: Customer[];
  vehicles: Vehicle[];
  history: OptimizationResult[];
  factoryLocation: { lat: number; lng: number };
  trafficDensity: 'Low' | 'Medium' | 'High';
  setCustomers: (customers: Customer[]) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setHistory: (history: OptimizationResult[]) => void;
  setTrafficDensity: (density: 'Low' | 'Medium' | 'High') => void;
  addOptimizationResult: (result: OptimizationResult) => void;
}

const defaultVehicles: Vehicle[] = [
  ...Array.from({ length: 2 }).map((_, i) => ({
    id: `truck-${i + 1}`,
    name: `Truck ${i + 1}`,
    type: 'Truck' as const,
    capacity: 500, // kg
    costPerKm: 15, // baht
    fixedCost: 500, // baht
    startTime: '07:00',
    endTime: '18:00',
  })),
  ...Array.from({ length: 8 }).map((_, i) => ({
    id: `van-${i + 1}`,
    name: `Van ${i + 1}`,
    type: 'Van' as const,
    capacity: 200, // kg
    costPerKm: 8, // baht
    fixedCost: 200, // baht
    startTime: '07:00',
    endTime: '18:00',
  })),
];

// Sample customers around Khon Kaen
const defaultCustomers: Customer[] = [
  { id: 'c1', name: 'Market A', type: 'Shop', lat: 16.4364, lng: 102.8358, demand: 50, readyTime: '07:00', dueTime: '12:00', serviceTime: 30 },
  { id: 'c2', name: 'Hotel A', type: 'Hotel', lat: 16.4327, lng: 102.8365, demand: 60, readyTime: '07:00', dueTime: '12:00', serviceTime: 30 },
  { id: 'c3', name: 'School A', type: 'School', lat: 16.4207, lng: 102.8376, demand: 100, readyTime: '07:00', dueTime: '12:00', serviceTime: 30 },
  { id: 'c4', name: 'Market B', type: 'Shop', lat: 16.4282, lng: 102.8474, demand: 40, readyTime: '08:00', dueTime: '14:00', serviceTime: 30 },
  { id: 'c5', name: 'School B', type: 'School', lat: 16.4869, lng: 102.8521, demand: 80, readyTime: '07:00', dueTime: '12:00', serviceTime: 30 },
];

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(defaultCustomers);
  const [vehicles, setVehicles] = useState<Vehicle[]>(defaultVehicles);
  const [history, setHistory] = useState<OptimizationResult[]>([]);
  const [trafficDensity, setTrafficDensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const factoryLocation = { lat: 16.3548, lng: 102.794 }; // Factory Location

  const addOptimizationResult = (result: OptimizationResult) => {
    setHistory((prev) => [result, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        customers,
        vehicles,
        history,
        factoryLocation,
        trafficDensity,
        setCustomers,
        setVehicles,
        setHistory,
        setTrafficDensity,
        addOptimizationResult,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
