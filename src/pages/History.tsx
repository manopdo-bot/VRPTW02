import React from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Calendar, MapPin, Truck, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const { history } = useAppContext();
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Optimization History</h1>
        <p className="text-gray-500 mt-2">Review past delivery routes and performance</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date & Time</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Distance</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Cost</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Vehicles Used</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Unassigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map(h => (
              <tr key={h.id} onClick={() => navigate('/routing', { state: { resultId: h.id } })} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{format(new Date(h.date), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-gray-500">{format(new Date(h.date), 'HH:mm:ss')}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin size={16} className="text-blue-500" />
                    {h.totalDistance.toFixed(1)} km
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <DollarSign size={16} className="text-emerald-500" />
                    ฿{h.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Truck size={16} className="text-amber-500" />
                    {h.routes.length}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {h.unassignedCustomers.length > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {h.unassignedCustomers.length} missed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      All assigned
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No history available. Run an optimization first.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
