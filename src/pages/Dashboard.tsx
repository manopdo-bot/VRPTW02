import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Package, Truck, MapPin, TrendingDown, Download } from 'lucide-react';
import Papa from 'papaparse';
import { format } from 'date-fns';

const Dashboard = () => {
  const { history, customers, vehicles } = useAppContext();
  const latestResult = history[0];

  const totalCost = latestResult?.totalCost || 0;
  const totalDistance = latestResult?.totalDistance || 0;
  const activeVehicles = latestResult?.routes.length || 0;
  const unassigned = latestResult?.unassignedCustomers.length || 0;

  const costData = latestResult?.routes.map(r => {
    const v = vehicles.find(v => v.id === r.vehicleId);
    return {
      name: v?.name || r.vehicleId,
      cost: r.totalCost,
      distance: r.totalDistance,
      load: r.totalLoad,
    };
  }) || [];

  const timeData = latestResult?.routes.map(r => {
    const v = vehicles.find(v => v.id === r.vehicleId);
    return {
      name: v?.name || r.vehicleId,
      timeHours: Number((r.totalTime / 60).toFixed(1)),
    };
  }) || [];

  const historyData = history.slice().reverse().map((h, i) => ({
    name: `Run ${i + 1}`,
    cost: h.totalCost,
    distance: h.totalDistance,
  }));

  const handleExportAll = () => {
    if (!latestResult) return;
    
    const routeData = latestResult.routes.flatMap(r => 
      r.stops.map(s => {
        const customer = s.customerId === 'FACTORY' ? { name: 'Factory', type: 'Factory', demand: 0 } : customers.find(c => c.id === s.customerId);
        const vehicle = vehicles.find(v => v.id === r.vehicleId);
        return {
          Date: format(new Date(latestResult.date), 'yyyy-MM-dd'),
          Vehicle: vehicle?.name || r.vehicleId,
          VehicleType: vehicle?.type || '',
          StopName: customer?.name || s.customerId,
          StopType: customer?.type || '',
          Lat: s.lat,
          Lng: s.lng,
          ArrivalTime: s.arrivalTime,
          DepartureTime: s.departureTime,
          DistanceKm: s.distanceFromPrev.toFixed(2),
          TravelTimeMin: s.timeFromPrev.toFixed(0),
          LoadDelivered: customer?.demand || 0
        };
      })
    );

    const csv = Papa.unparse(routeData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `optimization_result_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    link.click();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-2">Overview of your delivery operations</p>
        </div>
        <button onClick={handleExportAll} disabled={!latestResult} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium disabled:opacity-50">
          <Download size={18} />
          Export Latest Result
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<TrendingDown className="text-emerald-500" />} title="Total Cost" value={`฿${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub="Latest optimization" />
        <StatCard icon={<MapPin className="text-blue-500" />} title="Total Distance" value={`${totalDistance.toFixed(1)} km`} sub="Total route length" />
        <StatCard icon={<Truck className="text-indigo-500" />} title="Active Vehicles" value={`${activeVehicles} / ${vehicles.length}`} sub="Vehicles deployed" />
        <StatCard icon={<Package className="text-amber-500" />} title="Unassigned" value={unassigned} sub="Customers missed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Cost per Vehicle</h2>
          <div className="h-80">
            {costData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} name="Cost (THB)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No data available. Run optimization first.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Total Time per Vehicle (Hours)</h2>
          <div className="h-80">
            {timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="timeHours" fill="#10b981" radius={[4, 4, 0, 0]} name="Time (Hours)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No data available.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Historical Cost Trend</h2>
          <div className="h-80">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} name="Total Cost" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No history available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, sub }: { icon: React.ReactNode, title: string, value: string | number, sub: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
    <div className="p-3 bg-gray-50 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  </div>
);

export default Dashboard;
