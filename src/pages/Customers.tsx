import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, DollarSign } from 'lucide-react';
import { getCustomers, saveCustomer, deleteCustomer, getCustomerBalance } from '../store/db';
import { formatCurrency } from '../utils/format';
import type { Customer, CustomerBalance } from '../types';

interface CustomersPageProps {
  onNavigate: (path: string, state?: any) => void;
}

export default function CustomersPage({ onNavigate }: CustomersPageProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [balances, setBalances] = useState<Record<string, CustomerBalance>>({});
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const emptyForm = { name: '', company: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { reload(); }, []);

  function reload() {
    const custs = getCustomers();
    setCustomers(custs);
    const balMap: Record<string, CustomerBalance> = {};
    custs.forEach(c => {
      const b = getCustomerBalance(c.id);
      if (b) balMap[c.id] = b;
    });
    setBalances(balMap);
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave() {
    if (!form.name.trim()) return;
    saveCustomer({ ...form, id: editingCustomer?.id });
    setShowForm(false);
    setEditingCustomer(null);
    setForm(emptyForm);
    reload();
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      company: customer.company,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      notes: customer.notes,
    });
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this customer? All related data will remain.')) {
      deleteCustomer(id);
      reload();
    }
  }

  const balance = detailCustomer ? balances[detailCustomer.id] : null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">{customers.length} total customers</p>
        </div>
        <button
          onClick={() => { setEditingCustomer(null); setForm(emptyForm); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editingCustomer ? 'Edit Customer' : 'New Customer'}</h2>
              <div className="space-y-3">
                {[
                  { key: 'name', label: 'Full Name *' },
                  { key: 'company', label: 'Company' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'address', label: 'Street Address' },
                  { key: 'city', label: 'City' },
                  { key: 'state', label: 'State' },
                  { key: 'zip', label: 'ZIP Code' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={(form as any)[field.key]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Save</button>
                <button onClick={() => { setShowForm(false); setEditingCustomer(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{detailCustomer.name}</h2>
                <button onClick={() => setDetailCustomer(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              {detailCustomer.company && <p className="text-gray-600">{detailCustomer.company}</p>}
              <p className="text-sm text-gray-500">{detailCustomer.address}</p>
              <p className="text-sm text-gray-500">{detailCustomer.city}, {detailCustomer.state} {detailCustomer.zip}</p>
              <p className="text-sm text-gray-500">{detailCustomer.phone} | {detailCustomer.email}</p>

              {balance && (
                <div className="mt-6 bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" /> Account Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Total Invoiced:</span>
                    <span className="font-medium text-right">{formatCurrency(balance.totalInvoiced)}</span>
                    <span className="text-gray-500">Total Paid:</span>
                    <span className="font-medium text-right text-green-600">{formatCurrency(balance.totalPaid)}</span>
                    <span className="text-gray-500">Amount Owed:</span>
                    <span className="font-bold text-right text-red-600">{formatCurrency(balance.totalOwed)}</span>
                    <span className="text-gray-500">Invoices:</span>
                    <span className="font-medium text-right">{balance.invoiceCount}</span>
                    <span className="text-gray-500">Expenses:</span>
                    <span className="font-medium text-right">{formatCurrency(balance.expenseTotal)}</span>
                    <span className="text-gray-500">Mileage:</span>
                    <span className="font-medium text-right">{formatCurrency(balance.mileageTotal)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { onNavigate('/invoices', { customerId: detailCustomer.id }); setDetailCustomer(null); }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  New Invoice
                </button>
                <button
                  onClick={() => { onNavigate('/expenses', { customerId: detailCustomer.id }); setDetailCustomer(null); }}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 font-medium text-sm"
                >
                  Add Expense
                </button>
                <button
                  onClick={() => { onNavigate('/mileage', { customerId: detailCustomer.id }); setDetailCustomer(null); }}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-medium text-sm"
                >
                  Add Mileage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No customers found. Add your first customer to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(customer => {
            const bal = balances[customer.id];
            return (
              <div key={customer.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    {customer.company && <p className="text-sm text-gray-500">{customer.company}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setDetailCustomer(customer)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(customer)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{customer.phone} • {customer.email}</p>
                <p className="text-xs text-gray-400 mt-1">{customer.city}, {customer.state}</p>
                {bal && (
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-xs text-gray-500">Owed</span>
                    <span className={`font-bold text-sm ${bal.totalOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(bal.totalOwed)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Users(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
