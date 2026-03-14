import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Vehicle, VehicleType } from '../types';
import { Plus, Trash2, Save, Edit2 } from 'lucide-react';

const Vehicles = () => {
  const { vehicles, setVehicles } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Vehicle>>({});

  const handleEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setEditForm(v);
  };

  const handleSave = () => {
    setVehicles(vehicles.map(v => v.id === editingId ? { ...v, ...editForm } as Vehicle : v));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const handleAdd = () => {
    const newId = `v-${Date.now()}`;
    setVehicles([...vehicles, {
      id: newId,
      name: `New Vehicle`,
      type: 'Van',
      capacity: 200,
      costPerKm: 8,
      fixedCost: 200,
      startTime: '07:00',
      endTime: '18:00'
    }]);
    setEditingId(newId);
    setEditForm({
      id: newId,
      name: `New Vehicle`,
      type: 'Van',
      capacity: 200,
      costPerKm: 8,
      fixedCost: 200,
      startTime: '07:00',
      endTime: '18:00'
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fleet Management</h1>
          <p className="text-gray-500 mt-2">Configure vehicle capacities, costs, and working hours</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium">
          <Plus size={18} />
          Add Vehicle
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Capacity (kg)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Cost / km (฿)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Fixed Cost (฿)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Working Hours</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.map(v => (
              <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                {editingId === v.id ? (
                  <>
                    <td className="px-6 py-3"><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                    <td className="px-6 py-3">
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as VehicleType})}>
                        <option value="Truck">Truck</option>
                        <option value="Van">Van</option>
                      </select>
                    </td>
                    <td className="px-6 py-3"><input type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={editForm.capacity || ''} onChange={e => setEditForm({...editForm, capacity: Number(e.target.value)})} /></td>
                    <td className="px-6 py-3"><input type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={editForm.costPerKm || ''} onChange={e => setEditForm({...editForm, costPerKm: Number(e.target.value)})} /></td>
                    <td className="px-6 py-3"><input type="number" className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" value={editForm.fixedCost || ''} onChange={e => setEditForm({...editForm, fixedCost: Number(e.target.value)})} /></td>
                    <td className="px-6 py-3 flex gap-2">
                      <input type="time" className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={editForm.startTime || ''} onChange={e => setEditForm({...editForm, startTime: e.target.value})} />
                      <input type="time" className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={editForm.endTime || ''} onChange={e => setEditForm({...editForm, endTime: e.target.value})} />
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-800 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"><Save size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-medium text-gray-900">{v.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        v.type === 'Truck' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {v.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.capacity}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">฿{v.costPerKm}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">฿{v.fixedCost}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.startTime} - {v.endTime}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleEdit(v)} className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Vehicles;
