import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Customer, CustomerType } from '../types';
import { Plus, Upload, Download, Trash2, Edit2, Save, X } from 'lucide-react';
import Papa from 'papaparse';

const Customers = () => {
  const { customers, setCustomers } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<Customer>>({});

  const handleAddNewClick = () => {
    const lastCustomer = customers[customers.length - 1];
    const baseLat = lastCustomer ? lastCustomer.lat : 16.4300;
    const baseLng = lastCustomer ? lastCustomer.lng : 102.8300;
    const randomOffset = () => (Math.random() - 0.5) * 0.01;

    setFormData({
      name: `Customer ${customers.length + 1}`,
      type: 'Shop',
      lat: Number((baseLat + randomOffset()).toFixed(4)),
      lng: Number((baseLng + randomOffset()).toFixed(4)),
      demand: 50,
      readyTime: '07:00',
      dueTime: '12:00',
      serviceTime: 30
    });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditClick = (c: Customer) => {
    setFormData(c);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!formData.name || formData.lat === undefined || formData.lng === undefined) {
      alert('Please fill in Name, Latitude, and Longitude');
      return;
    }

    const processedData = {
      ...formData,
      lat: Number(formData.lat) || 0,
      lng: Number(formData.lng) || 0,
      demand: Number(formData.demand) || 0,
      serviceTime: Number(formData.serviceTime) || 0,
    };

    if (modalMode === 'add') {
      setCustomers([...customers, { ...processedData, id: `c-${Date.now()}` } as Customer]);
    } else {
      setCustomers(customers.map(c => c.id === formData.id ? { ...c, ...processedData } as Customer : c));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const handleExport = () => {
    const csv = Papa.unparse(customers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'customers.csv';
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          const imported = results.data.map((row: any) => ({
            id: row.id || `c-${Date.now()}-${Math.random()}`,
            name: row.name,
            type: row.type || 'Shop',
            lat: Number(row.lat),
            lng: Number(row.lng),
            demand: Number(row.demand) || 10,
            readyTime: row.readyTime || '07:00',
            dueTime: row.dueTime || '18:00',
            serviceTime: Number(row.serviceTime) || 30
          })).filter(c => c.name && !isNaN(c.lat) && !isNaN(c.lng));
          setCustomers([...customers, ...imported]);
        }
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-gray-500 mt-2">Manage delivery locations and demands</p>
        </div>
        <div className="flex gap-3">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium">
            <Upload size={18} />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium">
            <Download size={18} />
            Export
          </button>
          <button onClick={handleAddNewClick} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium">
            <Plus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Location (Lat, Lng)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Demand (kg)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Time Window</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Service (min)</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    c.type === 'Hotel' ? 'bg-blue-100 text-blue-800' :
                    c.type === 'School' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {c.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{Number(c.lat).toFixed(4)}, {Number(c.lng).toFixed(4)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.demand}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.readyTime} - {c.dueTime}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.serviceTime}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => handleEditClick(c)} className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No customers found. Add some or import a CSV.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'add' ? 'Add New Customer' : 'Edit Customer'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Customer Name" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={formData.type || 'Shop'} onChange={e => setFormData({...formData, type: e.target.value as CustomerType})}>
                    <option value="Hotel">Hotel</option>
                    <option value="Shop">Shop</option>
                    <option value="School">School</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Demand (kg)</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={formData.demand ?? ''} onChange={e => setFormData({...formData, demand: e.target.value as any})} placeholder="e.g. 50" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={formData.lat ?? ''} onChange={e => setFormData({...formData, lat: e.target.value as any})} placeholder="e.g. 16.4321" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={formData.lng ?? ''} onChange={e => setFormData({...formData, lng: e.target.value as any})} placeholder="e.g. 102.8345" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ready Time</label>
                  <input type="time" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={formData.readyTime || ''} onChange={e => setFormData({...formData, readyTime: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Time</label>
                  <input type="time" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={formData.dueTime || ''} onChange={e => setFormData({...formData, dueTime: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Time (minutes)</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={formData.serviceTime ?? ''} onChange={e => setFormData({...formData, serviceTime: e.target.value as any})} placeholder="e.g. 30" />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveModal} className="px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2">
                <Save size={18} />
                {modalMode === 'add' ? 'Add Customer' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
