import { useState, useEffect } from 'react';
import { Plus, MapPin, X } from 'lucide-react';
import { getCustomers, getMileageEntries, saveMileageEntry, deleteMileageEntry } from '../store/db';
import { formatCurrency, formatDate, todayStr } from '../utils/format';
import type { MileageEntry } from '../types';

interface MileagePageProps {
  navState?: any;
}

const IRS_RATE = 0.67; // 2024 IRS standard mileage rate

export default function MileagePage({ navState }: MileagePageProps) {
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCustomer, setFilterCustomer] = useState('');

  const emptyForm = {
    customerId: '',
    date: todayStr(),
    fromAddress: '',
    toAddress: '',
    miles: 0,
    ratePerMile: IRS_RATE,
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (navState?.customerId) {
      setForm(f => ({ ...f, customerId: navState.customerId }));
      setShowForm(true);
    }
  }, [navState]);

  useEffect(() => { reload(); }, []);

  function reload() {
    setEntries(getMileageEntries());
    setCustomers(getCustomers().map(c => ({ id: c.id, name: c.name })));
  }

  const filtered = entries.filter(e =>
    !filterCustomer || e.customerId === filterCustomer
  );

  const totalMiles = filtered.reduce((s, e) => s + e.miles, 0);
  const totalCost = filtered.reduce((s, e) => s + e.total, 0);

  function handleSave() {
    if (!form.customerId || form.miles <= 0) {
      alert('Please select a customer and enter miles');
      return;
    }
    saveMileageEntry({ ...form, id: editingId || undefined });
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    reload();
  }

  function handleEdit(entry: MileageEntry) {
    setEditingId(entry.id);
    setForm({
      customerId: entry.customerId,
      date: entry.date,
      fromAddress: entry.fromAddress,
      toAddress: entry.toAddress,
      miles: entry.miles,
      ratePerMile: entry.ratePerMile,
      notes: entry.notes,
    });
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this mileage entry?')) {
      deleteMileageEntry(id);
      reload();
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mileage Tracker</h1>
          <p className="text-gray-500 mt-1">
            {totalMiles.toFixed(1)} miles • {formatCurrency(totalCost)} total
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add Mileage
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterCustomer}
          onChange={e => setFilterCustomer(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Customers</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{editingId ? 'Edit' : 'New'} Mileage Entry</h2>
                <button onClick={() => { setShowForm(false); setEditingId(null); }}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <select
                    value={form.customerId}
                    onChange={e => setForm({ ...form, customerId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
                  <input
                    type="text"
                    value={form.fromAddress}
                    onChange={e => setForm({ ...form, fromAddress: e.target.value })}
                    placeholder="123 Main St..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Address</label>
                  <input
                    type="text"
                    value={form.toAddress}
                    onChange={e => setForm({ ...form, toAddress: e.target.value })}
                    placeholder="456 Oak Ave..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Miles *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.miles || ''}
                      onChange={e => setForm({ ...form, miles: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate/Mile ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.ratePerMile}
                      onChange={e => setForm({ ...form, ratePerMile: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    <strong>Total:</strong> {form.miles} miles × ${form.ratePerMile.toFixed(2)} = <strong>{formatCurrency(form.miles * form.ratePerMile)}</strong>
                  </p>
                  <p className="text-xs text-purple-600 mt-1">IRS 2024 standard rate: $0.67/mile</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    placeholder="Purpose of trip..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 font-medium">Save Entry</button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No mileage entries. Start tracking your job-related travel.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="divide-y">
            {filtered.map(entry => {
              const customer = customers.find(c => c.id === entry.customerId);
              return (
                <div key={entry.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      {entry.fromAddress || '—'} → {entry.toAddress || '—'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {customer?.name} • {formatDate(entry.date)} • {entry.miles} mi
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(entry.total)}</span>
                    <button onClick={() => handleEdit(entry)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(entry.id)} className="text-xs text-red-500 hover:underline">Del</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
